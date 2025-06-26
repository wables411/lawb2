// Safely access ethers from window
const ethers = window.ethers || null;
if (!ethers) {
    console.error("Ethers.js not found on window. Please ensure it is loaded.");
}

const contractAddress = "0x3112AF5728520F52FD1C6710dD7bD52285a68e47";
const edgeFunctionUrl = "https://roxwocgknkiqnsgiojgz.supabase.co/functions/v1/dynamic-task";
const sankoNetwork = { chainId: 1992, name: "Sanko Testnet" };
let isMultiplayerInitialized = false;
let isInitializingMultiplayer = false;

class MultiplayerManager {
    static hasGameBeenCreated = false;

    constructor() {
        if (!window.gameDatabase) throw new Error("Game database not initialized");
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.currentGameState = null;
        this.isMultiplayerMode = true;
        this.isProcessingMove = false;
        this.selectedPiece = null;
        this.chessContract = null;
        this.lastCreateClickTime = 0;
        this.hasCreatedGame = false;
        this.currentAddress = localStorage.getItem('currentPlayer')?.toLowerCase() || null;
        this.isCheckingGameState = false;
        this.isWaitingForOpponent = false;
        this.activeGames = [];
        this.lobbySubscription = null;
        this.expiryInterval = null;
        this.lastCheckTime = 0;
        this.lastQueriedGameId = null;
        this.web3 = null;

        // Bind methods
        this.initWeb3 = this.initWeb3.bind(this);
        this.connectToContract = this.connectToContract.bind(this);
        this.checkPlayerGameState = this.checkPlayerGameState.bind(this);
        this.joinGameByCode = this.joinGameByCode.bind(this);
        this.makeMove = this.makeMove.bind(this);
        this.showGame = this.showGame.bind(this);
        this.handleGameEnd = this.handleGameEnd.bind(this);
        this.initializeEventListeners = this.initializeEventListeners.bind(this);

        console.log("MultiplayerManager constructor called, currentAddress:", this.currentAddress);
        this.initializeEventListeners();
        if (this.currentAddress) {
            console.log("Triggering initial game state check");
            this.initWeb3().then(() => {
                this.checkPlayerGameState().catch(err => console.error("Initial checkPlayerGameState failed:", err.message));
            }).catch(err => console.error("Initial initWeb3 failed:", err.message));
        }
    }

    async checkPlayerGameState(maxRetries = 5, baseDelay = 1000) {
        console.log("checkPlayerGameState started, currentAddress:", this.currentAddress);
        if (!this.currentAddress) {
            console.error("No wallet connected in checkPlayerGameState");
            window.updateStatusDisplay("Please connect your wallet");
            return false;
        }
        if (Date.now() - this.lastCheckTime < 1000) {
            console.log("checkPlayerGameState: Debounced");
            return false;
        }
        this.lastCheckTime = Date.now();

        let attempt = 1;
        while (attempt <= maxRetries) {
            console.log(`checkPlayerGameState attempt ${attempt} for ${this.currentAddress}`);
            try {
                let gameIdStr;
                const contract = await this.connectToContract();
                if (contract) {
                    const chainId = await window.ethereum.request({ method: "eth_chainId" });
                    console.log("Current chainId:", chainId);
                    if (chainId !== "0x7c8") {
                        console.error("Wrong network, expected Sanko Testnet (0x7c8)");
                        window.updateStatusDisplay("Please switch to Sanko Testnet");
                        return false;
                    }
                    const gameId = await contract.playerToGame(this.currentAddress);
                    console.log("Contract playerToGame result:", gameId);
                    if (gameId !== "0x000000000000" && gameId !== "") {
                        gameIdStr = ethers.utils.hexlify(gameId).slice(2).toUpperCase();
                        console.log(`Contract gameId: ${gameIdStr}`);
                    }
                } else {
                    console.warn("Contract not connected, falling back to Supabase");
                }

                if (!gameIdStr) {
                    console.log("Querying Supabase for active games");
                    const { data, error } = await this.supabase
                        .from("chess_games")
                        .select("game_id")
                        .eq("chain", "sanko")
                        .eq("game_state", "active")
                        .or(`blue_player_id.eq.${this.currentAddress},red_player_id.eq.${this.currentAddress}`);
                    if (error) {
                        console.error("Supabase query error:", error.message);
                        throw new Error(`Supabase error: ${error.message}`);
                    }
                    if (!data?.length) {
                        console.log("No active games found in Supabase");
                        this.resetGameState();
                        return false;
                    }
                    gameIdStr = data[0].game_id;
                    console.log(`Supabase found game: ${gameIdStr}`);
                }

                if (this.lastQueriedGameId === gameIdStr) {
                    console.log(`Game ${gameIdStr} already queried`);
                    return false;
                }
                this.lastQueriedGameId = gameIdStr;

                console.log(`Fetching game data for ${gameIdStr}`);
                const { data: gameData, error } = await this.supabase
                    .from("chess_games")
                    .select("game_id, blue_player_id, red_player_id, board, current_player, game_state, piece_state, last_move, bet_amount, is_public, game_title, chain, created_at")
                    .eq("game_id", gameIdStr)
                    .eq("chain", "sanko")
                    .or(`blue_player_id.eq.${this.currentAddress},red_player_id.eq.${this.currentAddress}`)
                    .single();
                if (error) {
                    console.error("Supabase game data query error:", error.message);
                    throw new Error(`Supabase query error: ${error.message}`);
                }

                console.log("Game data retrieved:", gameData);
                if (gameData.game_state === "active" || gameData.game_state === "waiting") {
                    this.currentGameState = gameData;
                    this.playerColor = this.currentAddress === gameData.blue_player_id ? 'blue' : 'red';
                    console.log(`Loading game state for ${gameIdStr}, playerColor: ${this.playerColor}`);
                    window.loadGameState({
                        board: gameData.board.positions,
                        currentPlayer: gameData.current_player,
                        pieceState: gameData.piece_state,
                        lastMove: gameData.last_move,
                        playerColor: this.playerColor
                    });
                    window.updateStatusDisplay(this.isMyTurn() ? 'Your turn' : "Opponent's turn");
                    await this.showGame(gameData);
                    return true;
                } else {
                    console.log(`Game ${gameIdStr} is not active or waiting, resetting state`);
                    this.resetGameState();
                    return false;
                }
            } catch (error) {
                console.error(`checkPlayerGameState attempt ${attempt} failed:`, error.message);
                if (attempt < maxRetries) {
                    console.log(`Retrying in ${baseDelay * Math.pow(2, attempt - 1)}ms`);
                    await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
                } else {
                    console.error("Max retries reached in checkPlayerGameState");
                    window.updateStatusDisplay("Failed to load game. Please reconnect wallet.");
                }
            }
            attempt++;
        }
        return false;
    }

    async initWeb3(attempt = 1, maxRetries = 3) {
        console.log(`initWeb3 attempt ${attempt}`);
        if (attempt > maxRetries) {
            console.error("Max wallet connection retries reached");
            window.updateStatusDisplay("Max wallet connection retries reached");
            return null;
        }
        if (!window.ethereum) {
            console.error("MetaMask not detected");
            window.updateStatusDisplay("Please install MetaMask");
            return null;
        }
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.request({ method: 'eth_requestAccounts' });
            const signer = provider.getSigner();
            this.currentAddress = (await signer.getAddress()).toLowerCase();
            localStorage.setItem('currentPlayer', this.currentAddress);
            console.log("Wallet connected:", this.currentAddress);

            const { error } = await this.supabase.rpc("set_current_player", {
                player_address: this.currentAddress
            });
            if (error) {
                console.error(`set_current_player failed: ${error.message}`);
                throw new Error(`set_current_player failed: ${error.message}`);
            }

            this.web3 = { provider, signer };
            console.log("Dispatching walletConnected event for:", this.currentAddress);
            window.dispatchEvent(new CustomEvent('walletConnected', { detail: this.currentAddress }));
            console.log("Web3 initialized:", this.currentAddress);
            return this.web3;
        } catch (error) {
            console.error(`initWeb3 attempt ${attempt} failed:`, error.message);
            window.updateStatusDisplay(`Wallet connection failed: ${error.message}`);
            if (attempt < maxRetries) {
                return await this.initWeb3(attempt + 1, maxRetries);
            }
            return null;
        }
    }

    async connectToContract() {
        if (this.chessContract) {
            console.log("Returning cached contract:", this.chessContract.address);
            return this.chessContract;
        }
        if (!this.web3 || !this.web3.provider || !this.web3.signer) {
            const web3 = await this.initWeb3();
            if (!web3) {
                console.error("Failed to initialize Web3");
                return null;
            }
            this.web3 = web3;
        }
        try {
            const contractABI = [
                {
                    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
                    "name": "playerToGame",
                    "outputs": [{"internalType": "bytes6", "name": "", "type": "bytes6"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"}],
                    "name": "createGame",
                    "outputs": [],
                    "stateMutability": "payable",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"}],
                    "name": "joinGame",
                    "outputs": [],
                    "stateMutability": "payable",
                    "type": "function"
                },
                {
                    "inputs": [
                        {"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
                        {"internalType": "address", "name": "winner", "type": "address"}
                    ],
                    "name": "endGame",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"}],
                    "name": "cancelGame",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "MIN_WAGER",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "MAX_WAGER",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {"indexed": true, "internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
                        {"indexed": true, "internalType": "address", "name": "player1", "type": "address"},
                        {"indexed": false, "internalType": "uint256", "name": "wagerAmount", "type": "uint256"}
                    ],
                    "name": "GameCreated",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {"indexed": true, "internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
                        {"indexed": true, "internalType": "address", "name": "player2", "type": "address"}
                    ],
                    "name": "GameJoined",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {"indexed": true, "internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
                        {"indexed": true, "internalType": "address", "name": "winner", "type": "address"},
                        {"indexed": false, "internalType": "uint256", "name": "houseFee", "type": "uint256"},
                        {"indexed": false, "internalType": "uint256", "name": "payoutOrRefund", "type": "uint256"}
                    ],
                    "name": "GameEnded",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {"indexed": true, "internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
                        {"indexed": true, "internalType": "address", "name": "player1", "type": "address"}
                    ],
                    "name": "GameCancelled",
                    "type": "event"
                }
            ];
            this.chessContract = new ethers.Contract(contractAddress, contractABI, this.web3.signer);
            console.log("Connected to contract:", contractAddress);

            const attachEventListeners = () => {
                this.chessContract.on("GameCreated", (inviteCode, player1, wagerAmount) => {
                    const inviteCodeStr = inviteCode.slice(2).toUpperCase();
                    console.log(`GameCreated: ${inviteCodeStr}, ${player1}, ${ethers.utils.formatEther(wagerAmount)} tDMT`);
                    if (player1.toLowerCase() === this.currentAddress) {
                        this.gameId = inviteCodeStr;
                        this.playerColor = "blue";
                        this.showGame({
                            game_id: inviteCodeStr,
                            blue_player_id: player1.toLowerCase(),
                            red_player_id: null,
                            game_state: "waiting",
                            board: { positions: JSON.parse(JSON.stringify(window.initialBoard || [])), piece_state: window.pieceState || {} },
                            current_player: "Blue",
                            bet_amount: ethers.utils.formatEther(wagerAmount)
                        });
                    }
                });

                this.chessContract.on("GameJoined", (inviteCode, player2) => {
                    const inviteCodeStr = inviteCode.slice(2).toUpperCase();
                    console.log(`GameJoined: ${inviteCodeStr}, ${player2}`);
                    if (this.gameId === inviteCodeStr && player2.toLowerCase() === this.currentAddress) {
                        this.playerColor = "red";
                        this.showGame({
                            game_id: inviteCodeStr,
                            blue_player_id: this.currentGameState?.blue_player_id,
                            red_player_id: player2.toLowerCase(),
                            game_state: "active",
                            board: this.currentGameState?.board || { positions: JSON.parse(JSON.stringify(window.initialBoard || [])), piece_state: window.pieceState || {} },
                            current_player: "Blue"
                        });
                    }
                });

                this.chessContract.on("GameEnded", (code, winner, fee, payout) => {
                    const gameId = code.slice(2).toUpperCase();
                    console.log(`GameEnded: ${gameId}, ${winner}, ${ethers.utils.formatEther(fee)} tDMT, ${ethers.utils.formatEther(payout)} tDMT`);
                    if (this.gameId === gameId) {
                        this.handleGameEnd({ gameId, winner });
                    }
                });

                this.chessContract.on("GameCancelled", (code, player1) => {
                    const gameId = code.slice(2).toUpperCase();
                    console.log(`GameCancelled: ${gameId}, ${player1}`);
                    if (this.gameId === gameId) {
                        this.handleGameEnd({ gameId, winner: ethers.constants.AddressZero });
                    }
                });
            };

            if (!this.chessContract.listenerCount("GameCreated")) {
                attachEventListeners();
            }

            return this.chessContract;
        } catch (error) {
            console.error("connectToContract error:", error.message);
            return null;
        }
    }

    initializeEventListeners() {
        if (isMultiplayerInitialized) {
            console.log("Event listeners already initialized, skipping");
            return;
        }
        isMultiplayerInitialized = true;
        console.log("Initializing event listeners");

        window.addEventListener('walletConnected', async (event) => {
            const address = event.detail?.toLowerCase();
            if (!address) {
                console.error("walletConnected: No address provided");
                return;
            }
            console.log(`walletConnected event received: ${address}`);
            this.currentAddress = address;
            localStorage.setItem('currentPlayer', address);
            if (this.isMultiplayerMode) {
                console.log("Checking game state due to wallet connection");
                await this.checkPlayerGameState().catch(err => console.error("checkPlayerGameState failed:", err.message));
            }
        });

        const elements = {
            singlePlayerBtn: document.getElementById('ai-mode'),
            multiplayerBtn: document.getElementById('multiplayer-mode'),
            chessboard: document.getElementById('chessboard'),
            createGameBtn: document.getElementById('create-game'),
            joinGameBtn: document.getElementById('join-game'),
            leaveGameBtn: document.getElementById('leave-game'),
            cancelMatchmakingBtn: document.getElementById('cancel-match'),
            forceLeaveGameBtn: document.getElementById('force-leave-by'),
            resyncGameBtn: document.getElementById('resync-game'),
            resyncGameMenuBtn: document.getElementById('resync-game-menu')
        };

        console.log("DOM elements found:", Object.keys(elements).filter(k => elements[k]).join(", "));

        if (elements.singlePlayerBtn) {
            elements.singlePlayerBtn.addEventListener('click', () => {
                console.log("Single-player mode selected");
                this.isMultiplayerMode = false;
                window.isMultiplayerMode = false;
                this.leaveGame();
            });
        }

        if (elements.multiplayerBtn) {
            elements.multiplayerBtn.addEventListener('click', () => {
                console.log("Multiplayer mode selected");
                this.isMultiplayerMode = true;
                window.isMultiplayerMode = true;
                const multiplayerMenu = document.querySelector('.multiplayer-menu');
                const difficultyScreen = document.getElementById('combat-screen');
                if (multiplayerMenu && difficultyScreen) {
                    multiplayerMenu.style.display = 'flex';
                    difficultyScreen.style.display = 'none';
                }
                this.initWeb3().then(() => {
                    console.log("initWeb3 completed, checking game state");
                    this.checkPlayerGameState().catch(err => console.error("Multiplayer mode checkPlayerGameState failed:", err.message));
                }).catch(err => console.error("initWeb3 failed:", err.message));
                this.fetchMultiplayerGames();
            });
        }

        if (elements.chessboard) {
            elements.chessboard.addEventListener('click', (e) => {
                console.log("Chessboard clicked");
                this.handleMultiplayerClick(e);
            });
        }

        if (elements.createGameBtn) {
            elements.createGameBtn.addEventListener('click', async () => {
                console.log("Create game button clicked");
                const wagerInput = document.getElementById('wagerAmount');
                const wagerAmount = parseFloat(wagerInput?.value || 0.1);
                const gameTitleInput = document.getElementById('game-title-input');
                const gameTitle = gameTitleInput?.value.trim() || '';
                if (isNaN(wagerAmount) || wagerAmount <= 0) {
                    alert('Please enter a valid wager amount');
                    return;
                }
                await this.createMultiplayerGame(wagerAmount, true, gameTitle);
            });
        }

        if (elements.joinGameBtn) {
            elements.joinGameBtn.addEventListener('click', async () => {
                console.log("Join game button clicked");
                const codeInput = document.getElementById('game-code-input');
                const code = codeInput?.value.trim().toUpperCase();
                if (!code) {
                    alert('Please enter a game code');
                    return;
                }
                await this.joinGameByCode(code);
            });
        }

        if (elements.leaveGameBtn) {
            elements.leaveGameBtn.addEventListener('click', () => {
                console.log("Leave game button clicked");
                this.leaveGame();
            });
        }

        if (elements.cancelMatchmakingBtn) {
            elements.cancelMatchmakingBtn.addEventListener('click', () => {
                console.log("Cancel matchmaking button clicked");
                this.cancelMultiplayer();
            });
        }

        if (elements.forceLeaveGameBtn) {
            elements.forceLeaveGameBtn.addEventListener('click', async () => {
                console.log("Force leave game button clicked");
                await this.leaveGame();
                alert('Attempted to leave game.');
            });
        }

        if (elements.resyncGameBtn) {
            elements.resyncGameBtn.addEventListener('click', () => {
                console.log("Resync game button clicked");
                this.forceMultiplayerSync();
            });
        }

        if (elements.resyncGameMenuBtn) {
            elements.resyncGameMenuBtn.addEventListener('click', () => {
                console.log("Resync game menu button clicked");
                this.forceMultiplayerSync();
            });
        }

        console.log('Event listeners initialized');
    }

    async updateMultiplayerMenu(gameData) {
        console.log("updateMultiplayerMenu called with gameData:", gameData);
        const activeGameInfo = document.getElementById("active-game-info");
        const activeGameIdSpan = document.getElementById("active-game-id");
        const multiplayerOptions = document.getElementById("multiplayer-options");
        const resumeGameBtn = document.getElementById("resume-game-btn");
        const multiplayerMenu = document.querySelector(".multiplayer-menu");
        const chessGame = document.getElementById("chess-game");
        const activeGamesList = document.getElementById("active-games-list");
        const createGameBtn = document.getElementById("create-game");
        const joinGameBtn = document.getElementById("join-game");
        const gameCodeInput = document.getElementById("game-code-input");
        const wagerInput = document.getElementById("wagerAmount");

        if (gameData && activeGameInfo && activeGameIdSpan && multiplayerOptions && resumeGameBtn) {
            console.log("Showing active game info for:", gameData.game_id);
            activeGameInfo.style.display = "block";
            activeGameIdSpan.textContent = gameData.game_id;
            multiplayerOptions.style.display = "none";
            resumeGameBtn.onclick = () => this.showGame(gameData);
            if (activeGamesList) activeGamesList.style.display = "none";
        } else {
            console.log("Showing multiplayer menu, no active game");
            if (activeGameInfo) activeGameInfo.style.display = "none";
            if (multiplayerOptions) multiplayerOptions.style.display = "block";
            if (multiplayerMenu && chessGame) {
                multiplayerMenu.style.display = "flex";
                chessGame.style.display = "none";
            }
            if (activeGamesList) {
                activeGamesList.style.display = this.isWaitingForOpponent ? "none" : "block";
            }
            if (createGameBtn) createGameBtn.disabled = this.isWaitingForOpponent;
            if (joinGameBtn) joinGameBtn.disabled = this.isWaitingForOpponent;
            if (gameCodeInput) gameCodeInput.disabled = this.isWaitingForOpponent;
            if (wagerInput) wagerInput.disabled = this.isWaitingForOpponent;
        }
    }

    async fetchMultiplayerGames() {
        console.log("fetchMultiplayerGames called");
        try {
            const { error } = await this.supabase.rpc("set_current_player", {
                player_address: this.currentAddress
            });
            if (error) {
                console.error(`set_current_player failed: ${error.message}`);
                throw new Error(`set_current_player failed: ${error.message}`);
            }
            const { data, error: fetchError } = await this.supabase
                .from("chess_games")
                .select("game_id, blue_player_id, red_player_id, bet_amount, game_title, created_at, game_state")
                .in("game_state", ["waiting", "active"])
                .eq("chain", "sanko")
                .or(
                    `blue_player_id.eq.${this.currentAddress},red_player_id.eq.${this.currentAddress},and(game_state.eq.waiting,red_player_id.is.null,is_public.eq.true)`
                )
                .order("created_at", { ascending: false });
            if (fetchError) {
                console.error(`Supabase fetch error: ${fetchError.message}`);
                throw new Error(`Supabase error: ${fetchError.message}`);
            }
            this.activeGames = (data || []).filter(game =>
                game.blue_player_id !== this.currentAddress ||
                game.game_state === "active" ||
                game.red_player_id === null
            );
            console.log(`Fetched ${this.activeGames.length} games`);
            this.renderMultiplayerGames();
        } catch (error) {
            console.error("Failed to fetch games:", error.message);
            const container = document.getElementById("games-container");
            if (container) {
                container.innerHTML = '<p style="color: white; font-family: monospace; text-align: center;">Error loading games</p>';
            }
        }
    }

    renderMultiplayerGames() {
        console.log("renderMultiplayerGames called");
        const container = document.getElementById("games-container");
        const activeGamesList = document.getElementById("active-games-list");
        if (!container || !activeGamesList) {
            console.error("Missing games-container or active-games-list elements");
            return;
        }
        container.innerHTML = "";
        activeGamesList.style.display = "block";
        if (!this.activeGames.length) {
            container.innerHTML = '<p style="color: white; font-family: monospace; text-align: center;">No games available.</p>';
            return;
        }
        this.activeGames.forEach(game => {
            const gameDiv = document.createElement("div");
            gameDiv.className = "game-item";
            const truncatedAddress = `${game.blue_player_id.slice(0, 6)}...${game.blue_player_id.slice(-4)}`;
            gameDiv.innerHTML = `
                <span>Game: ${game.game_id} | Player: ${truncatedAddress} | ${game.bet_amount} tDMT | ${game.game_title || "No Title"}</span>
                <button class="join-game-btn" data-game-id="${game.game_id}" ${this.currentAddress && game.blue_player_id === this.currentAddress && game.game_state !== "active" ? "disabled" : ""}>Join</button>
            `;
            container.appendChild(gameDiv);
        });
        document.querySelectorAll(".join-game-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const gameId = btn.dataset.gameId;
                const codeInput = document.getElementById("game-code-input");
                if (codeInput) codeInput.value = gameId;
                await this.joinGameByCode(gameId);
            });
        });
    }

    setupRealtimeSubscription() {
        console.log("setupRealtimeSubscription called");
        if (this.lobbySubscription) {
            this.supabase.removeChannel(this.lobbySubscription);
        }
        this.lobbySubscription = this.supabase
            .channel("chess_games_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "chess_games",
                    filter: "game_state=eq.waiting,chain=eq.sanko"
                },
                () => this.fetchMultiplayerGames()
            )
            .subscribe();
    }

    startGameExpiryCheck() {
        console.log("startGameExpiryCheck called");
        if (this.expiryInterval) clearInterval(this.expiryInterval);
        this.expiryInterval = setInterval(async () => {
            try {
                const expiryThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
                const { data, error } = await this.supabase
                    .from("chess_games")
                    .select("game_id, blue_player_id")
                    .eq("game_state", "waiting")
                    .is("red_player_id", null)
                    .lte("created_at", expiryThreshold)
                    .eq("chain", "sanko");
                if (error) {
                    console.error("Supabase expiry query error:", error.message);
                    throw error;
                }

                for (const game of data) {
                    const contract = await this.connectToContract();
                    if (contract) {
                        const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + game.game_id.toLowerCase()), 6);
                        await contract.cancelGame(inviteCodeBytes);
                        await this.supabase
                            .from("chess_games")
                            .update({ game_state: "cancelled", updated_at: new Date().toISOString() })
                            .eq("game_id", game.game_id);
                    }
                }
                await this.fetchMultiplayerGames();
            } catch (error) {
                console.error("Error checking game expiry:", error.message);
            }
        }, 60 * 1000);
    }

    async createMultiplayerGame(wagerAmount = 0.1, isPublic = true, gameTitle = "") {
        console.log("createMultiplayerGame called, wagerAmount:", wagerAmount, "isPublic:", isPublic, "gameTitle:", gameTitle);
        if (this.hasCreatedGame) {
            console.log("Game creation blocked: already created");
            return;
        }
        this.hasCreatedGame = true;
        const createBtn = document.getElementById("create-game");
        if (createBtn) createBtn.disabled = true;

        let inviteCode;
        try {
            if (!this.currentAddress) throw new Error("Wallet not connected");
            if (!this.supabase) throw new Error("Supabase not initialized");

            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== "0x7c8") {
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x7c8" }]
                    });
                } catch (error) {
                    if (error.code === 4902) {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: "0x7c8",
                                chainName: "Sanko Testnet",
                                rpcUrls: ["https://sanko-arb-sepolia.rpc.caldera.xyz/http"],
                                nativeCurrency: { name: "tDMT", symbol: "tDMT", decimals: 18 },
                                blockExplorerUrls: ["https://explorer.testnet.sanko.xyz"]
                            }]
                        });
                    } else {
                        throw new Error("Please switch to Sanko Testnet");
                    }
                }
            }

            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed to connect to contract");

            const minWager = ethers.utils.formatEther(await contract.MIN_WAGER());
            const maxWager = ethers.utils.formatEther(await contract.MAX_WAGER());
            if (wagerAmount < minWager || wagerAmount > maxWager) {
                throw new Error(`Wager must be between ${minWager} and ${maxWager} tDMT`);
            }

            let existingGame = await contract.playerToGame(this.currentAddress);
            if (existingGame !== "0x000000000000" && existingGame !== "") {
                const gameIdStr = ethers.utils.hexlify(existingGame).slice(2).toUpperCase();
                await this.leaveGame();
                existingGame = await contract.playerToGame(this.currentAddress);
                if (existingGame !== "0x000000000000" && existingGame !== "") {
                    const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + gameIdStr.toLowerCase()), 6);
                    await contract.cancelGame(inviteCodeBytes);
                    await this.cleanupStaleGame(gameIdStr);
                }
            }

            inviteCode = await this.generateUniqueInviteCode();
            const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + inviteCode.toLowerCase()), 6);
            const wagerInWei = ethers.utils.parseEther(wagerAmount.toString());

            const { data: existingGames } = await this.supabase
                .from("chess_games")
                .select("game_id")
                .eq("game_id", inviteCode)
                .eq("game_state", "waiting");
            if (existingGames?.length) throw new Error("Invite code already exists");

            const { data: supabaseData, error } = await this.supabase
                .from("chess_games")
                .insert({
                    game_id: inviteCode,
                    blue_player_id: this.currentAddress,
                    red_player_id: null,
                    board: { positions: JSON.parse(JSON.stringify(window.initialBoard || [])), piece_state: window.pieceState || {} },
                    current_player: "Blue",
                    game_state: "waiting",
                    bet_amount: wagerAmount,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_public: isPublic,
                    game_title: gameTitle || null,
                    chain: "sanko",
                    contract_address: contract.address
                })
                .select()
                .single();
            if (error) {
                console.error("Supabase insert error:", error.message);
                throw new Error(`Supabase insert failed: ${error.message}`);
            }

            await contract.createGame(inviteCodeBytes, { value: wagerInWei });

            this.gameId = inviteCode;
            this.playerColor = "blue";
            this.currentGameState = supabaseData;
            this.isWaitingForOpponent = true;

            const gameCodeElement = document.getElementById("gameCode");
            const gameCodeDisplay = document.getElementById("gameCodeDisplay");
            const matchmakingStatus = document.getElementById("matchmaking-status");
            const cancelMatchmaking = document.getElementById("cancel-match");
            const createGameButton = document.getElementById("create-game");
            const joinGameButton = document.getElementById("join-game");
            const leaveGameButton = document.getElementById("leave-game");
            const forceLeaveGameButton = document.getElementById("force-leave-by");
            if (gameCodeElement) gameCodeElement.textContent = inviteCode;
            if (gameCodeDisplay) gameCodeDisplay.style.display = "block";
            if (matchmakingStatus) {
                matchmakingStatus.style.display = "block";
                const statusText = matchmakingStatus.querySelector(".status-text");
                if (statusText) statusText.textContent = "Waiting for opponent...";
            }
            if (cancelMatchmaking) cancelMatchmaking.style.display = "block";
            if (createGameButton) createGameButton.style.display = "none";
            if (joinGameButton) joinGameButton.style.display = "none";
            if (leaveGameButton) leaveGameButton.style.display = "block";
            if (forceLeaveGameButton) forceLeaveGameButton.style.display = "block";

            await this.subscribeToGame();
            await this.updateMultiplayerMenu(supabaseData);
            await this.fetchMultiplayerGames();
            alert(`Game created with wager ${wagerAmount} tDMT`);
            return inviteCode;
        } catch (error) {
            console.error("Create game failed:", error.message);
            this.hasCreatedGame = false;
            this.isWaitingForOpponent = false;
            if (inviteCode) {
                await this.cleanupStaleGame(inviteCode);
                const contract = await this.connectToContract();
                if (contract) {
                    const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + inviteCode.toLowerCase()), 6);
                    await contract.cancelGame(inviteCodeBytes).catch(() => {});
                }
            }
            alert(`Failed to create game: ${error.message}`);
            return false;
        } finally {
            if (createBtn) createBtn.disabled = false;
        }
    }

    async generateUniqueInviteCode() {
        const uuid = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
            .replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
            .slice(0, 6)
            .toUpperCase();
        const { data } = await this.supabase
            .from("chess_games")
            .select("game_id")
            .eq("game_id", uuid)
            .single();
        if (data) return this.generateUniqueInviteCode();
        return uuid;
    }

    async cleanupStaleGame(inviteCode) {
        console.log("cleanupStaleGame called for:", inviteCode);
        try {
            await this.supabase
                .from("chess_games")
                .delete()
                .eq("game_id", inviteCode)
                .eq("game_state", "waiting");
            console.log(`Deleted stale game ${inviteCode}`);
        } catch (error) {
            console.error(`Failed to delete stale game ${inviteCode}:`, error.message);
        }
    }

    async joinGameByCode(gameId, maxRetries = 3, retryDelay = 2000) {
        console.log("joinGameByCode called for gameId:", gameId);
        let attempt = 1;
        while (attempt <= maxRetries) {
            console.log(`Joining game ${gameId}, attempt ${attempt}`);
            try {
                if (!this.currentAddress) throw new Error("Wallet not connected");
                const contract = await this.connectToContract();
                if (!contract) throw new Error("Failed to connect to contract");
                const gameData = await this.supabase
                    .from("chess_games")
                    .select("bet_amount")
                    .eq("game_id", gameId)
                    .single();
                if (gameData.error) {
                    console.error("Supabase game fetch error:", gameData.error.message);
                    throw new Error(`Failed to fetch game: ${gameData.error.message}`);
                }
                const wagerAmount = ethers.utils.parseEther(gameData.data.bet_amount.toString());
                const inviteCode = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + gameId.toLowerCase()), 6);
                await contract.joinGame(inviteCode, { value: wagerAmount });
                console.log(`Joined game ${gameId}`);
                await this.checkPlayerGameState();
                return true;
            } catch (error) {
                console.error(`Join attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                    window.updateStatusDisplay(`Failed to join game: ${error.message}`);
                    return false;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            attempt++;
        }
        return false;
    }

    async cancelMultiplayer() {
        console.log("cancelMultiplayer called");
        if (!this.isWaitingForOpponent) {
            console.log("No matchmaking to cancel");
            return;
        }
        try {
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed to connect to contract");
            const { data, error } = await this.supabase
                .from("chess_games")
                .select("game_id")
                .eq("blue_player_id", this.currentAddress)
                .eq("game_state", "waiting")
                .is("red_player_id", null)
                .eq("chain", "sanko")
                .single();
            if (error || !data) {
                console.error("No waiting game found:", error?.message);
                throw new Error("No waiting game found");
            }
            const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + data.game_id.toLowerCase()), 6);
            await contract.cancelGame(inviteCodeBytes);
            await this.supabase
                .from("chess_games")
                .update({ game_state: "cancelled", updated_at: new Date().toISOString() })
                .eq("game_id", data.game_id);
            this.isWaitingForOpponent = false;
            this.hasCreatedGame = false;
            await this.updateMultiplayerMenu(null);
            alert("Matchmaking cancelled");
        } catch (error) {
            console.error("Cancel matchmaking error:", error.message);
            alert(`Error cancelling: ${error.message}`);
        }
    }

    async endGame(inviteCode, winnerAddress) {
        console.log("endGame called for inviteCode:", inviteCode, "winnerAddress:", winnerAddress);
        try {
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed to connect to contract");
            const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + inviteCode.toLowerCase()), 6);
            await contract.endGame(inviteCodeBytes, winnerAddress);
            await this.supabase
                .from("chess_games")
                .update({
                    game_state: "completed",
                    winner: winnerAddress === this.currentGameState.blue_player_id ? "blue" :
                            winnerAddress === this.currentGameState.red_player_id ? "red" : "draw",
                    updated_at: new Date().toISOString()
                })
                .eq("game_id", inviteCode);
            this.handleGameEnd({ game_id: inviteCode, winner: winnerAddress });
        } catch (error) {
            console.error(`End game ${inviteCode} error:`, error.message);
            alert(`Failed to end game: ${error.message}`);
        }
    }

    async leaveGame() {
        console.log("leaveGame called");
        if (this.subscription) {
            this.supabase.removeChannel(this.subscription);
            this.subscription = null;
        }
        try {
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed to connect to contract");
            const inviteCode = await contract.playerToGame(this.currentAddress);
            if (inviteCode !== "0x000000000000" && inviteCode !== "") {
                const gameIdStr = ethers.utils.hexlify(inviteCode).slice(2).toUpperCase();
                const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + gameIdStr.toLowerCase()), 6);
                const game = await contract.games(inviteCodeBytes);
                if (game.player2 === ethers.constants.AddressZero) {
                    await contract.cancelGame(inviteCodeBytes);
                    await this.cleanupStaleGame(gameIdStr);
                } else {
                    throw new Error("Cannot leave active game with two players");
                }
            }
            if (this.gameId) {
                await this.supabase
                    .from("chess_games")
                    .update({
                        game_state: "cancelled",
                        winner: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("game_id", this.gameId);
            }
            this.resetGameState();
            await this.updateMultiplayerMenu(null);
        } catch (error) {
            console.error("Leave game error:", error.message);
            alert(`Error leaving game: ${error.message}`);
            this.resetGameState();
            await this.updateMultiplayerMenu(null);
        }
    }

    async debugLeaveGame() {
        console.log("debugLeaveGame called");
        try {
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed to connect to contract");
            const gameId = await contract.playerToGame(this.currentAddress);
            if (gameId === "0x000000000000" || gameId === "") {
                console.log("No game to leave");
                return;
            }
            const gameIdStr = ethers.utils.hexlify(gameId).slice(2).toUpperCase();
            const { data, error } = await this.supabase
                .from("chess_games")
                .select("game_state, blue_player_id, red_player_id")
                .eq("game_id", gameIdStr)
                .single();
            if (error || !data) {
                console.error("Game not found:", error?.message);
                throw new Error("Game not found");
            }
            if (data.game_state === "active" && data.blue_player_id && data.red_player_id) {
                alert("Cannot leave active game with two players");
                return;
            }
            const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + gameIdStr.toLowerCase()), 6);
            await contract.cancelGame(inviteCodeBytes);
            await this.supabase
                .from("chess_games")
                .update({
                    game_state: "cancelled",
                    updated_at: new Date().toISOString()
                })
                .eq("game_id", gameIdStr);
            if (this.subscription) {
                this.supabase.removeChannel(this.subscription);
                this.subscription = null;
            }
            this.resetGameState();
            await this.updateMultiplayerMenu(null);
        } catch (error) {
            console.error("Debug leave failed:", error.message);
            alert(`Failed to leave: ${error.message}`);
        }
    }

    async debugEndGame(winnerAddress) {
        console.log("debugEndGame called for winnerAddress:", winnerAddress);
        try {
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed to connect to contract");
            const gameId = await contract.playerToGame(this.currentAddress);
            if (gameId === "0x000000000000" || gameId === "") {
                console.log("No game to end");
                return;
            }
            const gameIdStr = ethers.utils.hexlify(gameId).slice(2).toUpperCase();
            const inviteCodeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify("0x" + gameIdStr.toLowerCase()), 6);
            await contract.endGame(inviteCodeBytes, winnerAddress);
            await this.supabase
                .from("chess_games")
                .update({
                    game_state: "completed",
                    winner: winnerAddress === this.currentAddress ? "blue" : "red",
                    updated_at: new Date().toISOString()
                })
                .eq("game_id", gameIdStr);
        } catch (error) {
            console.error("Debug endGame failed:", error.message);
            alert(`Failed to end game: ${error.message}`);
        }
    }

    resetGameState() {
        console.log("resetGameState called");
        if (this.currentGameState?.game_state === "active" || this.currentGameState?.game_state === "waiting") {
            console.warn("resetGameState: Skipping for active/waiting game");
            return;
        }
        this.gameId = null;
        this.playerColor = null;
        this.currentGameState = null;
        this.selectedPiece = null;
        this.hasCreatedGame = false;
        this.lastCreateClickTime = 0;
        this.isWaitingForOpponent = false;

        const menuEl = document.querySelector(".multiplayer-menu");
        const gameEl = document.getElementById("chess-game");
        const difficultyScreen = document.getElementById("combat-screen");
        if (menuEl) menuEl.style.display = "block";
        if (gameEl) gameEl.style.display = "none";
        if (difficultyScreen) difficultyScreen.style.display = "none";

        if (window.updateGameResult) {
            window.updateGameResult({ winner: "loss", player: this.currentAddress, mode: "online" });
        }
        if (window.leaderboardManager) {
            window.leaderboardManager.loadLeaderboard();
        }
    }

    isMyTurn() {
        const isTurn = this.currentGameState?.current_player?.toLowerCase() === this.playerColor?.toLowerCase();
        console.log("isMyTurn:", isTurn, "current_player:", this.currentGameState?.current_player, "playerColor:", this.playerColor);
        return isTurn;
    }

    async showGame(gameData) {
        console.log("showGame called with gameData:", gameData);
        if (!gameData?.game_id) {
            console.error('showGame: Invalid game ID', gameData);
            window.updateStatusDisplay('Failed to load game');
            return;
        }

        console.log(`showGame: Loading ${gameData.game_id}`);
        const board = gameData.board.positions;
        const pieceState = gameData.piece_state || gameData.board.piece_state || {
            redKingMoved: false, redRooksMove: { left: false, right: false },
            blueKingMoved: false, blueRooksMove: { left: false, right: false },
            lastPawnDoubleMove: null
        };
        const currentPlayer = gameData.current_player;

        try {
            const chessGame = document.getElementById('chess-game');
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            console.log("chess-game element:", !!chessGame, "multiplayer-menu element:", !!multiplayerMenu);
            if (chessGame && multiplayerMenu) {
                console.log("Showing chess game, hiding multiplayer menu");
                chessGame.style.display = 'block';
                multiplayerMenu.style.display = 'none';
            } else {
                console.error("Missing DOM elements: chess-game or multiplayer-menu");
                window.updateStatusDisplay("UI error: Game board not found");
                return;
            }

            window.board = board;
            window.pieceState = pieceState;
            window.currentPlayer = currentPlayer;
            console.log("Calling placePieces");
            window.placePieces();

            console.log("Updating move log with:", gameData.last_move);
            window.updateMoveLog(gameData.last_move);
            const status = this.isMyTurn() ? 'Your turn' : "Opponent's turn";
            console.log("Updating status display:", status);
            window.updateStatusDisplay(status);

            this.gameId = gameData.game_id;
            this.currentGameState = { ...gameData, board: { positions: board, piece_state: pieceState }, current_player: currentPlayer };
            console.log("Updating board interactivity");
            this.updateBoardInteractivity();
            console.log("Subscribing to game:", gameData.game_id);
            await this.subscribeToGame(gameData.game_id);
        } catch (error) {
            console.error('showGame error:', error.message);
            window.updateStatusDisplay('Error loading game');
        }
    }

    updateBoardInteractivity() {
        console.log("updateBoardInteractivity called");
        const chessboard = document.getElementById("chessboard");
        if (!chessboard) {
            console.error("Chessboard element not found");
            return;
        }

        const isMyTurn = this.isMyTurn();
        chessboard.style.pointerEvents = isMyTurn ? "auto" : "none";

        const pieces = chessboard.getElementsByClassName("piece");
        Array.from(pieces).forEach(piece => {
            const row = parseInt(piece.getAttribute("data-row"));
            const col = parseInt(piece.getAttribute("data-col"));
            const pieceType = window.board[row][col];
            if (pieceType) {
                const pieceColor = window.getPieceColor(pieceType);
                piece.style.cursor = isMyTurn && pieceColor === this.playerColor ? "pointer" : "default";
            }
        });
    }

    async subscribeToGame(gameId = this.gameId) {
        console.log("subscribeToGame called for gameId:", gameId);
        if (!gameId) {
            console.error("Invalid game ID for subscription");
            window.updateStatusDisplay("Failed to connect to game");
            return;
        }

        if (this.subscription) {
            this.supabase.removeChannel(this.subscription);
            this.subscription = null;
        }

        const channelName = `game_${gameId}`;
        let heartbeatInterval = null;

        this.subscription = this.supabase
            .channel(channelName)
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "chess_games",
                filter: `game_id=eq.${gameId}`
            }, (payload) => {
                console.log("Received game update:", payload);
                if (payload.new) this.handleUpdate(payload.new);
            })
            .subscribe((status) => {
                console.log("Subscription status:", status);
                if (status === "SUBSCRIBED") {
                    heartbeatInterval = setInterval(() => {
                        this.supabase.channel(channelName).send({
                            type: "broadcast",
                            event: "heartbeat",
                            payload: { ping: Date.now() }
                        });
                    }, 30000);
                } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
                    clearInterval(heartbeatInterval);
                    this.subscribeToGame(gameId);
                }
            });
    }

    async handleUpdate(game) {
        console.log("handleUpdate called with game:", game);
        if (!game) return;
        try {
            this.currentGameState = game;
            if (game.board?.positions) {
                window.board = JSON.parse(JSON.stringify(game.board.positions));
                window.pieceState = game.piece_state || window.pieceState;
                window.placePieces();
            }
            if (game.last_move) {
                window.updateMoveLog(game.last_move);
            }
            if (game.current_player) {
                window.currentPlayer = game.current_player;
                this.updateBoardInteractivity();
                const baseStatus = this.isMyTurn() ? "Your turn" : "Waiting for opponent";
                if (window.isKingInCheck && window.isKingInCheck(game.current_player)) {
                    window.updateStatusDisplay(`Check: ${baseStatus}`);
                } else if (game.game_state !== "completed") {
                    window.updateStatusDisplay(baseStatus);
                }
            }
            if (game.game_state === "completed") {
                await this.handleGameEnd(game);
            }
            if (game.game_state === "active" && this.isWaitingForOpponent) {
                this.isWaitingForOpponent = false;
                await this.showGame(game);
                await this.updateMultiplayerMenu(game);
            }
        } catch (error) {
            console.error("handleUpdate error:", error.message);
            window.updateStatusDisplay("Error syncing game");
        }
    }

    async handleGameEnd(game) {
        console.log("handleGameEnd called with game:", game);
        try {
            let gameResult, displayMessage;
            if (!game.winner || game.winner === "draw") {
                gameResult = "draw";
                displayMessage = "Game Over - Draw!";
            } else if (game.winner === ethers.constants.AddressZero) {
                gameResult = "loss";
                displayMessage = "Game Cancelled!";
            } else {
                gameResult = game.winner === (this.playerColor === "blue" ? this.currentGameState.blue_player_id : this.currentGameState.red_player_id) ? "win" : "loss";
                displayMessage = `Game Over - ${game.winner === this.currentGameState.blue_player_id ? "Blue" : "Red"} wins!`;
            }

            if (game.bet_amount) {
                const wagerAmount = ethers.utils.parseEther(game.bet_amount.toString());
                const totalPot = wagerAmount.mul(2);
                const houseFee = totalPot.mul(5).div(100);
                const payout = totalPot.sub(houseFee);
                const payoutInTDMT = ethers.utils.formatEther(payout);
                const houseFeeInTDMT = ethers.utils.formatEther(houseFee);

                if (game.winner === "draw" || !game.winner) {
                    const refundPerPlayer = ethers.utils.formatEther(payout.div(2));
                    displayMessage += `\nEach player refunded: ${refundPerPlayer} tDMT (after 5% fee of ${houseFeeInTDMT} tDMT)`;
                } else if (game.winner !== ethers.constants.AddressZero) {
                    displayMessage += `\nWinner payout: ${payoutInTDMT} tDMT (after 5% fee of ${houseFeeInTDMT} tDMT)`;
                }
            }

            window.updateStatusDisplay(displayMessage);

            if (window.updateGameResult) {
                window.updateGameResult({ winner: کروناresult, player: this.currentAddress, mode: "online" });
            }
            if (window.leaderboardManager) {
                await window.leaderboardManager.loadLeaderboard();
            }

            const chessboard = document.getElementById("chessboard");
            if (chessboard) chessboard.style.pointerEvents = "none";
            await this.updateMultiplayerMenu(null);
        } catch (error) {
            console.error("handleGameEnd error:", error.message);
            window.updateStatusDisplay("Error processing game end");
        }
    }

    handleMultiplayerClick(e) {
        console.log("handleMultiplayerClick called");
        if (!this.isMultiplayerMode || this.isProcessingMove) {
            console.log("Click ignored: not in multiplayer mode or processing move");
            return false;
        }
        if (!this.isMyTurn()) {
            window.updateStatusDisplay("Waiting for opponent");
            return true;
        }

        const piece = e.target.closest(".piece");
        const square = e.target.closest(".highlight");

        if (piece) {
            const row = parseInt(piece.getAttribute("data-row"));
            const col = parseInt(piece.getAttribute("data-col"));
            this.handlePieceClick(row, col, piece);
        } else if (square && this.selectedPiece) {
            const row = parseInt(square.getAttribute("data-row"));
            const col = parseInt(square.getAttribute("data-col"));
            this.handleSquareClick(row, col);
        }
    }

    handlePieceClick(row, col, pieceElement) {
        console.log("handlePieceClick called at row:", row, "col:", col);
        if (!this.isMultiplayerMode || !this.isMyTurn()) {
            console.log("Piece click ignored: not multiplayer or not my turn");
            return;
        }
        const piece = window.board[row][col];
        if (!piece || window.getPieceColor(piece) !== this.playerColor) {
            console.log("Invalid piece or wrong color");
            return;
        }

        if (this.selectedPiece) {
            this.selectedPiece.element.style.opacity = "1";
            window.removeHighlights && window.removeHighlights();
        }

        if (this.selectedPiece?.row === row && this.selectedPiece?.col === col) {
            this.selectedPiece = null;
            return;
        }

        this.selectedPiece = { row, col, element: pieceElement };
        pieceElement.style.opacity = "0.7";
        window.showLegalMoves?.(row, col);
    }

    handleSquareClick(row, col) {
        console.log("handleSquareClick called at row:", row, "col:", col);
        if (!this.selectedPiece || !this.isMyTurn()) {
            console.log("Square click ignored: no selected piece or not my turn");
            return;
        }
        const startRow = this.selectedPiece.row;
        const startCol = this.selectedPiece.col;
        const piece = window.board[startRow][startCol];

        if (this.isPawnPromotion(piece, row)) {
            window.promptPawnPromotion(startRow, startCol, row, col);
        } else {
            this.makeMove(startRow, startCol, row, col);
        }

        this.selectedPiece.element.style.opacity = "1";
        this.selectedPiece = null;
        window.removeHighlights && window.removeHighlights();
    }

    isPawnPromotion(piece, targetRow) {
        const isPromotion = piece.toLowerCase() === "p" &&
            ((this.playerColor === "blue" && targetRow === 0) ||
             (this.playerColor === "red" && targetRow === 7));
        console.log("isPawnPromotion:", isPromotion, "piece:", piece, "targetRow:", targetRow);
        return isPromotion;
    }

    async handleMove({ startRow, startCol, endRow, endCol, promotionPiece }) {
        console.log("handleMove called with:", { startRow, startCol, endRow, endCol, promotionPiece });
        return await this.makeMove(startRow, startCol, endRow, endCol, promotionPiece);
    }

    async makeMove(startRow, startCol, endRow, endCol, promotionPiece) {
        console.log(`makeMove: [${startRow},${startCol}] to [${endRow},${endCol}]`);
        if (this.isProcessingMove) {
            console.log("Move blocked: already processing");
            return false;
        }
        this.isProcessingMove = true;
        try {
            if (!this.currentAddress) throw new Error("No wallet connected");
            if (!this.gameId || !this.currentGameState) throw new Error("No active game");
            if (this.currentGameState.current_player?.toLowerCase() !== this.playerColor) {
                throw new Error("Not your turn");
            }

            if (startRow < 0 || startRow > 7 || startCol < 0 || startCol > 7 ||
                endRow < 0 || endRow > 7 || endCol < 0 || endCol > 7) {
                throw new Error("Invalid coordinates");
            }

            const piece = window.board[startRow][startCol];
            if (!piece || window.getPieceColor(piece) !== this.playerColor) {
                throw new Error("Invalid piece");
            }
            if (!window.canPieceMove(piece, startCol, startRow, endRow, endCol, true, this.playerColor)) {
                throw new Error("Illegal move");
            }

            const newBoard = JSON.parse(JSON.stringify(window.board));
            const newPieceState = JSON.parse(JSON.stringify(window.pieceState || {
                redKingMoved: false,
                redRooksMove: { left: false, right: false },
                blueKingMoved: false,
                blueRooksMove: { left: false, right: false },
                lastPawnDoubleMove: null
            }));
            const capturedPiece = newBoard[endRow][endCol];
            newBoard[endRow][endCol] = promotionPiece || piece;
            newBoard[startRow][startCol] = null;

            if (piece.toLowerCase() === 'k') {
                newPieceState[this.playerColor + 'KingMoved'] = true;
            }
            if (piece.toLowerCase() === 'r') {
                if (startCol === 0) newPieceState[this.playerColor + 'RooksMove'].left = true;
                if (startCol === 7) newPieceState[this.playerColor + 'RooksMove'].right = true;
            }
            if (piece.toLowerCase() === 'p' && Math.abs(startRow - endRow) === 2) {
                newPieceState.lastPawnDoubleMove = { row: endRow, col: endCol };
            } else {
                newPieceState.lastPawnDoubleMove = null;
            }

            if (piece.toLowerCase() === 'k' && Math.abs(endCol - startCol) === 2) {
                const row = this.playerColor === 'blue' ? 7 : 0;
                if (endCol === 6) {
                    newBoard[row][5] = newBoard[row][7];
                    newBoard[row][7] = null;
                } else if (endCol === 2) {
                    newBoard[row][3] = newBoard[row][0];
                    newBoard[row][0] = null;
                }
            }
            if (piece.toLowerCase() === 'p' && endCol !== startCol && !capturedPiece &&
                newPieceState.lastPawnDoubleMove?.row === endRow && newPieceState.lastPawnDoubleMove?.col === endCol) {
                const pawnDirection = this.playerColor === 'blue' ? 1 : -1;
                newBoard[endRow + pawnDirection][endCol] = null;
            }

            const newCurrentPlayer = this.playerColor === 'blue' ? 'red' : 'blue';
            const move = {
                piece,
                from_row: startRow,
                from_col: startCol,
                end_row: endRow,
                end_col: endCol,
                promotion: promotionPiece,
                captured_piece: capturedPiece
            };

            const { error: rpcError } = await this.supabase.rpc('set_current_player', { player_address: this.currentAddress });
            if (rpcError) throw new Error(`set_current_player failed: ${rpcError.message}`);

            const { data, error: updateError } = await this.supabase
                .from('chess_games')
                .update({
                    board: { positions: newBoard, piece_state: newPieceState },
                    current_player: newCurrentPlayer,
                    last_move: move,
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', this.gameId)
                .select('current_player');
            if (updateError) throw new Error(`Supabase update failed: ${updateError.message}`);

            window.board = newBoard;
            window.pieceState = newPieceState;
            window.currentPlayer = newCurrentPlayer;
            window.placePieces();
            this.currentGameState = {
                ...this.currentGameState,
                board: { positions: newBoard, piece_state: newPieceState },
                current_player: newCurrentPlayer,
                last_move: move
            };
            this.updateBoardInteractivity();

            window.updateMoveLog(move);

            if (window.isCheckmate && window.isCheckmate(newCurrentPlayer)) {
                const winnerAddress = this.playerColor === 'blue' ? this.currentGameState.blue_player_id : this.currentGameState.red_player_id;
                await this.endGame(this.gameId, winnerAddress);
            } else if (window.isStalemate && window.isStalemate(newCurrentPlayer)) {
                await this.endGame(this.gameId, ethers.constants.AddressZero);
            } else if (window.isKingInCheck && window.isKingInCheck(newCurrentPlayer)) {
                window.updateStatusDisplay(`Check: ${this.isMyTurn() ? 'Your turn' : 'Opponent'}`);
            } else {
                window.updateStatusDisplay(this.isMyTurn() ? 'Your turn' : 'Opponent');
            }

            return true;
        } catch (error) {
            console.error(`makeMove error for ${this.gameId}:`, error.message);
            window.updateStatusDisplay(`Move failed: ${error.message}`);
            return false;
        } finally {
            this.isProcessingMove = false;
        }
    }

    async forceMultiplayerSync() {
        console.log("forceMultiplayerSync called");
        try {
            if (!this.currentAddress) {
                console.log("No wallet connected, attempting to initialize");
                await this.initWeb3();
            }
            if (this.currentAddress) {
                console.log("Attempting to resync game state");
                await this.checkPlayerGameState();
            } else {
                console.error("Failed to connect wallet for resync");
                window.updateStatusDisplay("Please connect wallet to resync");
            }
        } catch (error) {
            console.error("forceMultiplayerSync failed:", error.message);
            window.updateStatusDisplay("Resync failed: " + error.message);
        }
    }
}

function initializeMultiplayerManager() {
    console.log("initializeMultiplayerManager called");
    if (isInitializingMultiplayer) {
        console.log("Multiplayer initialization already in progress");
        return;
    }
    isInitializingMultiplayer = true;
    const initManager = () => {
        console.log("initManager called, gameDatabase:", !!window.gameDatabase);
        if (!window.gameDatabase) {
            console.log("Waiting for supabaseReadyEvent");
            document.addEventListener("supabaseReadyEvent", initManager, { once: true });
            return;
        }
        if (!window.multiplayerManager) {
            console.log("Creating new MultiplayerManager");
            window.multiplayerManager = new MultiplayerManager();
            window.multiplayerManager.setupRealtimeSubscription();
            window.multiplayerManager.startGameExpiryCheck();
            if (window.multiplayerManager && localStorage.getItem("currentPlayer")) {
                console.log("Checking player game state on startup");
                window.multiplayerManager.checkPlayerGameState();
            }
        }
        isInitializingMultiplayer = false;
        console.log("MultiplayerManager initialization complete");
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        console.log("Document ready, initializing manager");
        initManager();
    } else {
        console.log("Document not ready, waiting for DOMContentLoaded");
        document.addEventListener("DOMContentLoaded", initManager, { once: true });
    }
}

window.initializeMultiplayerGame = initializeMultiplayerManager;
initializeMultiplayerManager();

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded, checking supabase");
    if (window.gameDatabase) {
        console.log("Supabase ready, dispatching supabaseReady");
        document.dispatchEvent(new CustomEvent("supabaseReady"));
    }
}, { once: true });