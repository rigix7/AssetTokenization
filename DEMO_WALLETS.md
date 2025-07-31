# Demo Wallets for Agricultural Asset Tokenization Platform

This document provides the complete wallet configuration for stakeholder demonstrations. Each wallet is pre-configured with appropriate roles, permissions, and initial token balances.

## 🎭 Demo Roles Overview

### 👔 Authority & Management
| Role | Name | Address | Purpose |
|------|------|---------|---------|
| **Central Authority** | Platform Admin | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Token minting, governance |
| **Independent Auditor** | Verifier | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | Asset verification |
| **Platform Operator** | Operations | `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` | Day-to-day management |

### 🚜 Farmers (Asset Producers)
| Farm | Owner | Address | Initial Assets |
|------|-------|---------|----------------|
| **Happy Farm Supplier A** | Large Producer | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 1,000 tCHICKEN, 5,000 tEGG |
| **Green Valley Farm B** | Medium Producer | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 600 tCHICKEN, 3,000 tEGG |
| **Sunrise Poultry C** | Small Organic | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 200 tCHICKEN, 1,200 tEGG |

### 🍳 Kitchens (Asset Buyers)
| Kitchen | Type | Address | Initial Budget |
|---------|------|---------|----------------|
| **Central Kitchen Alpha** | Restaurant Chain | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 800M tIDR |
| **Central Kitchen Beta** | Hotel Chain | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | 500M tIDR |

## 🔑 Private Keys for MetaMask Import

**⚠️ SECURITY NOTICE: These are development keys only. Never use on mainnet or with real funds.**

### Authority & Management
```
Central Authority: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Independent Auditor: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e  
Platform Operator: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
```

### Farmers
```
Happy Farm A: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Green Valley B: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Sunrise Poultry C: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

### Kitchens  
```
Kitchen Alpha: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
Kitchen Beta: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

## 🎬 Demo Scenario Suggestions

### Scenario 1: Token Minting (Authority)
1. Switch to Central Authority wallet
2. Navigate to Authority panel
3. Mint new tokens for farmers
4. Show verification process

### Scenario 2: Farmer Inventory Management  
1. Switch to Happy Farm Supplier A wallet
2. Navigate to Farmers panel
3. Show current asset inventory (1,000 chickens, 5,000 eggs)
4. Demonstrate asset transfer to kitchen

### Scenario 3: Kitchen Procurement
1. Switch to Central Kitchen Alpha wallet  
2. Navigate to Kitchens panel
3. Show budget status (800M IDR available)
4. Place order for chicken and eggs

### Scenario 4: Cross-Role Trading
1. Kitchen places escrow order
2. Farmer delivers assets to escrow
3. Verifier approves the transaction
4. Show automatic token transfer

### Scenario 5: Multi-Language Demo
1. Use language switcher (globe icon in nav)
2. Switch between English and Bahasa Indonesia
3. Show how all text translates while preserving functionality

## 📱 MetaMask Setup Instructions

### 1. Import Demo Wallet
1. Open MetaMask
2. Click account menu → "Import Account"
3. Select "Private Key"
4. Paste private key for desired role
5. Click "Import"

### 2. Add Local Network
1. Go to Settings → Networks → Add Network
2. **Network Name**: Hardhat Local
3. **RPC URL**: http://localhost:8545
4. **Chain ID**: 31337
5. **Currency Symbol**: ETH

### 3. Switch Between Roles
- Use multiple browser tabs/profiles for different roles
- Or switch accounts in MetaMask for same browser
- Each wallet starts with 10,000 ETH for gas fees

## 🔧 Setup Commands

To prepare demo environment:

```bash
# Start local blockchain
npm run start:node

# Deploy contracts and setup initial state
npm run deploy:local

# Setup demo roles and balances
npx hardhat run scripts/setup-demo-roles.ts --network localhost

# Start web interface
npm run start:web
```

## 📊 Demo Flow Checklist

- [ ] Local blockchain running (port 8545)
- [ ] Contracts deployed successfully  
- [ ] Demo wallets imported to MetaMask
- [ ] Web interface accessible (port 5000)
- [ ] Language switcher tested
- [ ] All role-specific interfaces working
- [ ] Token balances showing correctly
- [ ] Escrow transactions functional

## 💡 Demo Tips

### For Effective Presentations:
- **Start with Authority** - Show platform setup and governance
- **Move to Farmers** - Demonstrate asset tokenization and inventory
- **Switch to Kitchens** - Show procurement and budget management  
- **Use Verifier** - Demonstrate compliance and verification
- **Show Translations** - Switch languages to show bilingual support

### Technical Notes:
- All wallets use Hardhat's deterministic addresses
- Private keys are publicly known (development only)
- Token expiry dates are pre-configured (chickens: 30 days, eggs: 14 days, IDR: 90 days)
- Escrow system includes 1% platform fee
- All transactions are on local blockchain for fast execution

## 🚀 Ready for Demo!

Your platform now supports dedicated wallets for each stakeholder type, making demonstrations more organized and realistic. Each role has appropriate starting balances and permissions to showcase their part of the agricultural tokenization ecosystem.