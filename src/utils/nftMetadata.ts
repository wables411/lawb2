import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getCollectionNFTs, getOpenSeaSolanaNFTs, getOpenSeaSolanaNFTsByOwner } from '../mint';
import { cachedFetch } from './fetchCache';

const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";

function pickMagicEdenMintImage(data: Record<string, unknown> | null): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, any>;
  const candidates = [
    d.image,
    d.img,
    d.imageUrl,
    d.links?.image,
    d.content?.metadata?.image,
    d.content?.files?.[0]?.uri,
    d.content?.links?.image,
    d.offChainData?.image,
    d.metadata?.image,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

function pickMagicEdenMintName(data: Record<string, unknown> | null): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, any>;
  const n =
    (typeof d.name === 'string' && d.name) ||
    (typeof d.content?.metadata?.name === 'string' && d.content.metadata.name) ||
    (typeof d.metadata?.name === 'string' && d.metadata.name);
  return n || undefined;
}

/** Single-mint metadata via Netlify proxy (listings/wallet responses often omit image URLs). */
async function fetchMagicEdenMintMetadata(mint: string): Promise<{ image_url: string; name?: string } | null> {
  try {
    const proxyUrl = `/.netlify/functions/magiceden-nft?mode=mint&mint=${encodeURIComponent(mint)}`;
    const response = await cachedFetch(proxyUrl);
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    const image_url = pickMagicEdenMintImage(data);
    if (!image_url) return null;
    return { image_url, name: pickMagicEdenMintName(data) };
  } catch {
    return null;
  }
}

export async function fetchTokenMetadata(
  collection: keyof typeof NFT_COLLECTIONS,
  tokenId: string,
  ownerAddress?: string,
  /** Base58 Solana wallet — required for Magic Eden owner lookups when primary profile is EVM */
  solanaOwnerAddress?: string,
): Promise<{ image_url: string; name?: string }> {
  const collectionConfig = NFT_COLLECTIONS[collection];
  
  try {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[NFT METADATA] Fetching metadata for', collection, 'token', tokenId, ownerAddress ? `(owner: ${ownerAddress})` : '');
    }
    
    // Use Scatter API for Pixelawbs and Lawbstarz
    if (collectionConfig.api === 'scatter') {
      try {
        // If we have owner address, filter by owner (much faster and more reliable)
        if (ownerAddress) {
          // Try multiple pages in case the token isn't in the first 100
          for (let page = 1; page <= 3; page++) {
            const response = await getCollectionNFTs(collectionConfig.slug, page, 100, ownerAddress);
            const nft = response.data.find(n => n.token_id.toString() === tokenId);
            
            if (nft) {
              const imageUrl = nft.image_url || nft.image || nft.image_url_shrunk || '';
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[NFT METADATA] Found NFT in Scatter API (filtered by owner, page', page, '):', nft.name, 'Image:', imageUrl);
              }
              return {
                image_url: imageUrl,
                name: nft.name
              };
            }
            
            // If we've searched all available pages, stop
            if (page >= response.totalPages) {
              break;
            }
          }
        } else {
          // Fallback: Search up to 5 pages (500 NFTs) to find the token
          for (let page = 1; page <= 5; page++) {
            const response = await getCollectionNFTs(collectionConfig.slug, page, 100);
            const nft = response.data.find(n => n.token_id.toString() === tokenId);
          
            if (nft) {
              const imageUrl = nft.image_url || nft.image || nft.image_url_shrunk || '';
              if (typeof window !== 'undefined' && window.console) {
                window.console.log('[NFT METADATA] Found NFT in Scatter API (page', page, '):', nft.name, 'Image:', imageUrl);
              }
              return {
                image_url: imageUrl,
                name: nft.name
              };
            }
            
            // If we've searched all available pages, stop
            if (page >= response.totalPages) {
              break;
            }
          }
        }
        
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn('[NFT METADATA] Token', tokenId, 'not found in Scatter API' + (ownerAddress ? ' for owner ' + ownerAddress : ' after searching all pages'));
        }
      } catch (scatterError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT METADATA] Error fetching from Scatter API:', scatterError);
        }
      }
    }
    
    // Use OpenSea API for Lawbsters and Halloween Lawbsters
    if (collectionConfig.api === 'opensea') {
      try {
        const chain = collectionConfig.chainId === 8453 ? 'base' : 'ethereum';
        const response = await fetch(
          `https://api.opensea.io/api/v2/chain/${chain}/contract/${collectionConfig.address}/nfts/${tokenId}`,
          { headers: { 'X-API-KEY': OPENSEA_API_KEY } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('[NFT METADATA] OpenSea API response:', data);
          }
          
          const imageUrl = data.nft?.image_url || data.image_url || '';
          const name = data.nft?.name || data.name;
          
          if (imageUrl) {
            return {
              image_url: imageUrl,
              name: name
            };
          }
        } else {
          if (typeof window !== 'undefined' && window.console) {
            window.console.error('[NFT METADATA] OpenSea API error:', response.status, response.statusText);
          }
        }
      } catch (openseaError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT METADATA] Error fetching from OpenSea API:', openseaError);
        }
      }
    }

    // Use Magic Eden-backed Solana fetchers for LawbStation/LawbNexus.
    if (collectionConfig.api === 'magiceden-solana') {
      try {
        // tokenId is the mint address for Solana profile picture selection.
        const isMintLike = tokenId.length >= 24;
        const mintAddress = tokenId;
        const mintLower = mintAddress.toLowerCase();
        const isEvm = ownerAddress && /^0x[a-fA-F0-9]{40}$/.test(ownerAddress);
        const solOwner =
          solanaOwnerAddress ||
          (!isEvm && ownerAddress ? ownerAddress : undefined);
        const response = solOwner
          ? await getOpenSeaSolanaNFTsByOwner(solOwner, 200)
          : await getOpenSeaSolanaNFTs(collectionConfig.slug, 200);
        const nft = response.data.find((n) => {
          if (isMintLike) {
            const addr = (n.address || '').toLowerCase();
            const id = (n.id || '').toLowerCase();
            return addr === mintLower || id === mintLower;
          }
          return String(n.token_id) === tokenId;
        });
        let imageUrl = (nft?.image_url || '').trim();
        let name = nft?.name;
        if ((!imageUrl || !name) && isMintLike) {
          const mintMeta = await fetchMagicEdenMintMetadata(mintAddress);
          if (mintMeta?.image_url) {
            imageUrl = mintMeta.image_url;
            name = name || mintMeta.name;
          }
        }
        if (imageUrl) {
          return {
            image_url: imageUrl,
            name,
          };
        }
      } catch (solanaError) {
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('[NFT METADATA] Error fetching from Solana collection API:', solanaError);
        }
      }
    }
    
    // Fallback: return empty if all APIs fail
    if (typeof window !== 'undefined' && window.console) {
      window.console.warn('[NFT METADATA] All API methods failed, returning empty');
    }
    return { image_url: '', name: undefined };
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error(`[NFT METADATA] Error fetching metadata for ${collection} token ${tokenId}:`, error);
    }
    return { image_url: '', name: undefined };
  }
}

