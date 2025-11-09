import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import type { QuorumStatus } from '../types';

export function useQuorumSubscription(proposalId: string) {
  const [quorumStatus, setQuorumStatus] = useState<QuorumStatus | null>(null);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch initial quorum data
  const { data: quorumData } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'getQuorum',
    args: proposalId ? [BigInt(proposalId)] : undefined,
  });

  // Update quorum status when data changes
  useEffect(() => {
    if (quorumData) {
      const [current, required] = quorumData as [bigint, bigint];
      setQuorumStatus({
        current,
        required,
        reached: current >= required,
      });
    }
  }, [quorumData]);

  // SDS subscription for real-time updates
  useEffect(() => {
    if (!publicClient || !proposalId) return;

    let mounted = true;

    const setupSDSSubscription = async () => {
      try {
        const sdk = await connectionManager.connect(publicClient, walletClient || undefined);
        
        // If SDS is not available, log error
        if (!sdk) {
          console.error('SDS SDK not available - real-time quorum updates disabled');
          return;
        }

        const { quorumEventSchemaId } = getSchemaIds();
        
        if (!quorumEventSchemaId) {
          console.warn('Quorum event schema ID not configured');
          return;
        }

        // Subscribe to quorum event schema ID for real-time updates
        await connectionManager.subscribe(
          quorumEventSchemaId,
          [],
          (data: any) => {
            if (!mounted) return;
            
            try {
              // Filter by proposal ID if provided
              if (proposalId && data.proposalId !== proposalId) return;
              
              setQuorumStatus({
                current: BigInt(data.currentQuorum || 0),
                required: BigInt(data.requiredQuorum || 0),
                reached: data.eventType === 'reached',
              });
            } catch (error) {
              console.warn('Failed to process SDS quorum data:', error);
            }
          },
          (error: Error) => {
            console.error('SDS quorum subscription error:', error);
          }
        );
      } catch (error: any) {
        console.error('SDS subscription failed:', error.message);
      }
    };

    setupSDSSubscription();

    return () => {
      mounted = false;
      connectionManager.disconnect();
    };
  }, [publicClient, walletClient, proposalId, connectionManager]);

  return quorumStatus;
}

