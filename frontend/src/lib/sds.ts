// SDS Schema Definitions and Integration
// Based on official Somnia Data Streams SDK documentation:
// https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide

import { SDK } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';
import type { Proposal, Vote } from '../types';

// Define Somnia Testnet for SDS initialization
const somniaTestnet = defineChain({
  id: 123456,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'SOM',
  },
  rpcUrls: {
    default: {
      http: [(import.meta.env.VITE_RPC_URL as string) || 'https://dream-rpc.somnia.network'],
    },
  },
});

// Schema Definitions (as strings, per SDK documentation)
// Format: 'type1 field1, type2 field2, ...'
export const ProposalSchemaString = 'bytes32 id, string title, string description, address proposer, uint256 votesFor, uint256 votesAgainst, uint256 quorumThreshold, uint256 currentQuorum, uint256 deadline, string status, uint256 createdAt, uint256 totalVotingPower';

export const VoteSchemaString = 'bytes32 proposalId, address voter, bool support, uint256 votingPower, uint256 timestamp, bytes32 txHash';

export const QuorumEventSchemaString = 'bytes32 proposalId, string eventType, uint256 currentQuorum, uint256 requiredQuorum, uint256 timestamp';

export const ActivityEventSchemaString = 'bytes32 eventId, string eventType, bytes32 proposalId, address user, string data, uint256 timestamp';

// Schema IDs (computed from schema strings using SDK)
let proposalSchemaId: `0x${string}` | null = null;
let voteSchemaId: `0x${string}` | null = null;
let quorumEventSchemaId: `0x${string}` | null = null;
let activityEventSchemaId: `0x${string}` | null = null;

// Initialize SDK instance
let sdkInstance: SDK | null = null;

/**
 * Initialize SDK with public and wallet clients
 * Per official docs: https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide
 */
export async function initializeSDK(publicClient: any, walletClient?: any) {
  const rpcUrl = (import.meta.env.VITE_RPC_URL as string) || 'https://dream-rpc.somnia.network';
  
  // Use provided public client or create one
  const publicClientInstance = publicClient || createPublicClient({
    chain: somniaTestnet,
    transport: http(rpcUrl),
  });

  // Create SDK instance
  sdkInstance = new SDK({
    public: publicClientInstance,
    wallet: walletClient || undefined,
  });

  // Compute schema IDs using the SDK
  proposalSchemaId = (await sdkInstance.streams.computeSchemaId(ProposalSchemaString)) as `0x${string}` || null;
  voteSchemaId = (await sdkInstance.streams.computeSchemaId(VoteSchemaString)) as `0x${string}` || null;
  quorumEventSchemaId = (await sdkInstance.streams.computeSchemaId(QuorumEventSchemaString)) as `0x${string}` || null;
  activityEventSchemaId = (await sdkInstance.streams.computeSchemaId(ActivityEventSchemaString)) as `0x${string}` || null;

  return sdkInstance;
}

export async function initializeSchemas(sdk: SDK) {
  // Compute schema IDs using the SDK
  proposalSchemaId = (await sdk.streams.computeSchemaId(ProposalSchemaString)) as `0x${string}` || null;
  voteSchemaId = (await sdk.streams.computeSchemaId(VoteSchemaString)) as `0x${string}` || null;
  quorumEventSchemaId = (await sdk.streams.computeSchemaId(QuorumEventSchemaString)) as `0x${string}` || null;
  activityEventSchemaId = (await sdk.streams.computeSchemaId(ActivityEventSchemaString)) as `0x${string}` || null;
  
  return {
    proposalSchemaId,
    voteSchemaId,
    quorumEventSchemaId,
    activityEventSchemaId,
  };
}

export function getSchemaIds() {
  return {
    proposalSchemaId,
    voteSchemaId,
    quorumEventSchemaId,
    activityEventSchemaId,
  };
}

export function getSDKInstance() {
  return sdkInstance;
}

// Encoding/Decoding helpers
// Note: SDS uses Hex strings for data, not Uint8Array
// Per docs: data should be encoded using SchemaEncoder or similar
export function encodeProposal(proposal: Proposal): `0x${string}` {
  // TODO: Implement proper encoding using SDS SDK SchemaEncoder
  // For now, JSON encoding as placeholder
  const json = JSON.stringify(proposal);
  return `0x${Buffer.from(json).toString('hex')}` as `0x${string}`;
}

export function encodeVote(vote: Vote): `0x${string}` {
  // TODO: Implement proper encoding using SDS SDK SchemaEncoder
  const json = JSON.stringify(vote);
  return `0x${Buffer.from(json).toString('hex')}` as `0x${string}`;
}

export function decodeProposal(data: `0x${string}`): Proposal {
  // TODO: Implement proper decoding using SDS SDK
  const json = Buffer.from(data.slice(2), 'hex').toString();
  return JSON.parse(json) as Proposal;
}

export function decodeVote(data: `0x${string}`): Vote {
  // TODO: Implement proper decoding using SDS SDK
  const json = Buffer.from(data.slice(2), 'hex').toString();
  return JSON.parse(json) as Vote;
}

// SDS Connection Manager
export class SDSConnectionManager {
  private sdk: SDK | null = null;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  async connect(publicClient: any, walletClient?: any) {
    try {
      // Initialize SDK with proper clients per official docs
      this.sdk = await initializeSDK(publicClient, walletClient);
      return this.sdk;
    } catch (error) {
      console.warn('SDS connection failed:', error);
      // Return null but don't throw - allow app to continue rendering
      this.sdk = null;
      return null;
    }
  }

  /**
   * Subscribe to SDS events
   * Per official docs: https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide
   * 
   * @param somniaStreamsEventId - Event ID (must be registered first)
   * @param ethCalls - ETH calls for enrichment (can be empty array)
   * @param onData - Callback for successful notifications
   * @param onError - Callback for errors
   */
  async subscribe(
    somniaStreamsEventId: string | null,
    ethCalls: any[] = [],
    onData: (data: any) => void,
    onError?: (error: Error) => void
  ) {
    if (!this.sdk) {
      console.warn('SDS not connected - returning mock subscription');
      const subscription = {
        unsubscribe: () => {},
      };
      this.subscriptions.set(somniaStreamsEventId || 'mock', subscription);
      return subscription;
    }

    try {
      // Use official SDK subscribe method per documentation
      // Type assertion needed as SDK types may not be fully available
      const streams = this.sdk.streams as any;
      const result = await streams.subscribe({
        somniaStreamsEventId,
        ethCalls,
        onData,
        onError: onError || ((err: any) => console.error('Subscription error:', err)),
      });

      if (result) {
        this.subscriptions.set(somniaStreamsEventId || 'mock', result);
        return result;
      }
    } catch (error) {
      console.warn('Failed to subscribe:', error);
      // Return mock subscription to prevent app crash
      const subscription = {
        unsubscribe: () => {},
      };
      this.subscriptions.set(somniaStreamsEventId || 'mock', subscription);
      return subscription;
    }

    // Fallback mock subscription
    const subscription = {
      unsubscribe: () => {},
    };
    this.subscriptions.set(somniaStreamsEventId || 'mock', subscription);
    return subscription;
  }

  unsubscribe(schemaId: string) {
    const subscription = this.subscriptions.get(schemaId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(schemaId);
    }
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.sdk = null;
  }
}
