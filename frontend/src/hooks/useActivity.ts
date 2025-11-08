import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SDSConnectionManager, getSchemaIds } from '../lib/sds';
import type { ActivityEvent } from '../types';

export function useActivitySubscription() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
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
        const { activityEventSchemaId } = getSchemaIds();
        
        if (!activityEventSchemaId) {
          console.warn('Activity event schema ID not initialized - SDS not configured yet');
          return;
        }

        // Subscribe using official SDK API format
        await connectionManager.subscribe(
          'ActivityEvent', // Event ID (needs to be registered first)
          [], // ethCalls for enrichment
          (data: any) => {
            if (!mounted) return;
            
            const activity = data as ActivityEvent;
            setActivities(prev => {
              // Keep last 100 activities
              return [activity, ...prev].slice(0, 100);
            });
          },
          (error: Error) => {
            console.error('Activity subscription error:', error);
          }
        );
      } catch (error) {
        console.warn('Failed to setup activity subscription:', error);
        // Don't throw - allow app to continue rendering
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      connectionManager.disconnect();
    };
  }, [publicClient, walletClient, connectionManager]);

  return activities;
}

