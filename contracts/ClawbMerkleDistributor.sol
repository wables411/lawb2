// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

library MerkleProof {
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        return processProof(proof, leaf) == root;
    }

    function processProof(bytes32[] memory proof, bytes32 leaf) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encode(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encode(proofElement, computedHash));
            }
        }
        return computedHash;
    }
}

contract ClawbMerkleDistributor {
    IERC20Minimal public immutable token;
    bytes32 public immutable merkleRoot;
    address public immutable owner;

    mapping(uint256 => uint256) private claimedBitMap;

    event Claimed(uint256 indexed index, address indexed account, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error AlreadyClaimed();
    error InvalidProof();
    error NotOwner();
    error TransferFailed();

    constructor(address token_, bytes32 merkleRoot_) {
        token = IERC20Minimal(token_);
        merkleRoot = merkleRoot_;
        owner = msg.sender;
    }

    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        if (isClaimed(index)) revert AlreadyClaimed();

        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node)) revert InvalidProof();

        _setClaimed(index);
        if (!token.transfer(account, amount)) revert TransferFailed();

        emit Claimed(index, account, amount);
    }

    function withdrawUnclaimed(address to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        if (!token.transfer(to, amount)) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    function claimableBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
