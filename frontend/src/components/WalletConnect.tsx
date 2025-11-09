import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { somniaTestnet } from '../lib/wagmi';

export default function WalletConnect() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();

  // Check if user is on the correct network
  const isCorrectNetwork = chainId === somniaTestnet.id || currentChainId === somniaTestnet.id;

  const handleConnect = async () => {
    // Try injected connector first (MetaMask, etc.)
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      connect({ 
        connector: injectedConnector,
        chainId: somniaTestnet.id, // Request connection to Somnia Testnet
      });
    } else {
      // Fallback to first available connector
      connect({ 
        connector: connectors[0],
        chainId: somniaTestnet.id,
      });
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: somniaTestnet.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // If switch fails, try to add the network
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

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        {!isCorrectNetwork && (
          <div className="w-full sm:w-auto">
            <button
              onClick={handleSwitchNetwork}
              className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto bg-status-warning hover:bg-status-warning/80"
            >
              Switch to Somnia Testnet
            </button>
          </div>
        )}
        <div className="hidden sm:block text-sm">
          <div className="text-dark-text-secondary text-xs">Connected</div>
          <div className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</div>
          {!isCorrectNetwork && (
            <div className="text-status-warning text-xs mt-1">Wrong Network</div>
          )}
        </div>
        <button
          onClick={() => disconnect()}
          className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px]"
        >
          <span className="hidden sm:inline">Disconnect</span>
          <span className="sm:hidden">DC</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="btn-primary text-sm sm:text-base px-4 py-2 min-h-[44px]"
    >
      Connect Wallet
    </button>
  );
}

