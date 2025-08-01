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
            authority: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1',
            tCHICKEN: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44',
            tEGG: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f',
            tIDR: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319',
            escrow: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F'
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
            console.log('Testing blockchain connection...');
            
            // Use proxy endpoint to avoid CORS issues
            const testResponse = await fetch('/blockchain', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'net_version',
                    params: [],
                    id: 1
                })
            });

            console.log('HTTP test response status:', testResponse.status);

            if (!testResponse.ok) {
                throw new Error(`HTTP ${testResponse.status}: Cannot reach Hardhat node`);
            }

            const testData = await testResponse.json();
            console.log('HTTP test response data:', testData);

            if (testData.error) {
                throw new Error(`RPC Error: ${testData.error.message}`);
            }

            console.log('HTTP test successful, initializing Web3...');

            // Create custom Web3 provider using our proxy
            const customProvider = {
                send: async (payload, callback) => {
                    try {
                        const response = await fetch('/blockchain', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const result = await response.json();
                        callback(null, result);
                    } catch (error) {
                        callback(error, null);
                    }
                },
                sendAsync: async (payload, callback) => {
                    try {
                        const response = await fetch('/blockchain', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const result = await response.json();
                        callback(null, result);
                    } catch (error) {
                        callback(error, null);
                    }
                }
            };
            
            this.web3 = new Web3(customProvider);
            
            // Verify Web3 connection
            console.log('Testing Web3 connection...');
            const networkId = await this.web3.eth.net.getId();
            console.log(`Web3 connected to network: ${networkId}`);
            
            const blockNumber = await this.web3.eth.getBlockNumber();
            console.log(`Current block number: ${blockNumber}`);
            
            // Setup contracts
            console.log('Setting up contracts...');
            await this.setupContracts();
            
            this.isConnected = true;
            this.updateConnectionStatus(true);
            
            console.log('Blockchain connection successful!');
            return true;
        } catch (error) {
            console.error('Blockchain connection failed:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async setupContracts() {
        // Token ABI for balance, transfer, and approval operations
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
            },
            {
                "inputs": [
                    {"name": "spender", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "owner", "type": "address"},
                    {"name": "spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "from", "type": "address"},
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transferFrom",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        // Authority ABI for minting
        const authorityABI = [
            {
                "inputs": [
                    {"name": "tokenAddress", "type": "address"},
                    {"name": "recipient", "type": "address"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "createdAt", "type": "uint256"},
                    {"name": "expiryTimestamp", "type": "uint256"},
                    {"name": "location", "type": "string"}
                ],
                "name": "authorizeTokenMinting",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "supplierAddress", "type": "address"},
                    {"name": "name", "type": "string"},
                    {"name": "location", "type": "string"},
                    {"name": "assetTypes", "type": "string[]"}
                ],
                "name": "registerSupplier",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "supplierAddress", "type": "address"}
                ],
                "name": "approveSupplier",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "supplier", "type": "address"}
                ],
                "name": "isSupplierApproved",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // Escrow ABI for purchase orders
        const escrowABI = [
            {
                "inputs": [
                    {"name": "seller", "type": "address"},
                    {"name": "paymentToken", "type": "address"},
                    {"name": "assetTokens", "type": "address[]"},
                    {"name": "assetAmounts", "type": "uint256[]"},
                    {"name": "paymentAmount", "type": "uint256"},
                    {"name": "expirationTime", "type": "uint256"}
                ],
                "name": "createOrder",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "orderId", "type": "uint256"}
                ],
                "name": "depositPayment",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "orderId", "type": "uint256"}
                ],
                "name": "orders",
                "outputs": [
                    {"name": "buyer", "type": "address"},
                    {"name": "seller", "type": "address"},
                    {"name": "paymentToken", "type": "address"},
                    {"name": "paymentAmount", "type": "uint256"},
                    {"name": "expirationTime", "type": "uint256"},
                    {"name": "paymentDeposited", "type": "bool"},
                    {"name": "assetsDelivered", "type": "bool"},
                    {"name": "buyerVerified", "type": "bool"},
                    {"name": "sellerVerified", "type": "bool"},
                    {"name": "authorityVerified", "type": "bool"},
                    {"name": "completed", "type": "bool"},
                    {"name": "cancelled", "type": "bool"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "orderCounter",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "amount", "type": "uint256"},
                    {"name": "reason", "type": "string"}
                ],
                "name": "burnOwnAssets",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        // Initialize contract instances
        this.contracts = {
            authority: new this.web3.eth.Contract(authorityABI, this.contractAddresses.authority),
            escrow: new this.web3.eth.Contract(escrowABI, this.contractAddresses.escrow),
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

    updateTotalCost() {
        const quantity = document.getElementById('purchaseAmount')?.value || 0;
        const price = document.getElementById('purchasePrice')?.value || 0;
        const total = parseFloat(quantity) * parseFloat(price);
        
        const display = document.getElementById('totalCostDisplay');
        if (display) {
            display.textContent = total ? `${total.toLocaleString()} IDR` : '0 IDR';
        }
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
            console.log('Purchase form submitted');
            this.handlePurchaseTokens();
        });

        document.getElementById('burnAssetsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBurnAssets();
        });

        // Add price calculation listener
        document.addEventListener('input', (e) => {
            if (e.target.id === 'purchaseAmount' || e.target.id === 'purchasePrice') {
                this.updateTotalCost();
            }
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
        
        // Update active orders for kitchen users
        if (this.currentWallet && this.currentWallet.type === 'kitchen') {
            this.updateActiveOrders();
        }
    }

    async updateActiveOrders() {
        if (!this.currentWallet || this.currentWallet.type !== 'kitchen') return;

        try {
            const orderCounter = await this.contracts.escrow.methods.orderCounter().call();
            const activeOrdersList = document.getElementById('activeOrdersList');
            const orders = [];

            // Check each order to see if it belongs to current wallet and is incomplete
            for (let i = 0; i < parseInt(orderCounter); i++) {
                try {
                    const order = await this.contracts.escrow.methods.orders(i).call();
                    
                    // Check if this order belongs to current wallet and is not completed/cancelled
                    if (order.buyer.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                        !order.completed && !order.cancelled) {
                        
                        // Get asset token details (order.assetTokens is an array)
                        let assetType = 'Unknown';
                        let quantity = '0';
                        
                        // For now, assume single asset per order (first element)
                        if (order.assetTokens && order.assetTokens.length > 0) {
                            const assetAddress = order.assetTokens[0];
                            if (assetAddress === this.contractAddresses.tCHICKEN) assetType = '🐔 Chickens';
                            else if (assetAddress === this.contractAddresses.tEGG) assetType = '🥚 Eggs';
                            
                            if (order.assetAmounts && order.assetAmounts.length > 0) {
                                quantity = this.web3.utils.fromWei(order.assetAmounts[0], 'ether');
                            }
                        }
                        
                        orders.push({
                            id: i,
                            assetType,
                            quantity,
                            totalCost: this.web3.utils.fromWei(order.paymentAmount, 'ether'),
                            supplier: order.seller,
                            paymentDeposited: order.paymentDeposited,
                            assetsDelivered: order.assetsDelivered,
                            expirationTime: order.expirationTime
                        });
                    }
                } catch (orderError) {
                    console.log(`Skipping order ${i}:`, orderError.message);
                    continue;
                }
            }

            // Update UI
            if (orders.length === 0) {
                activeOrdersList.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No active orders</td></tr>';
            } else {
                activeOrdersList.innerHTML = orders.map(order => {
                    const status = this.getOrderStatus(order);
                    const actions = this.getOrderActions(order);
                    const supplierName = this.getSupplierName(order.supplier);
                    
                    return `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.assetType}</td>
                            <td>${parseFloat(order.quantity).toLocaleString()}</td>
                            <td>${parseFloat(order.totalCost).toLocaleString()} IDR</td>
                            <td>${supplierName}</td>
                            <td><span class="badge ${status.class}">${status.text}</span></td>
                            <td>${actions}</td>
                        </tr>
                    `;
                }).join('');
            }

        } catch (error) {
            console.error('Failed to update active orders:', error);
        }
    }

    getOrderStatus(order) {
        if (!order.paymentDeposited) {
            return { text: 'Payment Pending', class: 'bg-warning' };
        } else if (!order.assetsDelivered) {
            return { text: 'Awaiting Delivery', class: 'bg-info' };
        } else {
            return { text: 'Ready for Verification', class: 'bg-success' };
        }
    }

    getOrderActions(order) {
        if (!order.paymentDeposited) {
            return `<button class="btn btn-sm btn-primary" onclick="window.blockchainDemo.retryPayment(${order.id})">Retry Payment</button>`;
        } else if (order.assetsDelivered) {
            return `<button class="btn btn-sm btn-success" onclick="window.blockchainDemo.verifyOrder(${order.id})">Verify Order</button>`;
        } else {
            return '<span class="text-muted">Waiting for supplier</span>';
        }
    }

    getSupplierName(address) {
        const suppliers = {
            [this.demoWallets.farmer1.address.toLowerCase()]: 'Happy Farm A',
            [this.demoWallets.farmer2.address.toLowerCase()]: 'Green Valley B', 
            [this.demoWallets.farmer3.address.toLowerCase()]: 'Sunrise Poultry C'
        };
        return suppliers[address.toLowerCase()] || this.formatAddress(address);
    }

    async retryPayment(orderId) {
        try {
            this.showLoading('Retrying payment deposit...');
            
            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);
            
            const depositTx = this.contracts.escrow.methods.depositPayment(orderId);
            await depositTx.send({
                from: account.address,
                gas: 200000
            });
            
            this.hideLoading();
            this.showSuccess('Payment deposited successfully!');
            await this.refreshBalances();
            
        } catch (error) {
            this.hideLoading();
            console.error('Payment retry failed:', error);
            this.showToast(`Failed to deposit payment: ${error.message}`, 'error');
        }
    }

    async verifyOrder(orderId) {
        try {
            this.showLoading('Verifying order...');
            
            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);
            
            const verifyTx = this.contracts.escrow.methods.verifyOrder(orderId);
            await verifyTx.send({
                from: account.address,
                gas: 200000
            });
            
            this.hideLoading();
            this.showSuccess('Order verified successfully!');
            await this.refreshBalances();
            
        } catch (error) {
            this.hideLoading();
            console.error('Order verification failed:', error);
            this.showToast(`Failed to verify order: ${error.message}`, 'error');
        }
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
            
            // Calculate expiry timestamp
            const now = Math.floor(Date.now() / 1000);
            const expiryTimestamp = now + (expiryDays * 24 * 60 * 60);

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            // First ensure the recipient is registered and approved as a supplier
            const isApproved = await this.contracts.authority.methods.isSupplierApproved(recipient).call();
            if (!isApproved && recipient !== account.address) {
                // Register and approve the supplier first
                console.log('Registering new supplier...');
                const registerTx = this.contracts.authority.methods.registerSupplier(
                    recipient, 
                    'Demo Supplier', 
                    'Demo Location', 
                    [tokenType]
                );
                await registerTx.send({
                    from: account.address,
                    gas: 500000
                });

                const approveTx = this.contracts.authority.methods.approveSupplier(recipient);
                await approveTx.send({
                    from: account.address,
                    gas: 100000
                });
            }

            // Get the token contract address
            const tokenAddress = this.contractAddresses[tokenType];

            const tx = this.contracts.authority.methods.authorizeTokenMinting(
                tokenAddress,
                recipient,
                amountWei,
                now,
                expiryTimestamp,
                'Demo Location'
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

    async handleBurnAssets() {
        if (!this.currentWallet) {
            this.showToast('Please select a wallet first', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showToast('Please connect to blockchain first', 'error');
            return;
        }

        if (this.currentWallet.type !== 'farmer') {
            this.showToast('Only farmers can burn assets', 'error');
            return;
        }

        const assetType = document.getElementById('burnAssetType').value;
        const quantity = document.getElementById('burnQuantity').value;
        const reason = document.getElementById('burnReason').value;

        if (!assetType || !quantity || !reason) {
            this.showToast('Please fill all fields', 'error');
            return;
        }

        try {
            this.showLoading('Burning assets...');

            const contract = this.contracts[assetType];
            const quantityWei = this.web3.utils.toWei(quantity, 'ether');

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            // Check balance first
            const balance = await contract.methods.balanceOf(account.address).call();
            if (this.web3.utils.toBN(balance).lt(this.web3.utils.toBN(quantityWei))) {
                throw new Error('Insufficient balance');
            }

            const tx = contract.methods.burnOwnAssets(quantityWei, reason);

            const gas = await tx.estimateGas({ from: account.address });
            const gasPrice = await this.web3.eth.getGasPrice();

            const receipt = await tx.send({
                from: account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            this.hideLoading();
            this.showSuccess(`Successfully burned ${quantity} ${assetType} (Reason: ${reason})`, receipt.transactionHash);
            
            // Reset form and refresh balances
            document.getElementById('burnAssetsForm').reset();
            await this.refreshBalances();

        } catch (error) {
            this.hideLoading();
            console.error('Burn failed:', error);
            this.showToast(`Failed to burn assets: ${error.message}`, 'error');
        }
    }

    async handlePurchaseTokens() {
        console.log('handlePurchaseTokens called');
        
        if (!this.currentWallet) {
            this.showToast('Please select a wallet first', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showToast('Please connect to blockchain first', 'error');
            return;
        }

        const supplier = document.getElementById('purchaseSupplier').value;
        const assetType = document.getElementById('purchaseTokenType').value;
        const quantity = document.getElementById('purchaseAmount').value;
        const pricePerUnit = document.getElementById('purchasePrice').value;
        
        console.log('Form values:', { supplier, assetType, quantity, pricePerUnit });
        
        // Calculate total cost from user inputs
        const totalCost = (parseFloat(quantity) * parseFloat(pricePerUnit)).toString();

        if (!supplier || !assetType || !quantity || !pricePerUnit) {
            this.showToast('Please fill all fields', 'error');
            return;
        }

        try {
            this.showLoading('Creating purchase order...');

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            // Convert amounts to Wei
            const quantityWei = this.web3.utils.toWei(quantity, 'ether');
            const totalCostWei = this.web3.utils.toWei(totalCost, 'ether');

            // Create order parameters
            const paymentToken = this.contractAddresses.tIDR; // Pay with tIDR
            const assetTokens = [this.contractAddresses[assetType]];
            const assetAmounts = [quantityWei];
            const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

            // Step 1: Approve payment token spending
            console.log('Approving payment token...');
            const approveTx = this.contracts.tIDR.methods.approve(
                this.contractAddresses.escrow,
                totalCostWei
            );
            await approveTx.send({
                from: account.address,
                gas: 100000
            });

            // Step 2: Create the order
            console.log('Creating order...');
            const createOrderTx = this.contracts.escrow.methods.createOrder(
                supplier,
                paymentToken,
                assetTokens,
                assetAmounts,
                totalCostWei,
                expirationTime
            );

            const gas = await createOrderTx.estimateGas({ from: account.address });
            const receipt = await createOrderTx.send({
                from: account.address,
                gas: Math.floor(gas * 1.2)
            });

            // Get the order ID using orderCounter (more reliable approach)
            console.log('Getting order ID from contract state...');
            
            // The order was just created, so the current orderCounter - 1 is our order ID
            const currentCounter = await this.contracts.escrow.methods.orderCounter().call();
            const orderId = parseInt(currentCounter) - 1; // Last created order
            
            console.log('Current order counter:', currentCounter);
            console.log('Our order ID:', orderId);
            
            if (orderId < 0) {
                console.error('Invalid order ID calculated');
                throw new Error('Failed to determine order ID');
            }

            // Step 3: Deposit payment
            console.log('Depositing payment...');
            const depositTx = this.contracts.escrow.methods.depositPayment(orderId);
            await depositTx.send({
                from: account.address,
                gas: 200000
            });

            this.hideLoading();
            this.showSuccess(
                `Purchase order created successfully! Order ID: ${orderId}`, 
                receipt.transactionHash
            );
            
            // Reset form and refresh balances
            document.getElementById('purchaseForm').reset();
            await this.refreshBalances();

            // Show informational message about next steps
            setTimeout(() => {
                this.showToast(
                    `Order created! Now the supplier needs to deliver the ${assetType} tokens to complete the transaction.`,
                    'info'
                );
            }, 2000);

        } catch (error) {
            this.hideLoading();
            console.error('Purchase failed:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            
            // Show more detailed error message
            let errorMsg = 'Failed to create purchase order';
            if (error.message.includes('execution reverted')) {
                errorMsg += ': Transaction reverted';
            } else if (error.message.includes('insufficient funds')) {
                errorMsg += ': Insufficient funds';
            } else if (error.message.includes('User denied')) {
                errorMsg += ': Transaction cancelled';
            } else {
                errorMsg += `: ${error.message}`;
            }
            
            this.showToast(errorMsg, 'error');
        }
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