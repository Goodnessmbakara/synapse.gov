import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient, useWatchContractEvent } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import type { ActivityEvent } from '../types';

export function useActivitySubscription() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Watch for ProposalCreated events
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'ProposalCreated',
    onLogs(logs) {
      logs.forEach((log) => {
        const activity: ActivityEvent = {
          eventId: log.transactionHash || ('' as `0x${string}`),
          eventType: 'proposal_created',
          proposalId: log.args.proposalId?.toString() || '',
          user: log.args.proposer || '',
          data: { title: log.args.title || '' },
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
        };
        setActivities(prev => [activity, ...prev].slice(0, 100));
      });
    },
  });

  // Watch for VoteCast events
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'VoteCast',
    onLogs(logs) {
      logs.forEach((log) => {
        const activity: ActivityEvent = {
          eventId: log.transactionHash || ('' as `0x${string}`),
          eventType: 'vote_cast',
          proposalId: log.args.proposalId?.toString() || '',
          user: log.args.voter || '',
          data: {
            support: log.args.support || false,
            votingPower: log.args.votingPower?.toString() || '0',
          },
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
        };
        setActivities(prev => [activity, ...prev].slice(0, 100));
      });
    },
  });

  // Watch for QuorumReached events
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'QuorumReached',
    onLogs(logs) {
      logs.forEach((log) => {
        const activity: ActivityEvent = {
          eventId: log.transactionHash || ('' as `0x${string}`),
          eventType: 'quorum_reached',
          proposalId: log.args.proposalId?.toString() || '',
          user: '', // System event
          data: {},
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
        };
        setActivities(prev => [activity, ...prev].slice(0, 100));
      });
    },
  });

  // Watch for ProposalExecuted events
  useWatchContractEvent({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    eventName: 'ProposalExecuted',
    onLogs(logs) {
      logs.forEach((log) => {
        const activity: ActivityEvent = {
          eventId: log.transactionHash || ('' as `0x${string}`),
          eventType: 'proposal_executed',
          proposalId: log.args.proposalId?.toString() || '',
          user: '', // System event
          data: {},
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
        };
        setActivities(prev => [activity, ...prev].slice(0, 100));
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
        const { activityEventSchemaId } = getSchemaIds();
        
        if (!activityEventSchemaId) {
          return; // SDS not configured, contract events will handle updates
        }

        await connectionManager.subscribe(
          'ActivityEvent',
          [],
          (data: any) => {
            if (!mounted) return;
            
            const activity = data as ActivityEvent;
            setActivities(prev => [activity, ...prev].slice(0, 100));
          },
          (error: Error) => {
            console.error('SDS activity subscription error:', error);
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

  return activities;
}

