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