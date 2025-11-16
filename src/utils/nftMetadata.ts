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
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT METADATA] Fetching metadata for', collection, 'token', tokenId);
    }
    
    // Use appropriate provider based on chain
    const provider = collectionConfig.chainId === 8453 
      ? new JsonRpcProvider('https://mainnet.base.org')
      : new JsonRpcProvider('https://eth.llamarpc.com');
    
    const contract = new Contract(collectionConfig.address, ERC721_ABI, provider);
    const tokenURI = await contract.tokenURI(tokenId);
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT METADATA] Token URI:', tokenURI);
    }
    
    let metadataUrl = tokenURI;
    
    // If it's IPFS, convert to HTTP gateway
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsHash = tokenURI.replace('ipfs://', '');
      metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    // Fetch metadata
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    const metadata = await response.json();
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT METADATA] Metadata:', metadata);
    }
    
    let imageUrl = metadata.image || metadata.image_url || '';
    
    // Convert IPFS image URLs to HTTP gateway
    if (imageUrl.startsWith('ipfs://')) {
      const ipfsHash = imageUrl.replace('ipfs://', '');
      imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT METADATA] Final image URL:', imageUrl);
    }
    
    return {
      image_url: imageUrl,
      name: metadata.name
    };
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error(`[NFT METADATA] Error fetching metadata for ${collection} token ${tokenId}:`, error);
    }
    return { image_url: '', name: undefined };
  }
}

