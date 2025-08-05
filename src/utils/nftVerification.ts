// NFT verification utilities for Pixelawbs collection
const PIXELAWBS_CONTRACT_ADDRESS = '0x2d278e95b2fC67D4b27a276807e24E479D9707F6';

// ERC-721 balanceOf function ABI
const ERC721_BALANCE_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  }
];

export interface NFTVerificationResult {
  hasPixelawbsNFT: boolean;
  balance: number;
  error?: string;
}

/**
 * Check if a wallet owns at least 1 Pixelawb NFT using cross-chain verification
 * This works regardless of which network the user is currently connected to
 * @param walletAddress - The wallet address to check
 * @returns Promise<NFTVerificationResult>
 */
export const checkPixelawbsNFTOwnership = async (
  walletAddress: string
): Promise<NFTVerificationResult> => {
  try {
    // Use a public Ethereum RPC endpoint to check NFT ownership
    // This allows us to verify Ethereum NFTs while user is on Sanko
    const ethereumRpcUrl = 'https://eth.llamarpc.com'; // Public RPC endpoint
    
    // Call balanceOf function on the Pixelawbs contract via Ethereum RPC
    const response = await fetch(ethereumRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: PIXELAWBS_CONTRACT_ADDRESS,
            data: '0x70a08231' + '000000000000000000000000' + walletAddress.slice(2) // balanceOf(address)
          },
          'latest'
        ],
        id: 1
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message}`);
    }

    // Parse the result (returns hex string)
    const balance = parseInt(result.result, 16);
    
    return {
      hasPixelawbsNFT: balance > 0,
      balance: balance
    };
  } catch (error) {
    console.error('[NFT_VERIFICATION] Error checking Pixelawbs NFT ownership:', error);
    return {
      hasPixelawbsNFT: false,
      balance: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Alternative method using ethers.js with custom provider
 * This also works cross-chain
 */
export const checkPixelawbsNFTOwnershipWithEthers = async (
  walletAddress: string
): Promise<NFTVerificationResult> => {
  try {
    // Create a custom provider for Ethereum mainnet
    const { JsonRpcProvider } = await import('ethers');
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');

    // Create contract instance
    const { Contract } = await import('ethers');
    const contract = new Contract(
      PIXELAWBS_CONTRACT_ADDRESS,
      ERC721_BALANCE_ABI,
      ethereumProvider
    );

    // Call balanceOf
    const balance = await contract.balanceOf(walletAddress);
    
    return {
      hasPixelawbsNFT: balance > 0,
      balance: balance.toNumber()
    };
  } catch (error) {
    console.error('[NFT_VERIFICATION] Error checking Pixelawbs NFT ownership with ethers:', error);
    return {
      hasPixelawbsNFT: false,
      balance: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fallback method that prompts user to switch networks
 * Use this if cross-chain verification fails
 */
export const checkPixelawbsNFTOwnershipWithNetworkSwitch = async (
  walletAddress: string,
  ethereumProvider: any
): Promise<NFTVerificationResult> => {
  try {
    // Check if we're on Ethereum mainnet
    const chainId = await ethereumProvider.request({ method: 'eth_chainId' });
    if (chainId !== '0x1') { // Ethereum mainnet
      return {
        hasPixelawbsNFT: false,
        balance: 0,
        error: 'Please switch to Ethereum mainnet to verify Pixelawbs NFT ownership'
      };
    }

    // Call balanceOf function on the Pixelawbs contract
    const result = await ethereumProvider.request({
      method: 'eth_call',
      params: [
        {
          to: PIXELAWBS_CONTRACT_ADDRESS,
          data: '0x70a08231' + '000000000000000000000000' + walletAddress.slice(2) // balanceOf(address)
        },
        'latest'
      ]
    });

    // Parse the result (returns hex string)
    const balance = parseInt(result, 16);
    
    return {
      hasPixelawbsNFT: balance > 0,
      balance: balance
    };
  } catch (error) {
    console.error('[NFT_VERIFICATION] Error checking Pixelawbs NFT ownership:', error);
    return {
      hasPixelawbsNFT: false,
      balance: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 