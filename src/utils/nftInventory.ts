import { JsonRpcProvider, Contract } from 'ethers';
import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getCollectionNFTs } from '../mint';

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

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
      if (etherscanData.status === '1' && etherscanData.result) {
        const balanceStr = Array.isArray(etherscanData.result) ? etherscanData.result[0] : etherscanData.result;
        const balance = BigInt(balanceStr || '0');
        
        if (balance === 0n) {
          inventory.pixelawbs = [];
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] No Pixelawbs found from Etherscan (balance is 0)');
          }
        } else {
          // Etherscan confirmed ownership, get token IDs from contract
          const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
          const contract = new Contract(pixelawbs.address, ERC721_ABI, ethereumProvider);
          const tokenIds: string[] = [];
          const balanceNum = Number(balance);
          for (let i = 0; i < balanceNum; i++) {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
              tokenIds.push(tokenId.toString());
            } catch (e) {
              if (typeof window !== 'undefined' && window.console) {
                window.console.warn(`Error fetching token ${i} for Pixelawbs:`, e);
              }
              break;
            }
          }
          inventory.pixelawbs = tokenIds;
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs (verified via Etherscan, token IDs from contract)');
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
      window.console.warn('Error fetching Pixelawbs from Etherscan, trying contract:', etherscanError);
    }
    // Fallback to contract call
    try {
      const pixelawbs = NFT_COLLECTIONS.pixelawbs;
      const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
      const contract = new Contract(pixelawbs.address, ERC721_ABI, ethereumProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      if (balance === 0n) {
        inventory.pixelawbs = [];
      } else {
        const tokenIds: string[] = [];
        const balanceNum = Number(balance);
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
            tokenIds.push(tokenId.toString());
          } catch (e) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.warn(`Error fetching token ${i} for Pixelawbs:`, e);
            }
            break;
          }
        }
        inventory.pixelawbs = tokenIds;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs from contract');
        }
      }
    } catch (contractError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('Error fetching Pixelawbs from contract, trying Scatter API:', contractError);
      }
      // Final fallback to Scatter API
      try {
        const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
        inventory.pixelawbs = response.data
          .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
          .map(nft => nft.token_id.toString());
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs from Scatter API (fallback)');
        }
      } catch (apiError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('Error fetching Pixelawbs from Scatter API:', apiError);
        }
      }
    }
  }

  // Fetch Lawbsters (Ethereum) - Try Etherscan API first (most reliable), then contract, then OpenSea
  try {
    const lawbsters = NFT_COLLECTIONS.lawbsters;
    // Etherscan free tier works without API key, but using one increases rate limits
    // You can get a free API key from https://etherscan.io/apis
    const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY || "";
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT] Fetching Lawbsters for', walletAddress, 'from Etherscan');
    }
    
    // Etherscan API: Get NFT balance first to verify ownership, then get token IDs from contract
    // Note: tokennftbalance only returns balance count, not token IDs
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=tokennftbalance&contractaddress=${lawbsters.address}&address=${walletAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const etherscanResponse = await fetch(etherscanUrl);
    
    if (etherscanResponse.ok) {
      const etherscanData = await etherscanResponse.json();
      if (etherscanData.status === '1' && etherscanData.result) {
        // Etherscan returns balance as string "0" or array with balance
        const balanceStr = Array.isArray(etherscanData.result) ? etherscanData.result[0] : etherscanData.result;
        const balance = BigInt(balanceStr || '0');
        
        if (balance === 0n) {
          inventory.lawbsters = [];
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] No Lawbsters found from Etherscan (balance is 0)');
          }
        } else {
          // Etherscan confirmed ownership, now get token IDs from contract (more reliable than parsing transactions)
          const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
          const contract = new Contract(lawbsters.address, ERC721_ABI, ethereumProvider);
          const tokenIds: string[] = [];
          const balanceNum = Number(balance);
          for (let i = 0; i < balanceNum; i++) {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
              tokenIds.push(tokenId.toString());
            } catch (e) {
              if (typeof window !== 'undefined' && window.console) {
                window.console.warn(`Error fetching token ${i} for Lawbsters:`, e);
              }
              break;
            }
          }
          inventory.lawbsters = tokenIds;
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters (verified via Etherscan, token IDs from contract)');
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
      window.console.warn('Error fetching Lawbsters from Etherscan, trying contract:', etherscanError);
    }
    // Fallback to contract call
    try {
      const lawbsters = NFT_COLLECTIONS.lawbsters;
      const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
      const contract = new Contract(lawbsters.address, ERC721_ABI, ethereumProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[NFT] Lawbsters contract balance:', balance.toString());
      }
      
      if (balance === 0n) {
        inventory.lawbsters = [];
      } else {
        const tokenIds: string[] = [];
        const balanceNum = Number(balance);
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
            tokenIds.push(tokenId.toString());
          } catch (e) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.warn(`Error fetching token ${i} for Lawbsters:`, e);
            }
            break;
          }
        }
        inventory.lawbsters = tokenIds;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters from contract');
        }
      }
    } catch (contractError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Error fetching Lawbsters from contract, trying OpenSea API:', contractError);
      }
      // Final fallback to OpenSea API
      try {
        const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
        const lawbstersAddress = NFT_COLLECTIONS.lawbsters.address;
        const response = await fetch(
          `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?contract_address=${lawbstersAddress}&limit=100`,
          { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
        );
        if (response.ok) {
          const data = await response.json();
          inventory.lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters from OpenSea (fallback)');
          }
        }
      } catch (apiError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('Error fetching Lawbsters from OpenSea API:', apiError);
        }
      }
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
      if (etherscanData.status === '1' && etherscanData.result) {
        const balanceStr = Array.isArray(etherscanData.result) ? etherscanData.result[0] : etherscanData.result;
        const balance = BigInt(balanceStr || '0');
        
        if (balance === 0n) {
          inventory.lawbstarz = [];
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] No Lawbstarz found from Etherscan (balance is 0)');
          }
        } else {
          // Etherscan confirmed ownership, get token IDs from contract
          const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
          const contract = new Contract(lawbstarz.address, ERC721_ABI, ethereumProvider);
          const tokenIds: string[] = [];
          const balanceNum = Number(balance);
          for (let i = 0; i < balanceNum; i++) {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
              tokenIds.push(tokenId.toString());
            } catch (e) {
              if (typeof window !== 'undefined' && window.console) {
                window.console.warn(`Error fetching token ${i} for Lawbstarz:`, e);
              }
              break;
            }
          }
          inventory.lawbstarz = tokenIds;
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz (verified via Etherscan, token IDs from contract)');
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
      window.console.warn('Error fetching Lawbstarz from Etherscan, trying contract:', etherscanError);
    }
    // Fallback to contract call
    try {
      const lawbstarz = NFT_COLLECTIONS.lawbstarz;
      const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
      const contract = new Contract(lawbstarz.address, ERC721_ABI, ethereumProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      if (balance === 0n) {
        inventory.lawbstarz = [];
      } else {
        const tokenIds: string[] = [];
        const balanceNum = Number(balance);
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
            tokenIds.push(tokenId.toString());
          } catch (e) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.warn(`Error fetching token ${i} for Lawbstarz:`, e);
            }
            break;
          }
        }
        inventory.lawbstarz = tokenIds;
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz from contract');
        }
      }
    } catch (contractError) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.warn('Error fetching Lawbstarz from contract, trying Scatter API:', contractError);
      }
      // Final fallback to Scatter API
      try {
        const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
        inventory.lawbstarz = response.data
          .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
          .map(nft => nft.token_id.toString());
        if (typeof window !== 'undefined' && window.console) {
          window.console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz from Scatter API (fallback)');
        }
      } catch (apiError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('Error fetching Lawbstarz from Scatter API:', apiError);
        }
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

