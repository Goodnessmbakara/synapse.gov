import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useReadContract, useWatchContractEvent } from 'wagmi';
import { SDSConnectionManager, getSchemaIds, decodeProposal } from '../lib/sds';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
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
        const fetchedProposals: Proposal[] = [];

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

            const proposal: Proposal = {
              id: i.toString(),
              title: proposalData.title,
              description: proposalData.description,
              proposer: proposalData.proposer,
              votesFor: proposalData.votesFor,
              votesAgainst: proposalData.votesAgainst,
              quorumThreshold: BigInt(quorumRequired),
              currentQuorum: BigInt(quorumCurrent),
              deadline: proposalData.deadline,
              status: proposalData.executed ? 'executed' :
                      Number(proposalData.deadline) < Date.now() / 1000 ?
                        (proposalData.votesFor > proposalData.votesAgainst ? 'passed' : 'failed') :
                        'active',
              createdAt: proposalData.createdAt,
              totalVotingPower: BigInt(totalVotingPower),
            };

            fetchedProposals.push(proposal);
          } catch (error) {
            console.warn(`Failed to fetch proposal ${i}:`, error);
          }
        }

        setProposals(fetchedProposals.reverse()); // Newest first
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
      }
    };

    fetchProposals();
  }, [publicClient, proposalCount]);

  // Watch for ProposalCreated events (real-time updates)
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'ProposalCreated',
    onLogs(logs) {
      logs.forEach(async (log) => {
        const proposalId = log.args.proposalId;
        if (!proposalId) return;

        try {
          // Fetch the new proposal
          const proposalData = await publicClient?.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getProposal',
            args: [proposalId],
          });

          if (!proposalData) return;

          const [quorumCurrent, quorumRequired] = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getQuorum',
            args: [proposalId],
          });

          const totalVotingPower = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'totalVotingPower',
          });

          const proposal: Proposal = {
            id: proposalId.toString(),
            title: proposalData.title,
            description: proposalData.description,
            proposer: log.args.proposer || proposalData.proposer,
            votesFor: proposalData.votesFor,
            votesAgainst: proposalData.votesAgainst,
            quorumThreshold: BigInt(quorumRequired),
            currentQuorum: BigInt(quorumCurrent),
            deadline: proposalData.deadline,
            status: 'active',
            createdAt: proposalData.createdAt,
            totalVotingPower: BigInt(totalVotingPower),
          };

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
          console.error('Failed to fetch new proposal:', error);
        }
      });
    },
  });

  // Watch for VoteCast events to update proposal vote counts
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'VoteCast',
    onLogs(logs) {
      logs.forEach(async (log) => {
        const proposalId = log.args.proposalId;
        if (!proposalId) return;

        try {
          // Refresh the proposal to get updated vote counts
          const proposalData = await publicClient?.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getProposal',
            args: [proposalId],
          });

          if (!proposalData) return;

          const [quorumCurrent, quorumRequired] = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getQuorum',
            args: [proposalId],
          });

          setProposals(prev => {
            const index = prev.findIndex(p => p.id === proposalId.toString());
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                votesFor: proposalData.votesFor,
                votesAgainst: proposalData.votesAgainst,
                currentQuorum: BigInt(quorumCurrent),
                status: proposalData.executed ? 'executed' :
                        Number(proposalData.deadline) < Date.now() / 1000 ?
                          (proposalData.votesFor > proposalData.votesAgainst ? 'passed' : 'failed') :
                          'active',
              };
              return updated;
            }
            return prev;
          });
        } catch (error) {
          console.error('Failed to update proposal votes:', error);
        }
      });
    },
  });

  // SDS subscription (enhancement when available)
  useEffect(() => {
    if (!publicClient) return;

    let mounted = true;

    const setupSDSSubscription = async () => {
      try {
        await connectionManager.connect(publicClient, walletClient || undefined);
        const { proposalSchemaId } = getSchemaIds();
        
        if (!proposalSchemaId) {
          return; // SDS not configured, contract events will handle updates
        }

        await connectionManager.subscribe(
          'ProposalCreated',
          [],
          (data: any) => {
            if (!mounted) return;
            try {
              const proposal = decodeProposal(data as `0x${string}`);
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
              console.warn('Failed to decode SDS proposal:', error);
            }
          },
          (error: Error) => {
            console.error('SDS proposal subscription error:', error);
          }
        );
      } catch (error) {
        // SDS subscription failed, contract events will handle updates
        console.warn('SDS subscription not available, using contract events');
      }
    };

    setupSDSSubscription();

    return () => {
      mounted = false;
      connectionManager.disconnect();
    };
  }, [publicClient, walletClient, connectionManager]);

  return proposals;
}

