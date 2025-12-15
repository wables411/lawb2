// ERC20 Token ABI
export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_from", "type": "address"},
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Updated Chess Contract ABI with token support - Mainnet Implementation
export const CHESS_CONTRACT_ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},
  {"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},
  {"inputs":[],"name":"ERC1967NonPayable","type":"error"},
  {"inputs":[],"name":"FailedCall","type":"error"},
  {"inputs":[],"name":"InvalidInitialization","type":"error"},
  {"inputs":[],"name":"NotInitializing","type":"error"},
  {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
  {"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},
  {"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player1","type":"address"}],"name":"GameCancelled","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player1","type":"address"},{"indexed":false,"internalType":"uint256","name":"wagerAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"wagerToken","type":"address"}],"name":"GameCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"houseFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"payoutOrRefund","type":"uint256"},{"indexed":false,"internalType":"address","name":"wagerToken","type":"address"}],"name":"GameEnded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"indexed":false,"internalType":"address","name":"player2","type":"address"}],"name":"GameJoined","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"allowAllTokens","type":"bool"}],"name":"AllowAllTokensUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"minWager","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxWager","type":"uint256"}],"name":"TokenLimitsUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},
  {"inputs":[],"name":"DMT_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"GOLD_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"LAWB_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"MOSS_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"NATIVE_DMT","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"allowAllTokens","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"addSupportedToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"cancelGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"address","name":"wagerToken","type":"address"},{"internalType":"uint256","name":"wagerAmount","type":"uint256"}],"name":"createGame","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"createGameERC721","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"quantity","type":"uint256"}],"name":"createGameERC1155","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"address","name":"winner","type":"address"}],"name":"endGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"","type":"bytes6"}],"name":"games","outputs":[{"internalType":"address","name":"player1","type":"address"},{"internalType":"address","name":"player2","type":"address"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"uint256","name":"wagerAmount","type":"uint256"},{"internalType":"address","name":"wagerToken","type":"address"},{"internalType":"uint8","name":"wagerType","type":"uint8"},{"internalType":"uint256","name":"player1TokenId","type":"uint256"},{"internalType":"uint256","name":"player2TokenId","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getNativeDMTBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"getTokenBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"house","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_house","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"isNativeDMT","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"}],"name":"joinGame","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"joinGameERC721","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes6","name":"inviteCode","type":"bytes6"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"joinGameERC1155","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"leaderboard","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerToGame","outputs":[{"internalType":"bytes6","name":"","type":"bytes6"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"removeSupportedToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"player","type":"address"}],"name":"resetPlayerGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"supportedTokens","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"tokenMaxWager","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"tokenMinWager","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"minWager","type":"uint256"},{"internalType":"uint256","name":"maxWager","type":"uint256"}],"name":"updateTokenLimits","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address payable","name":"recipient","type":"address"}],"name":"withdrawTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}
] as const; 