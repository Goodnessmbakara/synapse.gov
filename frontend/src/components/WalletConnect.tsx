import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="text-dark-text-secondary">Connected</div>
          <div className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</div>
        </div>
        <button
          onClick={() => disconnect()}
          className="btn-secondary text-sm"
        >
          Disconnect
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
      className="btn-primary"
    >
      Connect Wallet
    </button>
  );
}

