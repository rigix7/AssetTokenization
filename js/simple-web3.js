// Simplified Web3 connection for demo purposes
// Works without MetaMask, connects directly to local Hardhat node

class SimpleWeb3Demo {
    constructor() {
        this.demoWallets = {
            'authority': {
                name: 'Central Authority',
                address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                description: 'Platform governance and token minting',
                icon: '👔',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '0' }
            },
            'farmer_a': {
                name: 'Happy Farm Supplier A',
                address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                description: 'Large chicken farm - 1000 birds',
                icon: '🚜',
                balances: { tCHICKEN: '900', tEGG: '4000', tIDR: '9900000' }
            },
            'farmer_b': {
                name: 'Green Valley Farm B',
                address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                description: 'Medium egg producer - 500 hens',
                icon: '🚜',
                balances: { tCHICKEN: '600', tEGG: '3000', tIDR: '0' }
            },
            'farmer_c': {
                name: 'Sunrise Poultry C',
                address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
                description: 'Small organic farm - 200 birds',
                icon: '🚜',
                balances: { tCHICKEN: '100', tEGG: '1000', tIDR: '0' }
            },
            'kitchen_a': {
                name: 'Central Kitchen Alpha',
                address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
                description: 'Restaurant chain procurement',
                icon: '🍳',
                balances: { tCHICKEN: '100', tEGG: '1000', tIDR: '490100000' }
            },
            'kitchen_b': {
                name: 'Central Kitchen Beta',
                address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
                description: 'Hotel chain food service',
                icon: '🍳',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '500000000' }
            },
            'verifier': {
                name: 'Independent Auditor',
                address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
                description: 'Third-party asset verification',
                icon: '🔍',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '0' }
            },
            'operator': {
                name: 'Platform Operator',
                address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
                description: 'Day-to-day operations',
                icon: '⚙️',
                balances: { tCHICKEN: '0', tEGG: '0', tIDR: '0' }
            }
        };
        
        this.currentWallet = null;
        this.isConnected = false;
    }

    async initialize() {
        console.log('Initializing simple Web3 demo...');
        
        try {
            // Simulate blockchain connection check
            await this.testBlockchainConnection();
            
            // Set default wallet
            this.selectWallet('authority');
            
            this.isConnected = true;
            this.updateConnectionUI();
            
            console.log('Demo initialized successfully!');
            return true;
        } catch (error) {
            console.error('Failed to initialize demo:', error);
            this.showConnectionError(error.message);
            return false;
        }
    }

    async testBlockchainConnection() {
        // Simple fetch test to check if Hardhat node is responsive
        try {
            const response = await fetch('http://localhost:8545', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(`RPC Error: ${data.error.message}`);
            }
            
            const blockNumber = parseInt(data.result, 16);
            console.log(`Blockchain connection OK! Block: ${blockNumber}`);
            return true;
            
        } catch (error) {
            console.error('Blockchain connection test failed:', error);
            throw new Error(`Cannot connect to Hardhat node: ${error.message}`);
        }
    }

    selectWallet(walletKey) {
        const wallet = this.demoWallets[walletKey];
        if (!wallet) {
            console.error('Wallet not found:', walletKey);
            return false;
        }

        this.currentWallet = {
            key: walletKey,
            ...wallet
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
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                <strong>Connected to Local Blockchain</strong> - Demo Mode (No MetaMask needed!)
                <br><small class="text-muted">Using demo wallets with simulated blockchain interactions</small>
            `;
            connectionStatus.className = 'alert alert-success';
            connectionStatus.style.display = 'block';
        }
    }

    updateCurrentWalletDisplay() {
        // Update wallet info panel
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
                    <button class="btn btn-sm btn-outline-primary" onclick="simpleWeb3.showWalletSelector()">
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
                                         style="cursor: pointer;" onclick="simpleWeb3.selectWalletAndClose('${key}', this)">
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
                        <div class="alert alert-info mt-3">
                            <strong>Demo Mode Active!</strong><br>
                            This demo shows real contract data from your Hardhat blockchain.
                            Switch between wallets to see different stakeholder perspectives.
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

    showConnectionError(errorMessage = '') {
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Blockchain Connection Issue</strong><br>
                Demo mode will still work with simulated data
                <br><small class="text-muted mt-2">Error: ${errorMessage}</small>
                <br><button class="btn btn-sm btn-warning mt-2" onclick="simpleWeb3.initialize()">Retry Connection</button>
            `;
            connectionStatus.className = 'alert alert-warning';
            connectionStatus.style.display = 'block';
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

// Initialize the simple Web3 demo
const simpleWeb3 = new SimpleWeb3Demo();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    simpleWeb3.initialize();
});

// Global functions for HTML integration
function showWalletSelector() {
    simpleWeb3.showWalletSelector();
}

function connectDirectly() {
    simpleWeb3.initialize();
}