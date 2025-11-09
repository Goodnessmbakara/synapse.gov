import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { SDSConnectionManager, decodeProposal, initializeSDK, getProposalFromSDS } from '../lib/sds';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import { getProposalMetadataBatch, getProposalMetadata } from '../lib/proposal-metadata';
import type { Proposal } from '../types';

export function useProposalSubscription() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch initial proposal count
  const { data: proposalCount } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'getProposalCount',
  });

  // Fetch all proposals on mount and when count changes
  useEffect(() => {
    if (!publicClient || !proposalCount) return;

    const fetchProposals = async () => {
      try {
        const count = Number(proposalCount);
        console.log(`Fetching ${count} proposals...`);
        const fetchedProposals: Proposal[] = [];

        // Fetch all proposal IDs first
        const proposalIds = Array.from({ length: count }, (_, i) => BigInt(i));
        
        // Fetch metadata (title/description) from events in batch
        console.log('Fetching proposal metadata from events...');
        const metadataMap = await getProposalMetadataBatch(publicClient, proposalIds);
        console.log(`Retrieved metadata for ${metadataMap.size} proposals`);

        // Fetch each proposal
        for (let i = 0; i < count; i++) {
          try {
            const proposalData = await publicClient.readContract({
              address: GOVERNANCE_CONTRACT_ADDRESS,
              abi: GovernanceABI,
              functionName: 'getProposal',
              args: [BigInt(i)],
            });

            const [quorumCurrent, quorumRequired] = await publicClient.readContract({
              address: GOVERNANCE_CONTRACT_ADDRESS,
              abi: GovernanceABI,
              functionName: 'getQuorum',
              args: [BigInt(i)],
            });

            const totalVotingPower = await publicClient.readContract({
              address: GOVERNANCE_CONTRACT_ADDRESS,
              abi: GovernanceABI,
              functionName: 'totalVotingPower',
            });

            // Try to get title/description from SDS first (persistent storage)
            let metadata = { title: '', description: '' };
            
            try {
              // Initialize SDS SDK for reading
              const sdk = await initializeSDK(publicClient);
              if (sdk) {
                // Try to read from SDS using the proposer address
                const sdsProposal = await getProposalFromSDS(sdk, BigInt(i), proposalData.proposer);
                if (sdsProposal && (sdsProposal.title || sdsProposal.description)) {
                  metadata = {
                    title: sdsProposal.title,
                    description: sdsProposal.description,
                  };
                  console.log(`✅ Found proposal ${i} metadata in SDS`);
                }
              }
            } catch (error) {
              console.debug(`SDS read failed for proposal ${i}, trying events...`);
            }
            
            // Fallback to contract events if SDS doesn't have it
            if (!metadata.title && !metadata.description) {
              const eventMetadata = metadataMap.get(BigInt(i)) || { title: '', description: '' };
              if (eventMetadata.title || eventMetadata.description) {
                metadata = eventMetadata;
              } else {
                // Try fetching individually as last resort
                console.warn(`No metadata found for proposal ${i}, attempting individual fetch...`);
                const individualMetadata = await getProposalMetadata(publicClient, BigInt(i));
                if (individualMetadata) {
                  metadata = {
                    title: individualMetadata.title,
                    description: individualMetadata.description,
                  };
                }
              }
            }

            const proposal: Proposal = {
              id: i.toString(),
              title: metadata.title || `Proposal #${i}`,
              description: metadata.description || 'No description available',
              proposer: proposalData.proposer,
              votesFor: BigInt(proposalData.votesFor),
              votesAgainst: BigInt(proposalData.votesAgainst),
              quorumThreshold: BigInt(quorumRequired),
              currentQuorum: BigInt(quorumCurrent),
              deadline: BigInt(proposalData.deadline),
              status: proposalData.executed ? 'executed' :
                      Number(proposalData.deadline) < Date.now() / 1000 ?
                        (Number(proposalData.votesFor) > Number(proposalData.votesAgainst) ? 'passed' : 'failed') :
                        'active',
              createdAt: BigInt(proposalData.createdAt),
              totalVotingPower: BigInt(totalVotingPower),
            };

            fetchedProposals.push(proposal);
          } catch (error) {
            console.warn(`Failed to fetch proposal ${i}:`, error);
          }
        }

        console.log(`Successfully fetched ${fetchedProposals.length} proposals`);
        setProposals(fetchedProposals.reverse()); // Newest first
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
      }
    };

    fetchProposals();
  }, [publicClient, proposalCount]);

  // SDS subscription for real-time updates
  useEffect(() => {
    if (!publicClient) return;

    let mounted = true;
    const subscriptionKeys: string[] = [];

    const setupSDSSubscription = async () => {
      try {
        const sdk = await connectionManager.connect(publicClient, walletClient || undefined);
        
        // If SDS is not available, log error
        if (!sdk) {
          console.error('SDS SDK not available - real-time updates disabled');
          return;
        }

        // Subscribe to 'ProposalCreated' event for real-time updates
        // Per SDS docs: subscribe to EVENT NAMES, not schema IDs
        await connectionManager.subscribe(
          'ProposalCreated', // Event name emitted by setAndEmitEvent
          [], // No additional view calls needed
          (data: any) => {
            if (!mounted) return;
            try {
              // Data from SDS event contains the proposal data
              // The event structure depends on what was emitted by setAndEmitEvent
              // We may need to decode or transform the data based on the actual event structure
              let proposal: Proposal;
              
              if (typeof data === 'string' && data.startsWith('0x')) {
                // If it's encoded hex, decode it
                proposal = decodeProposal(data as `0x${string}`);
              } else if (data && typeof data === 'object') {
                // If it's already an object, use it directly or transform as needed
                // The event may contain the proposal data directly or nested
                proposal = data as Proposal;
              } else {
                console.warn('Unexpected SDS event data format:', data);
                return;
              }
              
              setProposals(prev => {
                const index = prev.findIndex(p => p.id === proposal.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = proposal;
                  return updated;
                }
                return [proposal, ...prev];
              });
            } catch (error) {
              console.warn('Failed to process SDS proposal data:', error);
            }
          },
          (error: Error) => {
            console.error('SDS proposal subscription error:', error.message);
          }
        );
        
        subscriptionKeys.push('ProposalCreated');

        // Also subscribe to VoteCast events to update proposal vote counts
        await connectionManager.subscribe(
          'VoteCast',
          [],
          (data: any) => {
            if (!mounted) return;
            try {
              const vote = typeof data === 'object' ? data : {};
              const proposalId = vote.proposalId?.toString();
              
              if (!proposalId) return;

              // Update proposal vote counts when a vote is cast
              setProposals(prev => {
                const index = prev.findIndex(p => p.id === proposalId);
                if (index >= 0) {
                  const updated = [...prev];
                  // Increment vote counts
                  updated[index] = {
                    ...updated[index],
                    votesFor: vote.support 
                      ? updated[index].votesFor + BigInt(vote.votingPower || 0)
                      : updated[index].votesFor,
                    votesAgainst: !vote.support
                      ? updated[index].votesAgainst + BigInt(vote.votingPower || 0)
                      : updated[index].votesAgainst,
                  };
                  return updated;
                }
                return prev;
              });
            } catch (error) {
              console.warn('Failed to process SDS vote update for proposal:', error);
            }
          },
          (error: Error) => {
            console.error('SDS VoteCast subscription error for proposals:', error.message);
          }
        );
        
        subscriptionKeys.push('VoteCast');
      } catch (error: any) {
        console.error('SDS subscription failed:', error.message);
      }
    };

    setupSDSSubscription();

    return () => {
      mounted = false;
      subscriptionKeys.forEach(key => {
        connectionManager.unsubscribe(key);
      });
    };
  }, [publicClient, walletClient, connectionManager]);

  return proposals;
}

