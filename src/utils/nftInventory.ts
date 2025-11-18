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
}

export async function fetchNFTInventory(walletAddress: string): Promise<NFTInventory> {
  const inventory: NFTInventory = {
    lawbsters: [],
    lawbstarz: [],
    halloween_lawbsters: [],
    pixelawbs: []
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
    const proxyUrl = `/api/alchemy-nft?owner=${encodeURIComponent(walletAddress)}&contractAddress=${encodeURIComponent(lawbsters.address)}`;
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
      const errorText = await alchemyResponse.text();
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('[NFT] Alchemy API error response:', errorText);
      }
      // Alchemy failed, try contract enumeration
      throw new Error(`Alchemy API error: ${alchemyResponse.status} - ${errorText.substring(0, 100)}`);
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

  // Fetch Halloween Lawbsters (Base chain) - Use contract directly for accurate count
  try {
    const halloween = NFT_COLLECTIONS.halloween_lawbsters;
    const baseProvider = new JsonRpcProvider('https://mainnet.base.org');
    const contract = new Contract(halloween.address, ERC721_ABI, baseProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Halloween Lawbsters contract balance:', balance.toString());
    }
    
    // If balance is 0, skip fetching token IDs
    if (balance === 0n) {
      inventory.halloween_lawbsters = [];
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] No Halloween Lawbsters found (balance is 0)');
      }
    } else {
      const tokenIds: string[] = [];
      const balanceNum = Number(balance);
      for (let i = 0; i < balanceNum; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId.toString());
        } catch (e) {
          if (typeof window !== 'undefined' && window.console) {
            window.console.warn(`Error fetching token ${i} for Halloween Lawbsters:`, e);
          }
          break;
        }
      }
      inventory.halloween_lawbsters = tokenIds;
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] Found', inventory.halloween_lawbsters.length, 'Halloween Lawbsters from contract');
      }
    }
  } catch (contractError) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error('Error fetching Halloween Lawbsters from contract, trying OpenSea API:', contractError);
    }
    // Fallback to OpenSea API
    try {
      const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
      const halloweenAddress = NFT_COLLECTIONS.halloween_lawbsters.address;
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] Fetching Halloween Lawbsters for', walletAddress, 'from OpenSea Base');
      }
      const response = await fetch(
        `https://api.opensea.io/api/v2/chain/base/account/${walletAddress}/nfts?contract_address=${halloweenAddress}&limit=100`,
        { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
      );
      if (response.ok) {
        const data = await response.json();
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Halloween Lawbsters OpenSea response:', data);
        }
        inventory.halloween_lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.halloween_lawbsters.length, 'Halloween Lawbsters from OpenSea');
        }
      } else {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT] OpenSea API error for Halloween Lawbsters:', response.status, response.statusText);
        }
      }
    } catch (apiError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Error fetching Halloween Lawbsters from OpenSea API:', apiError);
      }
    }
  }

  return inventory;
}

