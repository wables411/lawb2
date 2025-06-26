// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22; // Updated to match hardhat.config.js

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ChessGameUpgradable is Initializable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    IERC20Upgradeable public lawbToken;
    uint256 public constant MIN_WAGER = 100 * 10**6; // 100 $LAWB (with 6 decimals)
    uint256 public constant MAX_WAGER = 10000000 * 10**6; // 10,000,000 $LAWB (with 6 decimals)
    address public constant house = 0x13031dC2dC848A985cCb6532956f7B8f3487772A; // Replace with your actual house address    struct Game {
        address player1;           // Creator (Blue)
        address player2;           // Joiner (Red)
        bool isActive;             // Game in progress
        address winner;            // Winner address
        bytes6 inviteCode;         // 6-character Invite code
        uint256 wagerAmount;       // Wager amount set by Player 1
    }

    mapping(bytes6 => Game) public games;
    mapping(address => bytes6) public playerToGame;

    event GameCreated(bytes6 inviteCode, address player1, uint256 wagerAmount);
    event GameJoined(bytes6 inviteCode, address player2);
    event GameEnded(bytes6 inviteCode, address winner, uint256 houseFee, uint256 wagerPayout);
    event GameCancelled(bytes6 inviteCode, address player1);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
    _disableInitializers(); // Prevent initialization during construction
    }

    function initialize(address _lawbToken) public initializer {
        __ReentrancyGuard_init(); // Initialize ReentrancyGuard
        __UUPSUpgradeable_init(); // Initialize UUPS
        lawbToken = IERC20Upgradeable(_lawbToken);
    }

    // Create a new game with a custom wager
    function createGame(bytes6 inviteCode, uint256 wagerAmount) external nonReentrant {
        require(playerToGame[msg.sender] == bytes6(0), "Already in a game");
        require(games[inviteCode].player1 == address(0), "Invite code taken");
        require(wagerAmount >= MIN_WAGER && wagerAmount <= MAX_WAGER, "Wager out of bounds");

        // Transfer the wager amount from player1 to contract
        require(lawbToken.transferFrom(msg.sender, address(this), wagerAmount), "Token transfer failed");

        games[inviteCode] = Game({
            player1: msg.sender,
            player2: address(0),
            isActive: false,
            winner: address(0),
            inviteCode: inviteCode,
            wagerAmount: wagerAmount
        });
        playerToGame[msg.sender] = inviteCode;

        emit GameCreated(inviteCode, msg.sender, wagerAmount);
    }

    // Join an existing game with the same wager
    function joinGame(bytes6 inviteCode) external nonReentrant {
        Game storage game = games[inviteCode];
        require(game.player1 != address(0), "Game does not exist");
        require(game.player2 == address(0), "Game already full");
        require(playerToGame[msg.sender] == bytes6(0), "Already in a game");
        require(msg.sender != game.player1, "Cannot join own game");

        uint256 wagerAmount = game.wagerAmount;

        // Transfer the wager amount from player2 to contract
        require(lawbToken.transferFrom(msg.sender, address(this), wagerAmount), "Token transfer failed");

        game.player2 = msg.sender;
        game.isActive = true;
        playerToGame[msg.sender] = inviteCode;

        emit GameJoined(inviteCode, msg.sender);
    }

    // Report game completion and distribute winnings with a 5% house fee
    function endGame(bytes6 inviteCode, address winner) external nonReentrant {
        Game storage game = games[inviteCode];
        require(game.isActive, "Game not active");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        require(winner == game.player1 || winner == game.player2, "Invalid winner");

        game.isActive = false;
        game.winner = winner;

        uint256 wagerAmount = game.wagerAmount;
        uint256 totalPot = wagerAmount * 2; // Total pot from both players
        uint256 houseFee = (totalPot * 5) / 100; // 5% of the total pot
        uint256 payout = totalPot - houseFee; // 95% goes to the winner

        // Transfer the house fee to the deployer (house)
        require(lawbToken.transfer(house, houseFee), "House fee transfer failed");
        // Transfer the remaining pot to the winner
        require(lawbToken.transfer(winner, payout), "Payout failed");

        // Clean up
        playerToGame[game.player1] = bytes6(0);
        playerToGame[game.player2] = bytes6(0);
        delete games[inviteCode];

        emit GameEnded(inviteCode, winner, houseFee, payout);
    }

    // Cancel a game (before Player 2 joins)
    function cancelGame(bytes6 inviteCode) external nonReentrant {
        Game storage game = games[inviteCode];
        require(game.player1 == msg.sender, "Not the creator");
        require(game.player2 == address(0), "Game already started");
        require(game.wagerAmount > 0, "No game found");

        // Refund Player 1
        require(lawbToken.transfer(msg.sender, game.wagerAmount), "Refund failed");

        // Clean up
        playerToGame[msg.sender] = bytes6(0);
        delete games[inviteCode];

        emit GameCancelled(inviteCode, msg.sender);
    }

    // New function to reset a player's game state (house-only)
    function resetPlayerGame(address player) external {
        require(msg.sender == house, "Unauthorized");
        playerToGame[player] = bytes6(0);
    }

    // Emergency withdrawal (optional, for stuck funds)
    function withdrawTokens(address recipient) external {
        require(msg.sender == house, "Unauthorized");
        uint256 balance = lawbToken.balanceOf(address(this));
        require(lawbToken.transfer(recipient, balance), "Withdrawal failed");
    }

    // UUPS upgrade function (for future upgrades, if needed)
    function _authorizeUpgrade(address newImplementation) internal override onlyHouse {}

    modifier onlyHouse() {
        require(msg.sender == house, "Unauthorized");
        _;
    }
}