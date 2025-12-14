import { ethers } from 'ethers';
import { ERC20_ABI } from '../config/abis';

// ERC721 ABI
export const ERC721_ABI = [
  {
    constant: true,
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', type: 'address' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_operator', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_tokenId', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_operator', type: 'address' },
      { name: '_approved', type: 'bool' }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
] as const;

// ERC1155 ABI
export const ERC1155_ABI = [
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_operator', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_operator', type: 'address' },
      { name: '_approved', type: 'bool' }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_id', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
] as const;

export interface SelectedNFT {
  contractAddress: string;
  tokenId: string;
  type: 'ERC721' | 'ERC1155';
  quantity?: number; // For ERC1155
  name?: string;
  image?: string;
  symbol?: string;
}

/**
 * Check if NFT is approved for contract
 */
export async function checkNFTApproval(
  nftContract: string,
  tokenId: string,
  type: 'ERC721' | 'ERC1155',
  contractAddress: string,
  ownerAddress: string,
  provider: ethers.Provider
): Promise<{ approved: boolean; needsApproval: boolean }> {
  try {
    if (type === 'ERC721') {
      const nftContractInstance = new ethers.Contract(nftContract, ERC721_ABI, provider);
      const [approved, isApprovedForAll] = await Promise.all([
        nftContractInstance.getApproved(tokenId).catch(() => '0x0000000000000000000000000000000000000000'),
        nftContractInstance.isApprovedForAll(ownerAddress, contractAddress).catch(() => false)
      ]);
      
      return {
        approved: approved === contractAddress || isApprovedForAll,
        needsApproval: approved !== contractAddress && !isApprovedForAll
      };
    } else {
      // ERC1155
      const nftContractInstance = new ethers.Contract(nftContract, ERC1155_ABI, provider);
      const isApproved = await nftContractInstance.isApprovedForAll(ownerAddress, contractAddress).catch(() => false);
      
      return {
        approved: isApproved,
        needsApproval: !isApproved
      };
    }
  } catch (error) {
    console.error('[NFT_APPROVAL] Error checking approval:', error);
    return { approved: false, needsApproval: true };
  }
}

/**
 * Approve NFT for contract
 */
export async function approveNFT(
  nftContract: string,
  tokenId: string,
  type: 'ERC721' | 'ERC1155',
  contractAddress: string,
  signer: ethers.Signer
): Promise<{ approved: boolean; txHash?: string }> {
  try {
    if (type === 'ERC721') {
      const nftContractInstance = new ethers.Contract(nftContract, ERC721_ABI, signer);
      
      // Check if already approved
      const [approved, isApprovedForAll] = await Promise.all([
        nftContractInstance.getApproved(tokenId).catch(() => '0x0000000000000000000000000000000000000000'),
        nftContractInstance.isApprovedForAll(await signer.getAddress(), contractAddress).catch(() => false)
      ]);
      
      if (approved === contractAddress || isApprovedForAll) {
        return { approved: true };
      }
      
      // Approve single NFT
      const tx = await nftContractInstance.approve(contractAddress, tokenId);
      await tx.wait();
      return { approved: true, txHash: tx.hash };
    } else {
      // ERC1155: Must use setApprovalForAll
      const nftContractInstance = new ethers.Contract(nftContract, ERC1155_ABI, signer);
      
      const isApproved = await nftContractInstance.isApprovedForAll(
        await signer.getAddress(),
        contractAddress
      ).catch(() => false);
      
      if (isApproved) {
        return { approved: true };
      }
      
      const tx = await nftContractInstance.setApprovalForAll(contractAddress, true);
      await tx.wait();
      return { approved: true, txHash: tx.hash };
    }
  } catch (error) {
    console.error('[NFT_APPROVAL] Error approving NFT:', error);
    throw error;
  }
}

/**
 * Fetch user's NFTs (simplified - would need Alchemy/OpenSea API for full implementation)
 */
export async function fetchUserNFTs(
  address: string,
  chainId: number,
  provider: ethers.Provider
): Promise<SelectedNFT[]> {
  // This is a placeholder - in production, you'd use Alchemy/OpenSea API
  // or query known NFT contracts
  console.log('[NFT_FETCH] Fetching NFTs for:', address, 'on chain:', chainId);
  
  // TODO: Implement actual NFT fetching
  // For now, return empty array
  return [];
}
