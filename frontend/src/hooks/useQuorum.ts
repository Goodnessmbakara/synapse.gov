import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import type { QuorumStatus } from '../types';

export function useQuorumSubscription(proposalId: string) {
  const [quorumStatus, setQuorumStatus] = useState<QuorumStatus | null>(null);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!publicClient || !proposalId) return;

    let mounted = true;

    const setupSubscription = async () => {
      try {
        await connectionManager.connect(publicClient, walletClient || undefined);
        const { quorumEventSchemaId } = getSchemaIds();
        
        if (!quorumEventSchemaId) {
          console.warn('Quorum event schema ID not initialized - SDS not configured yet');
          return;
        }

        // Subscribe using official SDK API format
        await connectionManager.subscribe(
          'QuorumReached', // Event ID (needs to be registered first)
          [], // ethCalls for enrichment
          (data: any) => {
            if (!mounted) return;
            
            setQuorumStatus({
              current: BigInt(data.currentQuorum || 0),
              required: BigInt(data.requiredQuorum || 0),
              reached: data.eventType === 'reached',
            });
          },
          (error: Error) => {
            console.error('Quorum subscription error:', error);
          }
        );
      } catch (error) {
        console.warn('Failed to setup quorum subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      connectionManager.disconnect();
    };
  }, [publicClient, walletClient, proposalId, connectionManager]);

  return quorumStatus;
}

