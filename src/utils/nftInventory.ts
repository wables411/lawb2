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
    const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
    inventory.pixelawbs = response.data
      .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
      .map(nft => nft.token_id.toString());
  } catch (apiError) {
    console.error('Error fetching Pixelawbs from API, trying contract:', apiError);
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

  // Fetch Lawbsters (Ethereum) - Try OpenSea API
  try {
    const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?collection=lawbsters&limit=100`,
      { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
    );
    if (response.ok) {
      const data = await response.json();
      inventory.lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
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
    const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
    inventory.lawbstarz = response.data
      .filter(nft => nft.owner_of?.toLowerCase() === walletAddress.toLowerCase())
      .map(nft => nft.token_id.toString());
  } catch (apiError) {
    console.error('Error fetching Lawbstarz from API, trying contract:', apiError);
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

  // Fetch Halloween Lawbsters (Base chain) - Try OpenSea API first
  try {
    const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/account/${walletAddress}/nfts?collection=a-lawbster-halloween&limit=100`,
      { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
    );
    if (response.ok) {
      const data = await response.json();
      inventory.halloween_lawbsters = data.nfts?.map((nft: any) => nft.identifier) || [];
    }
  } catch (apiError) {
    console.error('Error fetching Halloween Lawbsters from OpenSea API, trying contract:', apiError);
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

