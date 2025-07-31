import hre from "hardhat";
const { ethers } = hre;
import { SimpleCentralAuthority, SimpleAgricultureToken } from "../typechain-types";

// Setup script for assigning roles and initial tokens to demo wallets
// This ensures each wallet has appropriate permissions and starting balances

async function setupDemoRoles() {
    console.log("🎭 Setting up Demo Roles and Initial Balances");
    console.log("=" .repeat(60));

    // Get deployed contract addresses (these will be set by deployment)
    const contracts = {
        authority: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        tCHICKEN: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 
        tEGG: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        tIDR: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
    };

    // Demo wallet addresses (deterministic generation)
    const demoWallets = {
        authority: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Authority
        farmerA: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",    // Happy Farm Supplier A
        farmerB: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",    // Green Valley Farm B
        farmerC: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",    // Sunrise Poultry C
        kitchenA: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",   // Central Kitchen Alpha
        kitchenB: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",   // Central Kitchen Beta
        verifier: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",  // Independent Auditor
        operator: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"   // Platform Operator
    };

    const [deployer] = await ethers.getSigners();
    console.log(`🚀 Setting up with deployer: ${deployer.address}\n`);

    // Connect to contracts
    const authority = await ethers.getContractAt("SimpleCentralAuthority", contracts.authority) as SimpleCentralAuthority;
    const tCHICKEN = await ethers.getContractAt("SimpleAgricultureToken", contracts.tCHICKEN) as SimpleAgricultureToken;
    const tEGG = await ethers.getContractAt("SimpleAgricultureToken", contracts.tEGG) as SimpleAgricultureToken;
    const tIDR = await ethers.getContractAt("SimpleAgricultureToken", contracts.tIDR) as SimpleAgricultureToken;

    console.log("👔 Setting up Authority roles...");
    
    try {
        // Grant verifier role to independent auditor
        await authority.grantRole(await authority.VERIFIER_ROLE(), demoWallets.verifier);
        console.log(`✅ Verifier role granted to: ${demoWallets.verifier}`);
        
        // Grant operator role to platform operator
        await authority.grantRole(await authority.OPERATOR_ROLE(), demoWallets.operator);
        console.log(`✅ Operator role granted to: ${demoWallets.operator}`);
    } catch (error) {
        console.log("ℹ️  Roles may already be assigned");
    }

    console.log("\n🚜 Setting up Farmer inventories...");
    
    // Farmer A - Large operation (1000 chickens, 5000 eggs)
    await mintTokensForAddress(authority, demoWallets.farmerA, "CHICKEN", 1000, 30);
    await mintTokensForAddress(authority, demoWallets.farmerA, "EGG", 5000, 14);
    console.log(`✅ Farmer A (Happy Farm): 1000 tCHICKEN, 5000 tEGG`);

    // Farmer B - Medium operation (600 chickens, 3000 eggs)  
    await mintTokensForAddress(authority, demoWallets.farmerB, "CHICKEN", 600, 30);
    await mintTokensForAddress(authority, demoWallets.farmerB, "EGG", 3000, 14);
    console.log(`✅ Farmer B (Green Valley): 600 tCHICKEN, 3000 tEGG`);

    // Farmer C - Small organic operation (200 chickens, 1200 eggs)
    await mintTokensForAddress(authority, demoWallets.farmerC, "CHICKEN", 200, 30);
    await mintTokensForAddress(authority, demoWallets.farmerC, "EGG", 1200, 14);
    console.log(`✅ Farmer C (Sunrise Poultry): 200 tCHICKEN, 1200 tEGG`);

    console.log("\n🍳 Setting up Kitchen budgets...");
    
    // Kitchen A - Large chain (800M IDR budget)
    await mintTokensForAddress(authority, demoWallets.kitchenA, "IDR", 800000000, 90);
    console.log(`✅ Kitchen A (Restaurant Chain): 800M tIDR budget`);

    // Kitchen B - Hotel chain (500M IDR budget)
    await mintTokensForAddress(authority, demoWallets.kitchenB, "IDR", 500000000, 90);
    console.log(`✅ Kitchen B (Hotel Chain): 500M tIDR budget`);

    console.log("\n📊 Final Demo Setup Summary:");
    console.log("=" .repeat(50));
    
    // Display all balances
    console.log("\n👔 Authority & Management:");
    console.log(`   Authority: ${demoWallets.authority}`);
    console.log(`   Verifier: ${demoWallets.verifier}`);
    console.log(`   Operator: ${demoWallets.operator}`);
    
    console.log("\n🚜 Farmers (Asset Producers):");
    const farmerAChicken = await tCHICKEN.balanceOf(demoWallets.farmerA);
    const farmerAEgg = await tEGG.balanceOf(demoWallets.farmerA);
    console.log(`   Farmer A: ${ethers.formatEther(farmerAChicken)} tCHICKEN, ${ethers.formatEther(farmerAEgg)} tEGG`);
    
    const farmerBChicken = await tCHICKEN.balanceOf(demoWallets.farmerB);
    const farmerBEgg = await tEGG.balanceOf(demoWallets.farmerB);
    console.log(`   Farmer B: ${ethers.formatEther(farmerBChicken)} tCHICKEN, ${ethers.formatEther(farmerBEgg)} tEGG`);
    
    const farmerCChicken = await tCHICKEN.balanceOf(demoWallets.farmerC);
    const farmerCEgg = await tEGG.balanceOf(demoWallets.farmerC);
    console.log(`   Farmer C: ${ethers.formatEther(farmerCChicken)} tCHICKEN, ${ethers.formatEther(farmerCEgg)} tEGG`);
    
    console.log("\n🍳 Kitchens (Asset Buyers):");
    const kitchenABudget = await tIDR.balanceOf(demoWallets.kitchenA);
    console.log(`   Kitchen A: ${ethers.formatEther(kitchenABudget)} tIDR budget`);
    
    const kitchenBBudget = await tIDR.balanceOf(demoWallets.kitchenB);
    console.log(`   Kitchen B: ${ethers.formatEther(kitchenBBudget)} tIDR budget`);

    console.log("\n🎬 Demo wallets are ready for stakeholder presentations!");
    console.log("💡 Each role can now demonstrate their part of the platform");
}

async function mintTokensForAddress(
    authority: SimpleCentralAuthority,
    recipient: string,
    tokenType: string,
    amount: number,
    expiryDays: number
) {
    try {
        const tx = await authority.verifyAndMintTokens(
            tokenType,
            ethers.parseEther(amount.toString()),
            recipient,
            expiryDays
        );
        await tx.wait();
    } catch (error) {
        // Token may already be minted
        console.log(`ℹ️  Tokens may already exist for ${recipient}`);
    }
}

// Export demo wallet configuration for frontend
export function getDemoWalletInfo() {
    return {
        roles: [
            {
                role: "Authority",
                name: "Central Authority",
                address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
                description: "Platform governance and token minting"
            },
            {
                role: "Farmer A",
                name: "Happy Farm Supplier",
                address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
                description: "Large chicken farm - 1000 birds"
            },
            {
                role: "Farmer B", 
                name: "Green Valley Farm",
                address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
                description: "Medium egg producer - 500 hens"
            },
            {
                role: "Farmer C",
                name: "Sunrise Poultry",
                address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
                description: "Small organic farm - 200 birds"
            },
            {
                role: "Kitchen A",
                name: "Central Kitchen Alpha",
                address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
                privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
                description: "Restaurant chain procurement"
            },
            {
                role: "Kitchen B",
                name: "Central Kitchen Beta", 
                address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
                privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
                description: "Hotel chain food service"
            },
            {
                role: "Verifier",
                name: "Independent Auditor",
                address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
                privateKey: "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
                description: "Third-party asset verification"
            },
            {
                role: "Operator",
                name: "Platform Operator",
                address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
                privateKey: "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
                description: "Day-to-day operations"
            }
        ]
    };
}

// Main execution
if (require.main === module) {
    setupDemoRoles()
        .then(() => {
            console.log("\n✅ Demo role setup complete!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Error setting up demo roles:", error);
            process.exit(1);
        });
}