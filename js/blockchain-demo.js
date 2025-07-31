// Agricultural Asset Tokenization Demo Platform
// Direct blockchain integration with demo wallet system

class BlockchainDemo {
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.currentWallet = null;
        this.isConnected = false;
        
        // Contract addresses from latest deployment
        this.contractAddresses = {
            authority: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            tCHICKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            tEGG: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            tIDR: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
            escrow: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
        };

        // Demo wallets with reset balances (0 for fresh demos)
        this.demoWallets = {
            authority: {
                name: 'Central Authority',
                address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                description: 'Platform governance and token minting',
                icon: '👔',
                canMint: true,
                type: 'authority'
            },
            farmer_a: {
                name: 'Happy Farm Supplier A',
                address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
                description: 'Large chicken farm - 1000 birds capacity',
                icon: '🚜',
                canMint: false,
                type: 'farmer'
            },
            farmer_b: {
                name: 'Green Valley Farm B',
                address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
                description: 'Medium egg producer - 500 hens',
                icon: '🚜',
                canMint: false,
                type: 'farmer'
            },
            farmer_c: {
                name: 'Sunrise Poultry C',
                address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
                privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
                description: 'Small organic farm - 200 birds',
                icon: '🚜',
                canMint: false,
                type: 'farmer'
            },
            kitchen_a: {
                name: 'Central Kitchen Alpha',
                address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
                privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
                description: 'Restaurant chain procurement',
                icon: '🍳',
                canMint: false,
                type: 'kitchen'
            },
            kitchen_b: {
                name: 'Central Kitchen Beta',
                address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
                privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
                description: 'Hotel chain food service',
                icon: '🍳',
                canMint: false,
                type: 'kitchen'
            },
            verifier: {
                name: 'Independent Auditor',
                address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
                privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
                description: 'Third-party asset verification',
                icon: '🔍',
                canMint: false,
                type: 'authority'
            },
            operator: {
                name: 'Platform Operator',
                address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
                privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
                description: 'Day-to-day operations',
                icon: '⚙️',
                canMint: false,
                type: 'authority'
            }
        };
    }

    async initialize() {
        console.log('Initializing Blockchain Demo Platform...');
        
        try {
            this.setupUI();
            this.setupEventHandlers();
            
            // Try to connect to blockchain
            await this.connectToBlockchain();
            
            console.log('Demo platform ready!');
            return true;
        } catch (error) {
            console.error('Failed to initialize demo platform:', error);
            this.updateConnectionStatus(false, error.message);
            return false;
        }
    }

    async connectToBlockchain() {
        try {
            // Test blockchain connection
            const response = await fetch('http://localhost:8545', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'net_version',
                    params: [],
                    id: 1
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Cannot reach Hardhat node`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(`RPC Error: ${data.error.message}`);
            }

            // Initialize Web3
            this.web3 = new Web3('http://localhost:8545');
            
            // Verify connection
            const networkId = await this.web3.eth.net.getId();
            console.log(`Connected to network: ${networkId}`);
            
            // Setup contracts
            await this.setupContracts();
            
            this.isConnected = true;
            this.updateConnectionStatus(true);
            
            return true;
        } catch (error) {
            console.error('Blockchain connection failed:', error);
            throw error;
        }
    }

    async setupContracts() {
        // Token ABI for balance and transfer operations
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

        // Authority ABI for minting
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
    }

    setupUI() {
        // Create wallet grid
        this.createWalletGrid();
        
        // Populate dropdowns
        this.populateDropdowns();
        
        // Display contract addresses
        this.displayContractInfo();
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
                        <div class="text-muted small">${this.formatAddress(wallet.address)}</div>
                    </div>
                </div>
            `;
            walletGrid.appendChild(walletCard);
        });
    }

    populateDropdowns() {
        const mintRecipient = document.getElementById('mintRecipient');
        const transferRecipient = document.getElementById('transferRecipient');
        const purchaseSupplier = document.getElementById('purchaseSupplier');
        
        // Clear existing options
        [mintRecipient, transferRecipient, purchaseSupplier].forEach(select => {
            select.innerHTML = '<option value="">Select...</option>';
        });

        Object.entries(this.demoWallets).forEach(([key, wallet]) => {
            // Mint recipients - all wallets
            const mintOption = document.createElement('option');
            mintOption.value = wallet.address;
            mintOption.textContent = `${wallet.icon} ${wallet.name}`;
            mintRecipient.appendChild(mintOption);

            // Transfer recipients - all wallets
            const transferOption = mintOption.cloneNode(true);
            transferRecipient.appendChild(transferOption);

            // Purchase suppliers - only farmers
            if (wallet.type === 'farmer') {
                const supplierOption = mintOption.cloneNode(true);
                purchaseSupplier.appendChild(supplierOption);
            }
        });
    }

    displayContractInfo() {
        document.getElementById('authorityAddress').textContent = this.formatAddress(this.contractAddresses.authority);
        document.getElementById('tokenAddresses').innerHTML = `
            tCHICKEN: ${this.formatAddress(this.contractAddresses.tCHICKEN)}<br>
            tEGG: ${this.formatAddress(this.contractAddresses.tEGG)}<br>
            tIDR: ${this.formatAddress(this.contractAddresses.tIDR)}
        `;
    }

    setupEventHandlers() {
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

        document.getElementById('purchaseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePurchaseTokens();
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
        document.getElementById('currentWalletName').textContent = `${wallet.icon} ${wallet.name}`;
        document.getElementById('currentWalletAddress').textContent = wallet.address;
        document.getElementById('currentWalletDesc').textContent = wallet.description;

        // Show relevant sections
        this.showRelevantSections(wallet.type);

        // Load balances if connected
        if (this.isConnected) {
            await this.refreshBalances();
        } else {
            // Reset to 0 for demo
            this.resetBalanceDisplays();
        }

        this.showToast(`Selected wallet: ${wallet.name}`, 'success');
    }

    showRelevantSections(type) {
        // Hide all sections first
        ['authority', 'farmer', 'kitchen'].forEach(section => {
            document.getElementById(section).style.display = 'none';
        });

        // Show relevant section
        if (type === 'authority') {
            document.getElementById('authority').style.display = 'block';
        } else if (type === 'farmer') {
            document.getElementById('farmer').style.display = 'block';
        } else if (type === 'kitchen') {
            document.getElementById('kitchen').style.display = 'block';
        }
    }

    async refreshBalances() {
        if (!this.currentWallet || !this.isConnected) return;

        try {
            const chickenBalance = await this.contracts.tCHICKEN.methods.balanceOf(this.currentWallet.address).call();
            const eggBalance = await this.contracts.tEGG.methods.balanceOf(this.currentWallet.address).call();
            const idrBalance = await this.contracts.tIDR.methods.balanceOf(this.currentWallet.address).call();

            const chicken = this.web3.utils.fromWei(chickenBalance, 'ether');
            const egg = this.web3.utils.fromWei(eggBalance, 'ether');
            const idr = this.web3.utils.fromWei(idrBalance, 'ether');

            this.updateBalanceDisplays(chicken, egg, idr);

        } catch (error) {
            console.error('Failed to refresh balances:', error);
            this.resetBalanceDisplays();
        }
    }

    resetBalanceDisplays() {
        this.updateBalanceDisplays('0', '0', '0');
    }

    updateBalanceDisplays(chicken, egg, idr) {
        document.getElementById('chickenBalance').textContent = this.formatNumber(chicken);
        document.getElementById('eggBalance').textContent = this.formatNumber(egg);
        document.getElementById('idrBalance').textContent = this.formatNumber(idr);

        // Update section-specific displays
        document.getElementById('farmerChickenBalance').textContent = this.formatNumber(chicken);
        document.getElementById('farmerEggBalance').textContent = this.formatNumber(egg);
        document.getElementById('kitchenBudget').textContent = this.formatNumber(parseFloat(idr) / 1000000) + 'M';
    }

    async handleMintTokens() {
        if (!this.currentWallet || !this.currentWallet.canMint) {
            this.showToast('Only Central Authority can mint tokens', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showToast('Please connect to blockchain first', 'error');
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
            this.showSuccess(`Successfully minted ${amount} ${tokenType} tokens!`, receipt.transactionHash);
            
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

        if (!this.isConnected) {
            this.showToast('Please connect to blockchain first', 'error');
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
            this.showSuccess(`Successfully transferred ${amount} ${tokenType}!`, receipt.transactionHash);
            
            // Reset form and refresh balances
            document.getElementById('transferForm').reset();
            await this.refreshBalances();

        } catch (error) {
            this.hideLoading();
            console.error('Transfer failed:', error);
            this.showToast(`Failed to transfer tokens: ${error.message}`, 'error');
        }
    }

    async handlePurchaseTokens() {
        // This would handle purchase via escrow - simplified for demo
        this.showToast('Purchase functionality coming soon - use transfer for now', 'info');
    }

    updateConnectionStatus(connected, errorMsg = '') {
        const status = document.getElementById('connectionStatus');
        if (connected) {
            status.className = 'demo-connection';
            status.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            status.innerHTML = `
                <div class="row align-items-center">
                    <div class="col-auto">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="col">
                        <strong>Connected to Hardhat Network</strong>
                        <br><small>Ready for smart contract interactions</small>
                    </div>
                </div>
            `;
        } else {
            status.className = 'demo-connection';
            status.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            status.innerHTML = `
                <div class="row align-items-center">
                    <div class="col-auto">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="col">
                        <strong>Connection Failed</strong>
                        <br><small>${errorMsg || 'Cannot connect to blockchain at localhost:8545'}</small>
                    </div>
                    <div class="col-auto">
                        <button class="btn btn-light btn-sm" onclick="location.reload()">Retry</button>
                    </div>
                </div>
            `;
        }
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

    showSuccess(message, txHash) {
        document.getElementById('successMessage').textContent = message;
        document.getElementById('txHashLink').href = `#tx-${txHash}`;
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} border-0`;
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

// Global functions
async function connectToBlockchain() {
    if (window.demoApp) {
        await window.demoApp.connectToBlockchain();
    }
}

// Initialize the demo platform
window.demoApp = new BlockchainDemo();

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.demoApp.initialize();
});