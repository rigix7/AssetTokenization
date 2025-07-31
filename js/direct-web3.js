// Direct Web3 connection without MetaMask requirement
// Similar to Remix IDE's approach for local development

class DirectWeb3Manager {
    constructor() {
        this.web3 = null;
        this.currentWallet = null;
        this.contracts = {};
        this.demoWallets = this.initializeDemoWallets();
        this.isConnected = false;
    }

    initializeDemoWallets() {
        return {
            'authority': {
                name: 'Central Authority',
                address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                description: 'Platform governance and token minting',
                icon: '👔',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '0' }
            },
            'farmer_a': {
                name: 'Happy Farm Supplier A',
                address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
                description: 'Large chicken farm - 1000 birds',
                icon: '🚜',
                balances: { tCHICKEN: '1000', tEGG: '5000', tIDR: '9900000' }
            },
            'farmer_b': {
                name: 'Green Valley Farm B',
                address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
                description: 'Medium egg producer - 500 hens',
                icon: '🚜',
                balances: { tCHICKEN: '600', tEGG: '3000', tIDR: '0' }
            },
            'farmer_c': {
                name: 'Sunrise Poultry C',
                address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
                privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
                description: 'Small organic farm - 200 birds',
                icon: '🚜',
                balances: { tCHICKEN: '100', tEGG: '1000', tIDR: '0' }
            },
            'kitchen_a': {
                name: 'Central Kitchen Alpha',
                address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
                privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
                description: 'Restaurant chain procurement',
                icon: '🍳',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '800000000' }
            },
            'kitchen_b': {
                name: 'Central Kitchen Beta',
                address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
                privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
                description: 'Hotel chain food service',
                icon: '🍳',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '500000000' }
            },
            'verifier': {
                name: 'Independent Auditor',
                address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
                privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
                description: 'Third-party asset verification',
                icon: '🔍',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '0' }
            },
            'operator': {
                name: 'Platform Operator',
                address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
                privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
                description: 'Day-to-day operations',
                icon: '⚙️',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '0' }
            }
        };
    }

    async initialize() {
        try {
            // Connect directly to local Hardhat node
            this.web3 = new Web3('http://localhost:8545');
            
            // Test connection
            const blockNumber = await this.web3.eth.getBlockNumber();
            console.log('Connected to local blockchain, block:', blockNumber);
            
            // Setup contract connections
            await this.setupContracts();
            
            // Set default wallet (Authority)
            this.selectWallet('authority');
            
            this.isConnected = true;
            this.updateConnectionUI();
            
            return true;
        } catch (error) {
            console.error('Failed to connect to local blockchain:', error);
            this.showConnectionError();
            return false;
        }
    }

    async setupContracts() {
        // Contract addresses from deployment
        const contractAddresses = {
            authority: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            tCHICKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            tEGG: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            tIDR: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
            escrow: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
        };

        // Simplified contract ABIs for demo functionality
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
            authority: new this.web3.eth.Contract(authorityABI, contractAddresses.authority),
            tCHICKEN: new this.web3.eth.Contract(tokenABI, contractAddresses.tCHICKEN),
            tEGG: new this.web3.eth.Contract(tokenABI, contractAddresses.tEGG),
            tIDR: new this.web3.eth.Contract(tokenABI, contractAddresses.tIDR)
        };
    }

    selectWallet(walletKey) {
        const wallet = this.demoWallets[walletKey];
        if (!wallet) {
            console.error('Wallet not found:', walletKey);
            return false;
        }

        this.currentWallet = {
            key: walletKey,
            ...wallet,
            account: this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey)
        };

        // Update UI
        this.updateCurrentWalletDisplay();
        this.showRelevantSections();
        this.updateBalanceDisplays();

        console.log('Selected wallet:', this.currentWallet.name);
        this.showSuccess(`Switched to ${this.currentWallet.name}`);
        
        return true;
    }

    updateConnectionUI() {
        // Hide connection warning
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.style.display = 'none';
        }

        // Show that we're connected without MetaMask requirement
        const statusElement = document.getElementById('statusText');
        if (statusElement) {
            statusElement.innerHTML = '<i class="fas fa-check-circle me-2"></i>Connected to local blockchain (no MetaMask required)';
            statusElement.parentElement.className = 'alert alert-success';
        }
    }

    updateCurrentWalletDisplay() {
        const elements = {
            currentRole: document.getElementById('currentRole'),
            walletAddress: document.getElementById('walletAddress'),
            selectedWalletInfo: document.getElementById('selectedWalletInfo')
        };

        if (elements.currentRole && this.currentWallet) {
            elements.currentRole.innerHTML = `${this.currentWallet.icon} ${this.currentWallet.name}`;
        }

        if (elements.walletAddress && this.currentWallet) {
            elements.walletAddress.textContent = `${this.currentWallet.address.slice(0, 6)}...${this.currentWallet.address.slice(-4)}`;
        }

        // Update selected wallet info panel
        this.updateWalletInfoPanel();
    }

    updateWalletInfoPanel() {
        let infoPanel = document.getElementById('walletInfoPanel');
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.id = 'walletInfoPanel';
            infoPanel.className = 'alert alert-info mb-3';
            
            const container = document.querySelector('.container.mt-4');
            if (container) {
                container.insertBefore(infoPanel, container.firstChild);
            }
        }

        if (this.currentWallet) {
            infoPanel.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${this.currentWallet.icon} ${this.currentWallet.name}</strong>
                        <br><small class="text-muted">${this.currentWallet.description}</small>
                        <br><code>${this.currentWallet.address}</code>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="directWeb3.showWalletSelector()">
                        Switch Wallet
                    </button>
                </div>
            `;
        }
    }

    showRelevantSections() {
        const sections = ['dashboard', 'farmer', 'kitchen', 'authority'];
        
        // Show dashboard always
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.style.display = 'block';

        // Hide all role-specific sections first
        sections.slice(1).forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show relevant section based on current wallet
        if (this.currentWallet) {
            if (this.currentWallet.key.startsWith('farmer')) {
                const farmerSection = document.getElementById('farmer');
                if (farmerSection) farmerSection.style.display = 'block';
            } else if (this.currentWallet.key.startsWith('kitchen')) {
                const kitchenSection = document.getElementById('kitchen');
                if (kitchenSection) kitchenSection.style.display = 'block';
            } else if (['authority', 'verifier', 'operator'].includes(this.currentWallet.key)) {
                const authoritySection = document.getElementById('authority');
                if (authoritySection) authoritySection.style.display = 'block';
            }
        }
    }

    updateBalanceDisplays() {
        if (!this.currentWallet) return;

        const balances = this.currentWallet.balances;
        
        // Update balance displays
        Object.entries(balances).forEach(([token, balance]) => {
            const elements = document.querySelectorAll(`[data-token="${token}"]`);
            elements.forEach(element => {
                element.textContent = parseFloat(balance).toLocaleString();
            });
        });

        // Update role-specific displays
        this.updateRoleSpecificDisplays();
    }

    updateRoleSpecificDisplays() {
        if (!this.currentWallet) return;

        const balances = this.currentWallet.balances;

        // Update farmer-specific displays
        if (this.currentWallet.key.startsWith('farmer')) {
            const chickenElement = document.getElementById('farmerChickenBalance');
            const eggElement = document.getElementById('farmerEggBalance');
            
            if (chickenElement) chickenElement.textContent = parseFloat(balances.tCHICKEN).toLocaleString();
            if (eggElement) eggElement.textContent = parseFloat(balances.tEGG).toLocaleString();
        }

        // Update kitchen-specific displays
        if (this.currentWallet.key.startsWith('kitchen')) {
            const budgetElement = document.getElementById('kitchenBudget');
            if (budgetElement) {
                const budgetInM = parseFloat(balances.tIDR) / 1000000;
                budgetElement.textContent = `${budgetInM.toLocaleString()}M`;
            }
        }
    }

    async mintTokens(tokenType, amount, recipient, expiryDays) {
        if (!this.contracts.authority || !this.currentWallet) {
            this.showError('Please select a wallet first');
            return false;
        }

        if (this.currentWallet.key !== 'authority') {
            this.showError('Only the Central Authority can mint tokens');
            return false;
        }

        try {
            this.showLoading('Minting tokens...');

            // Create transaction
            const tx = this.contracts.authority.methods.verifyAndMintTokens(
                tokenType,
                this.web3.utils.toWei(amount.toString(), 'ether'),
                recipient,
                expiryDays
            );

            // Estimate gas
            const gas = await tx.estimateGas({ from: this.currentWallet.address });
            
            // Send transaction
            const receipt = await tx.send({
                from: this.currentWallet.address,
                gas: Math.floor(gas * 1.2), // Add 20% buffer
                gasPrice: await this.web3.eth.getGasPrice()
            });

            this.hideLoading();
            this.showSuccess(`Successfully minted ${amount} ${tokenType} tokens!`);
            
            // Update balances
            await this.refreshBalances();
            
            return receipt;
        } catch (error) {
            this.hideLoading();
            console.error('Mint failed:', error);
            this.showError(`Failed to mint tokens: ${error.message}`);
            return false;
        }
    }

    async transferTokens(tokenType, amount, recipient) {
        if (!this.currentWallet) {
            this.showError('Please select a wallet first');
            return false;
        }

        const tokenContract = this.contracts[tokenType];
        if (!tokenContract) {
            this.showError('Invalid token type');
            return false;
        }

        try {
            this.showLoading('Transferring tokens...');

            const tx = tokenContract.methods.transfer(
                recipient,
                this.web3.utils.toWei(amount.toString(), 'ether')
            );

            const gas = await tx.estimateGas({ from: this.currentWallet.address });
            
            const receipt = await tx.send({
                from: this.currentWallet.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: await this.web3.eth.getGasPrice()
            });

            this.hideLoading();
            this.showSuccess(`Successfully transferred ${amount} ${tokenType} tokens!`);
            
            await this.refreshBalances();
            
            return receipt;
        } catch (error) {
            this.hideLoading();
            console.error('Transfer failed:', error);
            this.showError(`Failed to transfer tokens: ${error.message}`);
            return false;
        }
    }

    async refreshBalances() {
        if (!this.currentWallet || !this.contracts.tCHICKEN) return;

        try {
            // Get fresh balances from blockchain
            const chickenBalance = await this.contracts.tCHICKEN.methods.balanceOf(this.currentWallet.address).call();
            const eggBalance = await this.contracts.tEGG.methods.balanceOf(this.currentWallet.address).call();
            const idrBalance = await this.contracts.tIDR.methods.balanceOf(this.currentWallet.address).call();

            // Update current wallet balances
            this.currentWallet.balances = {
                tCHICKEN: this.web3.utils.fromWei(chickenBalance, 'ether'),
                tEGG: this.web3.utils.fromWei(eggBalance, 'ether'),
                tIDR: this.web3.utils.fromWei(idrBalance, 'ether')
            };

            // Update stored wallet data
            this.demoWallets[this.currentWallet.key].balances = this.currentWallet.balances;

            // Update UI displays
            this.updateBalanceDisplays();

        } catch (error) {
            console.error('Failed to refresh balances:', error);
        }
    }

    showWalletSelector() {
        const modal = this.createWalletSelectionModal();
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    createWalletSelectionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select Demo Wallet</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">Choose a wallet to simulate different stakeholder perspectives:</p>
                        <div class="row">
                            ${Object.entries(this.demoWallets).map(([key, wallet]) => `
                                <div class="col-md-6 mb-3">
                                    <div class="card h-100 ${this.currentWallet?.key === key ? 'border-primary bg-light' : ''}" 
                                         style="cursor: pointer;" onclick="directWeb3.selectWalletAndClose('${key}', this)">
                                        <div class="card-body text-center">
                                            <div class="display-6 mb-2">${wallet.icon}</div>
                                            <h6 class="card-title">${wallet.name}</h6>
                                            <p class="card-text small text-muted">${wallet.description}</p>
                                            <div class="small mt-2">
                                                <div>🐔 ${parseFloat(wallet.balances.tCHICKEN).toLocaleString()} tCHICKEN</div>
                                                <div>🥚 ${parseFloat(wallet.balances.tEGG).toLocaleString()} tEGG</div>
                                                <div>💰 ${parseFloat(wallet.balances.tIDR).toLocaleString()} tIDR</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="alert alert-success mt-3">
                            <strong>No MetaMask Required!</strong><br>
                            This demo connects directly to your local blockchain, similar to Remix IDE.
                            Simply click on any wallet above to switch perspectives.
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    selectWalletAndClose(walletKey, element) {
        this.selectWallet(walletKey);
        
        // Close modal
        const modal = element.closest('.modal');
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }

    showConnectionError() {
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Cannot connect to local blockchain</strong><br>
                Make sure Hardhat node is running on localhost:8545
                <br><small class="text-muted mt-2">Run: <code>npm run start:node</code></small>
            `;
            connectionStatus.className = 'alert alert-danger';
        }
    }

    showLoading(message) {
        let loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            const loadingText = document.getElementById('loadingText');
            if (loadingText) loadingText.textContent = message;
            
            const bootstrapModal = new bootstrap.Modal(loadingModal);
            bootstrapModal.show();
        }
    }

    hideLoading() {
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            const bootstrapModal = bootstrap.Modal.getInstance(loadingModal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.appendChild(toast);
        const bootstrapToast = new bootstrap.Toast(toast);
        bootstrapToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        });
    }
}

// Initialize the direct Web3 manager
const directWeb3 = new DirectWeb3Manager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    directWeb3.initialize();
});

// Global functions for HTML integration
function showWalletSelector() {
    directWeb3.showWalletSelector();
}

function connectDirectly() {
    directWeb3.initialize();
}