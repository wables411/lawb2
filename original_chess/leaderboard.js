// Part 1: Core Setup and Constants
let leaderboardManagerInstance = null;

const WALLET_CONNECT_TIMEOUT = 30000;
const SANKO_TESTNET_CHAIN_ID = '0x7c8';
const SANKO_TESTNET_CONFIG = {
    chainId: SANKO_TESTNET_CHAIN_ID,
    chainName: 'Sanko Testnet',
    nativeCurrency: { name: 'tDMT', symbol: 'tDMT', decimals: 18 },
    rpcUrls: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'],
    blockExplorerUrls: ['https://explorer.testnet.sanko.xyz']
};

function isValidEVMAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// Part 2: LeaderboardManager Class
class LeaderboardManager {
    constructor() {
        console.log('Initializing LeaderboardManager...');
        if (leaderboardManagerInstance) {
            console.log('Returning existing LeaderboardManager instance');
            return leaderboardManagerInstance;
        }
        leaderboardManagerInstance = this;

        this.leaderboardData = [];
        this.subscription = null;

        if (!window.gameDatabase) {
            console.error('Error: gameDatabase not initialized');
            return;
        }

        this.loadLeaderboard();
        this.setupRealtimeSubscription();
        console.log('LeaderboardManager initialization complete');
    }

    setupRealtimeSubscription() {
        try {
            console.log('Setting up realtime subscription...');
            this.subscription = window.gameDatabase.channel('leaderboard-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, (payload) => {
                    console.log('Received leaderboard update:', payload);
                    this.loadLeaderboard();
                })
                .subscribe();
            console.log('Realtime subscription setup complete');
        } catch (error) {
            console.error('Error setting up subscription:', error);
        }
    }

    async loadLeaderboard() {
        try {
            console.log('Loading leaderboard data...');
            const { data, error } = await window.gameDatabase
                .from('leaderboard')
                .select('*')
                .order('points', { ascending: false });

            if (error) throw error;

            console.log('Leaderboard data loaded:', data);
            this.leaderboardData = data || [];
            await this.displayLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5">Error loading leaderboard: ${error.message}</td></tr>`;
            }
        }
    }

    async displayLeaderboard() {
        try {
            console.log('Displaying leaderboard...');
            const tbody = document.getElementById('leaderboard-body');
            if (!tbody) throw new Error('Leaderboard tbody element not found');
            if (!this.leaderboardData) throw new Error('No leaderboard data available');

            console.log('Generating leaderboard HTML for', this.leaderboardData.length, 'entries');
            tbody.innerHTML = this.leaderboardData.map((player, index) => {
                const username = this.formatAddress(player.username);
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>[DMT] ${username}</td>
                        <td>${player.points}</td>
                        <td>${player.wins}/${player.losses}/${player.draws}</td>
                        <td>${player.total_games}</td>
                    </tr>
                `;
            }).join('');
            console.log('Leaderboard displayed successfully');
        } catch (error) {
            console.error('Error displaying leaderboard:', error);
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5">Error displaying leaderboard: ${error.message}</td></tr>`;
            }
        }
    }

    async updateScore(walletAddress, gameResult, difficulty) {
        if (!walletAddress) {
            console.error('No wallet address provided');
            return;
        }

        try {
            console.log('Updating score for:', { walletAddress, gameResult, difficulty });

            const { data: existingRecord } = await window.gameDatabase
                .from('leaderboard')
                .select('*')
                .eq('username', walletAddress)
                .maybeSingle();

            console.log('Existing record:', existingRecord);

            const wins = (existingRecord?.wins || 0) + (gameResult === 'win' ? 1 : 0);
            const losses = (existingRecord?.losses || 0) + (gameResult === 'loss' ? 1 : 0);
            const draws = (existingRecord?.draws || 0) + (gameResult === 'draw' ? 1 : 0);
            const total_games = wins + losses + draws;
            const pointsToAdd = gameResult === 'win' ? (difficulty === 'hard' ? 5 : 3) : 
                               gameResult === 'draw' ? 1 : 0;
            const points = (existingRecord?.points || 0) + pointsToAdd;

            const record = {
                username: walletAddress,
                chain_type: 'evm',
                wins,
                losses,
                draws,
                total_games,
                points,
                updated_at: new Date().toISOString()
            };

            console.log('Upserting record:', record);

            const { error: upsertError } = await window.gameDatabase
                .from('leaderboard')
                .upsert(record, { onConflict: 'username' });

            if (upsertError) throw upsertError;

            console.log('Successfully updated leaderboard');
            await this.loadLeaderboard();
        } catch (error) {
            console.error('Error updating score:', error);
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
}

// Part 3: WalletConnector Class
class WalletConnector {
    constructor() {
        console.log('Initializing WalletConnector...');
        this.evmProvider = this.selectEVMProvider();
        this.address = null;
        this.network = null;
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    selectEVMProvider() {
        if (!window.ethereum) return null;
        if (window.ethereum.isMetaMask) return window.ethereum;
        if (window.ethereum.providers) {
            const metaMask = window.ethereum.providers.find(p => p.isMetaMask);
            if (metaMask) return metaMask;
            return window.ethereum.providers[0] || window.ethereum;
        }
        return window.ethereum;
    }

    async connectWallet(walletType) {
        console.log(`Attempting to connect ${walletType} wallet...`);
        try {
            if (walletType !== 'sanko-testnet') {
                throw new Error('Only Sanko Testnet is supported');
            }
            return await this.connectEVMWallet(true);
        } catch (error) {
            console.error(`Error connecting ${walletType} wallet:`, error);
            alert(`Failed to connect ${walletType} wallet: ${error.message}`);
            throw error;
        }
    }

    async connectEVMWallet(isTestnet = true) {
        try {
            if (!window.ethereum) throw new Error("No EVM wallet detected. Please install MetaMask.");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            console.log(`Current chainId: ${chainId}, Target chainId: ${SANKO_TESTNET_CHAIN_ID}`);

            if (chainId !== SANKO_TESTNET_CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: SANKO_TESTNET_CHAIN_ID }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [SANKO_TESTNET_CONFIG],
                        });
                    } else {
                        throw new Error('Please switch to Sanko Testnet.');
                    }
                }
            }

            console.log(`Authenticating wallet: ${address}`);

            const { error: rpcError } = await window.gameDatabase.rpc('set_current_player', {
                player_address: address
            });
            if (rpcError) {
                throw new Error(`Failed to authenticate wallet: ${rpcError.message}`);
            }

            this.address = address;
            this.network = 'evm';
            localStorage.setItem('currentPlayer', address);
            localStorage.setItem('walletType', 'sanko-testnet');
            localStorage.setItem('chainType', 'evm');
            this.updateWalletUI(address, 'sanko-testnet');
            this.emit('walletConnected', { address, network: 'evm', walletType: 'sanko-testnet' });
            console.log(`EVM wallet connected successfully (Testnet): ${address}`);
            return address;
        } catch (error) {
            console.error("Wallet connection failed:", error.message);
            this.emit('error', error);
            throw error;
        }
    }

    setupEVMEventListeners() {
        if (!this.evmProvider) return;
        this.evmProvider.on('accountsChanged', (accounts) => {
            console.log('EVM accounts changed:', accounts);
            if (accounts.length === 0) {
                this.disconnectWallet();
            } else {
                this.address = accounts[0];
                localStorage.setItem('currentPlayer', this.address);
                this.updateWalletUI(this.address, 'sanko-testnet');
                this.emit('walletConnected', { address: this.address, network: 'evm', walletType: 'sanko-testnet' });
            }
        });
        this.evmProvider.on('chainChanged', (chainId) => {
            console.log('EVM chain changed:', chainId);
            if (chainId !== SANKO_TESTNET_CHAIN_ID) {
                this.disconnectWallet();
                alert('Please switch to Sanko Testnet');
            } else {
                this.address = localStorage.getItem('currentPlayer');
                this.updateWalletUI(this.address, 'sanko-testnet');
                this.emit('walletConnected', { address: this.address, network: 'evm', walletType: 'sanko-testnet' });
            }
        });
    }

    updateWalletUI(walletAddress, walletType) {
        console.log('Updating wallet UI:', { walletAddress, walletType });
        const walletButtons = document.querySelectorAll('.wallet-btn');
        walletButtons.forEach(btn => btn.style.cssText = 'display: none !important;');
        const addressDisplay = document.getElementById('walletAddress');
        if (addressDisplay) {
            addressDisplay.style.cssText = 'display: block !important;';
            addressDisplay.textContent = `Connected [DMT]: ${this.formatAddress(walletAddress)}`;
        } else {
            console.warn('walletAddress element not found');
        }
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) difficultyScreen.style.cssText = 'display: flex !important;';
        const statusElement = document.getElementById('status');
        if (statusElement) statusElement.textContent = 'Select difficulty to play';
    }

    disconnectWallet() {
        console.log('Disconnecting wallet...');
        this.address = null;
        this.network = null;
        localStorage.removeItem('currentPlayer');
        localStorage.removeItem('walletType');
        localStorage.removeItem('chainType');
        const walletButtons = document.querySelectorAll('.wallet-btn');
        walletButtons.forEach(btn => btn.style.cssText = 'display: block !important;');
        const addressDisplay = document.getElementById('walletAddress');
        if (addressDisplay) addressDisplay.style.cssText = 'display: none !important;';
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) difficultyScreen.style.cssText = 'display: none !important;';
        const statusElement = document.getElementById('status');
        if (statusElement) statusElement.textContent = 'Connect to play';
        this.emit('walletDisconnected', {});
        console.log('Wallet disconnected successfully');
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    async reconnectWallet() {
        const savedWalletType = localStorage.getItem('walletType');
        const savedAddress = localStorage.getItem('currentPlayer');
        if (!savedWalletType || !savedAddress || savedWalletType !== 'sanko-testnet') return false;

        console.log('Attempting to reconnect wallet:', { savedWalletType, savedAddress });

        try {
            if (!this.evmProvider) return false;
            const accounts = await this.evmProvider.request({ method: 'eth_accounts' });
            const chainId = await this.evmProvider.request({ method: 'eth_chainId' });
            if (accounts.length > 0 && 
                accounts[0].toLowerCase() === savedAddress.toLowerCase() && 
                chainId === SANKO_TESTNET_CHAIN_ID) {
                this.address = accounts[0];
                this.network = 'evm';
                this.updateWalletUI(this.address, savedWalletType);
                this.setupEVMEventListeners();
                this.emit('walletConnected', { address: this.address, network: 'evm', walletType: savedWalletType });
                return true;
            }
        } catch (error) {
            console.error('Error reconnecting wallet:', error);
            this.disconnectWallet();
        }
        return false;
    }
}

// Part 4: Initialization and Setup
let walletConnector = null;

function initializeWalletUI() {
    console.log('Starting wallet UI initialization...');
    function attemptInitialization(attempt = 1) {
        console.log(`Wallet initialization attempt ${attempt}, document.readyState:`, document.readyState);
        const walletConnection = document.querySelector('.wallet-connection');
        if (!walletConnection) {
            if (attempt < 10) {
                setTimeout(() => attemptInitialization(attempt + 1), 1000);
                return;
            }
            console.error('Failed to find wallet connection after 10 attempts');
            return;
        }

        console.log('Found wallet connection div, creating buttons...');
        if (!walletConnector) {
            walletConnector = new WalletConnector();
            window.walletConnector = walletConnector;
        }

        const walletButtons = document.createElement('div');
        walletButtons.className = 'wallet-buttons';
        walletButtons.style.cssText = `
            display: flex !important;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
            opacity: 1 !important;
            visibility: visible !important;
        `;

        const wallets = [
            { name: 'Sanko Testnet', type: 'sanko-testnet', color: '#8BC34A' }
        ];

        wallets.forEach(wallet => {
            const button = document.createElement('button');
            button.className = 'wallet-btn';
            button.innerHTML = `Connect ${wallet.name}`;
            button.style.cssText = `
                display: block !important;
                padding: 10px 20px;
                margin: 5px;
                border-radius: 5px;
                cursor: pointer;
                font-family: Impact, sans-serif;
                border: none;
                color: white;
                min-width: 180px;
                background: linear-gradient(45deg, ${wallet.color}, ${adjustColor(wallet.color, 20)});
                opacity: 1 !important;
                visibility: visible !important;
                z-index: 1000;
                position: relative;
            `;
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await walletConnector.connectWallet(wallet.type);
                } catch (error) {
                    console.error(`Failed to connect ${wallet.name}:`, error);
                }
            });
            walletButtons.appendChild(button);
            console.log(`Created button for ${wallet.name}`);
        });

        const addressDisplay = document.createElement('div');
        addressDisplay.id = 'walletAddress';
        addressDisplay.className = 'wallet-address';
        addressDisplay.style.cssText = 'display: none !important;';

        walletConnection.innerHTML = '';
        walletConnection.style.cssText = 'display: block !important;';
        walletConnection.appendChild(walletButtons);
        walletConnection.appendChild(addressDisplay);

        console.log('Wallet UI initialization complete');
        walletConnector.reconnectWallet();
    }
    attemptInitialization();
}

window.updateGameResult = async function(result) {
    let currentPlayer = localStorage.getItem('currentPlayer') || result.player;
    if (!currentPlayer) {
        console.warn('No wallet address found for game result update');
        return;
    }
    if (!leaderboardManagerInstance) {
        console.error('LeaderboardManager instance not found for game result update');
        return;
    }
    if (!window.gameDatabase) {
        console.error('Supabase client (gameDatabase) not initialized');
        return;
    }

    const { winner, mode, difficulty } = result;
    console.log(`Game ended. Result:`, { winner, player: currentPlayer, mode, difficulty });

    let gameResult;
    if (mode === 'ai') {
        gameResult = winner === 'blue' ? 'win' : winner === 'red' ? 'loss' : 'draw';
    } else if (mode === 'online') {
        gameResult = winner;
    } else {
        console.warn('Unknown game mode:', mode);
        return;
    }

    console.log(`Updating score for ${currentPlayer}: ${gameResult}, difficulty: ${difficulty || 'multiplayer'}`);
    await leaderboardManagerInstance.updateScore(currentPlayer, gameResult, difficulty || 'multiplayer');

    console.log('Leaderboard update triggered successfully');
};

function initializeAllComponents() {
    console.log('Initializing all components...');
    if (!window.leaderboardManager) {
        console.log('Creating new LeaderboardManager...');
        window.leaderboardManager = new LeaderboardManager();
    }
    initializeWalletUI();

    const style = document.createElement('style');
    style.textContent = `
        .wallet-connection { display: block !important; opacity: 1 !important; visibility: visible !important; }
        .wallet-buttons { display: flex !important; opacity: 1 !important; visibility: visible !important; }
        .wallet-btn { display: block !important; opacity: 1 !important; visibility: visible !important; }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.gameDatabase) initializeAllComponents();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded, running initialization...');
    if (window.gameDatabase) initializeAllComponents();
}