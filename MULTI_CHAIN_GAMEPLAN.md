# Multi-Chain Chess Integration Game Plan

## 📊 Current Status

### Contracts
- ✅ **Base Mainnet**: Deployed at `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`
- ⏳ **Arbitrum One**: Coming soon (focus on Base first)
- ✅ **Sanko Mainnet**: Already deployed at `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56`

### Contract Features
- ✅ **Sanko**: Fixed token list (DMT, GOLD, LAWB, MOSS) - NO CHANGES
- ✅ **Base**: `allowAllTokens` mode enabled (ANY ERC20 token can be used)
- ✅ **Base**: NFT wagering supported (ERC721 & ERC1155)
- ✅ **Base**: USDC limits configured as example (1-10,000 USDC)
- ✅ **Base**: Native ETH support (zero address)
- ⏳ **Arbitrum**: Same as Base (when deployed)

### Frontend Status
- ✅ Multi-chain token configuration structure created
- ⏳ Need to update contract addresses
- ⏳ Need chain selector component
- ⏳ Need to support `allowAllTokens` (any token input)
- ⏳ Need Firebase `chain` field migration
- ⏳ Need multi-chain leaderboard aggregation

---

## 🎯 Implementation Plan

### Phase 1: Update Contract Addresses & Configuration

#### 1.1 Update `src/config/tokens.ts`
```typescript
export const CONTRACT_ADDRESSES = {
  testnet: {
    chess: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47' // Sanko Testnet
  },
  mainnet: {
    chess: '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56' // Sanko Mainnet
  },
  base: {
    chess: '0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11' // ✅ Base Mainnet
  },
  arbitrum: {
    chess: '0x0000000000000000000000000000000000000000' // ⏳ Update after deployment
  }
} as const;
```

#### 1.2 Update Token Support (Chain-Specific)

**Sanko (No Changes):**
- Keep existing fixed token list: DMT, GOLD, LAWB, MOSS
- No custom token input
- No NFT wagering option

**Base (New Features):**
- **Quick-select buttons**: USDC, ETH, GG (GunGame), LAWB
- **Custom token input field**: Users can paste any ERC20 contract address
- **Token validation**: Verify contract address is valid ERC20
- **Auto-display symbol**: Fetch and display token symbol (e.g., "$LAWB") after validation
- **NFT wagering option**: Toggle between "Token Wager" and "NFT Wager"

---

### Phase 2: Chain Selection UI

#### 2.1 Create Chain Selector Component
**File**: `src/components/ChainSelector.tsx`

```typescript
interface ChainSelectorProps {
  selectedChain: 'sanko' | 'base' | 'arbitrum' | null;
  onSelect: (chain: 'sanko' | 'base' | 'arbitrum') => void;
  mode?: 'desktop' | 'base-app';
  disabled?: boolean;
}
```

**Features**:
- Desktop: Shows all 3 chains
- Base App: Hidden (always Base)
- Visual indicators for current chain
- Network switching prompts

#### 2.2 Integrate into ChessMultiplayer
- Add chain selector before game creation
- Store selected chain in state
- Use selected chain for contract address resolution
- Prompt network switch if needed

---

### Phase 3: Token Input System (Base Only)

#### 3.1 Chain-Specific TokenSelector
**Sanko**: Keep existing fixed token selector (no changes)
**Base**: Enhanced token selector with:
- Quick-select buttons (USDC, ETH, GG, LAWB)
- Custom token address input field
- Token validation and symbol display

#### 3.2 Conditional Rendering
```typescript
// In TokenSelector component
const isBase = chainId === NETWORKS.base.chainId;
const isArbitrum = chainId === NETWORKS.arbitrum.chainId;
const supportsCustomTokens = isBase || isArbitrum;

// Show quick-select + custom input only on Base/Arbitrum
{supportsCustomTokens && (
  <>
    <QuickSelectButtons />
    <CustomTokenInput />
  </>
)}
```

#### 3.3 Token Validation Helper (Base Only)
```typescript
// utils/tokenValidation.ts
export async function validateERC20Token(
  address: string,
  chainId: number
): Promise<{ valid: boolean; decimals?: number; symbol?: string; name?: string }> {
  // Only validate on Base/Arbitrum
  if (chainId !== NETWORKS.base.chainId && chainId !== NETWORKS.arbitrum.chainId) {
    return { valid: false, error: 'Custom tokens only supported on Base/Arbitrum' };
  }
  
  // Check if address is valid ERC20
  // Fetch decimals, symbol, name
  // Return validation result
}
```

#### 3.4 Update Token Balance Hook
- Sanko: Use existing fixed token addresses
- Base/Arbitrum: Support custom token addresses
- Fetch balance for any ERC20 on Base/Arbitrum
- Handle token decimals dynamically

---

### Phase 4: Firebase Integration

#### 4.1 Add `chain` Field to Game Data
**Update**: `src/firebaseChess.ts`

```typescript
// When creating game
await firebaseChess.createGame({
  chain: selectedChain, // 'sanko' | 'base' | 'arbitrum'
  invite_code: inviteCode,
  // ... rest of game data
});
```

#### 4.2 Migration Script
**File**: `scripts/migrate-firebase-games.ts`

```typescript
// Add chain field to existing games
// Set all existing games to 'sanko'
// Update Firebase rules
```

#### 4.3 Update Firebase Rules
**File**: `firebase.rules`

```javascript
match /chess_games/{gameId} {
  allow read: if true; // Public read
  allow create: if request.auth != null &&
                   (request.resource.data.chain == 'sanko' ||
                    request.resource.data.chain == 'base' ||
                    request.resource.data.chain == 'arbitrum' ||
                    !request.resource.data.chain); // Backward compat
  allow update: if request.auth != null &&
                   (resource.data.blue_player == request.auth.token.address ||
                    resource.data.red_player == request.auth.token.address);
}
```

#### 4.4 Update Game Queries
- Filter games by chain
- Show chain indicator in game list
- Support cross-chain game browsing

---

### Phase 5: Multi-Chain Leaderboard

#### 5.1 Aggregate Wins Across Chains
**Update**: `src/firebaseLeaderboard.ts`

```typescript
export async function getPlayerTotalWins(playerAddress: string) {
  // Query contract on each chain
  const [sankoWins, baseWins, arbitrumWins] = await Promise.all([
    getContractWins('sanko', playerAddress),
    getContractWins('base', playerAddress),
    getContractWins('arbitrum', playerAddress)
  ]);
  
  // Also get AI wins from Firebase
  const aiWins = await getAIWinsFromFirebase(playerAddress);
  
  return {
    sanko: sankoWins,
    base: baseWins,
    arbitrum: arbitrumWins,
    ai: aiWins,
    total: sankoWins + baseWins + arbitrumWins + aiWins
  };
}
```

#### 5.2 Update Leaderboard Display
- Show total wins across all chains
- Optional: Show breakdown by chain
- Include AI wins in total

---

### Phase 6: Base App Specific

#### 6.1 Detect Base App Context
```typescript
// Check if running as Base Mini App
const isBaseApp = window.location.hostname.includes('base.org') || 
                  window.location.search.includes('baseApp=true');
```

#### 6.2 Force Base Chain
```typescript
useEffect(() => {
  if (isBaseApp && chainId !== 8453) {
    switchChain({ chainId: 8453 });
  }
}, [chainId, isBaseApp]);
```

#### 6.3 Hide Chain Selector
- Don't show chain selector in Base app
- Always use Base contract address
- Simplify UI for Base users

---

## 📝 Implementation Checklist

### Frontend Updates
- [ ] Update contract addresses in `tokens.ts` (Base: ✅, Arbitrum: Coming soon)
- [ ] Create `ChainSelector` component
- [ ] Integrate chain selector into `ChessMultiplayer`
- [ ] **Sanko**: Keep existing TokenSelector unchanged (fixed tokens only)
- [ ] **Base**: Update `TokenSelector` with quick-select buttons (USDC, ETH, GG, LAWB)
- [ ] **Base**: Add custom token address input field (only show on Base/Arbitrum)
- [ ] **Base**: Add token validation utility (fetch symbol, name, decimals)
- [ ] **Base**: Display token symbol after validation (e.g., "$LAWB")
- [ ] **Base**: Update token balance hooks for custom tokens (Base/Arbitrum only)
- [ ] Add chain detection to conditionally show features
- [ ] Add network switching logic
- [ ] Update game creation to include `chain` field
- [ ] **NFT Wagering (Base Only):**
  - [ ] Add "Wager NFT" option (only show on Base/Arbitrum)
  - [ ] Create `NFTSelector` component (Base/Arbitrum only)
  - [ ] Add NFT fetching (user's NFTs on Base)
  - [ ] Add NFT approval flow (ERC721 & ERC1155)
  - [ ] Implement `createGameERC721` integration
  - [ ] Implement `createGameERC1155` integration
  - [ ] Implement `joinGameERC721` integration
  - [ ] Implement `joinGameERC1155` integration
  - [ ] Add NFT display in game UI (Base games only)
  - [ ] Add NFT winner display (Base games only)
  - [ ] Ensure NFT options hidden on Sanko
- [ ] Update Firebase game structure (include `wagerType`, `nftContract`, etc.)
- [ ] Create Firebase migration script
- [ ] Update Firebase rules
- [ ] Implement multi-chain leaderboard
- [ ] Add Base app detection
- [ ] Test Sanko games still work
- [ ] Test Base games work
- [ ] Test chain switching
- [ ] Test custom token input
- [ ] Test NFT wagering (ERC721)
- [ ] Test NFT wagering (ERC1155)

### Contract Deployment
- [x] Base contract deployed at `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`
- [ ] Arbitrum deployment (coming soon - focus on Base first)

### Testing
- [ ] Test game creation on Base
- [ ] Test game joining on Base
- [ ] Test Sanko still works with fixed tokens (no custom input)
- [ ] Test Base quick-select tokens (USDC, ETH, GG, LAWB)
- [ ] Test Base custom token address input
- [ ] Test Base token validation and symbol display
- [ ] Verify NFT options hidden on Sanko
- [ ] Test network switching
- [ ] Test Firebase game sync
- [ ] Test leaderboard aggregation
- [ ] Test Base app mode
- [ ] Test backward compatibility (existing Sanko games)
- [ ] **NFT Wagering Tests (Base Only):**
  - [ ] Test ERC721 game creation on Base
  - [ ] Test ERC721 game joining on Base
  - [ ] Test ERC1155 game creation on Base
  - [ ] Test ERC1155 game joining on Base
  - [ ] Test NFT approval flow
  - [ ] Test NFT winner payout
  - [ ] Test NFT refund on cancel
  - [ ] Verify NFT wagering NOT available on Sanko

---

## 🔧 Key Implementation Details

### 1. Chain Detection & Switching
```typescript
// utils/chainUtils.ts
export async function ensureChain(
  chainId: number,
  targetChain: 'sanko' | 'base' | 'arbitrum'
): Promise<boolean> {
  const targetChainId = NETWORKS[targetChain].chainId;
  
  if (chainId !== targetChainId) {
    try {
      await switchChain({ chainId: targetChainId });
      return true;
    } catch (error) {
      console.error('Failed to switch chain:', error);
      return false;
    }
  }
  return true;
}
```

### 2. Token Input System (ERC20)

#### 2.1 Quick-Select Buttons
```typescript
// components/TokenSelector.tsx
const QUICK_SELECT_TOKENS = {
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ETH: '0x0000000000000000000000000000000000000000', // Native
    GG: '0x[GunGame_Contract_Address]', // TODO: Get actual address
    LAWB: '0x[LAWB_Contract_Address]' // TODO: Get actual address
  },
  sanko: {
    DMT: '0x754cDAd6f5821077d6915004Be2cE05f93d176f8',
    GOLD: '0x6F5e2d3b8c5C5c5F9bcB4adCF40b13308e688D4D',
    LAWB: '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F',
    MOSS: '0xeA240b96A9621e67159c59941B9d588eb290ef09'
  }
};

// Quick-select button component
<button onClick={() => selectToken('USDC')}>USDC</button>
<button onClick={() => selectToken('ETH')}>ETH</button>
<button onClick={() => selectToken('GG')}>GG</button>
<button onClick={() => selectToken('LAWB')}>LAWB</button>
```

#### 2.2 Custom Token Address Input
```typescript
// components/CustomTokenInput.tsx
interface CustomTokenInputProps {
  value: string;
  onChange: (address: string) => void;
  chainId: number;
  onValidate: (result: TokenValidationResult) => void;
}

interface TokenValidationResult {
  valid: boolean;
  symbol?: string;
  name?: string;
  decimals?: number;
  error?: string;
}

// Validation function
export async function validateERC20Token(
  address: string,
  chainId: number,
  provider: any
): Promise<TokenValidationResult> {
  try {
    // Validate address format
    if (!ethers.isAddress(address)) {
      return { valid: false, error: 'Invalid address format' };
    }
    
    // Check if contract exists
    const code = await provider.getCode(address);
    if (code === '0x') {
      return { valid: false, error: 'Contract does not exist' };
    }
    
    // Try to read ERC20 functions
    const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol().catch(() => null),
      tokenContract.name().catch(() => null),
      tokenContract.decimals().catch(() => null)
    ]);
    
    if (!symbol || !decimals) {
      return { valid: false, error: 'Not a valid ERC20 token' };
    }
    
    return {
      valid: true,
      symbol,
      name,
      decimals: Number(decimals)
    };
  } catch (error) {
    return { valid: false, error: 'Failed to validate token' };
  }
}
```

#### 2.3 Token Display After Validation
```typescript
// After validation, display token symbol
{tokenValidationResult.valid && (
  <div>
    <span>Selected: ${tokenValidationResult.symbol}</span>
    {tokenValidationResult.name && (
      <span> ({tokenValidationResult.name})</span>
    )}
  </div>
)}
```

### 3. NFT Wagering Implementation (Base Only)

**Important**: NFT wagering is ONLY available on Base (and Arbitrum when deployed). Sanko does NOT support NFT wagering.

#### 3.1 NFT Wagering Flow (Base Only)
The contract supports NFT wagering via:
- `createGameERC721(inviteCode, nftContract, tokenId)` - Create game with ERC721 NFT
- `createGameERC1155(inviteCode, nftContract, tokenId, quantity)` - Create game with ERC1155 NFT
- `joinGameERC721(inviteCode, tokenId)` - Join with ERC721 NFT
- `joinGameERC1155(inviteCode, tokenId, quantity)` - Join with ERC1155 NFT

#### 3.1.1 Conditional NFT Option
```typescript
// Only show NFT wagering option on Base/Arbitrum
const isBase = chainId === NETWORKS.base.chainId;
const isArbitrum = chainId === NETWORKS.arbitrum.chainId;
const supportsNFTWagering = isBase || isArbitrum;

{supportsNFTWagering && (
  <button onClick={() => setWagerType('nft')}>
    Wager NFT
  </button>
)}
```

#### 3.2 NFT Selection UI
```typescript
// components/NFTSelector.tsx
interface NFTSelectorProps {
  chainId: number;
  onSelect: (nft: SelectedNFT) => void;
  selectedNFT: SelectedNFT | null;
}

interface SelectedNFT {
  contractAddress: string;
  tokenId: string;
  type: 'ERC721' | 'ERC1155';
  quantity?: number; // For ERC1155
  name?: string;
  image?: string;
}

// Fetch user's NFTs
async function fetchUserNFTs(address: string, chainId: number) {
  // Use Alchemy/OpenSea API or direct contract calls
  // Filter by ERC721 and ERC1155
  // Return list of NFTs user owns
}
```

#### 3.3 NFT Approval Flow
```typescript
// utils/nftApproval.ts
export async function approveNFT(
  nftContract: string,
  tokenId: string,
  type: 'ERC721' | 'ERC1155',
  contractAddress: string,
  signer: any
) {
  const nftContractInstance = new ethers.Contract(
    nftContract,
    type === 'ERC721' ? ERC721_ABI : ERC1155_ABI,
    signer
  );
  
  if (type === 'ERC721') {
    // Check if already approved
    const approved = await nftContractInstance.getApproved(tokenId);
    const isApprovedForAll = await nftContractInstance.isApprovedForAll(
      await signer.getAddress(),
      contractAddress
    );
    
    if (approved === contractAddress || isApprovedForAll) {
      return { approved: true };
    }
    
    // Approve single NFT
    const tx = await nftContractInstance.approve(contractAddress, tokenId);
    await tx.wait();
    return { approved: true, txHash: tx.hash };
  } else {
    // ERC1155: Must use setApprovalForAll
    const isApproved = await nftContractInstance.isApprovedForAll(
      await signer.getAddress(),
      contractAddress
    );
    
    if (isApproved) {
      return { approved: true };
    }
    
    const tx = await nftContractInstance.setApprovalForAll(contractAddress, true);
    await tx.wait();
    return { approved: true, txHash: tx.hash };
  }
}
```

#### 3.4 Create Game with NFT
```typescript
// In ChessMultiplayer component
const createGameWithNFT = async (
  inviteCode: string,
  nftContract: string,
  tokenId: string,
  type: 'ERC721' | 'ERC1155',
  quantity?: number
) => {
  // 1. Ensure NFT is approved
  const approval = await approveNFT(
    nftContract,
    tokenId,
    type,
    chessContractAddress,
    signer
  );
  
  if (!approval.approved) {
    throw new Error('NFT approval failed');
  }
  
  // 2. Create game on blockchain
  if (type === 'ERC721') {
    await writeContract({
      address: chessContractAddress,
      abi: CHESS_CONTRACT_ABI,
      functionName: 'createGameERC721',
      args: [inviteCode, nftContract, tokenId]
    });
  } else {
    await writeContract({
      address: chessContractAddress,
      abi: CHESS_CONTRACT_ABI,
      functionName: 'createGameERC1155',
      args: [inviteCode, nftContract, tokenId, quantity || 1]
    });
  }
  
  // 3. Create Firebase entry
  await firebaseChess.createGame({
    chain: selectedChain,
    invite_code: inviteCode,
    wagerType: type,
    nftContract: nftContract,
    player1TokenId: tokenId,
    // ... rest of game data
  });
};
```

#### 3.5 Join Game with NFT
```typescript
const joinGameWithNFT = async (
  inviteCode: string,
  tokenId: string,
  type: 'ERC721' | 'ERC1155',
  quantity?: number
) => {
  // 1. Get game data to find NFT contract
  const game = await firebaseChess.getGame(inviteCode);
  const nftContract = game.nftContract;
  
  // 2. Ensure NFT is approved
  await approveNFT(nftContract, tokenId, type, chessContractAddress, signer);
  
  // 3. Join game
  if (type === 'ERC721') {
    await writeContract({
      address: chessContractAddress,
      abi: CHESS_CONTRACT_ABI,
      functionName: 'joinGameERC721',
      args: [inviteCode, tokenId]
    });
  } else {
    await writeContract({
      address: chessContractAddress,
      abi: CHESS_CONTRACT_ABI,
      functionName: 'joinGameERC1155',
      args: [inviteCode, tokenId, quantity || 1]
    });
  }
};
```

#### 3.6 NFT Wagering UI Flow
```typescript
// Game creation flow
1. User selects "Wager NFT" option
2. Show NFT selector (fetch user's NFTs)
3. User selects NFT from their collection
4. Check NFT approval status
5. If not approved, show "Approve NFT" button
6. After approval, show "Create Game" button
7. Create game with NFT
8. Display game with NFT info (image, name, etc.)

// Game joining flow
1. User sees game in lobby with NFT wager indicator
2. User clicks "Join Game"
3. Show NFT selector (filtered to same NFT contract)
4. User selects matching NFT
5. Check approval, approve if needed
6. Join game with NFT
```

#### 3.7 NFT Display in Game
```typescript
// Show wagered NFTs in game UI
{game.wagerType === 'ERC721' || game.wagerType === 'ERC1155' ? (
  <div className="nft-wager-display">
    <div className="player1-nft">
      <img src={player1NFT.image} alt={player1NFT.name} />
      <span>{player1NFT.name} #{player1NFT.tokenId}</span>
    </div>
    <div className="vs">VS</div>
    <div className="player2-nft">
      {game.player2 ? (
        <>
          <img src={player2NFT.image} alt={player2NFT.name} />
          <span>{player2NFT.name} #{player2NFT.tokenId}</span>
        </>
      ) : (
        <span>Waiting for opponent...</span>
      )}
    </div>
  </div>
) : (
  // ERC20 wager display
  <div>Wager: {wagerAmount} {tokenSymbol}</div>
)}
```

#### 3.8 NFT Winner Display (Base Only)
```typescript
// After game ends, show winner gets both NFTs
// Only show for Base/Arbitrum games
{game.chain === 'base' && game.winner && (game.wagerType === 'ERC721' || game.wagerType === 'ERC1155') && (
  <div className="nft-winner">
    <h3>{game.winner === address ? 'You won!' : 'Opponent won!'}</h3>
    <p>Winner receives both NFTs:</p>
    <div className="won-nfts">
      <NFTDisplay nft={player1NFT} />
      <NFTDisplay nft={player2NFT} />
    </div>
  </div>
)}
```

#### 3.9 Sanko Behavior (No NFT Support)
```typescript
// On Sanko, only show token wagering
{chainId === NETWORKS.mainnet.chainId && (
  <TokenSelector 
    tokens={SANKO_TOKENS} // Fixed list: DMT, GOLD, LAWB, MOSS
    // No custom input
    // No NFT option
  />
)}
```

### 3. Game Creation with Chain
```typescript
const createGame = async (
  chain: 'sanko' | 'base' | 'arbitrum',
  inviteCode: string,
  tokenAddress: string,
  wagerAmount: bigint
) => {
  // 1. Ensure on correct chain
  await ensureChain(chainId, chain);
  
  // 2. Get contract address for chain
  const contractAddress = getContractAddress(NETWORKS[chain].chainId);
  
  // 3. Create game on blockchain
  await writeCreateGame({
    address: contractAddress,
    abi: CHESS_CONTRACT_ABI,
    functionName: 'createGame',
    args: [inviteCode, tokenAddress, wagerAmount]
  });
  
  // 4. Create Firebase entry with chain
  await firebaseChess.createGame({
    chain,
    invite_code: inviteCode,
    // ... rest
  });
};
```

---

## 🚀 Deployment Order

1. **Update Frontend Config** (lawb2)
   - Update contract addresses
   - Add chain selector
   - Support custom tokens

2. **Deploy Arbitrum Contract** (chess-sanko-contract)
   - Run `deploy-arbitrum.js`
   - Configure tokens
   - Verify contract

3. **Update Frontend with Arbitrum Address** (lawb2)
   - Add Arbitrum contract address
   - Test Arbitrum games

4. **Firebase Migration** (lawb2)
   - Run migration script
   - Update rules
   - Test existing games still work

5. **Testing & Launch**
   - Full end-to-end testing
   - Deploy to production

---

## 📚 Reference Files

### Contract Repo
- `scripts/deploy-base.js` - Base deployment
- `scripts/deploy-arbitrum.js` - Arbitrum deployment
- `scripts/configure-tokens-base.js` - Base token config
- `scripts/configure-tokens-arbitrum.js` - Arbitrum token config

### Frontend Repo (lawb2)
- `src/config/tokens.ts` - Token/chain configuration
- `src/components/ChessMultiplayer.tsx` - Main game component
- `src/components/TokenSelector.tsx` - Token selection
- `src/firebaseChess.ts` - Firebase integration
- `src/firebaseLeaderboard.ts` - Leaderboard logic

---

## 🎯 Success Criteria

✅ Users can select chain (desktop) or auto-detect (Base app)  
✅ Games can be created on any supported chain  
✅ **Sanko**: Fixed token list unchanged (DMT, GOLD, LAWB, MOSS)  
✅ **Base**: Any ERC20 token can be used for wagers (custom input)  
✅ **Base**: NFT wagering available (ERC721 & ERC1155)  
✅ **Sanko**: NFT wagering NOT available (hidden/disabled)  
✅ Firebase tracks games with chain field  
✅ Leaderboard aggregates wins across all chains  
✅ Existing Sanko games continue to work unchanged  
✅ Base app only shows Base games  
✅ Network switching works smoothly  
✅ Chain-specific features properly gated  

---

## ⚠️ Important Notes

1. **Backward Compatibility**: All existing Sanko games must continue working
2. **Firebase Migration**: Must be non-breaking (add `chain` field, don't remove existing fields)
3. **Token Validation**: Always validate custom token addresses before allowing wagers
4. **Network Switching**: Handle user rejection gracefully
5. **Base App**: Must detect Base context and force Base chain
6. **allowAllTokens**: Contracts support any ERC20, but we should validate tokens exist

---

Ready to start implementation! 🚀
