// SDS Schema Definitions and Integration
// Based on official Somnia Data Streams SDK documentation:
// https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide

import { SDK, SchemaEncoder, zeroBytes32 } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';
import { defineChain, toHex } from 'viem';
import { keccak256, stringToHex } from 'viem';
import type { Proposal, Vote } from '../types';

// Define Somnia Testnet for SDS initialization
const somniaTestnet = defineChain({
  id: 50312, // Actual Somnia Testnet chain ID (matches wagmi.ts)
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

/**
 * Compute schema ID locally using keccak256 hash
 * This avoids the need for contract calls and works offline
 */
function computeSchemaIdLocal(schema: string): `0x${string}` {
  // Compute keccak256 hash of the schema string
  const schemaHex = stringToHex(schema);
  return keccak256(schemaHex) as `0x${string}`;
}

// Schema IDs (computed from schema strings)
// Using local computation to avoid contract calls
let proposalSchemaId: `0x${string}` | null = computeSchemaIdLocal(ProposalSchemaString);
let voteSchemaId: `0x${string}` | null = computeSchemaIdLocal(VoteSchemaString);
let quorumEventSchemaId: `0x${string}` | null = QuorumEventSchemaString ? computeSchemaIdLocal(QuorumEventSchemaString) : null;
let activityEventSchemaId: `0x${string}` | null = computeSchemaIdLocal(ActivityEventSchemaString);

// Initialize SDK instance
let sdkInstance: SDK | null = null;

/**
 * Initialize SDK with public and wallet clients
 * Per official docs: https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide
 * 
 * NOTE: SDS is optional - if initialization fails, the app will continue without SDS features
 */
export async function initializeSDK(publicClient: any, walletClient?: any) {
  try {
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

    // Schema IDs are already computed locally (no contract call needed)
    // The SDK's computeSchemaId might call a contract, but we compute locally for reliability
    console.log('SDS SDK initialized successfully');
    console.log('Schema IDs:', {
      proposal: proposalSchemaId,
      vote: voteSchemaId,
      quorum: quorumEventSchemaId,
      activity: activityEventSchemaId,
    });

    return sdkInstance;
  } catch (error: any) {
    // SDK initialization failed - this is OK, SDS is optional
    console.warn('SDS initialization failed (SDS is optional, app will continue without it):', error.message);
    sdkInstance = null;
    proposalSchemaId = null;
    voteSchemaId = null;
    quorumEventSchemaId = null;
    activityEventSchemaId = null;
    return null;
  }
}

export async function initializeSchemas(sdk: SDK) {
  try {
    // Register schemas on-chain using registerDataSchemas (array-based)
    // If already registered, the second parameter (true) will skip registration
    // Use zeroBytes32 as parent (cast to Hex type)
    const parentSchema = zeroBytes32 as `0x${string}`;
    
    // Compute schema IDs locally (SDK's computeSchemaId tries to call a contract which may not be configured)
    // Local computation using keccak256 is the standard way and matches SDK's internal logic
    proposalSchemaId = computeSchemaIdLocal(ProposalSchemaString);
    voteSchemaId = computeSchemaIdLocal(VoteSchemaString);
    quorumEventSchemaId = QuorumEventSchemaString ? computeSchemaIdLocal(QuorumEventSchemaString) : null;
    activityEventSchemaId = computeSchemaIdLocal(ActivityEventSchemaString);
    
    // Register schemas using registerDataSchemas (correct method)
    // This makes schemas discoverable on-chain but is optional
    try {
      await sdk.streams.registerDataSchemas([
        {
          id: 'proposal',
          schema: ProposalSchemaString,
          parentSchemaId: parentSchema,
        },
        {
          id: 'vote',
          schema: VoteSchemaString,
          parentSchemaId: parentSchema,
        },
        {
          id: 'quorum',
          schema: QuorumEventSchemaString,
          parentSchemaId: parentSchema,
        },
        {
          id: 'activity',
          schema: ActivityEventSchemaString,
          parentSchemaId: parentSchema,
        },
      ], true); // true = ignore if already registered
      
      console.log('Schemas registered successfully');
    } catch (error: any) {
      // Schema registration is optional - schemas can be used without registration
      console.debug('Schema registration skipped (optional):', error.message);
    }
  } catch (error: any) {
    console.warn('Schema initialization failed, using locally computed IDs:', error.message);
    // Schema IDs are already computed locally, so we can continue
  }
  
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

/**
 * Read proposal data from SDS by proposal ID
 * This reads from persistent SDS storage, not from contract events
 * 
 * @param sdk - Initialized SDS SDK instance
 * @param proposalId - Proposal ID (bigint or string)
 * @param publisher - Address that published the proposal (usually the proposer)
 * @returns Proposal data if found, null otherwise
 */
export async function getProposalFromSDS(
  sdk: SDK,
  proposalId: bigint | string,
  publisher: string
): Promise<Proposal | null> {
  try {
    const { proposalSchemaId } = getSchemaIds();
    if (!proposalSchemaId) {
      return null;
    }

    const dataId = toHex(proposalId.toString(), { size: 32 });
    
    // Try to read from SDS using getByKey
    const data = await sdk.streams.getByKey(
      proposalSchemaId,
      publisher as `0x${string}`,
      dataId
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Decode the first result (most recent)
    const rawData = Array.isArray(data[0]) ? data[0] : data;
    const decoded = decodeProposal(rawData[0] as `0x${string}`);
    
    return decoded;
  } catch (error: any) {
    console.debug(`Failed to read proposal ${proposalId} from SDS:`, error.message);
    return null;
  }
}

/**
 * Read all proposals from SDS for a given publisher
 * Useful for fetching multiple proposals at once
 * 
 * @param sdk - Initialized SDS SDK instance
 * @param publisher - Address that published the proposals
 * @returns Array of proposals found in SDS
 */
export async function getAllProposalsFromSDS(
  sdk: SDK,
  publisher: string
): Promise<Proposal[]> {
  try {
    const { proposalSchemaId } = getSchemaIds();
    if (!proposalSchemaId) {
      return [];
    }

    // Get all data for this schema and publisher
    // Note: API signature may vary - using schemaId directly if getAllPublisherDataForSchema doesn't accept object
    const allData = await (sdk.streams as any).getAllPublisherDataForSchema(
      proposalSchemaId,
      publisher as `0x${string}`
    );

    if (!allData || !Array.isArray(allData) || allData.length === 0) {
      return [];
    }

    const proposals: Proposal[] = [];
    
    for (const dataEntry of allData) {
      try {
        const rawData = Array.isArray(dataEntry) ? dataEntry : [dataEntry];
        if (rawData.length > 0 && typeof rawData[0] === 'string' && rawData[0].startsWith('0x')) {
          const decoded = decodeProposal(rawData[0] as `0x${string}`);
          proposals.push(decoded);
        }
      } catch (error) {
        console.warn('Failed to decode proposal from SDS:', error);
      }
    }

    return proposals;
  } catch (error: any) {
    console.debug(`Failed to read proposals from SDS for publisher ${publisher}:`, error.message);
    return [];
  }
}

/**
 * Publish a proposal to SDS and emit a ProposalCreated event
 * This should be called after a proposal is successfully created on-chain
 * 
 * @param sdk - Initialized SDS SDK instance
 * @param proposal - Proposal data to publish
 * @param proposalId - Proposal ID (bigint or string)
 */
export async function publishProposalToSDS(
  sdk: SDK,
  proposal: Proposal,
  proposalId: bigint | string
): Promise<void> {
  try {
    // Ensure schemas are initialized before publishing
    await initializeSchemas(sdk);
    
    const { proposalSchemaId } = getSchemaIds();
    if (!proposalSchemaId) {
      console.warn('Proposal schema ID not available, skipping SDS publish');
      return;
    }

    const dataId = toHex(proposalId.toString(), { size: 32 });
    const encodedData = encodeProposal(proposal);
    
    // Check if setAndEmitEvents exists, otherwise use set() and emitEvents() separately
    if (typeof (sdk.streams as any).setAndEmitEvents === 'function') {
      // Use setAndEmitEvents to both store data and emit an event
      // This makes the proposal available for SDS subscriptions
      await (sdk.streams as any).setAndEmitEvents(
        [
          {
            id: dataId,
            schemaId: proposalSchemaId,
            data: encodedData,
          },
        ],
        [
          {
            id: 'ProposalCreated', // event ID/name that subscribers listen to
            argumentTopics: [dataId], // topics for filtering (proposal ID)
            data: encodedData, // event data
          },
        ]
      );
      console.log(`✅ Proposal ${proposalId} published to SDS and ProposalCreated event emitted`);
    } else {
      // Fallback: Use set() and emitEvents() separately
      // First, store the data
      await sdk.streams.set([
        {
          id: dataId,
          schemaId: proposalSchemaId,
          data: encodedData,
        },
      ]);
      
      // Then, emit the event
      if (typeof (sdk.streams as any).emitEvents === 'function') {
        await (sdk.streams as any).emitEvents([
          {
            id: 'ProposalCreated', // event ID/name that subscribers listen to
            argumentTopics: [dataId], // topics for filtering (proposal ID)
            data: encodedData, // event data
          },
        ]);
      }
      
      console.log(`✅ Proposal ${proposalId} published to SDS (using set + emitEvents)`);
    }
  } catch (error: any) {
    // Don't throw - SDS publishing is optional, contract events will handle updates
    console.warn('Failed to publish proposal to SDS (optional):', error.message);
  }
}

// Encoding/Decoding helpers using SchemaEncoder
export function encodeProposal(proposal: Proposal): `0x${string}` {
  try {
    const encoder = new SchemaEncoder(ProposalSchemaString);
    return encoder.encodeData([
      { name: 'id', type: 'bytes32', value: toHex(proposal.id, { size: 32 }) },
      { name: 'title', type: 'string', value: proposal.title },
      { name: 'description', type: 'string', value: proposal.description },
      { name: 'proposer', type: 'address', value: proposal.proposer },
      { name: 'votesFor', type: 'uint256', value: proposal.votesFor },
      { name: 'votesAgainst', type: 'uint256', value: proposal.votesAgainst },
      { name: 'quorumThreshold', type: 'uint256', value: proposal.quorumThreshold },
      { name: 'currentQuorum', type: 'uint256', value: proposal.currentQuorum },
      { name: 'deadline', type: 'uint256', value: proposal.deadline },
      { name: 'status', type: 'string', value: proposal.status },
      { name: 'createdAt', type: 'uint256', value: proposal.createdAt },
      { name: 'totalVotingPower', type: 'uint256', value: proposal.totalVotingPower },
    ]);
  } catch (error) {
    console.warn('Schema encoding failed, using JSON fallback:', error);
    // Fallback to JSON encoding
    const json = JSON.stringify(proposal);
    return `0x${Buffer.from(json).toString('hex')}` as `0x${string}`;
  }
}

export function encodeVote(vote: Vote): `0x${string}` {
  try {
    const encoder = new SchemaEncoder(VoteSchemaString);
    return encoder.encodeData([
      { name: 'proposalId', type: 'bytes32', value: toHex(vote.proposalId, { size: 32 }) },
      { name: 'voter', type: 'address', value: vote.voter },
      { name: 'support', type: 'bool', value: vote.support },
      { name: 'votingPower', type: 'uint256', value: vote.votingPower },
      { name: 'timestamp', type: 'uint256', value: vote.timestamp },
      { name: 'txHash', type: 'bytes32', value: vote.txHash || zeroBytes32 },
    ]);
  } catch (error) {
    console.warn('Schema encoding failed, using JSON fallback:', error);
    // Fallback to JSON encoding
    const json = JSON.stringify(vote);
    return `0x${Buffer.from(json).toString('hex')}` as `0x${string}`;
  }
}

export function decodeProposal(data: `0x${string}`): Proposal {
  try {
    const encoder = new SchemaEncoder(ProposalSchemaString);
    const decoded = encoder.decodeData(data);
    // Convert decoded items back to Proposal type
    const result: any = {};
    decoded.forEach(item => {
      result[item.name] = item.value.value;
    });
    return result as Proposal;
  } catch (error) {
    console.warn('Schema decoding failed, using JSON fallback:', error);
    // Fallback to JSON decoding
    const json = Buffer.from(data.slice(2), 'hex').toString();
    return JSON.parse(json) as Proposal;
  }
}

export function decodeVote(data: `0x${string}`): Vote {
  try {
    const encoder = new SchemaEncoder(VoteSchemaString);
    const decoded = encoder.decodeData(data);
    // Convert decoded items back to Vote type
    const result: any = {};
    decoded.forEach(item => {
      result[item.name] = item.value.value;
    });
    return result as Vote;
  } catch (error) {
    console.warn('Schema decoding failed, using JSON fallback:', error);
    // Fallback to JSON decoding
    const json = Buffer.from(data.slice(2), 'hex').toString();
    return JSON.parse(json) as Vote;
  }
}

// SDS Connection Manager
export class SDSConnectionManager {
  private sdk: SDK | null = null;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  async connect(publicClient: any, walletClient?: any) {
    try {
      // Initialize SDK with proper clients per official docs
      // SDS is optional - if it fails, app continues without SDS features
      this.sdk = await initializeSDK(publicClient, walletClient);
      if (!this.sdk) {
        console.info('SDS not available - app will use contract events instead');
        return null;
      }

      // Initialize and register schemas
      try {
        await initializeSchemas(this.sdk);
      } catch (error: any) {
        console.warn('Schema initialization failed, continuing without schema registration:', error.message);
        // Continue even if schema registration fails - schemas may already be registered
      }

      return this.sdk;
    } catch (error: any) {
      // SDS connection failed - this is OK, SDS is optional
      console.info('SDS connection failed (optional feature):', error.message);
      // Return null but don't throw - allow app to continue rendering
      this.sdk = null;
      return null;
    }
  }

  /**
   * Subscribe to SDS data streams using real SDS SDK
   * 
   * Per official SDK: subscribe({ somniaStreamsEventId, ethCalls, onData, onError, ... })
   * We subscribe to EVENT NAMES (like 'ProposalCreated', 'VoteCast'), not schema IDs
   * 
   * @param eventId - Event ID/name (e.g., 'ProposalCreated', 'VoteCast')
   * @param viewCalls - View calls for enrichment (optional, for fetching additional context)
   * @param onData - Callback for data updates
   * @param onError - Optional callback for errors
   */
  async subscribe(
    eventId: string | null,
    viewCalls: any[] = [],
    onData?: (data: any) => void,
    onError?: (error: Error) => void
  ) {
    if (!this.sdk) {
      const error = new Error('SDS SDK not initialized');
      if (onError) onError(error);
      throw error;
    }

    if (!eventId) {
      const error = new Error('Event ID is required for subscription');
      if (onError) onError(error);
      throw error;
    }

    try {
      // Use real SDS SDK subscribe method with object parameter
      // Signature: subscribe({ somniaStreamsEventId, ethCalls, onData, onError, onlyPushChanges, ... })
      const subscription = await this.sdk.streams.subscribe({
        somniaStreamsEventId: eventId,
        ethCalls: viewCalls,
        onlyPushChanges: true, // Only push when data actually changes
        onData: (event: any) => {
          try {
            if (onData) {
              onData(event);
            }
          } catch (error: any) {
            console.error('Error in SDS subscription callback:', error);
            if (onError) {
              onError(error instanceof Error ? error : new Error(String(error)));
            }
          }
        },
        onError: (error: any) => {
          console.error('SDS subscription error:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        },
      });

      const subscriptionKey = eventId;
      if (subscription) {
        this.subscriptions.set(subscriptionKey, subscription);
        console.log(`✅ SDS subscription created for event: ${eventId}`);
      }
      
      return subscription;
    } catch (error: any) {
      console.error(`Failed to create SDS subscription for event ${eventId}:`, error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  unsubscribe(eventId: string) {
    const subscription = this.subscriptions.get(eventId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(eventId);
    }
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.sdk = null;
  }
}
