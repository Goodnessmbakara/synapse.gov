// SDS Publisher Implementation
// Based on official Somnia Data Streams SDK documentation:
// https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide
// This file contains the logic to publish contract events to SDS

import { SDK } from '@somnia-chain/streams';
import { getSchemaIds } from './sds';
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

      // Publish to SDS using official SDK method
      // await sdk.streams.set([{
      //   id: toHex(proposalId.toString(), { size: 32 }),
      //   schemaId: proposalSchemaId as `0x${string}`,
      //   data: encodeProposal(_proposal),
      // }]);

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
      // Vote data fetched but not used until SDS SDK is configured
      void {
        proposalId: proposalId.toString(),
        voter: voter,
        support: support,
        votingPower: votingPower,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        txHash: '',
      };

      // TODO: Update with actual SDS SDK API when available
      // await sdk.streams.set([{
      //   id: toHex(`${proposalId}-${voter}`, { size: 32 }),
      //   schemaId: voteSchemaId,
      //   data: encodeVote(vote),
      // }]);

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

async function updateProposalVotes(_sdk: SDK, contract: any, proposalId: bigint) {
  try {
    const proposalData = await contract.getProposal(proposalId);
    const quorumThreshold = await contract.quorumThreshold();
    const totalVotingPower = await contract.totalVotingPower();
    
    const totalVotes = proposalData.votesFor + proposalData.votesAgainst;
    const currentQuorum = (totalVotes * 100n) / totalVotingPower;

    // Proposal data fetched but not used until SDS SDK is configured
    // Will be used when SDS SDK is properly configured
    const _proposal: Proposal = {
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
    void _proposal;

    // TODO: Update with actual SDS SDK API when available
    // const { proposalSchemaId } = getSchemaIds();
    // await sdk.streams.set([{
    //   id: toHex(proposalId.toString(), { size: 32 }),
    //   schemaId: proposalSchemaId!,
    //   data: encodeProposal(proposal),
    // }]);
  } catch (error) {
    console.error('Failed to update proposal votes:', error);
  }
}

async function checkQuorumStatus(_sdk: SDK, contract: any, proposalId: bigint) {
  try {
    const quorumReached = await contract.checkQuorum(proposalId);
    if (quorumReached) {
      // TODO: Update with actual SDS SDK API when available
      // const { current, required } = await contract.getQuorum(proposalId);
      // const { quorumEventSchemaId } = getSchemaIds();
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
    }
  } catch (error) {
    console.error('Failed to check quorum status:', error);
  }
}

async function publishActivityEvent(
  _sdk: SDK,
  _event: {
    eventType: string;
    proposalId: string;
    user: string;
    data: Record<string, any>;
  }
) {
  try {
    // TODO: Update with actual SDS SDK API when available
    // Use sdk.streams.emitEvents() or sdk.streams.setAndEmitEvents() per official docs
    // const { activityEventSchemaId } = getSchemaIds();
    // const eventId = toHex(`${event.proposalId}-${Date.now()}`, { size: 32 });
    // await sdk.streams.emitEvents([{
    //   id: 'ActivityEvent',
    //   argumentTopics: [toHex(event.proposalId, { size: 32 })],
    //   data: '0x' // optional encoded payload
    // }]);
  } catch (error) {
    console.error('Failed to publish activity event:', error);
  }
}
