// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ChessGame is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    // Native DMT address (zero address)
    address public constant NATIVE_DMT = address(0);
    
    // Wrapped DMT address
    address public constant WRAPPED_DMT = 0x754cDAd6f5821077d6915004Be2cE05f93d176f8;

    struct Game {
        bytes6 inviteCode;
        address bluePlayer;
        address redPlayer;
        address wagerToken;
        uint256 wagerAmount;
        uint256 gameStartTime;
        bool isActive;
        bool isFinished;
        address winner;
        uint256 lastMoveTime;
    }

    struct TokenLimits {
        uint256 minWager;
        uint256 maxWager;
        bool isSupported;
    }

    // Mapping from invite code to game
    mapping(bytes6 => Game) public games;
    
    // Mapping from player address to their current game invite code
    mapping(address => bytes6) public playerToGame;
    
    // Token limits mapping
    mapping(address => TokenLimits) public tokenLimits;
    
    // House address for collecting fees
    address public houseAddress;
    
    // Fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public feePercentage;
    
    // Timeout duration for moves (in seconds)
    uint256 public moveTimeout;
    
    // Events
    event GameCreated(bytes6 indexed inviteCode, address indexed bluePlayer, address wagerToken, uint256 wagerAmount);
    event GameJoined(bytes6 indexed inviteCode, address indexed redPlayer);
    event GameFinished(bytes6 indexed inviteCode, address indexed winner, uint256 amount);
    event GameCancelled(bytes6 indexed inviteCode, address indexed player, uint256 refundAmount);
    event TokenLimitsUpdated(address indexed token, uint256 minWager, uint256 maxWager);
    event FeeCollected(address indexed token, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _houseAddress, uint256 _feePercentage, uint256 _moveTimeout) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        houseAddress = _houseAddress;
        feePercentage = _feePercentage;
        moveTimeout = _moveTimeout;
        
        // Set default limits for native DMT
        tokenLimits[NATIVE_DMT] = TokenLimits({
            minWager: 0.01 ether, // 0.01 DMT minimum
            maxWager: 100 ether,  // 100 DMT maximum
            isSupported: true
        });
        
        // Set default limits for Wrapped DMT
        tokenLimits[WRAPPED_DMT] = TokenLimits({
            minWager: 0.01 ether, // 0.01 WDMT minimum
            maxWager: 100 ether,  // 100 WDMT maximum
            isSupported: true
        });
    }

    function createGame(bytes6 inviteCode, address wagerToken, uint256 wagerAmount) external payable nonReentrant whenNotPaused {
        require(games[inviteCode].inviteCode == 0, "Game already exists");
        require(playerToGame[msg.sender] == 0, "Player already in a game");
        require(wagerAmount > 0, "Wager amount must be positive");
        
        TokenLimits memory limits = tokenLimits[wagerToken];
        require(limits.isSupported, "Token not supported");
        require(wagerAmount >= limits.minWager, "Wager below minimum");
        require(wagerAmount <= limits.maxWager, "Wager above maximum");
        
        // Handle native DMT vs ERC20 tokens
        if (wagerToken == NATIVE_DMT) {
            // For native DMT, check msg.value
            require(msg.value == wagerAmount, "Incorrect native DMT amount");
        } else {
            // For ERC20 tokens, transfer from player
            require(msg.value == 0, "No native DMT should be sent for ERC20 tokens");
            IERC20(wagerToken).safeTransferFrom(msg.sender, address(this), wagerAmount);
        }
        
        games[inviteCode] = Game({
            inviteCode: inviteCode,
            bluePlayer: msg.sender,
            redPlayer: address(0),
            wagerToken: wagerToken,
            wagerAmount: wagerAmount,
            gameStartTime: block.timestamp,
            isActive: false,
            isFinished: false,
            winner: address(0),
            lastMoveTime: block.timestamp
        });
        
        playerToGame[msg.sender] = inviteCode;
        
        emit GameCreated(inviteCode, msg.sender, wagerToken, wagerAmount);
    }

    function joinGame(bytes6 inviteCode) external payable nonReentrant whenNotPaused {
        Game storage game = games[inviteCode];
        require(game.inviteCode != 0, "Game does not exist");
        require(game.redPlayer == address(0), "Game already has two players");
        require(game.bluePlayer != msg.sender, "Cannot join your own game");
        require(playerToGame[msg.sender] == 0, "Player already in a game");
        require(!game.isFinished, "Game is finished");
        
        // Handle native DMT vs ERC20 tokens
        if (game.wagerToken == NATIVE_DMT) {
            // For native DMT, check msg.value
            require(msg.value == game.wagerAmount, "Incorrect native DMT amount");
        } else {
            // For ERC20 tokens, transfer from player
            require(msg.value == 0, "No native DMT should be sent for ERC20 tokens");
            IERC20(game.wagerToken).safeTransferFrom(msg.sender, address(this), game.wagerAmount);
        }
        
        game.redPlayer = msg.sender;
        game.isActive = true;
        game.lastMoveTime = block.timestamp;
        playerToGame[msg.sender] = inviteCode;
        
        emit GameJoined(inviteCode, msg.sender);
    }

    function endGame(bytes6 inviteCode, address winner) external onlyOwner {
        Game storage game = games[inviteCode];
        require(game.inviteCode != 0, "Game does not exist");
        require(game.isActive, "Game is not active");
        require(!game.isFinished, "Game already finished");
        require(winner == game.bluePlayer || winner == game.redPlayer, "Invalid winner");
        
        game.isFinished = true;
        game.winner = winner;
        
        uint256 totalPot = game.wagerAmount * 2;
        uint256 fee = (totalPot * feePercentage) / 10000;
        uint256 winnerAmount = totalPot - fee;
        
        // Clear player mappings
        playerToGame[game.bluePlayer] = 0;
        playerToGame[game.redPlayer] = 0;
        
        // Distribute winnings
        if (game.wagerToken == NATIVE_DMT) {
            // Send native DMT
            (bool feeSuccess, ) = houseAddress.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
            
            (bool winnerSuccess, ) = winner.call{value: winnerAmount}("");
            require(winnerSuccess, "Winner transfer failed");
        } else {
            // Send ERC20 tokens
            IERC20(game.wagerToken).safeTransfer(houseAddress, fee);
            IERC20(game.wagerToken).safeTransfer(winner, winnerAmount);
        }
        
        emit GameFinished(inviteCode, winner, winnerAmount);
        emit FeeCollected(game.wagerToken, fee);
    }

    function cancelGame(bytes6 inviteCode) external nonReentrant {
        Game storage game = games[inviteCode];
        require(game.inviteCode != 0, "Game does not exist");
        require(!game.isFinished, "Game is finished");
        require(msg.sender == game.bluePlayer, "Only blue player can cancel");
        require(game.redPlayer == address(0), "Cannot cancel game with two players");
        
        game.isFinished = true;
        playerToGame[game.bluePlayer] = 0;
        
        // Refund the wager
        if (game.wagerToken == NATIVE_DMT) {
            (bool success, ) = game.bluePlayer.call{value: game.wagerAmount}("");
            require(success, "Refund failed");
        } else {
            IERC20(game.wagerToken).safeTransfer(game.bluePlayer, game.wagerAmount);
        }
        
        emit GameCancelled(inviteCode, game.bluePlayer, game.wagerAmount);
    }

    function timeoutGame(bytes6 inviteCode) external onlyOwner {
        Game storage game = games[inviteCode];
        require(game.inviteCode != 0, "Game does not exist");
        require(game.isActive, "Game is not active");
        require(!game.isFinished, "Game is finished");
        require(block.timestamp > game.lastMoveTime + moveTimeout, "Game not timed out");
        
        // Determine winner based on last move (simplified logic)
        address winner = game.bluePlayer; // Default to blue player
        game.isFinished = true;
        game.winner = winner;
        
        uint256 totalPot = game.wagerAmount * 2;
        uint256 fee = (totalPot * feePercentage) / 10000;
        uint256 winnerAmount = totalPot - fee;
        
        // Clear player mappings
        playerToGame[game.bluePlayer] = 0;
        playerToGame[game.redPlayer] = 0;
        
        // Distribute winnings
        if (game.wagerToken == NATIVE_DMT) {
            (bool feeSuccess, ) = houseAddress.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
            
            (bool winnerSuccess, ) = winner.call{value: winnerAmount}("");
            require(winnerSuccess, "Winner transfer failed");
        } else {
            IERC20(game.wagerToken).safeTransfer(houseAddress, fee);
            IERC20(game.wagerToken).safeTransfer(winner, winnerAmount);
        }
        
        emit GameFinished(inviteCode, winner, winnerAmount);
        emit FeeCollected(game.wagerToken, fee);
    }

    // Admin functions
    function updateTokenLimits(address token, uint256 minWager, uint256 maxWager) external onlyOwner {
        tokenLimits[token] = TokenLimits({
            minWager: minWager,
            maxWager: maxWager,
            isSupported: true
        });
        emit TokenLimitsUpdated(token, minWager, maxWager);
    }

    function setHouseAddress(address _houseAddress) external onlyOwner {
        houseAddress = _houseAddress;
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        feePercentage = _feePercentage;
    }

    function setMoveTimeout(uint256 _moveTimeout) external onlyOwner {
        moveTimeout = _moveTimeout;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getGame(bytes6 inviteCode) external view returns (Game memory) {
        return games[inviteCode];
    }

    function getPlayerGame(address player) external view returns (bytes6) {
        return playerToGame[player];
    }

    function tokenMinWager(address token) external view returns (uint256) {
        return tokenLimits[token].minWager;
    }

    function tokenMaxWager(address token) external view returns (uint256) {
        return tokenLimits[token].maxWager;
    }

    function isTokenSupported(address token) external view returns (bool) {
        return tokenLimits[token].isSupported;
    }

    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == NATIVE_DMT) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Withdrawal failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // Required for UUPS upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Allow contract to receive native DMT
    receive() external payable {
        // Only allow if it's part of a game creation/joining
        require(msg.sender == tx.origin, "Only EOA can send native DMT");
    }
} 