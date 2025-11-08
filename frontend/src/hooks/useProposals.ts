import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import type { Proposal } from '../types';

export function useProposalSubscription() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!publicClient) {
      // Return empty array if no public client - app will still render
      return;
    }

    let mounted = true;

    const setupSubscription = async () => {
      try {
        await connectionManager.connect(publicClient, walletClient || undefined);
        const { proposalSchemaId } = getSchemaIds();
        
        if (!proposalSchemaId) {
          console.warn('Proposal schema ID not initialized - SDS not configured yet');
          return;
        }

        // Subscribe using official SDK API format
        await connectionManager.subscribe(
          'ProposalCreated', // Event ID (needs to be registered first)
          [], // ethCalls for enrichment
          (data: any) => {
            if (!mounted) return;
            
            // Decode proposal from data
            const proposal = data as Proposal;
            setProposals(prev => {
              const index = prev.findIndex(p => p.id === proposal.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = proposal;
                return updated;
              }
              return [proposal, ...prev];
            });
          },
          (error: Error) => {
            console.error('Proposal subscription error:', error);
          }
        );
      } catch (error) {
        console.warn('Failed to setup proposal subscription:', error);
        // Don't throw - allow app to continue rendering
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      connectionManager.disconnect();
    };
  }, [publicClient, walletClient, connectionManager]);

  return proposals;
}

