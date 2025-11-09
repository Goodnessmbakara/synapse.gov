import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import type { ActivityEvent } from '../types';

export function useActivitySubscription() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [connectionManager] = useState(() => new SDSConnectionManager());
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // SDS subscription for real-time updates
  useEffect(() => {
    if (!publicClient) return;

    let mounted = true;
    let subscriptionKey: string | null = null;

    const setupSDSSubscription = async () => {
      try {
        const sdk = await connectionManager.connect(publicClient, walletClient || undefined);
        
        // If SDS is not available, log error
        if (!sdk) {
          console.error('SDS SDK not available - real-time activity updates disabled');
          return;
        }

        const { activityEventSchemaId } = getSchemaIds();
        
        if (!activityEventSchemaId) {
          console.warn('Activity event schema ID not configured');
          return;
        }
        
        // Subscribe to activity events for real-time updates
        // Activity events are named like 'Activity_proposal_created', 'Activity_vote_cast', etc.
        await connectionManager.subscribe(
          'Activity_proposal_created', // Subscribe to proposal creation activities
          [], // No additional view calls needed
          (data: any) => {
            if (!mounted) return;
            
            try {
              const activity = data as ActivityEvent;
              setActivities(prev => [activity, ...prev].slice(0, 100));
            } catch (error) {
              console.warn('Failed to process SDS activity data:', error);
            }
          },
          (error: Error) => {
            console.error('SDS activity subscription error:', error);
          }
        );
        
        subscriptionKey = 'Activity_proposal_created';
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
  }, [publicClient, walletClient, connectionManager]);

  return activities;
}

