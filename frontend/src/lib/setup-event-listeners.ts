// Contract Event Listeners Setup
// This file sets up event listeners on the deployed contract for SDS publishing
// Should be called from a server-side context or API route

import { createPublicClient, http, createWalletClient } from 'viem';
import { setupPublishers } from './sds-publishers';
import { initializeSDK, initializeSchemas } from './sds';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from './contracts';
import { somniaTestnet } from './wagmi';

/**
 * Set up contract event listeners for SDS publishing
 * This should be called from a server-side context (API route, background worker, etc.)
 * 
 * @param privateKey - Private key for wallet client (for publishing)
 */
export async function setupContractEventListeners(privateKey?: `0x${string}`) {
  const rpcUrl = process.env.VITE_RPC_URL || 'https://dream-rpc.somnia.network';
  
  // Create public client
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(rpcUrl),
  });

  // Create wallet client if private key provided
  let walletClient;
  if (privateKey) {
    walletClient = createWalletClient({
      chain: somniaTestnet,
      transport: http(rpcUrl),
    });
    // Note: In a real implementation, you'd need to import the account from private key
    // This is a placeholder - actual implementation depends on your setup
  }

  // Initialize SDS SDK
  const sdk = await initializeSDK(publicClient, walletClient);
  
  if (!sdk) {
    throw new Error('Failed to initialize SDS SDK');
  }
  
  // Initialize schemas
  await initializeSchemas(sdk);

  // Create contract instance using viem
  const contract = {
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    // Event listener methods
    on: async (eventName: string, callback: (...args: any[]) => void) => {
      // Set up event watcher using wagmi/viem
      publicClient.watchContractEvent({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        eventName: eventName as any,
        onLogs: (logs) => {
          logs.forEach((log) => {
            // Extract event arguments
            const args = log.args;
            callback(...Object.values(args || {}));
          });
        },
      });
    },
    // Contract read methods
    getProposal: async (proposalId: bigint) => {
      return await publicClient.readContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'getProposal',
        args: [proposalId],
      });
    },
    quorumThreshold: async () => {
      return await publicClient.readContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'quorumThreshold',
      });
    },
    totalVotingPower: async () => {
      return await publicClient.readContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'totalVotingPower',
      });
    },
    getQuorum: async (proposalId: bigint) => {
      return await publicClient.readContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'getQuorum',
        args: [proposalId],
      });
    },
    checkQuorum: async (proposalId: bigint) => {
      return await publicClient.readContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'checkQuorum',
        args: [proposalId],
      });
    },
  };

  // Set up publishers
  await setupPublishers(sdk, contract);

  console.log('✅ Contract event listeners set up successfully');
  console.log('📍 Contract:', GOVERNANCE_CONTRACT_ADDRESS);
  console.log('📡 Listening for: ProposalCreated, VoteCast, QuorumReached, ProposalExecuted');

  return { sdk, contract };
}

