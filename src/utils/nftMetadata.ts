import { JsonRpcProvider, Contract } from 'ethers';
import { NFT_COLLECTIONS } from '../config/nftCollections';

const ERC721_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)"
];

export async function fetchTokenMetadata(
  collection: keyof typeof NFT_COLLECTIONS,
  tokenId: string
): Promise<{ image_url: string; name?: string }> {
  const collectionConfig = NFT_COLLECTIONS[collection];
  
  try {
    // Use appropriate provider based on chain
    const provider = collectionConfig.chainId === 8453 
      ? new JsonRpcProvider('https://mainnet.base.org')
      : new JsonRpcProvider('https://eth.llamarpc.com');
    
    const contract = new Contract(collectionConfig.address, ERC721_ABI, provider);
    const tokenURI = await contract.tokenURI(tokenId);
    
    // If tokenURI is a URL, fetch it
    if (tokenURI.startsWith('http')) {
      const response = await fetch(tokenURI);
      const metadata = await response.json();
      return {
        image_url: metadata.image || metadata.image_url || '',
        name: metadata.name
      };
    }
    
    // If it's IPFS, convert to HTTP gateway
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsHash = tokenURI.replace('ipfs://', '');
      const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      const response = await fetch(gatewayUrl);
      const metadata = await response.json();
      return {
        image_url: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
        name: metadata.name
      };
    }
    
    return { image_url: '', name: undefined };
  } catch (error) {
    console.error(`Error fetching metadata for ${collection} token ${tokenId}:`, error);
    return { image_url: '', name: undefined };
  }
}

