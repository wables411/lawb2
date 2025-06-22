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

export async function getEligibleInviteLists(walletAddress: string): Promise<InviteList[]> {
  const SCATTER_API_URL = 'https://api.scatter.art/v1';
  const COLLECTION_SLUG = 'pixelawbs';
  
  try {
    console.log(`Getting eligible invite lists for collection: ${COLLECTION_SLUG}`);
    const response = await fetch(`${SCATTER_API_URL}/collection/${COLLECTION_SLUG}/eligible-invite-lists?minterAddress=${walletAddress}`);
    
    console.log(`Response status:`, response.status);
    
    if (response.ok) {
      const lists = await response.json();
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

export async function getCollectionNFTs(page: number = 1, pageSize: number = 50, ownerAddress?: string): Promise<NFTResponse> {
  const SCATTER_API_URL = 'https://api.scatter.art/v1';
  const COLLECTION_SLUG = 'pixelawbs';
  
  let url = `${SCATTER_API_URL}/collection/${COLLECTION_SLUG}/nfts?page=${page}&pageSize=${pageSize}&sortBy=recent&sortOrder=desc`;
  
  if (ownerAddress) {
    url += `&ownerAddress=${ownerAddress}`;
  }
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      return await response.json();
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
    const response = await getCollectionNFTs(1, limit, ownerAddress);
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
  
  const result = await response.json();
  
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