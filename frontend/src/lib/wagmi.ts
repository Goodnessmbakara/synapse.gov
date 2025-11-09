import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Somnia Testnet chain configuration
// Using official RPC URL from docs: https://dream-rpc.somnia.network
const rpcUrl = (import.meta.env.VITE_RPC_URL as string) || 'https://dream-rpc.somnia.network';

// Define Somnia Testnet chain (may not be in viem/chains yet)
export const somniaTestnet = defineChain({
  id: 50312, // Actual Somnia Testnet chain ID
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'SOM',
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: (import.meta.env.VITE_EXPLORER_URL as string) || 'https://explorer.somnia.network',
    },
  },
});

export const config = createConfig({
  chains: [somniaTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [somniaTestnet.id]: http(rpcUrl),
  },
  ssr: false,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
