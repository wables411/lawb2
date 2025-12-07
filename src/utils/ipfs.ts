// Utility functions for IPFS URL conversion

/**
 * Convert IPFS URL to HTTP gateway URL
 * Supports multiple IPFS gateways as fallbacks
 */
export function ipfsToHttp(ipfsUrl: string | null | undefined): string {
  if (!ipfsUrl) return '';
  
  // If already HTTP, return as-is
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl;
  }
  
  // Convert ipfs:// URLs
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    // Try multiple gateways
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // If it's just a hash (CID), assume it's IPFS
  if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafybe')) {
    return `https://ipfs.io/ipfs/${ipfsUrl}`;
  }
  
  return ipfsUrl;
}

/**
 * Try multiple IPFS gateways to fetch content
 */
export async function fetchFromIPFS(ipfsUrl: string): Promise<string> {
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ];
  
  const hash = ipfsUrl.replace('ipfs://', '').replace(/^https?:\/\/[^/]+\/ipfs\//, '');
  
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${hash}`;
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (response.ok) {
        return url;
      }
    } catch (e) {
      // Try next gateway
      continue;
    }
  }
  
  // Fallback to first gateway
  return `${gateways[0]}${hash}`;
}

