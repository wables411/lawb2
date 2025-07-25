# Frontend Integration Guide - Native DMT Support

This guide provides detailed instructions for updating your frontend to support native DMT wagering in the chess game contract.

## Overview

The contract upgrade adds native DMT support while maintaining all existing ERC-20 token functionality. The frontend needs to be updated to handle both native DMT and ERC-20 tokens seamlessly.

## Key Changes Required

### 1. Token Configuration Updates

Update your token configuration to include native DMT:

```javascript
// Updated token configuration
const TOKENS = {
  nativeDmt: {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "DMT",
    name: "Native DMT",
    decimals: 18,
    isNative: true,
    logo: "/images/dmt-logo.png", // Same logo as ERC-20 DMT
    color: "#FF6B35" // Your DMT brand color
  },
  dmt: {
    address: "0x754cDAd6f5821077d6915004Be2cE05f93d176f8",
    symbol: "DMT",
    name: "DMT Token",
    decimals: 18,
    isNative: false,
    logo: "/images/dmt-logo.png",
    color: "#FF6B35"
  },
  moss: {
    address: "0xeA240b96A9621e67159c59941B9d588eb290ef09",
    symbol: "MOSS",
    name: "MOSS Token",
    decimals: 18,
    isNative: false,
    logo: "/images/moss-logo.png",
    color: "#00FF00"
  },
  gold: {
    address: "0x6F5e2d3b8c5C5c5F9bcB4adCF40b13308e688D4D",
    symbol: "GOLD",
    name: "GOLD Token",
    decimals: 18,
    isNative: false,
    logo: "/images/gold-logo.png",
    color: "#FFD700"
  },
  lawb: {
    address: "0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F",
    symbol: "LAWB",
    name: "LAWB Token",
    decimals: 18,
    isNative: false,
    logo: "/images/lawb-logo.png",
    color: "#8B4513"
  }
};
```

### 2. Balance Checking Functions

Create utility functions to handle both native and ERC-20 token balances:

```javascript
// Balance checking utilities
export const getTokenBalance = async (provider, userAddress, tokenConfig) => {
  if (tokenConfig.isNative) {
    // For native DMT
    const balance = await provider.getBalance(userAddress);
    return balance;
  } else {
    // For ERC-20 tokens
    const tokenContract = new ethers.Contract(
      tokenConfig.address,
      ERC20_ABI,
      provider
    );
    const balance = await tokenContract.balanceOf(userAddress);
    return balance;
  }
};

// Format balance for display
export const formatTokenBalance = (balance, tokenConfig) => {
  if (tokenConfig.isNative) {
    return ethers.formatEther(balance);
  } else {
    return ethers.formatUnits(balance, tokenConfig.decimals);
  }
};
```

### 3. Transaction Creation Functions

Update your transaction creation logic to handle native DMT:

```javascript
// Create game transaction
export const createGame = async (contract, inviteCode, tokenConfig, wagerAmount) => {
  const parsedAmount = ethers.parseUnits(wagerAmount.toString(), tokenConfig.decimals);
  
  if (tokenConfig.isNative) {
    // Native DMT transaction
    const tx = await contract.createGame(inviteCode, tokenConfig.address, parsedAmount, {
      value: parsedAmount // Include native DMT in transaction
    });
    return tx;
  } else {
    // ERC-20 token transaction
    // First approve the contract to spend tokens
    const tokenContract = new ethers.Contract(
      tokenConfig.address,
      ERC20_ABI,
      contract.signer
    );
    
    const approveTx = await tokenContract.approve(contract.address, parsedAmount);
    await approveTx.wait();
    
    // Then create game
    const tx = await contract.createGame(inviteCode, tokenConfig.address, parsedAmount);
    return tx;
  }
};

// Join game transaction
export const joinGame = async (contract, inviteCode, game) => {
  const tokenConfig = getTokenConfig(game.wagerToken);
  const wagerAmount = game.wagerAmount;
  
  if (tokenConfig.isNative) {
    // Native DMT transaction
    const tx = await contract.joinGame(inviteCode, {
      value: wagerAmount
    });
    return tx;
  } else {
    // ERC-20 token transaction
    // First approve the contract to spend tokens
    const tokenContract = new ethers.Contract(
      tokenConfig.address,
      ERC20_ABI,
      contract.signer
    );
    
    const approveTx = await tokenContract.approve(contract.address, wagerAmount);
    await approveTx.wait();
    
    // Then join game
    const tx = await contract.joinGame(inviteCode);
    return tx;
  }
};
```

### 4. Token Selection UI

Update your token selection component to show both native and ERC-20 DMT:

```javascript
// Token selection component
const TokenSelector = ({ selectedToken, onTokenSelect }) => {
  const tokenList = Object.values(TOKENS);
  
  return (
    <div className="token-selector">
      <label>Select Token:</label>
      <select 
        value={selectedToken?.address || ""} 
        onChange={(e) => {
          const token = tokenList.find(t => t.address === e.target.value);
          onTokenSelect(token);
        }}
      >
        <option value="">Select a token</option>
        {tokenList.map((token) => (
          <option key={token.address} value={token.address}>
            {token.name} ({token.symbol})
            {token.isNative ? " - Native" : ""}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 5. Balance Display Component

Create a component to display token balances:

```javascript
const TokenBalance = ({ provider, userAddress, tokenConfig }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const bal = await getTokenBalance(provider, userAddress, tokenConfig);
        setBalance(bal);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (provider && userAddress && tokenConfig) {
      fetchBalance();
    }
  }, [provider, userAddress, tokenConfig]);
  
  if (loading) return <div>Loading balance...</div>;
  if (balance === null) return <div>Error loading balance</div>;
  
  const formattedBalance = formatTokenBalance(balance, tokenConfig);
  
  return (
    <div className="token-balance">
      <span className="balance-amount">{formattedBalance}</span>
      <span className="token-symbol">{tokenConfig.symbol}</span>
      {tokenConfig.isNative && <span className="native-badge">Native</span>}
    </div>
  );
};
```

### 6. Game Creation Form

Update your game creation form to handle native DMT:

```javascript
const CreateGameForm = ({ contract, provider, userAddress }) => {
  const [selectedToken, setSelectedToken] = useState(null);
  const [wagerAmount, setWagerAmount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleCreateGame = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const tx = await createGame(contract, inviteCode, selectedToken, wagerAmount);
      await tx.wait();
      
      // Show success message
      alert("Game created successfully!");
      
      // Reset form
      setInviteCode("");
      setWagerAmount("");
      setSelectedToken(null);
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Error creating game: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleCreateGame}>
      <div>
        <label>Invite Code:</label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter 6-character invite code"
          maxLength={6}
          required
        />
      </div>
      
      <div>
        <label>Token:</label>
        <TokenSelector 
          selectedToken={selectedToken}
          onTokenSelect={setSelectedToken}
        />
      </div>
      
      {selectedToken && (
        <div>
          <label>Your Balance:</label>
          <TokenBalance 
            provider={provider}
            userAddress={userAddress}
            tokenConfig={selectedToken}
          />
        </div>
      )}
      
      <div>
        <label>Wager Amount:</label>
        <input
          type="number"
          value={wagerAmount}
          onChange={(e) => setWagerAmount(e.target.value)}
          placeholder={`Enter amount in ${selectedToken?.symbol || "tokens"}`}
          min={selectedToken ? getTokenMinWager(selectedToken) : 0}
          max={selectedToken ? getTokenMaxWager(selectedToken) : undefined}
          step="0.1"
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? "Creating Game..." : "Create Game"}
      </button>
    </form>
  );
};
```

### 7. Game Joining Component

Update your game joining component:

```javascript
const JoinGameButton = ({ contract, game, userAddress }) => {
  const [loading, setLoading] = useState(false);
  
  const handleJoinGame = async () => {
    setLoading(true);
    
    try {
      const tx = await joinGame(contract, game.inviteCode, game);
      await tx.wait();
      
      alert("Successfully joined the game!");
      // Refresh game list or redirect to game
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Error joining game: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const tokenConfig = getTokenConfig(game.wagerToken);
  
  return (
    <div className="join-game">
      <div className="game-info">
        <p>Wager: {ethers.formatUnits(game.wagerAmount, tokenConfig.decimals)} {tokenConfig.symbol}</p>
        {tokenConfig.isNative && <span className="native-badge">Native DMT</span>}
      </div>
      
      <button onClick={handleJoinGame} disabled={loading}>
        {loading ? "Joining..." : "Join Game"}
      </button>
    </div>
  );
};
```

### 8. Utility Functions

Add these utility functions to your codebase:

```javascript
// Get token configuration by address
export const getTokenConfig = (tokenAddress) => {
  return Object.values(TOKENS).find(token => token.address === tokenAddress);
};

// Get minimum wager for token
export const getTokenMinWager = (tokenConfig) => {
  const limits = {
    nativeDmt: 0.1,
    dmt: 0.1,
    moss: 100,
    gold: 1,
    lawb: 1000
  };
  return limits[tokenConfig.symbol.toLowerCase()] || 0;
};

// Get maximum wager for token
export const getTokenMaxWager = (tokenConfig) => {
  const limits = {
    nativeDmt: 100,
    dmt: 100,
    moss: 1000000,
    gold: 1000,
    lawb: 10000000
  };
  return limits[tokenConfig.symbol.toLowerCase()] || 0;
};

// Check if user has sufficient balance
export const hasSufficientBalance = (userBalance, wagerAmount, tokenConfig) => {
  const parsedWager = ethers.parseUnits(wagerAmount.toString(), tokenConfig.decimals);
  return userBalance >= parsedWager;
};
```

### 9. Error Handling

Add specific error handling for native DMT transactions:

```javascript
// Enhanced error handling
export const handleTransactionError = (error) => {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return "Insufficient native DMT balance for transaction";
  }
  
  if (error.message.includes("Incorrect native DMT amount")) {
    return "The sent native DMT amount doesn't match the wager amount";
  }
  
  if (error.message.includes("No native DMT should be sent")) {
    return "Native DMT should not be sent for ERC-20 token transactions";
  }
  
  return error.message;
};
```

### 10. Testing Checklist

After implementing these changes, test the following:

- [ ] Native DMT balance displays correctly
- [ ] Native DMT game creation works
- [ ] Native DMT game joining works
- [ ] ERC-20 token functionality unchanged
- [ ] Token selection shows both native and ERC-20 DMT
- [ ] Error messages are clear and helpful
- [ ] Transaction confirmations work properly
- [ ] Balance updates after transactions
- [ ] UI clearly distinguishes between native and ERC-20 DMT

## Contract Address

- **Contract Address**: `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56`
- **Network**: Sanko Mainnet (Chain ID: 1996)

## Support

For questions or issues with the frontend integration, please refer to the contract documentation and test the functionality thoroughly before deploying to production. 