import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { SDSConnectionManager, decodeVote } from '../lib/sds';
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

  // SDS subscription for real-time updates
  useEffect(() => {
    if (!publicClient || !proposalId) return;

    let mounted = true;
    let subscriptionKey: string | null = null;

    const setupSDSSubscription = async () => {
      try {
        const sdk = await connectionManager.connect(publicClient, walletClient || undefined);
        
        // If SDS is not available, log error
        if (!sdk) {
          console.error('SDS SDK not available - real-time vote updates disabled');
          return;
        }
        
        // Subscribe to 'VoteCast' event for real-time updates
        // Per SDS docs: subscribe to EVENT NAMES, not schema IDs
        await connectionManager.subscribe(
          'VoteCast', // Event name emitted by setAndEmitEvent
          [], // No additional view calls needed
          (data: any) => {
            if (!mounted) return;
            
            try {
              // Data from SDS is already decoded, but we may need to transform it
              const vote = typeof data === 'string' && data.startsWith('0x')
                ? decodeVote(data as `0x${string}`)
                : data;
              
              // Filter by proposal ID
              if (vote.proposalId !== proposalId) return;
              
              setVotes(prev => {
                if (prev.some(v => v.voter === vote.voter && v.proposalId === vote.proposalId)) {
                  return prev;
                }
                return [...prev, vote];
              });
            } catch (error) {
              console.warn('Failed to process SDS vote data:', error);
            }
          },
          (error: Error) => {
            console.error('SDS vote subscription error:', error);
          }
        );
        
        subscriptionKey = 'VoteCast';
      } catch (error: any) {
        console.error('SDS subscription failed:', error.message);
      }
    };

    setupSDSSubscription();

    return () => {
      mounted = false;
      if (subscriptionKey) {
        connectionManager.unsubscribe(subscriptionKey);
      }
    };
  }, [publicClient, walletClient, proposalId, connectionManager]);

  return votes;
}

