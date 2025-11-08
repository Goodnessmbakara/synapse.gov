import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useReadContract, useWatchContractEvent } from 'wagmi';
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

  // Watch for VoteCast events to update quorum
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'VoteCast',
    onLogs(logs) {
      logs.forEach(async (log) => {
        const logProposalId = log.args.proposalId?.toString();
        if (!logProposalId || logProposalId !== proposalId) return;

        try {
          // Refresh quorum data after vote
          const [current, required] = await publicClient?.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getQuorum',
            args: [BigInt(proposalId)],
          }) || [0n, 0n];

          setQuorumStatus({
            current: current as bigint,
            required: required as bigint,
            reached: (current as bigint) >= (required as bigint),
          });
        } catch (error) {
          console.error('Failed to update quorum:', error);
        }
      });
    },
  });

  // Watch for QuorumReached events
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'QuorumReached',
    onLogs(logs) {
      logs.forEach(async (log) => {
        const logProposalId = log.args.proposalId?.toString();
        if (!logProposalId || logProposalId !== proposalId) return;

        try {
          const [current, required] = await publicClient?.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getQuorum',
            args: [BigInt(proposalId)],
          }) || [0n, 0n];

          setQuorumStatus({
            current: current as bigint,
            required: required as bigint,
            reached: true,
          });
        } catch (error) {
          console.error('Failed to update quorum status:', error);
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
        const { quorumEventSchemaId } = getSchemaIds();
        
        if (!quorumEventSchemaId) {
          return; // SDS not configured, contract events will handle updates
        }

        await connectionManager.subscribe(
          'QuorumReached',
          [],
          (data: any) => {
            if (!mounted) return;
            
            setQuorumStatus({
              current: BigInt(data.currentQuorum || 0),
              required: BigInt(data.requiredQuorum || 0),
              reached: data.eventType === 'reached',
            });
          },
          (error: Error) => {
            console.error('SDS quorum subscription error:', error);
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

  return quorumStatus;
}

