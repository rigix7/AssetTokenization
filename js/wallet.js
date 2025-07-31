// Wallet Connection and Demo Role Management
class WalletManager {
    constructor() {
        this.web3 = null;
        this.currentAccount = null;
        this.contracts = {};
        this.demoRoles = this.initializeDemoRoles();
        this.currentRole = null;
    }

    initializeDemoRoles() {
        return {
            'authority': {
                name: 'Central Authority',
                address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                description: 'Platform governance and token minting',
                icon: '👔'
            },
            'farmer_a': {
                name: 'Happy Farm Supplier A',
                address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
                description: 'Large chicken farm - 1000 birds',
                icon: '🚜'
            },
            'farmer_b': {
                name: 'Green Valley Farm B',
                address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
                description: 'Medium egg producer - 500 hens',
                icon: '🚜'
            },
            'farmer_c': {
                name: 'Sunrise Poultry C',
                address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
                privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
                description: 'Small organic farm - 200 birds',
                icon: '🚜'
            },
            'kitchen_a': {
                name: 'Central Kitchen Alpha',
                address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
                privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
                description: 'Restaurant chain procurement',
                icon: '🍳'
            },
            'kitchen_b': {
                name: 'Central Kitchen Beta',
                address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
                privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
                description: 'Hotel chain food service',
                icon: '🍳'
            },
            'verifier': {
                name: 'Independent Auditor',
                address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
                privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
                description: 'Third-party asset verification',
                icon: '🔍'
            },
            'operator': {
                name: 'Platform Operator',
                address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
                privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
                description: 'Day-to-day operations',
                icon: '⚙️'
            }
        };
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                this.web3 = new Web3(window.ethereum);
                const accounts = await this.web3.eth.getAccounts();
                this.currentAccount = accounts[0];
                
                // Check if connected account matches a demo role
                this.identifyRole();
                
                // Setup contract connections
                await this.setupContracts();
                
                // Update UI
                this.updateConnectionUI();
                
                console.log('Wallet connected:', this.currentAccount);
                return true;
            } else {
                this.showMetaMaskGuide();
                return false;
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.showError('Failed to connect wallet. Please try again.');
            return false;
        }
    }

    identifyRole() {
        const connectedAddress = this.currentAccount.toLowerCase();
        
        for (const [roleKey, roleData] of Object.entries(this.demoRoles)) {
            if (roleData.address.toLowerCase() === connectedAddress) {
                this.currentRole = {
                    key: roleKey,
                    ...roleData
                };
                break;
            }
        }
        
        if (!this.currentRole) {
            this.currentRole = {
                key: 'unknown',
                name: 'Unknown Wallet',
                address: this.currentAccount,
                description: 'External wallet not part of demo setup',
                icon: '👤'
            };
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

        // Load contract ABIs (simplified versions for demo)
        this.contracts = {
            authority: new this.web3.eth.Contract(AUTHORITY_ABI, contractAddresses.authority),
            tCHICKEN: new this.web3.eth.Contract(TOKEN_ABI, contractAddresses.tCHICKEN),
            tEGG: new this.web3.eth.Contract(TOKEN_ABI, contractAddresses.tEGG),
            tIDR: new this.web3.eth.Contract(TOKEN_ABI, contractAddresses.tIDR),
            escrow: new this.web3.eth.Contract(ESCROW_ABI, contractAddresses.escrow)
        };
    }

    updateConnectionUI() {
        // Hide connection warning
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.style.display = 'none';
        }

        // Update wallet display
        const walletAddress = document.getElementById('walletAddress');
        const currentRoleElement = document.getElementById('currentRole');
        
        if (walletAddress) {
            walletAddress.textContent = `${this.currentAccount.slice(0, 6)}...${this.currentAccount.slice(-4)}`;
        }
        
        if (currentRoleElement && this.currentRole) {
            currentRoleElement.innerHTML = `${this.currentRole.icon} ${this.currentRole.name}`;
        }

        // Show role-specific sections
        this.showRelevantSections();
        
        // Update token balances
        this.updateBalances();
    }

    showRelevantSections() {
        const sections = ['dashboard', 'farmer', 'kitchen', 'authority'];
        
        // Hide all sections first
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show dashboard always
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.style.display = 'block';

        // Show role-specific sections
        if (this.currentRole) {
            if (this.currentRole.key.startsWith('farmer')) {
                const farmerSection = document.getElementById('farmer');
                if (farmerSection) farmerSection.style.display = 'block';
            } else if (this.currentRole.key.startsWith('kitchen')) {
                const kitchenSection = document.getElementById('kitchen');
                if (kitchenSection) kitchenSection.style.display = 'block';
            } else if (this.currentRole.key === 'authority' || this.currentRole.key === 'verifier' || this.currentRole.key === 'operator') {
                const authoritySection = document.getElementById('authority');
                if (authoritySection) authoritySection.style.display = 'block';
            }
        }
    }

    async updateBalances() {
        if (!this.contracts.tCHICKEN || !this.currentAccount) return;

        try {
            // Get token balances
            const chickenBalance = await this.contracts.tCHICKEN.methods.balanceOf(this.currentAccount).call();
            const eggBalance = await this.contracts.tEGG.methods.balanceOf(this.currentAccount).call();
            const idrBalance = await this.contracts.tIDR.methods.balanceOf(this.currentAccount).call();

            // Update UI elements
            this.updateBalanceDisplay('tCHICKEN', Web3.utils.fromWei(chickenBalance, 'ether'));
            this.updateBalanceDisplay('tEGG', Web3.utils.fromWei(eggBalance, 'ether'));
            this.updateBalanceDisplay('tIDR', Web3.utils.fromWei(idrBalance, 'ether'));

        } catch (error) {
            console.error('Failed to update balances:', error);
        }
    }

    updateBalanceDisplay(tokenType, balance) {
        const elements = document.querySelectorAll(`[data-token="${tokenType}"]`);
        elements.forEach(element => {
            element.textContent = parseFloat(balance).toLocaleString();
        });
    }

    async mintTokens(tokenType, amount, recipient, expiryDays) {
        if (!this.contracts.authority || !this.currentAccount) {
            this.showError('Please connect your wallet first');
            return false;
        }

        try {
            const tx = await this.contracts.authority.methods.verifyAndMintTokens(
                tokenType,
                Web3.utils.toWei(amount.toString(), 'ether'),
                recipient,
                expiryDays
            ).send({ from: this.currentAccount });

            this.showSuccess(`Successfully minted ${amount} ${tokenType} tokens!`);
            await this.updateBalances();
            return tx;
        } catch (error) {
            console.error('Mint failed:', error);
            this.showError(`Failed to mint tokens: ${error.message}`);
            return false;
        }
    }

    showRoleSelector() {
        const modal = this.createRoleSelectionModal();
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Clean up modal when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    createRoleSelectionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select Demo Role</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">Choose a demo wallet to import into MetaMask:</p>
                        <div class="row">
                            ${Object.entries(this.demoRoles).map(([key, role]) => `
                                <div class="col-md-6 mb-3">
                                    <div class="card h-100 role-card" onclick="walletManager.selectRole('${key}')">
                                        <div class="card-body text-center">
                                            <div class="display-6 mb-2">${role.icon}</div>
                                            <h6 class="card-title">${role.name}</h6>
                                            <p class="card-text small text-muted">${role.description}</p>
                                            <code class="small">${role.address.slice(0, 10)}...${role.address.slice(-8)}</code>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="alert alert-info mt-3">
                            <strong>Instructions:</strong>
                            <ol class="mb-0 mt-2">
                                <li>Click on a role above to copy its private key</li>
                                <li>Open MetaMask and click "Import Account"</li>
                                <li>Select "Private Key" and paste the copied key</li>
                                <li>Switch to the imported account and refresh this page</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    selectRole(roleKey) {
        const role = this.demoRoles[roleKey];
        if (role) {
            // Copy private key to clipboard
            navigator.clipboard.writeText(role.privateKey).then(() => {
                this.showSuccess(`Private key for ${role.name} copied to clipboard!`);
            }).catch(() => {
                // Fallback for older browsers
                this.showInfo(`Private key for ${role.name}: ${role.privateKey}`);
            });
        }
    }

    showMetaMaskGuide() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">MetaMask Required</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>This application requires MetaMask to connect to the blockchain.</p>
                        <ol>
                            <li>Install MetaMask browser extension</li>
                            <li>Add localhost network (Chain ID: 31337, RPC: http://localhost:8545)</li>
                            <li>Import a demo wallet using the role selector</li>
                            <li>Refresh this page and connect</li>
                        </ol>
                        <div class="d-grid">
                            <a href="https://metamask.io" target="_blank" class="btn btn-primary">
                                Install MetaMask
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showInfo(message) {
        this.showToast(message, 'info');
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
            toastContainer.removeChild(toast);
        });
    }
}

// Contract ABIs (simplified for demo)
const TOKEN_ABI = [
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

const AUTHORITY_ABI = [
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

const ESCROW_ABI = [
    {
        "inputs": [],
        "name": "getOrderCount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Initialize wallet manager
const walletManager = new WalletManager();

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Connect wallet button
    const connectButton = document.getElementById('connectWallet');
    if (connectButton) {
        connectButton.addEventListener('click', () => walletManager.connectWallet());
    }

    // Auto-connect if MetaMask is available and previously connected
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    walletManager.connectWallet();
                }
            });
    }
});

// Global functions for HTML onclick events
function connectWallet() {
    walletManager.connectWallet();
}

function showWalletSelector() {
    walletManager.showRoleSelector();
}

function selectDemoRole(roleKey) {
    walletManager.selectRole(roleKey);
}