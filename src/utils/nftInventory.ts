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

  // Fetch Pixelawbs (Ethereum) - Try API first, fallback to contract
  try {
    console.log('[NFT] Fetching Pixelawbs for', walletAddress);
    const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
    console.log('[NFT] Pixelawbs API response:', response.data.length, 'NFTs');
    inventory.pixelawbs = response.data
      .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
      .map(nft => nft.token_id.toString());
    console.log('[NFT] Found', inventory.pixelawbs.length, 'Pixelawbs owned by', walletAddress);
  } catch (apiError) {
    console.error('[NFT] Error fetching Pixelawbs from API, trying contract:', apiError);
    try {
      const pixelawbs = NFT_COLLECTIONS.pixelawbs;
      const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
      const contract = new Contract(pixelawbs.address, ERC721_ABI, ethereumProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      const tokenIds: string[] = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId.toString());
        } catch (e) {
          console.warn(`Error fetching token ${i} for Pixelawbs:`, e);
          break; // Contract might not support tokenOfOwnerByIndex
        }
      }
      inventory.pixelawbs = tokenIds;
    } catch (error) {
      console.error('Error fetching Pixelawbs from contract:', error);
    }
  }

  // Fetch Lawbsters (Ethereum) - Try OpenSea API by contract address
  try {
    const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
    const lawbstersAddress = NFT_COLLECTIONS.lawbsters.address;
    console.log('[NFT] Fetching Lawbsters for', walletAddress, 'from OpenSea');
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?contract_address=${lawbstersAddress}&limit=100`,
      { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
    );
    if (response.ok) {
      const data = await response.json();
      console.log('[NFT] Lawbsters response:', data);
      inventory.lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
      console.log('[NFT] Found', inventory.lawbsters.length, 'Lawbsters');
    } else {
      console.error('[NFT] OpenSea API error for Lawbsters:', response.status, response.statusText);
    }
  } catch (apiError) {
    console.error('Error fetching Lawbsters from OpenSea API, trying contract:', apiError);
    try {
      const lawbsters = NFT_COLLECTIONS.lawbsters;
      const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
      const contract = new Contract(lawbsters.address, ERC721_ABI, ethereumProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      const tokenIds: string[] = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId.toString());
        } catch (e) {
          console.warn(`Error fetching token ${i} for Lawbsters:`, e);
          break;
        }
      }
      inventory.lawbsters = tokenIds;
    } catch (error) {
      console.error('Error fetching Lawbsters from contract:', error);
    }
  }

  // Fetch Lawbstarz (Ethereum) - Try API first
  try {
    console.log('[NFT] Fetching Lawbstarz for', walletAddress);
    const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
    console.log('[NFT] Lawbstarz API response:', response.data.length, 'NFTs');
    inventory.lawbstarz = response.data
      .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
      .map(nft => nft.token_id.toString());
    console.log('[NFT] Found', inventory.lawbstarz.length, 'Lawbstarz owned by', walletAddress);
  } catch (apiError) {
    console.error('[NFT] Error fetching Lawbstarz from API, trying contract:', apiError);
    try {
      const lawbstarz = NFT_COLLECTIONS.lawbstarz;
      const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
      const contract = new Contract(lawbstarz.address, ERC721_ABI, ethereumProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      const tokenIds: string[] = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId.toString());
        } catch (e) {
          console.warn(`Error fetching token ${i} for Lawbstarz:`, e);
          break;
        }
      }
      inventory.lawbstarz = tokenIds;
    } catch (error) {
      console.error('Error fetching Lawbstarz from contract:', error);
    }
  }

  // Fetch Halloween Lawbsters (Base chain) - Try OpenSea API by contract address
  try {
    const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
    const halloweenAddress = NFT_COLLECTIONS.halloween_lawbsters.address;
    console.log('[NFT] Fetching Halloween Lawbsters for', walletAddress, 'from OpenSea Base');
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/account/${walletAddress}/nfts?contract_address=${halloweenAddress}&limit=100`,
      { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
    );
    if (response.ok) {
      const data = await response.json();
      console.log('[NFT] Halloween Lawbsters response:', data);
      inventory.halloween_lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
      console.log('[NFT] Found', inventory.halloween_lawbsters.length, 'Halloween Lawbsters');
    } else {
      console.error('[NFT] OpenSea API error for Halloween Lawbsters:', response.status, response.statusText);
    }
  } catch (apiError) {
    console.error('[NFT] Error fetching Halloween Lawbsters from OpenSea API, trying contract:', apiError);
    try {
      const halloween = NFT_COLLECTIONS.halloween_lawbsters;
      const baseProvider = new JsonRpcProvider('https://mainnet.base.org');
      const contract = new Contract(halloween.address, ERC721_ABI, baseProvider);
      const balance = await contract.balanceOf(walletAddress);
      
      const tokenIds: string[] = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId.toString());
        } catch (e) {
          console.warn(`Error fetching token ${i} for Halloween Lawbsters:`, e);
          break;
        }
      }
      inventory.halloween_lawbsters = tokenIds;
    } catch (error) {
      console.error('Error fetching Halloween Lawbsters from contract:', error);
    }
  }

  return inventory;
}

