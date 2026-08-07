// Utility functions for IPFS URL conversion

/**
 * Convert IPFS URL to HTTP gateway URL
 * Supports multiple IPFS gateways as fallbacks
 */
// IPFS gateways that no longer resolve. Profile pictures store the gateway URL that was
// current when the user picked them, so dead hosts keep coming back from the database
// forever — rewrite them to a live public gateway at render time.
const DEAD_IPFS_GATEWAY_HOSTS = new Set([
  'd1kgk9u8ytew77.cloudfront.net', // OpenSea-era CDN, NXDOMAIN since ~2026-08
]);

export function ipfsToHttp(ipfsUrl: string | null | undefined): string {
  if (!ipfsUrl) return '';

  // If already HTTP, return as-is (rewriting dead gateway hosts first)
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    const match = ipfsUrl.match(/^https?:\/\/([^/]+)\/(ipfs\/.+)$/);
    if (match && DEAD_IPFS_GATEWAY_HOSTS.has(match[1].toLowerCase())) {
      return `https://ipfs.io/${match[2]}`;
    }
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

