// Utility to fetch ASCII Lawbster NFT metadata directly from contract
import { PublicClient } from 'viem';
import { base } from 'viem/chains';
import { ASCII_LAWBSTER_CONTRACT_ADDRESS, ASCII_LAWBSTER_CONTRACT_ABI } from './asciiLawbsterContract';
import { ipfsToHttp } from './ipfs';

interface NFTMetadata {
  image?: string;
  image_url?: string;
  name?: string;
  description?: string;
  animation_url?: string;
  [key: string]: any;
}

/**
 * Fetch NFT metadata directly from contract tokenURI
 * Falls back to multiple IPFS gateways if needed
 */
export async function fetchAsciiLawbsterMetadata(
  publicClient: PublicClient,
  tokenId: number
): Promise<{ image_url: string; name?: string } | null> {
  try {
    // Read tokenURI from contract
    const tokenURI = await publicClient.readContract({
      address: ASCII_LAWBSTER_CONTRACT_ADDRESS,
      abi: ASCII_LAWBSTER_CONTRACT_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    }) as string;

    if (!tokenURI) {
      return null;
    }

    // Convert IPFS URI to HTTP gateway URL
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = ipfsToHttp(tokenURI);
    }

    // Fetch metadata JSON
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      // Try alternative gateways
      const hash = tokenURI.replace('ipfs://', '');
      const gateways = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`,
      ];

      for (const gatewayUrl of gateways) {
        try {
          const altResponse = await fetch(gatewayUrl);
          if (altResponse.ok) {
            const metadata: NFTMetadata = await altResponse.json();
            const imageUrl = metadata.image || metadata.image_url || '';
            return {
              image_url: imageUrl ? ipfsToHttp(imageUrl) : '',
              name: metadata.name || `ASCII Lawbster #${tokenId}`,
            };
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    }

    const metadata: NFTMetadata = await response.json();
    const imageUrl = metadata.image || metadata.image_url || '';
    
    return {
      image_url: imageUrl ? ipfsToHttp(imageUrl) : '',
      name: metadata.name || `ASCII Lawbster #${tokenId}`,
    };
  } catch (error) {
    console.error(`Error fetching metadata for token ${tokenId}:`, error);
    return null;
  }
}

