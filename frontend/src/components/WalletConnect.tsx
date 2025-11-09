import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:block text-sm">
          <div className="text-dark-text-secondary text-xs">Connected</div>
          <div className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</div>
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

  const handleConnect = () => {
    // Try injected connector first (MetaMask, etc.)
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      // Fallback to first available connector
      connect({ connector: connectors[0] });
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="btn-primary text-sm sm:text-base px-4 py-2 min-h-[44px]"
    >
      Connect Wallet
    </button>
  );
}

