import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import type { Vote } from '../types';

export function useVoteSubscription(proposalId: string) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!publicClient || !proposalId) return;

    let mounted = true;

    const setupSubscription = async () => {
      try {
        await connectionManager.connect(publicClient, walletClient || undefined);
        const { voteSchemaId } = getSchemaIds();
        
        if (!voteSchemaId) {
          console.warn('Vote schema ID not initialized - SDS not configured yet');
          return;
        }

        // Subscribe using official SDK API format
        await connectionManager.subscribe(
          'VoteCast', // Event ID (needs to be registered first)
          [], // ethCalls for enrichment
          (data: any) => {
            if (!mounted || data.proposalId !== proposalId) return;
            
            const vote = data as Vote;
            setVotes(prev => {
              // Avoid duplicates
              if (prev.some(v => v.voter === vote.voter && v.proposalId === vote.proposalId)) {
                return prev;
              }
              return [...prev, vote];
            });
          },
          (error: Error) => {
            console.error('Vote subscription error:', error);
          }
        );
      } catch (error) {
        console.warn('Failed to setup vote subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      connectionManager.disconnect();
    };
  }, [publicClient, walletClient, proposalId, connectionManager]);

  return votes;
}

