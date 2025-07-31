# Agricultural Asset Tokenization Platform - Demo Guide

## For Stakeholder Presentations

### Quick Start for Demos

1. **Start the Environment**
   - The Hardhat blockchain and web interface will auto-start
   - Wait 30 seconds for full initialization

2. **Verify Demo Readiness**  
   - Check that "Demo Setup Check" workflow shows demo is ready
   - If contracts need redeployment, it will happen automatically

3. **Access the Platform**
   - Open the web interface at the provided URL
   - You'll see three user segments ready for demonstration

### Demo Flow for Stakeholders

#### Part 1: Authority Dashboard (Central Control)
1. Click "👔 Authority" in navigation
2. Show system overview with token statistics  
3. Demonstrate token minting capability
4. Show supplier management and verification system

#### Part 2: Farmers Dashboard (Asset Owners)
1. Click "🚜 Farmers" in navigation
2. Show current asset holdings (chickens and eggs)
3. Demonstrate asset expiry tracking (30 days chickens, 14 days eggs)
4. Show transfer capabilities to kitchens

#### Part 3: Kitchen Dashboard (Buyers)
1. Click "🍳 Kitchens" in navigation  
2. Show budget allocation (tIDR tokens)
3. Demonstrate order placement system
4. Show inventory management with expiry tracking

### Key Demo Points

**Expiry Management**
- Chickens expire in 30 days (food safety)
- Eggs expire in 14 days (freshness)  
- Budget tokens (tIDR) expire in 90 days (budget cycles)

**Compliance Features**
- All transfers require identity verification
- Asset backing verification by central authority
- Escrow-based secure trading

**Real-World Integration**
- Physical asset verification
- Supplier registration and approval
- Multi-party transaction verification

### Persistence Notes

**What Persists:**
- Smart contract code and interface
- System configuration and workflows

**What Resets (automatically restored):**
- Blockchain state and balances  
- Demo transaction history
- Contract deployment addresses

**For Consistent Demos:**
- The system automatically detects and restores demo state
- Fresh deployments include pre-loaded demo data
- All three user segments are immediately ready for presentation

### Troubleshooting

If demo data appears missing:
1. Wait for "Demo Setup Check" workflow to complete
2. Refresh the web interface  
3. Contract addresses may change but functionality remains identical

The platform is designed to provide a consistent stakeholder experience regardless of environment resets.