import React, { useState, useEffect } from 'react';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

interface WalletConnectorProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({
  onConnect,
  onDisconnect,
  isConnected = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string>('');

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof (window as any).ethereum !== 'undefined') {
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            if (!isConnected) {
              onConnect?.();
            }
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof (window as any).ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAddress('');
          onDisconnect?.();
        } else if (accounts[0] !== address) {
          // User switched accounts
          setAddress(accounts[0]);
          if (!isConnected) {
            onConnect?.();
          }
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup listener on component unmount
      return () => {
        (window as any).ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [onConnect, onDisconnect, isConnected, address]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Check if MetaMask is installed
      if (typeof (window as any).ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to use this app.');
        setIsLoading(false);
        return;
      }

      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);

        // Switch to Sepolia testnet if needed
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
          });
        } catch (switchError: any) {
          // If the chain hasn't been added to MetaMask, add it
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            });
          }
        }

        onConnect?.();
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAddress('');
    onDisconnect?.();
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </span>
        <button
          onClick={handleDisconnect}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default WalletConnector;