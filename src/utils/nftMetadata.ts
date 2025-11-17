import { NFT_COLLECTIONS } from '../config/nftCollections';
import { getCollectionNFTs } from '../mint';

const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";

export async function fetchTokenMetadata(
  collection: keyof typeof NFT_COLLECTIONS,
  tokenId: string,
  ownerAddress?: string
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

