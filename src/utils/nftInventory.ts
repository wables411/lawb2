import { JsonRpcProvider, Contract } from 'ethers';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getCollectionNFTs } from '../mint';

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

// RPC endpoints for Ethereum mainnet (with fallbacks)
const ETHEREUM_RPC_ENDPOINTS = [
  'https://eth.llamarpc.com',
  'https://eth.blockscout.com/api/eth-rpc',
  'https://rpc.ankr.com/eth',
  'https://eth-mainnet.public.blastapi.io'
];

// RPC endpoints for Base mainnet (with fallbacks)
const BASE_RPC_ENDPOINTS = [
  'https://mainnet.base.org',
  'https://base.llamarpc.com',
  'https://base-rpc.publicnode.com',
  'https://base.gateway.tenderly.co',
  'https://base.drpc.org',
  'https://1rpc.io/base'
];

/**
 * Helper function to try multiple RPC endpoints with automatic fallback
 * Returns a provider that works, or throws if all endpoints fail
 */
async function getEthereumProvider(): Promise<JsonRpcProvider> {
  let lastError: Error | null = null;
  
  for (const rpcUrl of ETHEREUM_RPC_ENDPOINTS) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      // Test the connection by getting the latest block number
      await provider.getBlockNumber();
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] Using RPC endpoint:', rpcUrl);
      }
      return provider;
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn(`[NFT] RPC endpoint failed (${rpcUrl}):`, error);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Helper function to get a working Base RPC provider with automatic fallback
 */
async function getBaseProvider(): Promise<JsonRpcProvider> {
  let lastError: Error | null = null;
  
  for (const rpcUrl of BASE_RPC_ENDPOINTS) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      // Test the connection by getting the latest block number
      await provider.getBlockNumber();
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] Using Base RPC endpoint:', rpcUrl);
      }
      return provider;
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn(`[NFT] Base RPC endpoint failed (${rpcUrl}):`, error);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  throw new Error(`All Base RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Fetch token IDs using Transfer events when tokenOfOwnerByIndex is not supported
 * Uses eth_getLogs to query Transfer events where 'to' is the wallet address
 */
async function fetchTokenIdsFromTransferEvents(
  contractAddress: string,
  walletAddress: string,
  collectionName: string,
  provider: JsonRpcProvider
): Promise<string[]> {
  try {
    // ERC721 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    // Event signature hash: keccak256("Transfer(address,address,uint256)")
    const TRANSFER_EVENT_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    
    // Pad wallet address to 32 bytes (64 hex chars) for topic filter
    // Format: 0x + 64 hex characters (32 bytes)
    const walletAddressPadded = '0x' + walletAddress.toLowerCase().slice(2).padStart(64, '0');
    
    // Get a recent block number to limit the query (some RPCs don't like fromBlock: 0)
    // Query from 1 year ago (approximately 2.5M blocks) or use earliest if that's too much
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 2500000); // ~1 year of blocks
    
    // Query Transfer events where 'to' is the wallet address
    // Some RPCs don't accept null in topics, so we'll query all Transfer events and filter client-side
    let logs;
    try {
      // Try with null topics first (most efficient)
      logs = await provider.getLogs({
        address: contractAddress,
        topics: [
          TRANSFER_EVENT_SIGNATURE,
          null, // from (any address)
          walletAddressPadded // to (our wallet)
        ],
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
    } catch (nullError) {
      // If null topics fail, query all Transfer events and filter client-side
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn(`[NFT] RPC doesn't support null topics, querying all Transfer events for ${collectionName}`);
      }
      const allLogs = await provider.getLogs({
        address: contractAddress,
        topics: [TRANSFER_EVENT_SIGNATURE],
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
      
      // Filter logs where 'to' is our wallet address
      logs = allLogs.filter(log => {
        if (log.topics.length >= 3) {
          // topics[2] is the 'to' address
          return log.topics[2]?.toLowerCase() === walletAddressPadded.toLowerCase();
        }
        return false;
      });
    }
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log(`[NFT] Found ${logs.length} Transfer events to ${walletAddress} for ${collectionName}`);
    }
    
    // Extract token IDs from Transfer events
    // tokenId is in topics[3] (indexed parameter)
    const tokenIds = new Set<string>();
    
    for (const log of logs) {
      if (log.topics.length >= 4) {
        // topics[3] contains the tokenId (uint256, padded to 32 bytes)
        const tokenIdHex = log.topics[3];
        const tokenId = BigInt(tokenIdHex).toString();
        tokenIds.add(tokenId);
      }
    }
    
    // Also check for Transfer events where 'from' is the wallet (to handle transfers out)
    let fromLogs;
    try {
      fromLogs = await provider.getLogs({
        address: contractAddress,
        topics: [
          TRANSFER_EVENT_SIGNATURE,
          walletAddressPadded, // from (our wallet)
          null // to (any address)
        ],
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
    } catch (nullError) {
      // If null topics fail, query all Transfer events and filter client-side
      const allLogs = await provider.getLogs({
        address: contractAddress,
        topics: [TRANSFER_EVENT_SIGNATURE],
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
      
      // Filter logs where 'from' is our wallet address
      fromLogs = allLogs.filter(log => {
        if (log.topics.length >= 2) {
          // topics[1] is the 'from' address
          return log.topics[1]?.toLowerCase() === walletAddressPadded.toLowerCase();
        }
        return false;
      });
    }
    
    // Remove token IDs that were transferred out
    for (const log of fromLogs) {
      if (log.topics.length >= 4) {
        const tokenIdHex = log.topics[3];
        const tokenId = BigInt(tokenIdHex).toString();
        tokenIds.delete(tokenId);
      }
    }
    
    const tokenIdsArray = Array.from(tokenIds);
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log(`[NFT] Found ${tokenIdsArray.length} ${collectionName} token IDs from Transfer events`);
    }
    
    return tokenIdsArray;
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error(`[NFT] Error fetching ${collectionName} token IDs from Transfer events:`, error);
    }
    throw error;
  }
}

/**
 * Fetch NFT balance and token IDs directly from contract using Base RPC calls
 * Tries multiple Base RPC endpoints with automatic fallback
 */
async function fetchNFTsFromBaseContract(
  contractAddress: string,
  walletAddress: string,
  collectionName: string
): Promise<{ balance: bigint; tokenIds: string[] }> {
  try {
    const provider = await getBaseProvider();
    const contract = new Contract(contractAddress, ERC721_ABI, provider);
    
    // Get balance
    const balance = await contract.balanceOf(walletAddress);
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log(`[NFT] ${collectionName} contract balance (Base):`, balance.toString());
    }
    
    if (balance === 0n) {
      return { balance: 0n, tokenIds: [] };
    }
    
    // Try to get token IDs using tokenOfOwnerByIndex first
    const tokenIds: string[] = [];
    const balanceNum = Number(balance);
    let enumerationFailed = false;
    
    for (let i = 0; i < balanceNum; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
        tokenIds.push(tokenId.toString());
      } catch (e) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn(`[NFT] Error fetching token ${i} for ${collectionName} (contract may not support tokenOfOwnerByIndex):`, e);
        }
        enumerationFailed = true;
        break;
      }
    }
    
    // If enumeration failed but we have a balance, try using Transfer events
    if (enumerationFailed && tokenIds.length === 0 && balance > 0n) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.log(`[NFT] Contract doesn't support tokenOfOwnerByIndex, trying Transfer events for ${collectionName}`);
      }
      try {
        const eventTokenIds = await fetchTokenIdsFromTransferEvents(
          contractAddress,
          walletAddress,
          collectionName,
          provider
        );
        tokenIds.push(...eventTokenIds);
      } catch (eventError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn(`[NFT] Failed to get token IDs from Transfer events for ${collectionName}:`, eventError);
        }
      }
    }
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log(`[NFT] Found ${tokenIds.length} ${collectionName} from Base contract (balance: ${balance.toString()})`);
    }
    
    return { balance, tokenIds };
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error(`[NFT] Error fetching ${collectionName} from Base contract:`, error);
    }
    throw error;
  }
}

/**
 * Fetch NFT balance and token IDs directly from contract using RPC calls
 * Tries multiple RPC endpoints with automatic fallback
 */
async function fetchNFTsFromContract(
  contractAddress: string,
  walletAddress: string,
  collectionName: string
): Promise<{ balance: bigint; tokenIds: string[] }> {
  try {
    const provider = await getEthereumProvider();
    const contract = new Contract(contractAddress, ERC721_ABI, provider);
    
    // Get balance
    const balance = await contract.balanceOf(walletAddress);
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log(`[NFT] ${collectionName} contract balance:`, balance.toString());
    }
    
    if (balance === 0n) {
      return { balance: 0n, tokenIds: [] };
    }
    
    // Try to get token IDs using tokenOfOwnerByIndex first
    const tokenIds: string[] = [];
    const balanceNum = Number(balance);
    let enumerationFailed = false;
    
    for (let i = 0; i < balanceNum; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
        tokenIds.push(tokenId.toString());
      } catch (e) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn(`[NFT] Error fetching token ${i} for ${collectionName} (contract may not support tokenOfOwnerByIndex):`, e);
        }
        enumerationFailed = true;
        break;
      }
    }
    
    // If enumeration failed but we have a balance, try using Transfer events
    if (enumerationFailed && tokenIds.length === 0 && balance > 0n) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.log(`[NFT] Contract doesn't support tokenOfOwnerByIndex, trying Transfer events for ${collectionName}`);
      }
      try {
        const eventTokenIds = await fetchTokenIdsFromTransferEvents(
          contractAddress,
          walletAddress,
          collectionName,
          provider
        );
        tokenIds.push(...eventTokenIds);
      } catch (eventError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn(`[NFT] Failed to get token IDs from Transfer events for ${collectionName}:`, eventError);
        }
      }
    }
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log(`[NFT] Found ${tokenIds.length} ${collectionName} from contract (balance: ${balance.toString()})`);
    }
    
    return { balance, tokenIds };
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error(`[NFT] Error fetching ${collectionName} from contract:`, error);
    }
    throw error;
  }
}

export interface NFTInventory {
  lawbsters: string[];
  lawbstarz: string[];
  halloween_lawbsters: string[];
  pixelawbs: string[];
  asciilawbs: string[];
}

export async function fetchNFTInventory(walletAddress: string): Promise<NFTInventory> {
  const inventory: NFTInventory = {
    lawbsters: [],
    lawbstarz: [],
    halloween_lawbsters: [],
    pixelawbs: [],
    asciilawbs: []
  };

  // Fetch Pixelawbs (Ethereum) - Try Etherscan API first, then contract, then Scatter API
  try {
    const pixelawbs = NFT_COLLECTIONS.pixelawbs;
    const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY || "";
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Fetching Pixelawbs for', walletAddress, 'from Etherscan');
    }
    
    // Etherscan API: Get NFT balance first to verify ownership
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=tokennftbalance&contractaddress=${pixelawbs.address}&address=${walletAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const etherscanResponse = await fetch(etherscanUrl);
    
    if (etherscanResponse.ok) {
      const etherscanData = await etherscanResponse.json();
      // Skip Etherscan if it returns NOTOK (rate limit or invalid key)
      if (etherscanData.status === '0' || etherscanData.message === 'NOTOK') {
        throw new Error(`Etherscan API error: ${etherscanData.message || 'NOTOK'}`);
      }
      if (etherscanData.status === '1' && etherscanData.result) {
        const balanceStr = Array.isArray(etherscanData.result) ? etherscanData.result[0] : etherscanData.result;
        const balance = BigInt(balanceStr || '0');
        
        if (balance === 0n) {
          inventory.pixelawbs = [];
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] No Pixelawbs found from Etherscan (balance is 0)');
          }
        } else {
          // Etherscan confirmed ownership, try to get token IDs from contract
          // If contract doesn't support tokenOfOwnerByIndex, fall back to Scatter API
          try {
            const { tokenIds } = await fetchNFTsFromContract(
              pixelawbs.address,
              walletAddress,
              'Pixelawbs'
            );
            if (tokenIds.length > 0) {
              inventory.pixelawbs = tokenIds;
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs (verified via Etherscan, token IDs from contract)');
              }
            } else {
              throw new Error('No token IDs returned from contract');
            }
          } catch (contractError) {
            // Contract doesn't support tokenOfOwnerByIndex, use Scatter API
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[NFT] Contract call failed, using Scatter API to get token IDs for Pixelawbs');
            }
            const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
            inventory.pixelawbs = response.data
              .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
              .map(nft => nft.token_id.toString());
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs from Scatter API');
            }
          }
        }
      } else {
        throw new Error(`Etherscan API error: ${etherscanData.message || 'Unknown error'}`);
      }
    } else {
      throw new Error(`Etherscan HTTP error: ${etherscanResponse.status}`);
    }
    } catch (etherscanError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('Error fetching Pixelawbs from Etherscan, trying Scatter API directly:', etherscanError);
      }
      // Fallback to Scatter API (most reliable for getting token IDs)
      try {
        const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
        inventory.pixelawbs = response.data
          .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
          .map(nft => nft.token_id.toString());
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs from Scatter API');
        }
      } catch (apiError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('Error fetching Pixelawbs from Scatter API:', apiError);
        }
      }
    }

  // Fetch Lawbsters (Ethereum) - Use Alchemy NFT API via Netlify proxy (keeps API key server-side)
  // Alchemy's getNFTs endpoint returns current holdings directly, no transaction parsing needed
  const lawbsters = NFT_COLLECTIONS.lawbsters;
  try {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Fetching Lawbsters for', walletAddress, 'from Alchemy NFT API (via proxy)');
    }
    
    // Use Netlify function proxy to keep API key server-side
    // Try direct function path first, then fallback to /api route
    const proxyUrl = `/.netlify/functions/alchemy-nft?owner=${encodeURIComponent(walletAddress)}&contractAddress=${encodeURIComponent(lawbsters.address)}`;
    const alchemyResponse = await fetch(proxyUrl);
    
    if (alchemyResponse.ok) {
      const contentType = alchemyResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await alchemyResponse.text();
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT] Alchemy proxy returned non-JSON response:', text.substring(0, 200));
        }
        throw new Error('Alchemy proxy returned invalid response');
      }
      
      const alchemyData = await alchemyResponse.json();
      if (alchemyData.ownedNfts && Array.isArray(alchemyData.ownedNfts)) {
        // Extract token IDs from Alchemy response
        inventory.lawbsters = alchemyData.ownedNfts.map((nft: any) => {
          // Alchemy returns tokenId as hex string or number, convert to string
          const tokenId = nft.id?.tokenId || nft.tokenId;
          return typeof tokenId === 'string' ? tokenId : tokenId.toString();
        });
        
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters from Alchemy API (current holdings)');
        }
      } else {
        inventory.lawbsters = [];
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] No Lawbsters found from Alchemy');
        }
      }
    } else {
      // Alchemy failed, log the error response for debugging
      let errorText = '';
      try {
        const contentType = alchemyResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await alchemyResponse.json();
          errorText = JSON.stringify(errorData);
        } else {
          errorText = await alchemyResponse.text();
        }
      } catch (e) {
        errorText = `Failed to read error response: ${e}`;
      }
      
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('[NFT] Alchemy proxy error:', alchemyResponse.status, errorText.substring(0, 300));
      }
      // Alchemy failed, try contract enumeration
      throw new Error(`Alchemy proxy error: ${alchemyResponse.status}`);
    }
  } catch (alchemyError) {
    // Fallback to contract enumeration if Alchemy fails
    if (typeof window !== 'undefined' && window.console) {
      window.console.warn('[NFT] Alchemy API failed for Lawbsters, trying contract enumeration:', alchemyError);
    }
    try {
      const { balance, tokenIds } = await fetchNFTsFromContract(
        lawbsters.address,
        walletAddress,
        'Lawbsters'
      );
      
      if (balance === 0n) {
        inventory.lawbsters = [];
      } else if (tokenIds.length > 0) {
        inventory.lawbsters = tokenIds;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters from contract enumeration');
        }
      } else {
        // Contract doesn't support enumeration - last resort: OpenSea
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn('[NFT] Contract enumeration not supported, trying OpenSea API');
        }
        const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
        const lawbstersAddress = NFT_COLLECTIONS.lawbsters.address;
        const response = await fetch(
          `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?contract_address=${lawbstersAddress}&limit=100`,
          { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
        );
        if (response.ok) {
          const data = await response.json();
          const nfts = data.nfts || [];
          const lawbstersAddressLower = lawbstersAddress.toLowerCase();
          const filteredNFTs = nfts.filter((nft: any) => 
            nft.contract?.toLowerCase() === lawbstersAddressLower
          );
          inventory.lawbsters = filteredNFTs.map((nft: any) => nft.identifier);
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters from OpenSea API (last resort)');
          }
        } else {
          inventory.lawbsters = [];
        }
      }
    } catch (fallbackError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('[NFT] All methods failed for Lawbsters:', fallbackError);
      }
      inventory.lawbsters = [];
    }
  }

  // Fetch Lawbstarz (Ethereum) - Try Etherscan API first, then contract, then Scatter API
  try {
    const lawbstarz = NFT_COLLECTIONS.lawbstarz;
    const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY || "";
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Fetching Lawbstarz for', walletAddress, 'from Etherscan');
    }
    
    // Etherscan API: Get NFT balance first to verify ownership
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=tokennftbalance&contractaddress=${lawbstarz.address}&address=${walletAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const etherscanResponse = await fetch(etherscanUrl);
    
    if (etherscanResponse.ok) {
      const etherscanData = await etherscanResponse.json();
      // Skip Etherscan if it returns NOTOK (rate limit or invalid key)
      if (etherscanData.status === '0' || etherscanData.message === 'NOTOK') {
        throw new Error(`Etherscan API error: ${etherscanData.message || 'NOTOK'}`);
      }
      if (etherscanData.status === '1' && etherscanData.result) {
        const balanceStr = Array.isArray(etherscanData.result) ? etherscanData.result[0] : etherscanData.result;
        const balance = BigInt(balanceStr || '0');
        
        if (balance === 0n) {
          inventory.lawbstarz = [];
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] No Lawbstarz found from Etherscan (balance is 0)');
          }
        } else {
          // Etherscan confirmed ownership, try to get token IDs from contract
          // If contract doesn't support tokenOfOwnerByIndex, fall back to Scatter API
          try {
            const { tokenIds } = await fetchNFTsFromContract(
              lawbstarz.address,
              walletAddress,
              'Lawbstarz'
            );
            if (tokenIds.length > 0) {
              inventory.lawbstarz = tokenIds;
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz (verified via Etherscan, token IDs from contract)');
              }
            } else {
              throw new Error('No token IDs returned from contract');
            }
          } catch (contractError) {
            // If contract call failed, use Scatter API
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[NFT] Contract call failed, using Scatter API to get token IDs for Lawbstarz');
            }
            try {
              const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
              inventory.lawbstarz = response.data
                .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
                .map(nft => nft.token_id.toString());
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz from Scatter API');
              }
            } catch (scatterError) {
              if (typeof window !== 'undefined' && window.console) {
                window.console.error('[NFT] Error fetching Lawbstarz from Scatter API:', scatterError);
              }
            }
          }
        }
      } else {
        throw new Error(`Etherscan API error: ${etherscanData.message || 'Unknown error'}`);
      }
    } else {
      throw new Error(`Etherscan HTTP error: ${etherscanResponse.status}`);
    }
  } catch (etherscanError) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.warn('Error fetching Lawbstarz from Etherscan, trying Scatter API directly:', etherscanError);
    }
    // Fallback to Scatter API (most reliable for getting token IDs)
    try {
      const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
      inventory.lawbstarz = response.data
        .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
        .map(nft => nft.token_id.toString());
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz from Scatter API');
      }
    } catch (apiError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Error fetching Lawbstarz from Scatter API:', apiError);
      }
    }
  }

  // Fetch Halloween Lawbsters (Base chain) - Use Alchemy NFT API via Netlify proxy (keeps API key server-side)
  const halloween = NFT_COLLECTIONS.halloween_lawbsters;
  try {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Fetching Halloween Lawbsters for', walletAddress, 'from Alchemy NFT API (Base chain, via proxy)');
    }
    
    // Use Netlify function proxy to keep API key server-side, specify Base chain
    const proxyUrl = `/.netlify/functions/alchemy-nft?owner=${encodeURIComponent(walletAddress)}&contractAddress=${encodeURIComponent(halloween.address)}&chain=base`;
    const alchemyResponse = await fetch(proxyUrl);
    
    if (alchemyResponse.ok) {
      const contentType = alchemyResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await alchemyResponse.text();
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT] Alchemy proxy returned non-JSON response for Halloween Lawbsters:', text.substring(0, 200));
        }
        throw new Error('Alchemy proxy returned invalid response');
      }
      
      const alchemyData = await alchemyResponse.json();
      if (alchemyData.ownedNfts && Array.isArray(alchemyData.ownedNfts)) {
        // Extract token IDs from Alchemy response
        inventory.halloween_lawbsters = alchemyData.ownedNfts.map((nft: any) => {
          // Alchemy returns tokenId as hex string or number, convert to string
          const tokenId = nft.id?.tokenId || nft.tokenId;
          return typeof tokenId === 'string' ? tokenId : tokenId.toString();
        });
        
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.halloween_lawbsters.length, 'Halloween Lawbsters from Alchemy API (Base chain, current holdings)');
        }
      } else {
        inventory.halloween_lawbsters = [];
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] No Halloween Lawbsters found from Alchemy');
        }
      }
    } else {
      // Alchemy failed, log the error response for debugging
      let errorText = '';
      try {
        const contentType = alchemyResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await alchemyResponse.json();
          errorText = JSON.stringify(errorData);
        } else {
          errorText = await alchemyResponse.text();
        }
      } catch (e) {
        errorText = `Failed to read error response: ${e}`;
      }
      
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('[NFT] Alchemy proxy error for Halloween Lawbsters:', alchemyResponse.status, errorText.substring(0, 300));
      }
      // Alchemy failed, try contract enumeration
      throw new Error(`Alchemy proxy error: ${alchemyResponse.status}`);
    }
  } catch (alchemyError) {
    // Fallback to Base contract enumeration if Alchemy fails
    if (typeof window !== 'undefined' && window.console) {
      window.console.warn('[NFT] Alchemy API failed for Halloween Lawbsters, trying Base contract enumeration:', alchemyError);
    }
    try {
      const { balance, tokenIds } = await fetchNFTsFromBaseContract(
        halloween.address,
        walletAddress,
        'Halloween Lawbsters'
      );
      
      if (balance === 0n) {
        inventory.halloween_lawbsters = [];
      } else if (tokenIds.length > 0) {
        inventory.halloween_lawbsters = tokenIds;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.halloween_lawbsters.length, 'Halloween Lawbsters from Base contract enumeration');
        }
      } else {
        inventory.halloween_lawbsters = [];
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn('[NFT] Base contract enumeration returned no token IDs for Halloween Lawbsters');
        }
      }
    } catch (fallbackError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('[NFT] All methods failed for Halloween Lawbsters:', fallbackError);
      }
      inventory.halloween_lawbsters = [];
    }
  }

  // Fetch ASCII Lawbsters (Base chain) - Use Alchemy NFT API via Netlify proxy (keeps API key server-side)
  const asciilawbs = NFT_COLLECTIONS.asciilawbs;
  try {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Fetching ASCII Lawbsters for', walletAddress, 'from Alchemy NFT API (Base chain, via proxy)');
    }
    
    // Use Netlify function proxy to keep API key server-side, specify Base chain
    const proxyUrl = `/.netlify/functions/alchemy-nft?owner=${encodeURIComponent(walletAddress)}&contractAddress=${encodeURIComponent(asciilawbs.address)}&chain=base`;
    const alchemyResponse = await fetch(proxyUrl);
    
    if (alchemyResponse.ok) {
      const contentType = alchemyResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await alchemyResponse.text();
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT] Alchemy proxy returned non-JSON response for ASCII Lawbsters:', text.substring(0, 200));
        }
        throw new Error('Alchemy proxy returned invalid response');
      }
      
      const alchemyData = await alchemyResponse.json();
      if (alchemyData.ownedNfts && Array.isArray(alchemyData.ownedNfts)) {
        // Extract token IDs from Alchemy response
        inventory.asciilawbs = alchemyData.ownedNfts.map((nft: any) => {
          // Alchemy returns tokenId as hex string or number, convert to string
          const tokenId = nft.id?.tokenId || nft.tokenId;
          return typeof tokenId === 'string' ? tokenId : tokenId.toString();
        });
        
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.asciilawbs.length, 'ASCII Lawbsters from Alchemy API (Base chain, current holdings)');
        }
      } else {
        inventory.asciilawbs = [];
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] No ASCII Lawbsters found from Alchemy');
        }
      }
    } else {
      // Alchemy failed, log the error response for debugging
      let errorText = '';
      try {
        const contentType = alchemyResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await alchemyResponse.json();
          errorText = JSON.stringify(errorData);
        } else {
          errorText = await alchemyResponse.text();
        }
      } catch (e) {
        errorText = `Failed to read error response: ${e}`;
      }
      
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('[NFT] Alchemy proxy error for ASCII Lawbsters:', alchemyResponse.status, errorText.substring(0, 300));
      }
      // Alchemy failed, try contract enumeration
      throw new Error(`Alchemy proxy error: ${alchemyResponse.status}`);
    }
  } catch (alchemyError) {
    // Fallback to Base contract enumeration if Alchemy fails
    if (typeof window !== 'undefined' && window.console) {
      window.console.warn('[NFT] Alchemy API failed for ASCII Lawbsters, trying Base contract enumeration:', alchemyError);
    }
    try {
      const { balance, tokenIds } = await fetchNFTsFromBaseContract(
        asciilawbs.address,
        walletAddress,
        'ASCII Lawbsters'
      );
      
      if (balance === 0n) {
        inventory.asciilawbs = [];
      } else if (tokenIds.length > 0) {
        inventory.asciilawbs = tokenIds;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.asciilawbs.length, 'ASCII Lawbsters from Base contract enumeration');
        }
      } else {
        inventory.asciilawbs = [];
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn('[NFT] Base contract enumeration returned no token IDs for ASCII Lawbsters');
        }
      }
    } catch (fallbackError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('[NFT] All methods failed for ASCII Lawbsters:', fallbackError);
      }
      inventory.asciilawbs = [];
    }
  }

  return inventory;
}

