import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useReadContract, useWatchContractEvent } from 'wagmi';
import { SDSConnectionManager, getSchemaIds, decodeVote } from '../lib/sds';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import type { Vote } from '../types';

export function useVoteSubscription(proposalId: string) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch initial voters list
  const { data: voters } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'getVoters',
    args: proposalId ? [BigInt(proposalId)] : undefined,
  });

  // Fetch all votes for this proposal
  useEffect(() => {
    if (!publicClient || !proposalId || !voters) return;

    const fetchVotes = async () => {
      try {
        const fetchedVotes: Vote[] = [];

        for (const voter of voters as `0x${string}`[]) {
          try {
            const voteData = await publicClient.readContract({
              address: GOVERNANCE_CONTRACT_ADDRESS,
              abi: GovernanceABI,
              functionName: 'getVote',
              args: [BigInt(proposalId), voter],
            });

            if (voteData && voteData.voter !== '0x0000000000000000000000000000000000000000') {
              fetchedVotes.push({
                proposalId,
                voter: voteData.voter,
                support: voteData.support,
                votingPower: voteData.votingPower,
                timestamp: voteData.timestamp,
                txHash: '' as `0x${string}`, // Not available from getVote
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch vote for ${voter}:`, error);
          }
        }

        setVotes(fetchedVotes);
      } catch (error) {
        console.error('Failed to fetch votes:', error);
      }
    };

    fetchVotes();
  }, [publicClient, proposalId, voters]);

  // Watch for VoteCast events (real-time updates)
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'VoteCast',
    onLogs(logs) {
      logs.forEach(async (log) => {
        const logProposalId = log.args.proposalId?.toString();
        if (!logProposalId || logProposalId !== proposalId) return;

        try {
          const vote: Vote = {
            proposalId,
            voter: log.args.voter || '',
            support: log.args.support || false,
            votingPower: log.args.votingPower || 0n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            txHash: log.transactionHash || ('' as `0x${string}`),
          };

          setVotes(prev => {
            // Avoid duplicates
            if (prev.some(v => v.voter === vote.voter && v.proposalId === vote.proposalId)) {
              return prev;
            }
            return [...prev, vote];
          });
        } catch (error) {
          console.error('Failed to process vote event:', error);
        }
      });
    },
  });

  // SDS subscription (enhancement when available)
  useEffect(() => {
    if (!publicClient || !proposalId) return;

    let mounted = true;

    const setupSDSSubscription = async () => {
      try {
        await connectionManager.connect(publicClient, walletClient || undefined);
        const { voteSchemaId } = getSchemaIds();
        
        if (!voteSchemaId) {
          return; // SDS not configured, contract events will handle updates
        }

        await connectionManager.subscribe(
          'VoteCast',
          [],
          (data: any) => {
            if (!mounted || data.proposalId !== proposalId) return;
            
            try {
              const vote = decodeVote(data as `0x${string}`);
              setVotes(prev => {
                if (prev.some(v => v.voter === vote.voter && v.proposalId === vote.proposalId)) {
                  return prev;
                }
                return [...prev, vote];
              });
            } catch (error) {
              console.warn('Failed to decode SDS vote:', error);
            }
          },
          (error: Error) => {
            console.error('SDS vote subscription error:', error);
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
  }, [publicClient, walletClient, proposalId, connectionManager]);

  return votes;
}

