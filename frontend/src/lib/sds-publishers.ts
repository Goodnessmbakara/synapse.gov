// SDS Publisher Implementation
// Based on official Somnia Data Streams SDK documentation:
// https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide
// This file contains the logic to publish contract events to SDS

import { SDK, SchemaEncoder } from '@somnia-chain/streams';
import { getSchemaIds, encodeProposal, encodeVote, QuorumEventSchemaString } from './sds';
import { toHex } from 'viem';
import type { Proposal } from '../types';

/**
 * Set up event listeners and publishers for contract events
 * This should be called from a server-side context or API route
 * 
 * IMPORTANT: Publishing requires a wallet client with private key.
 * Never expose private keys in client-side code.
 */
export async function setupPublishers(
  sdk: SDK,
  contract: any // Contract instance from ethers/viem
) {
  const { proposalSchemaId, voteSchemaId } = getSchemaIds();

  if (!proposalSchemaId || !voteSchemaId) {
    throw new Error('Schema IDs not initialized. Call initializeSchemas first.');
  }

  // Listen for ProposalCreated events
  contract.on('ProposalCreated', async (proposalId: bigint, proposer: string, title: string, deadline: bigint) => {
    try {
      // Fetch full proposal data
      const proposalData = await contract.getProposal(proposalId);
      const quorumThreshold = await contract.quorumThreshold();
      const totalVotingPower = await contract.totalVotingPower();
      
      // Proposal data fetched but not used until SDS SDK is configured
      // Will be used when SDS SDK is properly configured
      const _proposal: Proposal = {
        id: proposalId.toString(),
        title: proposalData.title,
        description: proposalData.description,
        proposer: proposer,
        votesFor: proposalData.votesFor,
        votesAgainst: proposalData.votesAgainst,
        quorumThreshold: BigInt(quorumThreshold),
        currentQuorum: BigInt(0),
        deadline: deadline,
        status: 'active',
        createdAt: proposalData.createdAt,
        totalVotingPower: BigInt(totalVotingPower),
      };
      void _proposal;

      // Publish to SDS and emit event using setAndEmitEvents() method
      // This stores the data AND emits a 'ProposalCreated' event that can be subscribed to
      if (proposalSchemaId) {
        try {
          const dataId = toHex(proposalId.toString(), { size: 32 });
          // Use setAndEmitEvents to both store data and emit an event
          // Signature: setAndEmitEvents([{ id, schemaId, data }], [{ id, argumentTopics, data }])
          const tx = await (sdk.streams as any).setAndEmitEvents(
            [
              {
                id: dataId,
                schemaId: proposalSchemaId,
                data: encodeProposal(_proposal),
              },
            ],
            [
              {
                id: 'ProposalCreated', // event ID/name
                argumentTopics: [dataId], // topics for filtering (proposal ID)
                data: encodeProposal(_proposal), // optional event data
              },
            ]
          );
          console.log('Proposal published and event emitted to SDS with tx hash:', tx);
        } catch (error) {
          console.error('Failed to publish proposal to SDS:', error);
        }
      }

      // Also publish to activity feed
      await publishActivityEvent(sdk, {
        eventType: 'proposal_created',
        proposalId: proposalId.toString(),
        user: proposer,
        data: { title },
      });
    } catch (error) {
      console.error('Failed to publish proposal event:', error);
    }
  });

  // Listen for VoteCast events
  contract.on('VoteCast', async (
    proposalId: bigint,
    voter: string,
    support: boolean,
    votingPower: bigint
  ) => {
    try {
      // Publish vote to SDS using set() method
      if (voteSchemaId) {
        try {
          const vote = {
            proposalId: proposalId.toString(),
            voter: voter,
            support: support,
            votingPower: votingPower,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            txHash: '' as `0x${string}`,
          };
          
          const dataId = toHex(`${proposalId}-${voter}`, { size: 32 });
          // Use setAndEmitEvents to both store vote data and emit a 'VoteCast' event
          const tx = await (sdk.streams as any).setAndEmitEvents(
            [
              {
                id: dataId,
                schemaId: voteSchemaId,
                data: encodeVote(vote),
              },
            ],
            [
              {
                id: 'VoteCast', // event ID/name
                argumentTopics: [toHex(proposalId.toString(), { size: 32 }), toHex(voter, { size: 20 })], // proposalId, voter
                data: encodeVote(vote), // optional event data
              },
            ]
          );
          console.log('Vote published and event emitted to SDS with tx hash:', tx);
        } catch (error) {
          console.error('Failed to publish vote to SDS:', error);
        }
      }

      // Update proposal vote counts
      await updateProposalVotes(sdk, contract, proposalId);

      // Publish activity event
      await publishActivityEvent(sdk, {
        eventType: 'vote_cast',
        proposalId: proposalId.toString(),
        user: voter,
        data: { support, votingPower: votingPower.toString() },
      });

      // Check quorum
      await checkQuorumStatus(sdk, contract, proposalId);
    } catch (error) {
      console.error('Failed to publish vote event:', error);
    }
  });

  // Listen for QuorumReached events
  contract.on('QuorumReached', async (proposalId: bigint) => {
    try {
      // TODO: Update with actual SDS SDK API when available
      // const { current, required } = await contract.getQuorum(proposalId);
      // await sdk.streams.set([{
      //   id: toHex(`quorum-${proposalId}`, { size: 32 }),
      //   schemaId: quorumEventSchemaId!,
      //   data: new TextEncoder().encode(JSON.stringify({
      //     proposalId: proposalId.toString(),
      //     eventType: 'reached',
      //     currentQuorum: current.toString(),
      //     requiredQuorum: required.toString(),
      //     timestamp: Math.floor(Date.now() / 1000),
      //   })),
      // }]);

      await publishActivityEvent(sdk, {
        eventType: 'quorum_reached',
        proposalId: proposalId.toString(),
        user: '', // System event
        data: {},
      });
    } catch (error) {
      console.error('Failed to publish quorum event:', error);
    }
  });

  // Listen for ProposalExecuted events
  contract.on('ProposalExecuted', async (proposalId: bigint) => {
    try {
      await publishActivityEvent(sdk, {
        eventType: 'proposal_executed',
        proposalId: proposalId.toString(),
        user: '', // System event
        data: {},
      });
    } catch (error) {
      console.error('Failed to publish execution event:', error);
    }
  });
}

async function updateProposalVotes(sdk: SDK, contract: any, proposalId: bigint) {
  try {
    const proposalData = await contract.getProposal(proposalId);
    const quorumThreshold = await contract.quorumThreshold();
    const totalVotingPower = await contract.totalVotingPower();
    
    const totalVotes = proposalData.votesFor + proposalData.votesAgainst;
    const currentQuorum = (totalVotes * 100n) / totalVotingPower;

    const proposal: Proposal = {
      id: proposalId.toString(),
      title: proposalData.title,
      description: proposalData.description,
      proposer: proposalData.proposer,
      votesFor: proposalData.votesFor,
      votesAgainst: proposalData.votesAgainst,
      quorumThreshold: BigInt(quorumThreshold),
      currentQuorum: currentQuorum,
      deadline: proposalData.deadline,
      status: proposalData.executed ? 'executed' : 
              Number(proposalData.deadline) < Date.now() / 1000 ?
                (proposalData.votesFor > proposalData.votesAgainst ? 'passed' : 'failed') :
                'active',
      createdAt: proposalData.createdAt,
      totalVotingPower: BigInt(totalVotingPower),
    };

    // Update proposal in SDS using set() method
    const { proposalSchemaId } = getSchemaIds();
    if (proposalSchemaId) {
      try {
        const dataId = toHex(proposalId.toString(), { size: 32 });
        // Update proposal data (no event emission needed for updates)
        const tx = await (sdk.streams as any).set([
          {
            id: dataId,
            schemaId: proposalSchemaId,
            data: encodeProposal(proposal),
          },
        ]);
        console.log('Proposal updated in SDS with tx hash:', tx);
      } catch (error) {
        console.error('Failed to update proposal in SDS:', error);
      }
    }
  } catch (error) {
    console.error('Failed to update proposal votes:', error);
  }
}

async function checkQuorumStatus(sdk: SDK, contract: any, proposalId: bigint) {
  try {
    const quorumReached = await contract.checkQuorum(proposalId);
    if (quorumReached) {
      const { current, required } = await contract.getQuorum(proposalId);
      const { quorumEventSchemaId } = getSchemaIds();
      
      if (quorumEventSchemaId) {
        try {
          const encoder = new SchemaEncoder(QuorumEventSchemaString);
          const encoded = encoder.encodeData([
            { name: 'proposalId', type: 'bytes32', value: toHex(proposalId.toString(), { size: 32 }) },
            { name: 'eventType', type: 'string', value: 'reached' },
            { name: 'currentQuorum', type: 'uint256', value: BigInt(current) },
            { name: 'requiredQuorum', type: 'uint256', value: BigInt(required) },
            { name: 'timestamp', type: 'uint256', value: BigInt(Math.floor(Date.now() / 1000)) },
          ]);
          
          const dataId = toHex(`quorum-${proposalId}`, { size: 32 });
          // Use setAndEmitEvents to emit 'QuorumReached' event
          const tx = await (sdk.streams as any).setAndEmitEvents(
            [
              {
                id: dataId,
                schemaId: quorumEventSchemaId!,
                data: encoded,
              },
            ],
            [
              {
                id: 'QuorumReached', // event ID/name
                argumentTopics: [toHex(proposalId.toString(), { size: 32 })], // proposalId
                data: encoded, // optional event data
              },
            ]
          );
          console.log('Quorum event published and emitted to SDS with tx hash:', tx);
        } catch (error) {
          console.error('Failed to publish quorum event to SDS:', error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to check quorum status:', error);
  }
}

async function publishActivityEvent(
  sdk: SDK,
  event: {
    eventType: string;
    proposalId: string;
    user: string;
    data: Record<string, any>;
  }
) {
  try {
    const { activityEventSchemaId } = getSchemaIds();
    if (!activityEventSchemaId) {
      console.warn('Activity event schema ID not available');
      return;
    }

    const encoder = new SchemaEncoder('bytes32 eventId, string eventType, bytes32 proposalId, address user, string data, uint256 timestamp');
    const encoded = encoder.encodeData([
      { name: 'eventId', type: 'bytes32', value: toHex(`${event.proposalId}-${Date.now()}`, { size: 32 }) },
      { name: 'eventType', type: 'string', value: event.eventType },
      { name: 'proposalId', type: 'bytes32', value: toHex(event.proposalId, { size: 32 }) },
      { name: 'user', type: 'address', value: event.user },
      { name: 'data', type: 'string', value: JSON.stringify(event.data) },
      { name: 'timestamp', type: 'uint256', value: BigInt(Math.floor(Date.now() / 1000)) },
    ]);

    const dataId = toHex(`${event.proposalId}-${Date.now()}`, { size: 32 });
    // Use setAndEmitEvents to emit activity events
    const eventName = `Activity_${event.eventType}`; // e.g., 'Activity_proposal_created'
    const tx = await (sdk.streams as any).setAndEmitEvents(
      [
        {
          id: dataId,
          schemaId: activityEventSchemaId!,
          data: encoded,
        },
      ],
      [
        {
          id: eventName, // event ID/name
          argumentTopics: [toHex(event.proposalId, { size: 32 })], // proposalId
          data: encoded, // optional event data
        },
      ]
    );
    console.log(`Activity event '${eventName}' published and emitted to SDS with tx hash:`, tx);
  } catch (error) {
    console.error('Failed to publish activity event:', error);
  }
}
