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

  // Fetch Pixelawbs (Ethereum)
  try {
    const pixelawbs = NFT_COLLECTIONS.pixelawbs;
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
    const contract = new Contract(pixelawbs.address, ERC721_ABI, ethereumProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.pixelawbs = tokenIds;
  } catch (error) {
    console.error('Error fetching Pixelawbs:', error);
    try {
      const response = await getCollectionNFTs('pixelawbs', 1, 100, walletAddress);
      inventory.pixelawbs = response.data.map(nft => nft.token_id.toString());
    } catch (apiError) {
      console.error('Error fetching Pixelawbs from API:', apiError);
    }
  }

  // Fetch Lawbsters (Ethereum)
  try {
    const lawbsters = NFT_COLLECTIONS.lawbsters;
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
    const contract = new Contract(lawbsters.address, ERC721_ABI, ethereumProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.lawbsters = tokenIds;
  } catch (error) {
    console.error('Error fetching Lawbsters:', error);
  }

  // Fetch Lawbstarz (Ethereum)
  try {
    const lawbstarz = NFT_COLLECTIONS.lawbstarz;
    const ethereumProvider = new JsonRpcProvider('https://eth.llamarpc.com');
    const contract = new Contract(lawbstarz.address, ERC721_ABI, ethereumProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.lawbstarz = tokenIds;
  } catch (error) {
    console.error('Error fetching Lawbstarz:', error);
    try {
      const response = await getCollectionNFTs('lawbstarz', 1, 100, walletAddress);
      inventory.lawbstarz = response.data.map(nft => nft.token_id.toString());
    } catch (apiError) {
      console.error('Error fetching Lawbstarz from API:', apiError);
    }
  }

  // Fetch Halloween Lawbsters (Base chain)
  try {
    const halloween = NFT_COLLECTIONS.halloween_lawbsters;
    const baseProvider = new JsonRpcProvider('https://mainnet.base.org');
    const contract = new Contract(halloween.address, ERC721_ABI, baseProvider);
    const balance = await contract.balanceOf(walletAddress);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      tokenIds.push(tokenId.toString());
    }
    inventory.halloween_lawbsters = tokenIds;
  } catch (error) {
    console.error('Error fetching Halloween Lawbsters:', error);
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
    } catch (accountError) {
      console.error('Error fetching Halloween Lawbsters from account API:', accountError);
    }
  }

  return inventory;
}

