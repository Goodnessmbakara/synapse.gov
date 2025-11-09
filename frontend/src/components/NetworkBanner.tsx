import { useAccount, useChainId } from 'wagmi';
import { somniaTestnet } from '../lib/wagmi';
import { useSwitchChain } from 'wagmi';

export default function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const isCorrectNetwork = chainId === somniaTestnet.id;
  
  if (!isConnected || isCorrectNetwork) {
    return null;
  }

  const handleSwitch = async () => {
    try {
      await switchChain({ chainId: somniaTestnet.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Try to add network if switch fails
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${somniaTestnet.id.toString(16)}`,
              chainName: somniaTestnet.name,
              nativeCurrency: {
                name: somniaTestnet.nativeCurrency.name,
                symbol: somniaTestnet.nativeCurrency.symbol,
                decimals: somniaTestnet.nativeCurrency.decimals,
              },
              rpcUrls: [somniaTestnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [somniaTestnet.blockExplorers.default.url],
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
    }
  };

  return (
    <div className="bg-status-warning/20 border-b border-status-warning/40 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-sm text-theme-primary">
          <span className="font-semibold">⚠️ Wrong Network:</span> Please switch to <span className="font-mono">Somnia Testnet</span> (Chain ID: {somniaTestnet.id}) to interact with this dApp.
        </div>
        <button
          onClick={handleSwitch}
          className="btn-primary text-xs sm:text-sm px-4 py-1.5 bg-status-warning hover:bg-status-warning/80 text-white"
        >
          Switch Network
        </button>
      </div>
    </div>
  );
}

