interface MintNFTResponse {
  success: boolean;
  mintTransaction?: {
    to: string;
    value: string;
    data: string;
  };
  erc20s?: Array<{
    address: string;
    amount: string;
  }>;
  message?: string;
}

interface InviteList {
  id: string;
  root: string;
  address: string;
  name: string;
  currency_address: string;
  currency_symbol: string;
  token_price: string;
  decimals: number;
  start_time: string;
  end_time: string | null;
  wallet_limit: number;
  list_limit: number;
  unit_size: number;
  created_at: string;
  updated_at: string;
}

interface NFT {
  id: string;
  address: string;
  token_id: number;
  attributes: string;
  block_minted: number;
  contract_type: string;
  description: string;
  image: string;
  image_url: string;
  image_url_shrunk: string;
  animation_url?: string;
  metadata: string;
  name: string;
  chain_id: number;
  old_image_url: string;
  old_token_uri: string;
  owner_of: string;
  token_uri: string;
  log_index: number;
  transaction_index: number;
  collection_id: string;
  num_items: number;
  created_at: string;
  updated_at: string;
  owners: Array<{
    owner_of: string;
    quantity: number;
  }>;
}

interface NFTResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: NFT[];
}

interface OpenSeaNft {
  identifier: string;
  contract: string;
  name: string;
  image_url: string;
  description: string;
  animation_url?: string;
  traits: { trait_type: string, value: string | number, display_type: string | null }[];
  owners: { address: string; quantity: number }[];
  updated_at: string;
}

interface OpenSeaApiResponse {
  nfts: OpenSeaNft[];
}

export async function getEligibleInviteLists(walletAddress: string): Promise<InviteList[]> {
  const SCATTER_API_URL = 'https://api.scatter.art/v1';
  const COLLECTION_SLUG = 'pixelawbs';
  
  try {
    console.log(`Getting eligible invite lists for collection: ${COLLECTION_SLUG}`);
    const response = await fetch(`${SCATTER_API_URL}/collection/${COLLECTION_SLUG}/eligible-invite-lists?minterAddress=${walletAddress}`);
    
    console.log(`Response status:`, response.status);
    
    if (response.ok) {
      const lists = await response.json() as InviteList[];
      console.log(`Lists found:`, lists);
      return lists;
    } else {
      console.log(`Failed to get lists:`, response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.log(`Error getting lists:`, error);
    return [];
  }
}

export async function getCollectionNFTs(collectionSlug: string, page: number = 1, pageSize: number = 50, ownerAddress?: string): Promise<NFTResponse> {
  const SCATTER_API_URL = 'https://api.scatter.art/v1';
  
  let url = `${SCATTER_API_URL}/collection/${collectionSlug}/nfts?page=${page}&pageSize=${pageSize}&sortBy=recent&sortOrder=desc`;
  
  if (ownerAddress) {
    url += `&ownerAddress=${ownerAddress}`;
  }
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      return await response.json() as NFTResponse;
    } else {
      throw new Error(`Failed to get NFTs: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error getting collection NFTs:', error);
    throw error;
  }
}

export async function getRecentlyMintedNFTs(ownerAddress: string, limit: number = 10): Promise<NFT[]> {
  try {
    const response = await getCollectionNFTs('pixelawbs', 1, limit, ownerAddress);
    return response.data;
  } catch (error) {
    console.error('Error getting recently minted NFTs:', error);
    return [];
  }
}

export async function mintNFT(walletAddress: string, selectedLists: Array<{id: string, quantity: number}>): Promise<MintNFTResponse> {
  const SCATTER_API_URL = 'https://api.scatter.art/v1';
  const COLLECTION_ADDRESS = '0x2d278e95b2fC67D4b27a276807e24E479D9707F6';
  const CHAIN_ID = 1;

  const response = await fetch(`${SCATTER_API_URL}/mint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collectionAddress: COLLECTION_ADDRESS,
      chainId: CHAIN_ID,
      minterAddress: walletAddress,
      lists: selectedLists
    })
  });
  
  const result = await response.json() as MintNFTResponse;
  
  if (!response.ok) {
    console.error('Scatter API Error:', JSON.stringify(result, null, 2));
    throw new Error(result.message || 'Minting failed');
  }
  
  return {
    success: true,
    mintTransaction: result.mintTransaction,
    erc20s: result.erc20s
  };
}

export async function getOpenSeaNFTs(collectionSlug: string, pageSize: number = 50, ownerAddress?: string): Promise<NFTResponse> {
  const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
  let url = `https://api.opensea.io/api/v2/collection/${collectionSlug}/nfts?limit=${pageSize}`;
  
  if (ownerAddress) {
    console.warn("Owner filtering is not supported for OpenSea collections in this view.");
  }

  try {
    const response = await fetch(url, { headers: { 'X-API-KEY': OPENSEA_API_KEY } });
    if (!response.ok) {
      throw new Error(`Failed to get OpenSea NFTs: ${response.statusText}`);
    }

    const data = await response.json() as OpenSeaApiResponse;
    
    const transformedNfts: NFT[] = data.nfts.map((nft): NFT => ({
      id: nft.identifier,
      address: nft.contract,
      token_id: parseInt(nft.identifier, 10),
      attributes: JSON.stringify(nft.traits || []),
      name: nft.name || `#${nft.identifier}`,
      image_url: nft.image_url,
      owner_of: nft.owners?.[0]?.address || '',
      block_minted: 0,
      contract_type: 'ERC721',
      description: nft.description || '',
      image: nft.image_url,
      image_url_shrunk: nft.image_url,
      animation_url: nft.animation_url,
      metadata: '',
      chain_id: 1,
      old_image_url: '',
      old_token_uri: '',
      token_uri: '',
      log_index: 0,
      transaction_index: 0,
      collection_id: collectionSlug,
      num_items: 1,
      created_at: nft.updated_at || new Date().toISOString(),
      updated_at: nft.updated_at || new Date().toISOString(),
      owners: nft.owners?.map((o) => ({ owner_of: o.address, quantity: o.quantity })) || []
    }));

    return {
      page: 1,
      pageSize: pageSize,
      totalCount: transformedNfts.length,
      totalPages: 1,
      data: transformedNfts
    };

  } catch (error) {
    console.error('Error getting OpenSea NFTs:', error);
    throw error;
  }
}

export async function getOpenSeaSingleNFT(chain: string, contractAddress: string, identifier: string): Promise<{ traits: { trait_type: string; value: string }[] }> {
  const OPENSEA_API_KEY = "030a5ee582f64b8ab3a598ab2b97d85f";
  const url = `https://api.opensea.io/api/v2/chain/${chain}/contract/${contractAddress}/nfts/${identifier}`;
  try {
    const response = await fetch(url, { headers: { 'X-API-KEY': OPENSEA_API_KEY } });
    if (!response.ok) throw new Error(`Failed to get single OpenSea NFT: ${response.statusText}`);
    const data = await response.json() as { nft: { traits: { trait_type: string; value: string }[] } };
    return data.nft;
  } catch (error) { console.error('Error getting single OpenSea NFT:', error); throw error; }
}

// Function to fetch Solana NFTs using Helius DAS API
export async function getOpenSeaSolanaNFTs(collectionSlug: string, pageSize: number = 50): Promise<NFTResponse> {
  const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=f2330fce-2a97-416b-ada9-ce0ba94ddadc";
  
  try {
    console.log('Using Helius DAS API for Solana collection:', collectionSlug);
    
    // Use collection mint addresses to fetch all NFTs in the collection
    const collectionMints = {
      'lawbstation': '9CU9LUX7UWkBEG4oP8YrgDUkNJKNHLt2wGdVfX6NY4EY',
      'lawbnexus': 'AfXkPjcfTWHz9WDjvXxZBkHSWQ1H7xsg7jT2fFLkAAi'
    };
    
    const collectionMint = collectionMints[collectionSlug as keyof typeof collectionMints];
    
    if (!collectionMint) {
      console.log('No collection mint found for collection:', collectionSlug);
      return {
        page: 1,
        pageSize: pageSize,
        totalCount: 0,
        totalPages: 1,
        data: []
      };
    }
    
    // Use Helius DAS API to get NFTs by collection
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetsByGroup',
        params: {
          groupKey: 'collection',
          groupValue: collectionMint,
          page: 1,
          limit: pageSize
        }
      })
    });
    
    if (!response.ok) {
      console.log('Helius DAS API response status:', response.status);
      console.log('Helius DAS API response text:', await response.text());
      throw new Error(`Helius DAS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Helius DAS API response:', data);
    
    if (data.error) {
      throw new Error(`Helius DAS API error: ${data.error.message}`);
    }
    
    const nfts = data.result?.items || [];
    
    // Transform the NFTs to our standard format
    const transformedNfts: NFT[] = nfts.map((nft: any): NFT => ({
      id: nft.id || nft.mint || 'unknown',
      address: nft.mint || '',
      token_id: parseInt(nft.content?.metadata?.name?.replace(/\D/g, '') || '0', 10),
      attributes: JSON.stringify(nft.content?.metadata?.attributes || []),
      name: nft.content?.metadata?.name || nft.content?.files?.[0]?.name || `#${nft.mint?.slice(0, 8)}`,
      image_url: nft.content?.files?.[0]?.uri || nft.content?.metadata?.image || '',
      owner_of: '',
      block_minted: 0,
      contract_type: 'SOL',
      description: nft.content?.metadata?.description || '',
      image: nft.content?.files?.[0]?.uri || nft.content?.metadata?.image || '',
      image_url_shrunk: nft.content?.files?.[0]?.uri || nft.content?.metadata?.image || '',
      animation_url: nft.content?.metadata?.animation_url || '',
      metadata: '',
      chain_id: 1399811149,
      old_image_url: '',
      old_token_uri: '',
      token_uri: '',
      log_index: 0,
      transaction_index: 0,
      collection_id: collectionSlug,
      num_items: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owners: []
    }));
    
    return {
      page: 1,
      pageSize: pageSize,
      totalCount: transformedNfts.length,
      totalPages: 1,
      data: transformedNfts
    };
    
  } catch (error) {
    console.error('Error getting Solana NFTs from Helius:', error);
    throw error;
  }
}

// Function to fetch Solana NFTs by owner using Helius DAS API
export async function getOpenSeaSolanaNFTsByOwner(ownerAddress: string, pageSize: number = 50): Promise<NFTResponse> {
  const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=f2330fce-2a97-416b-ada9-ce0ba94ddadc";
  
  try {
    console.log('Using Helius DAS API for Solana owner:', ownerAddress);
    
    // Use Helius DAS API to get NFTs by owner
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: ownerAddress,
          page: 1,
          limit: pageSize
        }
      })
    });
    
    if (!response.ok) {
      console.log('Helius DAS API response status:', response.status);
      console.log('Helius DAS API response text:', await response.text());
      throw new Error(`Helius DAS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Helius DAS API owner response:', data);
    
    if (data.error) {
      throw new Error(`Helius DAS API error: ${data.error.message}`);
    }
    
    const nfts = data.result?.items || [];
    
    // Filter to only include lawbstation and lawbnexus collections
    const mintAuthorities = {
      'lawbstation': '6cz67ciatfhDaxyWw3rdC9rZHXAxQvYnq5qkqmnG3G1Q',
      'lawbnexus': '35pjVXpTg2PCdBZ1zdUckNfnAxULJQBRSjWLXREo6692'
    };
    
    const filteredNfts = nfts.filter((nft: any) => {
      // Check if NFT belongs to our collections by mint authority
      const mintAuthority = nft.mintAuthority || nft.authority;
      return mintAuthority && Object.values(mintAuthorities).includes(mintAuthority);
    }).slice(0, pageSize);
    
    const transformedNfts: NFT[] = filteredNfts.map((nft: any): NFT => ({
      id: nft.id || nft.mint || 'unknown',
      address: nft.mint || '',
      token_id: parseInt(nft.content?.metadata?.name?.replace(/\D/g, '') || '0', 10),
      attributes: JSON.stringify(nft.content?.metadata?.attributes || []),
      name: nft.content?.metadata?.name || nft.content?.files?.[0]?.name || `#${nft.mint?.slice(0, 8)}`,
      image_url: nft.content?.files?.[0]?.uri || nft.content?.metadata?.image || '',
      owner_of: ownerAddress,
      block_minted: 0,
      contract_type: 'SOL',
      description: nft.content?.metadata?.description || '',
      image: nft.content?.files?.[0]?.uri || nft.content?.metadata?.image || '',
      image_url_shrunk: nft.content?.files?.[0]?.uri || nft.content?.metadata?.image || '',
      animation_url: nft.content?.metadata?.animation_url || '',
      metadata: '',
      chain_id: 1399811149,
      old_image_url: '',
      old_token_uri: '',
      token_uri: '',
      log_index: 0,
      transaction_index: 0,
      collection_id: nft.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || '',
      num_items: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owners: [{ owner_of: ownerAddress, quantity: 1 }]
    }));

    return {
      page: 1,
      pageSize: pageSize,
      totalCount: transformedNfts.length,
      totalPages: 1,
      data: transformedNfts
    };

  } catch (error) {
    console.error('Error getting Solana NFTs by owner from Helius:', error);
    throw error;
  }
}