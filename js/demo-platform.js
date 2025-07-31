// Agricultural Asset Tokenization Demo Platform
// Direct smart contract interactions without MetaMask

class AgriculturalTokenDemo {
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.currentWallet = null;
        this.isConnected = false;
        
        // Contract addresses from deployment
        this.contractAddresses = {
            authority: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            tCHICKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            tEGG: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            tIDR: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
            escrow: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
        };

        // Demo wallets with private keys for direct blockchain interaction
        this.demoWallets = {
            authority: {
                name: 'Central Authority',
                address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                description: 'Platform governance and token minting',
                icon: '👔',
                canMint: true
            },
            farmer_a: {
                name: 'Happy Farm Supplier A',
                address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
                description: 'Large chicken farm - 1000 birds',
                icon: '🚜',
                canMint: false
            },
            farmer_b: {
                name: 'Green Valley Farm B',
                address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
                description: 'Medium egg producer - 500 hens',
                icon: '🚜',
                canMint: false
            },
            farmer_c: {
                name: 'Sunrise Poultry C',
                address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
                privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
                description: 'Small organic farm - 200 birds',
                icon: '🚜',
                canMint: false
            },
            kitchen_a: {
                name: 'Central Kitchen Alpha',
                address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
                privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
                description: 'Restaurant chain procurement',
                icon: '🍳',
                canMint: false
            },
            kitchen_b: {
                name: 'Central Kitchen Beta',
                address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
                privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
                description: 'Hotel chain food service',
                icon: '🍳',
                canMint: false
            },
            verifier: {
                name: 'Independent Auditor',
                address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
                privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
                description: 'Third-party asset verification',
                icon: '🔍',
                canMint: false
            },
            operator: {
                name: 'Platform Operator',
                address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
                privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
                description: 'Day-to-day operations',
                icon: '⚙️',
                canMint: false
            }
        };
    }

    async initialize() {
        console.log('Initializing Agricultural Token Demo...');
        
        try {
            await this.connectToBlockchain();
            await this.setupContracts();
            this.setupUI();
            this.setupEventListeners();
            
            console.log('Demo platform initialized successfully!');
            return true;
        } catch (error) {
            console.error('Failed to initialize demo platform:', error);
            this.showConnectionError(error.message);
            return false;
        }
    }

    async connectToBlockchain() {
        // Test direct connection to Hardhat node
        const response = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Cannot connect to Hardhat node`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`Blockchain RPC Error: ${data.error.message}`);
        }

        // Initialize Web3 with working connection
        this.web3 = new Web3('http://localhost:8545');
        
        // Verify connection
        const blockNumber = await this.web3.eth.getBlockNumber();
        console.log(`Connected to Hardhat network, block: ${blockNumber}`);
        
        this.isConnected = true;
        this.updateConnectionStatus(true);
    }

    async setupContracts() {
        // Simplified ABIs for demo functionality
        const tokenABI = [
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        const authorityABI = [
            {
                "inputs": [
                    {"name": "tokenType", "type": "string"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "recipient", "type": "address"},
                    {"name": "expiryDays", "type": "uint256"}
                ],
                "name": "verifyAndMintTokens",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        // Initialize contract instances
        this.contracts = {
            authority: new this.web3.eth.Contract(authorityABI, this.contractAddresses.authority),
            tCHICKEN: new this.web3.eth.Contract(tokenABI, this.contractAddresses.tCHICKEN),
            tEGG: new this.web3.eth.Contract(tokenABI, this.contractAddresses.tEGG),
            tIDR: new this.web3.eth.Contract(tokenABI, this.contractAddresses.tIDR)
        };

        console.log('Smart contracts initialized successfully');
    }

    setupUI() {
        // Display contract addresses
        document.getElementById('authorityAddress').textContent = this.formatAddress(this.contractAddresses.authority);
        document.getElementById('chickenAddress').textContent = this.formatAddress(this.contractAddresses.tCHICKEN);
        document.getElementById('eggAddress').textContent = this.formatAddress(this.contractAddresses.tEGG);
        document.getElementById('idrAddress').textContent = this.formatAddress(this.contractAddresses.tIDR);

        // Create wallet grid
        this.createWalletGrid();
        
        // Populate recipient dropdowns
        this.populateRecipientDropdowns();
    }

    createWalletGrid() {
        const walletGrid = document.getElementById('walletGrid');
        walletGrid.innerHTML = '';

        Object.entries(this.demoWallets).forEach(([key, wallet]) => {
            const walletCard = document.createElement('div');
            walletCard.className = 'col-lg-3 col-md-4 col-sm-6 mb-3';
            walletCard.innerHTML = `
                <div class="card wallet-card h-100" data-wallet="${key}">
                    <div class="card-body text-center">
                        <div class="display-6 mb-2">${wallet.icon}</div>
                        <h6 class="card-title">${wallet.name}</h6>
                        <p class="card-text small text-muted">${wallet.description}</p>
                        <small class="text-muted">${this.formatAddress(wallet.address)}</small>
                    </div>
                </div>
            `;
            walletGrid.appendChild(walletCard);
        });
    }

    populateRecipientDropdowns() {
        const mintRecipient = document.getElementById('mintRecipient');
        const transferRecipient = document.getElementById('transferRecipient');
        
        Object.entries(this.demoWallets).forEach(([key, wallet]) => {
            const option1 = document.createElement('option');
            option1.value = wallet.address;
            option1.textContent = `${wallet.icon} ${wallet.name}`;
            mintRecipient.appendChild(option1);

            const option2 = option1.cloneNode(true);
            transferRecipient.appendChild(option2);
        });
    }

    setupEventListeners() {
        // Wallet selection
        document.addEventListener('click', (e) => {
            const walletCard = e.target.closest('.wallet-card');
            if (walletCard) {
                const walletKey = walletCard.dataset.wallet;
                this.selectWallet(walletKey);
            }
        });

        // Form submissions
        document.getElementById('mintForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMintTokens();
        });

        document.getElementById('transferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransferTokens();
        });
    }

    async selectWallet(walletKey) {
        const wallet = this.demoWallets[walletKey];
        if (!wallet) return;

        this.currentWallet = { key: walletKey, ...wallet };

        // Update UI
        document.querySelectorAll('.wallet-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-wallet="${walletKey}"]`).classList.add('active');

        // Show wallet info
        document.getElementById('selectedWalletInfo').style.display = 'block';
        document.getElementById('contractInteractions').style.display = 'block';
        
        document.getElementById('currentWalletName').textContent = `${wallet.icon} ${wallet.name}`;
        document.getElementById('currentWalletAddress').textContent = wallet.address;
        document.getElementById('currentWalletDesc').textContent = wallet.description;

        // Show/hide mint form based on permissions
        const mintCard = document.querySelector('#mintForm').closest('.card');
        mintCard.style.display = wallet.canMint ? 'block' : 'none';

        // Load balances
        await this.refreshBalances();

        this.showToast(`Selected wallet: ${wallet.name}`, 'success');
    }

    async refreshBalances() {
        if (!this.currentWallet || !this.isConnected) return;

        try {
            const chickenBalance = await this.contracts.tCHICKEN.methods.balanceOf(this.currentWallet.address).call();
            const eggBalance = await this.contracts.tEGG.methods.balanceOf(this.currentWallet.address).call();
            const idrBalance = await this.contracts.tIDR.methods.balanceOf(this.currentWallet.address).call();

            document.getElementById('chickenBalance').textContent = this.web3.utils.fromWei(chickenBalance, 'ether');
            document.getElementById('eggBalance').textContent = this.web3.utils.fromWei(eggBalance, 'ether');
            document.getElementById('idrBalance').textContent = this.formatNumber(this.web3.utils.fromWei(idrBalance, 'ether'));

        } catch (error) {
            console.error('Failed to refresh balances:', error);
        }
    }

    async handleMintTokens() {
        if (!this.currentWallet || !this.currentWallet.canMint) {
            this.showToast('Only Central Authority can mint tokens', 'error');
            return;
        }

        const tokenType = document.getElementById('mintTokenType').value;
        const amount = document.getElementById('mintAmount').value;
        const recipient = document.getElementById('mintRecipient').value;

        if (!tokenType || !amount || !recipient) {
            this.showToast('Please fill all fields', 'error');
            return;
        }

        try {
            this.showLoading('Minting tokens...');

            const expiryDays = tokenType === 'tCHICKEN' ? 30 : tokenType === 'tEGG' ? 14 : 90;
            const amountWei = this.web3.utils.toWei(amount, 'ether');

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            const tx = this.contracts.authority.methods.verifyAndMintTokens(
                tokenType, amountWei, recipient, expiryDays
            );

            const gas = await tx.estimateGas({ from: account.address });
            const gasPrice = await this.web3.eth.getGasPrice();

            const receipt = await tx.send({
                from: account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            this.hideLoading();
            this.showToast(`Successfully minted ${amount} ${tokenType} tokens!`, 'success');
            
            // Reset form and refresh balances
            document.getElementById('mintForm').reset();
            await this.refreshBalances();

        } catch (error) {
            this.hideLoading();
            console.error('Mint failed:', error);
            this.showToast(`Failed to mint tokens: ${error.message}`, 'error');
        }
    }

    async handleTransferTokens() {
        if (!this.currentWallet) {
            this.showToast('Please select a wallet first', 'error');
            return;
        }

        const tokenType = document.getElementById('transferTokenType').value;
        const amount = document.getElementById('transferAmount').value;
        const recipient = document.getElementById('transferRecipient').value;

        if (!tokenType || !amount || !recipient) {
            this.showToast('Please fill all fields', 'error');
            return;
        }

        if (recipient === this.currentWallet.address) {
            this.showToast('Cannot transfer to yourself', 'error');
            return;
        }

        try {
            this.showLoading('Transferring tokens...');

            const contract = this.contracts[tokenType];
            const amountWei = this.web3.utils.toWei(amount, 'ether');

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            const tx = contract.methods.transfer(recipient, amountWei);

            const gas = await tx.estimateGas({ from: account.address });
            const gasPrice = await this.web3.eth.getGasPrice();

            const receipt = await tx.send({
                from: account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            this.hideLoading();
            this.showToast(`Successfully transferred ${amount} ${tokenType} tokens!`, 'success');
            
            // Reset form and refresh balances
            document.getElementById('transferForm').reset();
            await this.refreshBalances();

        } catch (error) {
            this.hideLoading();
            console.error('Transfer failed:', error);
            this.showToast(`Failed to transfer tokens: ${error.message}`, 'error');
        }
    }

    updateConnectionStatus(connected) {
        const alert = document.getElementById('connectionAlert');
        if (connected) {
            alert.className = 'alert alert-success';
            alert.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                <strong>Connected to Hardhat Network</strong>
                <br><small>Ready for smart contract interactions</small>
            `;
        } else {
            alert.className = 'alert alert-danger';
            alert.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Connection Failed</strong>
                <br><small>Cannot connect to blockchain at localhost:8545</small>
            `;
        }
    }

    showConnectionError(message) {
        const alert = document.getElementById('connectionAlert');
        alert.className = 'alert alert-danger';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Connection Error</strong>
            <br><small>${message}</small>
            <button class="btn btn-sm btn-outline-danger ms-3" onclick="location.reload()">
                Retry Connection
            </button>
        `;
    }

    showLoading(message) {
        document.getElementById('loadingText').textContent = message;
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }

    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) modal.hide();
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        const bootstrapToast = new bootstrap.Toast(toast);
        bootstrapToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatNumber(num) {
        return parseFloat(num).toLocaleString();
    }
}

// Initialize the demo platform
const demoApp = new AgriculturalTokenDemo();

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    demoApp.initialize();
});