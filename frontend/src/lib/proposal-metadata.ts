// Helper function to fetch proposal title and description from ProposalCreated events
// This is needed for the optimized contract where strings are stored in events, not storage

import { PublicClient } from 'viem';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from './contracts';

export interface ProposalMetadata {
  title: string;
  description: string;
}

const metadataCache = new Map<string, ProposalMetadata>();

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Don't retry on "missing block data" errors for genesis blocks
      if (error.message?.includes('missing block data') && attempt === 0) {
        throw error; // Fail fast for genesis block issues
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Fetch events with error handling and retry logic
 */
async function fetchEventsWithRetry(
  publicClient: PublicClient,
  fromBlock: bigint,
  toBlock: bigint,
  proposalId?: bigint
) {
  // Skip genesis block queries if they're likely to fail
  // Many RPC providers don't have genesis block data
  if (fromBlock === 0n && toBlock < 1000n) {
    throw new Error('Skipping genesis block query - missing block data');
  }

  return retryWithBackoff(async () => {
    const eventParams: any = {
      address: GOVERNANCE_CONTRACT_ADDRESS,
      abi: GovernanceABI,
      eventName: 'ProposalCreated',
      fromBlock: fromBlock,
      toBlock: toBlock,
    };

    if (proposalId !== undefined) {
      eventParams.args = { proposalId };
    }

    return await publicClient.getContractEvents(eventParams);
  });
}

/**
 * Fetch proposal title and description from ProposalCreated event
 * Uses cache to avoid repeated RPC calls
 * Handles RPC block range limitations by chunking requests
 */
export async function getProposalMetadata(
  publicClient: PublicClient,
  proposalId: bigint
): Promise<ProposalMetadata | null> {
  const cacheKey = `${GOVERNANCE_CONTRACT_ADDRESS}-${proposalId}`;
  
  // Check cache first
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  try {
    // RPC providers limit block ranges to 1000 blocks
    // We'll search in chunks of 1000 blocks
    const CHUNK_SIZE = 1000n;
    const MAX_SEARCH_BLOCKS = 10000n; // Limit how far back we search
    
    let currentBlock: bigint;
    try {
      currentBlock = await publicClient.getBlockNumber();
    } catch (error) {
      console.warn('Could not get current block:', error);
      return null;
    }

    // Start from a reasonable point - try last 5000 blocks first
    // Avoid genesis block queries which often fail
    const minBlock = currentBlock > MAX_SEARCH_BLOCKS 
      ? currentBlock - MAX_SEARCH_BLOCKS 
      : (currentBlock > 1000n ? 1000n : 0n); // Start from block 1000 if available, otherwise 0
    
    let fromBlock = currentBlock > 5000n ? currentBlock - 5000n : minBlock;
    let found = false;
    let metadata: ProposalMetadata | null = null;

    // Search in chunks of 1000 blocks (recent blocks first)
    while (fromBlock <= currentBlock && !found && fromBlock >= minBlock) {
      const toBlock = fromBlock + CHUNK_SIZE - 1n > currentBlock 
        ? currentBlock 
        : fromBlock + CHUNK_SIZE - 1n;

      try {
        const events = await fetchEventsWithRetry(
          publicClient,
          fromBlock,
          toBlock,
          proposalId
        );

        if (events.length > 0) {
          const event = events[0] as any;
          metadata = {
            title: (event.args?.title as string) || '',
            description: (event.args?.description as string) || '',
          };
          found = true;
          break;
        }
      } catch (error: any) {
        // If this chunk fails and it's a genesis block issue, skip it
        if (error.message?.includes('missing block data') || error.message?.includes('Skipping genesis')) {
          console.debug(`Skipping block range ${fromBlock}-${toBlock} due to missing block data`);
          // Move past this problematic range
          fromBlock = toBlock + 1n;
          continue;
        }
        console.warn(`Failed to fetch events from block ${fromBlock} to ${toBlock}:`, error.message);
      }

      // Move to next chunk
      fromBlock = toBlock + 1n;
    }

    // If not found in recent blocks and we haven't searched from minBlock, try older blocks
    if (!found && fromBlock > minBlock && minBlock > 0n) {
      console.log(`Proposal ${proposalId} not found in recent blocks, searching older blocks...`);
      fromBlock = minBlock;
      
      while (fromBlock < currentBlock && !found) {
        const toBlock = fromBlock + CHUNK_SIZE - 1n > currentBlock 
          ? currentBlock 
          : fromBlock + CHUNK_SIZE - 1n;

        try {
          const events = await fetchEventsWithRetry(
            publicClient,
            fromBlock,
            toBlock,
            proposalId
          );

          if (events.length > 0) {
            const event = events[0] as any;
            metadata = {
              title: (event.args?.title as string) || '',
              description: (event.args?.description as string) || '',
            };
            found = true;
            break;
          }
        } catch (error: any) {
          // Skip problematic block ranges
          if (error.message?.includes('missing block data') || error.message?.includes('Skipping genesis')) {
            console.debug(`Skipping block range ${fromBlock}-${toBlock} due to missing block data`);
            fromBlock = toBlock + 1n;
            continue;
          }
          console.warn(`Failed to fetch events from block ${fromBlock} to ${toBlock}:`, error.message);
        }

        fromBlock = toBlock + 1n;
      }
    }

    if (!found || !metadata) {
      console.warn(`No ProposalCreated event found for proposal ${proposalId}`);
      return null;
    }

    // Cache the result
    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error(`Failed to fetch proposal metadata for ${proposalId}:`, error);
    return null;
  }
}

/**
 * Fetch metadata for multiple proposals in batch
 * More efficient than fetching individually
 * Handles RPC block range limitations by chunking requests
 */
export async function getProposalMetadataBatch(
  publicClient: PublicClient,
  proposalIds: bigint[]
): Promise<Map<bigint, ProposalMetadata>> {
  const results = new Map<bigint, ProposalMetadata>();
  
  if (proposalIds.length === 0) {
    return results;
  }

  // Fetch all ProposalCreated events at once, but in chunks
  try {
    const CHUNK_SIZE = 1000n; // RPC limit
    const MAX_SEARCH_BLOCKS = 10000n; // Limit how far back we search
    
    let currentBlock: bigint;
    try {
      currentBlock = await publicClient.getBlockNumber();
    } catch (error) {
      console.warn('Could not get current block:', error);
      return results;
    }

    console.log(`Fetching ProposalCreated events for ${proposalIds.length} proposals...`);

    // Start from recent blocks (last 5000) and work backwards if needed
    // Avoid genesis block queries which often fail
    const minBlock = currentBlock > MAX_SEARCH_BLOCKS 
      ? currentBlock - MAX_SEARCH_BLOCKS 
      : (currentBlock > 1000n ? 1000n : 0n); // Start from block 1000 if available
    
    let fromBlock = currentBlock > 5000n ? currentBlock - 5000n : minBlock;
    const eventMap = new Map<bigint, ProposalMetadata>();
    let allFound = false;

    // Search in chunks of 1000 blocks (recent blocks first)
    while (fromBlock <= currentBlock && !allFound && fromBlock >= minBlock) {
      const toBlock = fromBlock + CHUNK_SIZE - 1n > currentBlock 
        ? currentBlock 
        : fromBlock + CHUNK_SIZE - 1n;

      try {
        const events = await fetchEventsWithRetry(
          publicClient,
          fromBlock,
          toBlock
        );

        console.log(`Found ${events.length} ProposalCreated events in blocks ${fromBlock}-${toBlock}`);

          events.forEach((event) => {
            const eventAny = event as any;
            const proposalId = eventAny.args?.proposalId as bigint;
            if (proposalId && proposalIds.includes(proposalId) && !eventMap.has(proposalId)) {
              const title = (eventAny.args?.title as string) || '';
              const description = (eventAny.args?.description as string) || '';
            
            eventMap.set(proposalId, { title, description });
            
            // Also cache it
            const cacheKey = `${GOVERNANCE_CONTRACT_ADDRESS}-${proposalId}`;
            metadataCache.set(cacheKey, { title, description });
            
            console.log(`Found metadata for proposal ${proposalId}: title="${title.substring(0, 30)}..."`);
          }
        });

        // Check if we found all proposals
        allFound = proposalIds.every(id => eventMap.has(id));
        if (allFound) {
          break;
        }
      } catch (error: any) {
        // Skip problematic block ranges
        if (error.message?.includes('missing block data') || error.message?.includes('Skipping genesis')) {
          console.debug(`Skipping block range ${fromBlock}-${toBlock} due to missing block data`);
          fromBlock = toBlock + 1n;
          continue;
        }
        console.warn(`Failed to fetch events from block ${fromBlock} to ${toBlock}:`, error.message);
      }

      // Move to next chunk
      fromBlock = toBlock + 1n;
    }

    // If we didn't find all proposals and we haven't searched from minBlock, try older blocks
    if (!allFound && fromBlock > minBlock && minBlock > 0n) {
      console.log(`Missing ${proposalIds.length - eventMap.size} proposals, searching older blocks...`);
      fromBlock = minBlock;
      
      const missingIds = proposalIds.filter(id => !eventMap.has(id));
      
      while (fromBlock < currentBlock && missingIds.length > 0) {
        const toBlock = fromBlock + CHUNK_SIZE - 1n > currentBlock 
          ? currentBlock 
          : fromBlock + CHUNK_SIZE - 1n;

        try {
          const events = await fetchEventsWithRetry(
            publicClient,
            fromBlock,
            toBlock
          );

          events.forEach((event) => {
            const eventAny = event as any;
            const proposalId = eventAny.args?.proposalId as bigint;
            if (proposalId && missingIds.includes(proposalId) && !eventMap.has(proposalId)) {
              const title = (eventAny.args?.title as string) || '';
              const description = (eventAny.args?.description as string) || '';
              
              eventMap.set(proposalId, { title, description });
              
              const cacheKey = `${GOVERNANCE_CONTRACT_ADDRESS}-${proposalId}`;
              metadataCache.set(cacheKey, { title, description });
              
              console.log(`Found missing proposal ${proposalId} from older block search`);
            }
          });

          // Update missingIds list
          const stillMissing = missingIds.filter(id => !eventMap.has(id));
          if (stillMissing.length === 0) {
            break;
          }
        } catch (error: any) {
          // Skip problematic block ranges
          if (error.message?.includes('missing block data') || error.message?.includes('Skipping genesis')) {
            console.debug(`Skipping block range ${fromBlock}-${toBlock} due to missing block data`);
            fromBlock = toBlock + 1n;
            continue;
          }
          console.warn(`Failed to search from block ${fromBlock} to ${toBlock}:`, error.message);
        }

        fromBlock = toBlock + 1n;
      }
    }

    // Return results for requested proposal IDs
    proposalIds.forEach((id) => {
      if (eventMap.has(id)) {
        results.set(id, eventMap.get(id)!);
      } else {
        console.warn(`No metadata found for proposal ${id} in batch fetch`);
      }
    });

    console.log(`Retrieved metadata for ${results.size} out of ${proposalIds.length} proposals`);
  } catch (error) {
    console.error('Failed to fetch proposal metadata batch:', error);
  }

  return results;
}

/**
 * Fetch proposal metadata directly from a transaction hash
 * Useful for debugging or when you have the tx hash but not the proposal ID
 */
export async function getProposalMetadataFromTx(
  publicClient: PublicClient,
  txHash: `0x${string}`
): Promise<{ proposalId: bigint; metadata: ProposalMetadata } | null> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    
    // Find ProposalCreated event in the receipt logs
    const event = receipt.logs.find((log) => {
      // Check if this log is from our contract
      return log.address.toLowerCase() === GOVERNANCE_CONTRACT_ADDRESS.toLowerCase();
    });

    if (!event) {
      console.warn(`No events found in transaction ${txHash}`);
      return null;
    }

    // Decode the event
    const events = await publicClient.getContractEvents({
      address: GOVERNANCE_CONTRACT_ADDRESS,
      abi: GovernanceABI,
      eventName: 'ProposalCreated',
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    const proposalEvent = events.find(e => e.transactionHash === txHash);
    
    if (!proposalEvent) {
      console.warn(`ProposalCreated event not found in transaction ${txHash}`);
      return null;
    }

    const proposalId = proposalEvent.args.proposalId as bigint;
    const metadata: ProposalMetadata = {
      title: (proposalEvent.args.title as string) || '',
      description: (proposalEvent.args.description as string) || '',
    };

    // Cache it
    const cacheKey = `${GOVERNANCE_CONTRACT_ADDRESS}-${proposalId}`;
    metadataCache.set(cacheKey, metadata);

    return { proposalId, metadata };
  } catch (error) {
    console.error(`Failed to fetch proposal metadata from tx ${txHash}:`, error);
    return null;
  }
}

/**
 * Clear metadata cache (useful for testing or when contract changes)
 */
export function clearMetadataCache() {
  metadataCache.clear();
}

