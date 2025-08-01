// Agricultural Asset Tokenization Demo Platform
// Direct blockchain integration with demo wallet system

class BlockchainDemo {
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.currentWallet = null;
        this.isConnected = false;
        
        // Contract addresses - will be loaded from deployment file
        this.contractAddresses = null;
        
        // Local order tracking to avoid complex contract parsing
        this.localOrders = new Map(); // orderId -> order details

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
            this.updateContractStatus().catch(() => {}); // Update status to show error
            return false;
        }
    }

    async loadContractAddresses() {
        try {
            // Try to load addresses from deployment file
            const response = await fetch('/contract-addresses.json');
            if (response.ok) {
                const addresses = await response.json();
                console.log('Loaded contract addresses from deployment file:', addresses);
                this.contractAddresses = addresses;
                return true;
            }
        } catch (error) {
            console.log('Could not load contract addresses from file, using fallback');
        }
        
        // Fallback to hardcoded addresses (current deployment)
        this.contractAddresses = {
            authority: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1',
            tCHICKEN: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44',
            tEGG: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f',
            tIDR: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319',
            escrow: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F'
        };
        return false;
    }

    async connectToBlockchain() {
        try {
            console.log('Loading contract addresses...');
            await this.loadContractAddresses();
            
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
            
            // Display contract info now that everything is loaded
            this.displayContractInfo();
            
            this.isConnected = true;
            this.updateContractStatus();
            
            console.log('Blockchain connection successful!');
            
            // Start periodic status updates
            this.startStatusUpdates();
            
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
        // Load the full SimpleAgricultureToken ABI from artifacts
        let tokenABI;
        try {
            const response = await fetch('/artifacts/contracts/SimpleAgricultureToken.sol/SimpleAgricultureToken.json');
            const artifact = await response.json();
            tokenABI = artifact.abi;
        } catch (error) {
            console.error('Failed to load contract ABI, using fallback ABI', error);
            // Fallback minimal ABI including burnOwnAssets
            tokenABI = [
                {
                    "inputs": [{"name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
                    "name": "approve",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
                    "name": "allowance",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
                    "name": "transferFrom",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "amount", "type": "uint256"}, {"name": "reason", "type": "string"}],
                    "name": "burnOwnAssets",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];
        }



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
                "name": "deliverAssets",
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
                    {
                        "components": [
                            {"name": "buyer", "type": "address"},
                            {"name": "seller", "type": "address"},
                            {"name": "paymentToken", "type": "address"},
                            {"name": "assetTokens", "type": "address[]"},
                            {"name": "assetAmounts", "type": "uint256[]"},
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
                        "name": "",
                        "type": "tuple"
                    }
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
        
        // Display contract addresses (only if loaded)
        if (this.contractAddresses) {
            this.displayContractInfo();
        }
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
        if (!this.contractAddresses) {
            console.log('Contract addresses not yet loaded');
            return;
        }
        
        const authorityElement = document.getElementById('authorityAddress');
        const tokenAddressesElement = document.getElementById('tokenAddresses');
        
        if (authorityElement && tokenAddressesElement) {
            authorityElement.textContent = this.formatAddress(this.contractAddresses.authority);
            tokenAddressesElement.innerHTML = `
                tCHICKEN: ${this.formatAddress(this.contractAddresses.tCHICKEN)}<br>
                tEGG: ${this.formatAddress(this.contractAddresses.tEGG)}<br>
                tIDR: ${this.formatAddress(this.contractAddresses.tIDR)}
            `;
        }
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
            this.updateFarmerOrders();
        } else if (type === 'kitchen') {
            document.getElementById('kitchen').style.display = 'block';
            this.updateActiveOrders();
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
                    // Use enhanced order fetching
                    const order = await this.getOrderData(i);
                    
                    // Check if this order belongs to current wallet and is not completed/cancelled
                    if (order && order.buyer && order.buyer.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                        !order.completed && !order.cancelled) {
                        
                        // Get asset token details from order data
                        let assetType = 'Unknown';
                        let quantity = '0';
                        
                        if (order.assetType) {
                            // Use stored asset type from order
                            if (order.assetType === 'tCHICKEN') assetType = '🐔 Chickens';
                            else if (order.assetType === 'tEGG') assetType = '🥚 Eggs';
                            quantity = order.quantity || '0';
                        } else if (order.assetTokens && order.assetTokens.length > 0) {
                            // Fallback to token address detection
                            const assetAddress = order.assetTokens[0];
                            if (assetAddress.toLowerCase() === this.contractAddresses.tCHICKEN.toLowerCase()) assetType = '🐔 Chickens';
                            else if (assetAddress.toLowerCase() === this.contractAddresses.tEGG.toLowerCase()) assetType = '🥚 Eggs';
                            
                            if (order.assetAmounts && order.assetAmounts.length > 0) {
                                quantity = this.web3.utils.fromWei(order.assetAmounts[0].toString(), 'ether');
                            }
                        }
                        
                        orders.push({
                            id: i,
                            assetType,
                            quantity,
                            totalCost: this.web3.utils.fromWei(order.paymentAmount.toString(), 'ether'),
                            supplier: order.seller,
                            paymentDeposited: order.paymentDeposited,
                            assetsDelivered: order.assetsDelivered,
                            expirationTime: order.expirationTime
                        });
                    }
                } catch (orderError) {
                    console.log(`Error parsing order ${i}:`, orderError.message);
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
        if (!order.assetsDelivered) {
            return { text: 'Payment Secured - Awaiting Delivery', class: 'bg-info' };
        } else {
            return { text: 'Assets Delivered - Ready for Verification', class: 'bg-success' };
        }
    }

    getOrderActions(order) {
        if (order.assetsDelivered) {
            return `<button class="btn btn-sm btn-success" onclick="window.demoApp.verifyOrder(${order.id})">Verify & Complete Order</button>`;
        } else {
            return '<span class="text-muted"><i class="fas fa-clock me-1"></i>Waiting for supplier delivery</span>';
        }
    }

    getSupplierName(address) {
        const suppliers = {
            [this.demoWallets.farmer_a.address.toLowerCase()]: 'Happy Farm A',
            [this.demoWallets.farmer_b.address.toLowerCase()]: 'Green Valley B', 
            [this.demoWallets.farmer_c.address.toLowerCase()]: 'Sunrise Poultry C'
        };
        return suppliers[address.toLowerCase()] || this.formatAddress(address);
    }

    getCustomerName(address) {
        const customers = {
            [this.demoWallets.kitchen_a.address.toLowerCase()]: 'Central Kitchen Alpha',
            [this.demoWallets.kitchen_b.address.toLowerCase()]: 'Central Kitchen Beta'
        };
        return customers[address.toLowerCase()] || this.formatAddress(address);
    }



    // Payment deposit is now automatic - no retry needed

    async updateFarmerOrders() {
        if (!this.currentWallet || this.currentWallet.type !== 'farmer') return;

        try {
            const orderCounter = await this.contracts.escrow.methods.orderCounter().call();
            const farmerOrdersList = document.getElementById('farmerOrdersList');
            const orders = [];

            // Check each order to see if it belongs to current wallet (as seller) and needs action
            for (let i = 0; i < parseInt(orderCounter); i++) {
                try {
                    // Use low-level call to avoid automatic BigNumber conversion
                    const orderData = await this.web3.eth.call({
                        to: this.contractAddresses.escrow,
                        data: this.web3.eth.abi.encodeFunctionCall({
                            name: 'orders',
                            type: 'function',
                            inputs: [{'name': 'orderId', 'type': 'uint256'}]
                        }, [i])
                    });
                    
                    // Parse the hex data manually to avoid automatic BigNumber conversion
                    const order = this.parseOrderDataSafely(orderData);
                    
                    // Check if this order belongs to current wallet as seller and is not completed/cancelled
                    if (order && order.seller && order.seller.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                        !order.completed && !order.cancelled) {
                        
                        // Get asset token details
                        let assetType = 'Unknown';
                        let quantity = '0';
                        
                        if (order.assetTokens && order.assetTokens.length > 0) {
                            const assetAddress = order.assetTokens[0];
                            if (assetAddress.toLowerCase() === this.contractAddresses.tCHICKEN.toLowerCase()) assetType = '🐔 Chickens';
                            else if (assetAddress.toLowerCase() === this.contractAddresses.tEGG.toLowerCase()) assetType = '🥚 Eggs';
                            
                            if (order.assetAmounts && order.assetAmounts.length > 0) {
                                quantity = this.web3.utils.fromWei(order.assetAmounts[0].toString(), 'ether');
                            }
                        }
                        
                        orders.push({
                            id: i,
                            assetType,
                            quantity,
                            totalPayment: this.web3.utils.fromWei(order.paymentAmount.toString(), 'ether'),
                            buyer: order.buyer,
                            paymentDeposited: order.paymentDeposited,
                            assetsDelivered: order.assetsDelivered,
                            expirationTime: order.expirationTime
                        });
                    }
                } catch (orderError) {
                    console.log(`Error parsing farmer order ${i}:`, orderError.message);
                    continue;
                }
            }

            // Update UI
            if (orders.length === 0) {
                farmerOrdersList.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No active orders</td></tr>';
            } else {
                farmerOrdersList.innerHTML = orders.map(order => {
                    const status = this.getFarmerOrderStatus(order);
                    const actions = this.getFarmerOrderActions(order);
                    const buyerName = this.getCustomerName(order.buyer);
                    
                    return `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.assetType}</td>
                            <td>${parseFloat(order.quantity).toLocaleString()}</td>
                            <td>${parseFloat(order.totalPayment).toLocaleString()} IDR</td>
                            <td>${buyerName}</td>
                            <td><span class="badge ${status.class}">${status.text}</span></td>
                            <td>${actions}</td>
                        </tr>
                    `;
                }).join('');
            }

        } catch (error) {
            console.error('Error updating farmer orders:', error);
            if (document.getElementById('farmerOrdersList')) {
                document.getElementById('farmerOrdersList').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading orders</td></tr>';
            }
        }
    }

    getFarmerOrderStatus(order) {
        if (!order.assetsDelivered) {
            return { text: 'Payment Secured - Ready to Deliver', class: 'bg-success' };
        } else {
            return { text: 'Assets Delivered - Awaiting Verification', class: 'bg-primary' };
        }
    }

    getFarmerOrderActions(order) {
        if (!order.assetsDelivered) {
            return `<button class="btn btn-sm btn-success" onclick="window.demoApp.deliverAssets(${order.id})">
                <i class="fas fa-truck me-1"></i>Deliver Assets
            </button>`;
        } else {
            return '<span class="text-muted"><i class="fas fa-check me-1"></i>Delivered - awaiting verification</span>';
        }
    }

    async deliverAssets(orderId) {
        try {
            this.showLoading('Delivering assets...');
            
            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);
            
            const deliverTx = this.contracts.escrow.methods.deliverAssets(orderId);
            await deliverTx.send({
                from: account.address,
                gas: 300000
            });
            
            this.hideLoading();
            this.showSuccess('Assets delivered successfully!');
            await this.refreshBalances();
            
        } catch (error) {
            this.hideLoading();
            console.error('Asset delivery failed:', error);
            this.showToast(`Failed to deliver assets: ${error.message}`, 'error');
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

            // Make sure we have contracts and the specific contract exists
            if (!this.contracts || !this.contracts[assetType]) {
                throw new Error(`Contract for ${assetType} not found. Please refresh the page.`);
            }

            const contract = this.contracts[assetType];
            const quantityWei = this.web3.utils.toWei(quantity, 'ether');

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            // Check balance first
            const balance = await contract.methods.balanceOf(account.address).call();
            if (this.web3.utils.toBN(balance).lt(this.web3.utils.toBN(quantityWei))) {
                throw new Error('Insufficient balance to burn this amount');
            }

            // Verify the burnOwnAssets method exists
            if (!contract.methods.burnOwnAssets) {
                throw new Error('burnOwnAssets method not found in contract');
            }

            // Use the actual burnOwnAssets method from the smart contract
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
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                assetType: assetType,
                contractAddress: this.contractAddresses ? this.contractAddresses[assetType] : 'no addresses loaded',
                contractsLoaded: !!this.contracts,
                specificContractExists: !!(this.contracts && this.contracts[assetType]),
                contractMethods: this.contracts && this.contracts[assetType] && this.contracts[assetType].methods ? 
                    Object.keys(this.contracts[assetType].methods) : 'no contract or methods',
                isConnected: this.isConnected,
                currentWallet: this.currentWallet ? this.currentWallet.address : 'no wallet'
            });
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
            
            // Get the correct asset token address based on selected type
            let assetTokenAddress;
            if (assetType === 'tCHICKEN') {
                assetTokenAddress = this.contractAddresses.tCHICKEN;
            } else if (assetType === 'tEGG') {
                assetTokenAddress = this.contractAddresses.tEGG;
            } else {
                throw new Error(`Unsupported asset type: ${assetType}`);
            }
            
            const assetTokens = [assetTokenAddress];
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

            // Store order data locally for accurate display WITH payment status
            this.localOrders.set(orderId, {
                id: orderId,
                buyer: account.address,
                seller: supplier,
                assetType: assetType,
                quantity: quantity,
                pricePerUnit: pricePerUnit,
                totalCost: totalCost,
                assetTokens: assetTokens,
                assetAmounts: assetAmounts,
                paymentAmount: totalCostWei,
                paymentDeposited: true,  // Payment was just deposited successfully
                assetsDelivered: false,  // Assets not delivered yet
                completed: false,        // Order not completed yet
                cancelled: false,        // Order not cancelled
                createdAt: new Date().toISOString(),
                expirationTime: expirationTime
            });

            this.hideLoading();
            this.showSuccess(
                `Purchase order created successfully! Order ID: ${orderId}`, 
                receipt.transactionHash
            );
            
            // Reset form and refresh balances
            document.getElementById('purchaseForm').reset();
            await this.refreshBalances();
            
            // Force refresh of order displays to show the new order
            setTimeout(() => {
                this.updateKitchenOrders();
                this.updateFarmerOrders();
            }, 1000);

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

    async updateContractStatus() {
        try {
            // Update block number
            const blockNumber = await this.web3.eth.getBlockNumber();
            document.getElementById('blockInfo').textContent = `Block: ${blockNumber}`;
            
            // Test if contracts are responding (not returning empty responses)
            let contractsWorking = 0;
            let contractsTotal = 5;
            
            try {
                // Test authority contract - try to load the full artifact ABI
                const response = await fetch('/artifacts/contracts/SimpleCentralAuthority.sol/SimpleCentralAuthority.json');
                if (response.ok) {
                    const artifact = await response.json();
                    this.contracts.authority = new this.web3.eth.Contract(artifact.abi, this.contractAddresses.authority);
                    const authorityTest = await this.contracts.authority.methods.verificationCounter().call();
                    if (authorityTest !== null && authorityTest !== '0x') contractsWorking++;
                } else {
                    // Fallback: just count it as working if address exists
                    if (this.contractAddresses.authority && this.contractAddresses.authority !== '0x0000000000000000000000000000000000000000') contractsWorking++;
                }
            } catch (e) { 
                // Final fallback: just count it as working if address exists  
                if (this.contractAddresses.authority && this.contractAddresses.authority !== '0x0000000000000000000000000000000000000000') contractsWorking++;
            }
            
            try {
                // Test token contracts
                const chickenTest = await this.contracts.tCHICKEN.methods.totalSupply().call();
                if (chickenTest !== null && chickenTest !== '0x') contractsWorking++;
                
                const eggTest = await this.contracts.tEGG.methods.totalSupply().call();
                if (eggTest !== null && eggTest !== '0x') contractsWorking++;
                
                const idrTest = await this.contracts.tIDR.methods.totalSupply().call();
                if (idrTest !== null && idrTest !== '0x') contractsWorking++;
            } catch (e) { console.log('Token contract test failed:', e.message); }
            
            try {
                // Test escrow contract
                const escrowTest = await this.contracts.escrow.methods.orderCounter().call();
                if (escrowTest !== null && escrowTest !== '0x') contractsWorking++;
            } catch (e) { console.log('Escrow contract test failed:', e.message); }
            
            // Update contract status
            document.getElementById('contractInfo').textContent = `Contracts: ${contractsWorking}/${contractsTotal}`;
            
            // Update status display
            const statusSpinner = document.getElementById('statusSpinner');
            const statusIcon = document.getElementById('statusIcon');
            const statusText = document.getElementById('statusText');
            const contractStatus = document.getElementById('contractStatus');
            
            if (contractsWorking === contractsTotal) {
                // All contracts working
                statusSpinner.style.display = 'none';
                statusIcon.style.display = 'inline';
                statusIcon.innerHTML = '<i class="fas fa-check-circle text-success"></i>';
                statusText.innerHTML = '<strong>Smart Contracts Connected</strong><br><small class="text-muted">All contracts responding correctly</small>';
                contractStatus.className = 'card border-success border-0 shadow-sm';
            } else if (contractsWorking === 0) {
                // No contracts working - likely wrong addresses
                statusSpinner.style.display = 'none';
                statusIcon.style.display = 'inline';
                statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle text-warning"></i>';
                statusText.innerHTML = '<strong>Contract Address Mismatch</strong><br><small class="text-muted">Contracts not found at loaded addresses - click Refresh</small>';
                contractStatus.className = 'card border-warning border-0 shadow-sm';
            } else {
                // Some contracts working
                statusSpinner.style.display = 'none';
                statusIcon.style.display = 'inline';
                statusIcon.innerHTML = '<i class="fas fa-exclamation-circle text-info"></i>';
                statusText.innerHTML = '<strong>Partial Contract Connection</strong><br><small class="text-muted">Some contracts responding</small>';
                contractStatus.className = 'card border-info border-0 shadow-sm';
            }
            
            // Update contract addresses display
            this.updateContractAddressDisplay();
            
        } catch (error) {
            console.error('Status update failed:', error);
            document.getElementById('statusSpinner').style.display = 'none';
            document.getElementById('statusIcon').style.display = 'inline';
            document.getElementById('statusIcon').innerHTML = '<i class="fas fa-times-circle text-danger"></i>';
            document.getElementById('statusText').innerHTML = '<strong>Connection Error</strong><br><small class="text-muted">Cannot communicate with blockchain</small>';
            document.getElementById('contractStatus').className = 'card border-danger border-0 shadow-sm';
        }
    }
    
    updateContractAddressDisplay() {
        if (this.contractAddresses) {
            document.getElementById('authorityAddr').textContent = this.formatAddress(this.contractAddresses.authority);
            document.getElementById('escrowAddr').textContent = this.formatAddress(this.contractAddresses.escrow);
            document.getElementById('chickenAddr').textContent = this.formatAddress(this.contractAddresses.tCHICKEN);
            document.getElementById('eggAddr').textContent = this.formatAddress(this.contractAddresses.tEGG);
            document.getElementById('idrAddr').textContent = this.formatAddress(this.contractAddresses.tIDR);
        }
    }

    parseOrderDataSafely(orderData) {
        try {
            // Parse the hex response manually to avoid BigInt overflow
            if (!orderData || orderData === '0x') {
                return null;
            }

            // Remove '0x' prefix
            const hex = orderData.slice(2);
            
            // Each field is 32 bytes (64 hex chars)
            const fieldSize = 64;
            let offset = 0;

            const parseAddress = (hexData, position) => {
                const addressHex = hexData.substr(position, fieldSize);
                return '0x' + addressHex.slice(24); // Take last 20 bytes for address
            };

            const parseUint256 = (hexData, position) => {
                const numberHex = hexData.substr(position, fieldSize);
                return '0x' + numberHex;
            };

            const parseBool = (hexData, position) => {
                const boolHex = hexData.substr(position, fieldSize);
                return parseInt(boolHex.slice(-1), 16) === 1;
            };

            // CORRECTED Order struct fields (from contract):
            // address buyer, address seller, address paymentToken  
            // address[] assetTokens, uint256[] assetAmounts (these are pointers/lengths in simple ABI)
            // uint256 paymentAmount, uint256 expirationTime
            // bool paymentDeposited, bool assetsDelivered, bool buyerVerified
            // bool sellerVerified, bool authorityVerified, bool completed, bool cancelled

            const buyer = parseAddress(hex, offset); offset += fieldSize;
            const seller = parseAddress(hex, offset); offset += fieldSize;
            const paymentToken = parseAddress(hex, offset); offset += fieldSize;

            // The arrays are encoded differently - for this simple case they appear to be empty
            // so we see: arrayPointer1, arrayPointer2, then actual fields
            const arrayPointer1 = parseUint256(hex, offset); offset += fieldSize;
            const arrayPointer2 = parseUint256(hex, offset); offset += fieldSize;
            
            // Now we're at the actual order data
            const paymentAmount = parseUint256(hex, offset); offset += fieldSize;
            const expirationTime = parseUint256(hex, offset); offset += fieldSize;
            
            // Parse boolean fields
            const paymentDeposited = parseBool(hex, offset); offset += fieldSize;
            const assetsDelivered = parseBool(hex, offset); offset += fieldSize;
            const buyerVerified = parseBool(hex, offset); offset += fieldSize;
            const sellerVerified = parseBool(hex, offset); offset += fieldSize;
            const authorityVerified = parseBool(hex, offset); offset += fieldSize;
            const completed = parseBool(hex, offset); offset += fieldSize;
            const cancelled = parseBool(hex, offset);

            return {
                buyer,
                seller,
                paymentToken,
                paymentAmount,
                expirationTime,
                paymentDeposited,
                assetsDelivered,
                buyerVerified,
                sellerVerified,
                authorityVerified,
                completed,
                cancelled,
                assetTokens: [], // We'll populate this from local data if needed
                assetAmounts: []  // We'll populate this from local data if needed
            };

        } catch (error) {
            console.error('Error parsing order data safely:', error);
            return null;
        }
    }
    
    async refreshContractConnection() {
        console.log('Refreshing contract connection...');
        
        // Show loading state
        document.getElementById('statusSpinner').style.display = 'inline-block';
        document.getElementById('statusIcon').style.display = 'none';
        document.getElementById('statusText').innerHTML = '<strong>Refreshing Contracts...</strong><br><small class="text-muted">Reloading addresses and testing connections</small>';
        
        try {
            // Reload contract addresses
            await this.loadContractAddresses();
            
            // Reconnect to blockchain and setup contracts
            await this.connectToBlockchain();
            
            // Update status
            await this.updateContractStatus();
            
            // Refresh balances if wallet is selected
            if (this.currentWallet) {
                await this.refreshBalances();
            }
            
            this.showToast('Contract connection refreshed successfully!', 'success');
            
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showToast('Failed to refresh contract connection', 'error');
        }
    }

    async redeployContracts() {
        console.log('Triggering contract redeploy...');
        
        // Disable the redeploy button to prevent multiple clicks
        const redeployBtn = document.getElementById('redeployBtn');
        const originalHTML = redeployBtn.innerHTML;
        redeployBtn.disabled = true;
        redeployBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Deploying...';
        
        // Show loading state
        document.getElementById('statusSpinner').style.display = 'inline-block';
        document.getElementById('statusIcon').style.display = 'none';
        document.getElementById('statusText').innerHTML = '<strong>Redeploying Contracts...</strong><br><small class="text-muted">This may take 30-60 seconds</small>';
        
        try {
            // Trigger the Clean Deploy workflow
            const response = await fetch('/api/redeploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Deployment failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Deployment triggered:', result);
            
            // Poll for deployment completion
            await this.waitForDeploymentCompletion();
            
            // Reload contract addresses
            await this.loadContractAddresses();
            
            // Reconnect to blockchain and setup contracts
            await this.connectToBlockchain();
            
            // Update status
            await this.updateContractStatus();
            
            // Refresh balances if wallet is selected
            if (this.currentWallet) {
                await this.refreshBalances();
            }
            
            this.showToast('Contracts redeployed successfully!', 'success');
            
        } catch (error) {
            console.error('Redeploy failed:', error);
            this.showToast(`Failed to redeploy contracts: ${error.message}`, 'error');
        } finally {
            // Re-enable the redeploy button
            redeployBtn.disabled = false;
            redeployBtn.innerHTML = originalHTML;
        }
    }

    async waitForDeploymentCompletion() {
        console.log('Waiting for deployment to complete...');
        
        const maxAttempts = 30; // 30 attempts = ~60 seconds with 2-second intervals
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                // Check if new contract addresses are available
                const response = await fetch('/contract-addresses.json?t=' + Date.now());
                if (response.ok) {
                    const addresses = await response.json();
                    const deployedAt = new Date(addresses.deployedAt);
                    const now = new Date();
                    
                    // If deployment is recent (within last 2 minutes), consider it complete
                    if (now - deployedAt < 120000) {
                        console.log('Deployment detected as complete');
                        return;
                    }
                }
            } catch (error) {
                console.log('Still waiting for deployment...', error.message);
            }
            
            // Update status message to show progress
            const dots = '.'.repeat((attempts % 3) + 1);
            document.getElementById('statusText').innerHTML = `<strong>Redeploying Contracts${dots}</strong><br><small class="text-muted">This may take 30-60 seconds (${attempts + 1}/${maxAttempts})</small>`;
            
            // Wait 2 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }
        
        console.log('Deployment timeout reached, proceeding anyway');
    }
    
    startStatusUpdates() {
        // Update status immediately
        this.updateContractStatus();
        
        // Update every 10 seconds
        this.statusInterval = setInterval(() => {
            this.updateContractStatus();
        }, 10000);
    }
    
    stopStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
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

    // Get order data from contract and combine with local data if available
    async getOrderData(orderId) {
        try {
            // First check if we have local order data (for newly created orders)
            if (this.localOrders.has(orderId)) {
                const localOrder = this.localOrders.get(orderId);
                // If local order is missing critical status fields, remove it and query contract instead
                if (localOrder.paymentDeposited === undefined) {
                    console.log(`Local order ${orderId} missing status fields, clearing cache...`);
                    this.localOrders.delete(orderId);
                } else {
                    return localOrder;
                }
            }
            
            // Query the actual contract for real order status using safe low-level call
            console.log(`Querying contract for order ${orderId}...`);
            const orderData = await this.web3.eth.call({
                to: this.contractAddresses.escrow,
                data: this.web3.eth.abi.encodeFunctionCall({
                    name: 'orders',
                    type: 'function',
                    inputs: [{'name': 'orderId', 'type': 'uint256'}]
                }, [orderId])
            });
            
            console.log(`Raw contract data for order ${orderId}:`, orderData);
            
            // Parse the hex data manually to avoid automatic BigNumber conversion
            const contractOrder = this.parseOrderDataSafely(orderData);
            
            console.log(`Parsed contract order ${orderId}:`, contractOrder);
            
            // If parsing failed, return null
            if (!contractOrder) {
                return null;
            }
            
            // Use actual contract data for all orders
            if (contractOrder.buyer !== '0x0000000000000000000000000000000000000000') {
                // Determine asset type from payment token address
                let assetType = 'Unknown';
                let quantity = '0';
                let totalCost = '0';
                
                // Extract payment amount safely (avoid BigInt issues)
                if (contractOrder.paymentAmount && contractOrder.paymentAmount !== '0x0') {
                    try {
                        totalCost = this.web3.utils.fromWei(contractOrder.paymentAmount, 'ether');
                    } catch (e) {
                        console.warn('Could not parse payment amount:', e);
                        totalCost = 'Unknown';
                    }
                }
                
                // Check against known contract addresses to determine asset type
                if (contractOrder.paymentToken) {
                    const paymentToken = contractOrder.paymentToken.toLowerCase();
                    if (paymentToken === this.contractAddresses.tIDR.toLowerCase()) {
                        // This is an asset purchase order, need to determine what asset was bought
                        // For now, we'll use the local order data if available, or try to infer
                        
                        // Check if we have local order data for this order
                        if (this.localOrders.has(orderId)) {
                            const localOrder = this.localOrders.get(orderId);
                            assetType = localOrder.assetType || 'Unknown';
                            quantity = localOrder.quantity || '0';
                            totalCost = localOrder.totalCost || totalCost;
                        } else {
                            // Try to infer from recent order creation if this is order 0
                            // Based on the most recent minting activity
                            assetType = 'Agricultural Asset'; // Generic fallback
                        }
                    }
                }
                
                return {
                    id: orderId,
                    buyer: contractOrder.buyer,
                    seller: contractOrder.seller,
                    assetType: assetType,
                    quantity: quantity,
                    totalCost: totalCost,
                    assetTokens: contractOrder.assetTokens || [],
                    assetAmounts: contractOrder.assetAmounts || [],
                    paymentAmount: contractOrder.paymentAmount,
                    paymentDeposited: contractOrder.paymentDeposited,
                    assetsDelivered: contractOrder.assetsDelivered,
                    completed: contractOrder.completed,
                    cancelled: contractOrder.cancelled,
                    createdAt: new Date().toISOString()
                };
            }
            
            return null;
        } catch (error) {
            console.error(`Failed to get order ${orderId}:`, error);
            return null;
        }
    }



    async updateFarmerOrders() {
        if (!this.currentWallet || this.currentWallet.type !== 'farmer' || !this.currentWallet.address) {
            console.log('Farmer orders update skipped - wallet not ready:', this.currentWallet);
            return;
        }

        try {
            const orderCounter = await this.contracts.escrow.methods.orderCounter().call();
            const farmerOrdersList = document.getElementById('farmerOrdersList');
            const orders = [];

            // Check each order to see if it belongs to current farmer and needs delivery
            for (let i = 0; i < parseInt(orderCounter); i++) {
                try {
                    // Use enhanced order fetching
                    const order = await this.getOrderData(i);
                    
                    console.log(`DEBUG: Checking order ${i}:`, {
                        orderExists: !!order,
                        orderSeller: order?.seller,
                        currentWallet: this.currentWallet?.address,
                        orderPaymentDeposited: order?.paymentDeposited,
                        orderAssetsDelivered: order?.assetsDelivered,
                        orderCompleted: order?.completed,
                        orderCancelled: order?.cancelled,
                        addressesMatch: order?.seller?.toLowerCase() === this.currentWallet?.address?.toLowerCase(),
                        willShowOrder: order && order.seller && this.currentWallet && this.currentWallet.address && 
                                      order.seller.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                                      order.paymentDeposited && !order.assetsDelivered && !order.completed && !order.cancelled
                    });
                    
                    // Check if this order is for current farmer and payment is deposited but assets not delivered
                    if (order && order.seller && this.currentWallet && this.currentWallet.address && 
                        order.seller.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                        order.paymentDeposited && !order.assetsDelivered && !order.completed && !order.cancelled) {
                        
                        // Get asset token details from order data
                        let assetType = 'Unknown';
                        let quantity = '0';
                        
                        if (order.assetType) {
                            // Use stored asset type from order
                            if (order.assetType === 'tCHICKEN') assetType = '🐔 Chickens';
                            else if (order.assetType === 'tEGG') assetType = '🥚 Eggs';
                            quantity = order.quantity || '0';
                        } else if (order.assetTokens && order.assetTokens.length > 0) {
                            // Fallback to token address detection
                            const assetAddress = order.assetTokens[0];
                            if (assetAddress.toLowerCase() === this.contractAddresses.tCHICKEN.toLowerCase()) assetType = '🐔 Chickens';
                            else if (assetAddress.toLowerCase() === this.contractAddresses.tEGG.toLowerCase()) assetType = '🥚 Eggs';
                            
                            if (order.assetAmounts && order.assetAmounts.length > 0) {
                                quantity = this.web3.utils.fromWei(order.assetAmounts[0].toString(), 'ether');
                            }
                        }
                        
                        const customerName = this.getCustomerName(order.buyer);
                        
                        orders.push({
                            id: i,
                            assetType,
                            quantity,
                            customer: customerName,
                            paymentDeposited: order.paymentDeposited,
                            assetsDelivered: order.assetsDelivered
                        });
                    }
                } catch (orderError) {
                    console.log(`Error parsing farmer order ${i}:`, orderError.message);
                    continue;
                }
            }

            // Update UI
            if (orders.length === 0) {
                farmerOrdersList.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No pending orders</td></tr>';
            } else {
                farmerOrdersList.innerHTML = orders.map(order => {
                    return `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.assetType}</td>
                            <td>${parseFloat(order.quantity).toLocaleString()}</td>
                            <td>${order.customer}</td>
                            <td><span class="badge bg-warning">Payment Received</span></td>
                            <td>
                                <button class="btn btn-sm btn-success" onclick="window.demoApp.deliverAssets(${order.id})">
                                    <i class="fas fa-truck"></i> Deliver
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

        } catch (error) {
            console.error('Failed to update farmer orders:', error);
            document.getElementById('farmerOrdersList').innerHTML = 
                '<tr><td colspan="6" class="text-center text-danger">Error loading orders</td></tr>';
        }
    }

    async deliverAssets(orderId) {
        if (!this.currentWallet || this.currentWallet.type !== 'farmer') {
            this.showToast('Only farmers can deliver assets', 'error');
            return;
        }

        try {
            this.showLoading('Preparing asset delivery...');

            const account = this.web3.eth.accounts.privateKeyToAccount(this.currentWallet.privateKey);
            this.web3.eth.accounts.wallet.add(account);

            // First, get the order details to know which tokens and amounts are needed
            const order = await this.getOrderData(orderId);
            if (!order || !order.assetTokens || order.assetTokens.length === 0) {
                throw new Error('Order not found or invalid');
            }

            // For each asset token, check balance and approve if needed
            for (let i = 0; i < order.assetTokens.length; i++) {
                const tokenAddress = order.assetTokens[i];
                const requiredAmount = order.assetAmounts[i];
                
                // Determine which token contract to use
                let tokenContract;
                if (tokenAddress.toLowerCase() === this.contractAddresses.tCHICKEN.toLowerCase()) {
                    tokenContract = this.contracts.tCHICKEN;
                } else if (tokenAddress.toLowerCase() === this.contractAddresses.tEGG.toLowerCase()) {
                    tokenContract = this.contracts.tEGG;
                } else {
                    console.warn(`Unknown token address: ${tokenAddress}`);
                    continue;
                }

                // Check current balance
                const balance = await tokenContract.methods.balanceOf(account.address).call();
                if (this.web3.utils.toBN(balance).lt(this.web3.utils.toBN(requiredAmount))) {
                    throw new Error(`Insufficient ${tokenAddress === this.contractAddresses.tCHICKEN ? 'chicken' : 'egg'} tokens. Need ${this.web3.utils.fromWei(requiredAmount, 'ether')} but have ${this.web3.utils.fromWei(balance, 'ether')}`);
                }

                // Check current allowance
                const allowance = await tokenContract.methods.allowance(account.address, this.contractAddresses.escrow).call();
                if (this.web3.utils.toBN(allowance).lt(this.web3.utils.toBN(requiredAmount))) {
                    this.showLoading(`Approving ${tokenAddress === this.contractAddresses.tCHICKEN ? 'chicken' : 'egg'} tokens...`);
                    
                    // Approve the escrow contract to spend the required amount
                    const approveTx = tokenContract.methods.approve(this.contractAddresses.escrow, requiredAmount);
                    const approveGas = await approveTx.estimateGas({ from: account.address });
                    
                    await approveTx.send({
                        from: account.address,
                        gas: Math.floor(approveGas * 1.2),
                        gasPrice: await this.web3.eth.getGasPrice()
                    });
                }
            }

            this.showLoading('Delivering assets to escrow...');

            // Now call the deliverAssets function on the escrow contract
            const tx = this.contracts.escrow.methods.deliverAssets(orderId);
            
            const gas = await tx.estimateGas({ from: account.address });
            const gasPrice = await this.web3.eth.getGasPrice();

            const receipt = await tx.send({
                from: account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            this.hideLoading();
            this.showSuccess(`Assets delivered for order #${orderId}`, receipt.transactionHash);
            
            // Refresh both farmer and kitchen order lists
            this.updateFarmerOrders();
            this.updateActiveOrders();
            
        } catch (error) {
            this.hideLoading();
            console.error('Delivery failed:', error);
            this.showToast(`Failed to deliver assets: ${error.message}`, 'error');
        }
    }

    async updateKitchenOrders() {
        if (!this.currentWallet || this.currentWallet.type !== 'kitchen' || !this.currentWallet.address) {
            console.log('Kitchen orders update skipped - wallet not ready:', this.currentWallet);
            return;
        }

        try {
            const orderCounter = await this.contracts.escrow.methods.orderCounter().call();
            const kitchenOrdersList = document.getElementById('activeOrdersList');
            const orders = [];

            // Check each order to see if it belongs to current kitchen (as buyer)
            for (let i = 0; i < parseInt(orderCounter); i++) {
                try {
                    // Use enhanced order fetching
                    const order = await this.getOrderData(i);
                    
                    console.log(`DEBUG: Kitchen checking order ${i}:`, {
                        orderExists: !!order,
                        orderBuyer: order?.buyer,
                        currentWallet: this.currentWallet?.address,
                        orderPaymentDeposited: order?.paymentDeposited,
                        orderAssetsDelivered: order?.assetsDelivered,
                        orderCompleted: order?.completed,
                        orderCancelled: order?.cancelled,
                        addressesMatch: order?.buyer?.toLowerCase() === this.currentWallet?.address?.toLowerCase(),
                        willShowOrder: order && order.buyer && this.currentWallet && this.currentWallet.address && 
                                      order.buyer.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                                      !order.cancelled
                    });
                    
                    // Check if this order belongs to current kitchen as buyer and is not cancelled
                    if (order && order.buyer && this.currentWallet && this.currentWallet.address && 
                        order.buyer.toLowerCase() === this.currentWallet.address.toLowerCase() && 
                        !order.cancelled) {
                        
                        // Get asset token details from order data
                        let assetType = 'Unknown';
                        let quantity = '0';
                        
                        if (order.assetType) {
                            // Use stored asset type from order
                            if (order.assetType === 'tCHICKEN') assetType = '🐔 Chickens';
                            else if (order.assetType === 'tEGG') assetType = '🥚 Eggs';
                            quantity = order.quantity || '0';
                        }
                        
                        // Get supplier name
                        const supplierName = this.getSupplierName(order.seller);
                        
                        orders.push({
                            id: i,
                            assetType,
                            quantity,
                            totalPayment: order.totalCost || '0',
                            supplier: supplierName,
                            seller: order.seller,
                            paymentDeposited: order.paymentDeposited,
                            assetsDelivered: order.assetsDelivered,
                            completed: order.completed,
                            cancelled: order.cancelled
                        });
                    }
                } catch (orderError) {
                    console.log(`Error parsing kitchen order ${i}:`, orderError.message);
                    continue;
                }
            }

            // Update UI
            if (orders.length === 0) {
                kitchenOrdersList.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No orders found</td></tr>';
            } else {
                kitchenOrdersList.innerHTML = orders.map(order => {
                    const status = this.getKitchenOrderStatus(order);
                    return `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.assetType}</td>
                            <td>${this.formatNumber(order.quantity)}</td>
                            <td>${this.formatNumber(order.totalPayment)} tIDR</td>
                            <td>${order.supplier}</td>
                            <td><span class="badge ${status.class}">${status.text}</span></td>
                            <td>-</td>
                        </tr>
                    `;
                }).join('');
            }

        } catch (error) {
            console.error('Failed to update kitchen orders:', error);
            const kitchenOrdersList = document.getElementById('activeOrdersList');
            if (kitchenOrdersList) {
                kitchenOrdersList.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading orders</td></tr>';
            }
        }
    }

    getKitchenOrderStatus(order) {
        if (order.completed) {
            return { text: 'Completed', class: 'bg-success' };
        } else if (order.cancelled) {
            return { text: 'Cancelled', class: 'bg-danger' };
        } else if (order.assetsDelivered) {
            return { text: 'Delivered', class: 'bg-info' };
        } else if (order.paymentDeposited) {
            return { text: 'Awaiting Delivery', class: 'bg-warning' };
        } else {
            return { text: 'Payment Pending', class: 'bg-secondary' };
        }
    }

    getSupplierName(address) {
        const suppliers = {
            [this.demoWallets.farmer_a.address.toLowerCase()]: 'Happy Farm Supplier A',
            [this.demoWallets.farmer_b.address.toLowerCase()]: 'Green Valley Farm B',  
            [this.demoWallets.farmer_c.address.toLowerCase()]: 'Sunrise Poultry C'
        };
        return suppliers[address.toLowerCase()] || this.formatAddress(address);
    }

    getCustomerName(address) {
        const customers = {
            [this.demoWallets.kitchen_a.address.toLowerCase()]: 'Kitchen Alpha',
            [this.demoWallets.kitchen_b.address.toLowerCase()]: 'Kitchen Beta'
        };
        return customers[address.toLowerCase()] || this.formatAddress(address);
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