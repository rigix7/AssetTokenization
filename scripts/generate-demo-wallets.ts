import hre from "hardhat";
import { ethers } from "ethers";

// Demo wallet generation for role-based presentations
// This script creates deterministic wallets for consistent demo scenarios

interface DemoWallet {
    role: string;
    name: string;
    address: string;
    privateKey: string;
    mnemonic: string;
}

async function generateDemoWallets(): Promise<DemoWallet[]> {
    console.log("🎭 Generating Demo Wallets for Agricultural Asset Tokenization Platform");
    console.log("=" .repeat(70));

    const wallets: DemoWallet[] = [];
    
    // Define roles and their participants
    const roleDefinitions = [
        { role: "Authority", name: "Central Authority", description: "Platform governance and verification" },
        { role: "Farmer", name: "Happy Farm Supplier A", description: "Large chicken farm with 1000+ birds" },
        { role: "Farmer", name: "Green Valley Farm B", description: "Medium egg producer, 500 hens" },
        { role: "Farmer", name: "Sunrise Poultry C", description: "Small organic farm, 200 birds" },
        { role: "Kitchen", name: "Central Kitchen Alpha", description: "Main restaurant chain procurement" },
        { role: "Kitchen", name: "Central Kitchen Beta", description: "Hotel chain food service" },
        { role: "Verifier", name: "Independent Auditor", description: "Third-party asset verification" },
        { role: "Operator", name: "Platform Operator", description: "Day-to-day operations management" }
    ];

    console.log("👥 Creating wallets for demo roles...\n");

    // Generate wallets with deterministic seeds for consistency
    for (let i = 0; i < roleDefinitions.length; i++) {
        const roleDef = roleDefinitions[i];
        
        // Use Hardhat's built-in accounts for consistency with existing deployment
        const accounts = [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Authority
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Farmer A
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Farmer B
            "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Farmer C
            "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Kitchen A
            "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Kitchen B
            "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Verifier
            "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"  // Operator
        ];
        
        const privateKeys = [
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", 
            "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
            "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
            "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
            "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
            "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
        ];
        
        const wallet = new ethers.Wallet(privateKeys[i]);
        
        const demoWallet: DemoWallet = {
            role: roleDef.role,
            name: roleDef.name,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase || "N/A"
        };
        
        wallets.push(demoWallet);
        
        console.log(`${getRoleEmoji(roleDef.role)} ${roleDef.role}: ${roleDef.name}`);
        console.log(`   Address: ${wallet.address}`);
        console.log(`   Description: ${roleDef.description}`);
        console.log(`   Private Key: ${wallet.privateKey.slice(0, 10)}...${wallet.privateKey.slice(-8)}`);
        console.log("");
    }

    return wallets;
}

function getRoleEmoji(role: string): string {
    switch (role) {
        case "Authority": return "👔";
        case "Farmer": return "🚜";
        case "Kitchen": return "🍳";
        case "Verifier": return "🔍";
        case "Operator": return "⚙️";
        default: return "👤";
    }
}

// Export wallet configuration for use in other scripts
export function getDemoWalletConfig() {
    return {
        authority: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Will be updated by actual generation
        farmers: [
            "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
        ],
        kitchens: [
            "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
            "0x0165878A594ca255338adfa4d48449f69242Eb8F"
        ],
        verifier: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
        operator: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
    };
}

async function createWalletGuide(wallets: DemoWallet[]) {
    console.log("\n📋 Demo Wallet Usage Guide");
    console.log("=" .repeat(50));
    console.log("\nFor MetaMask Import:");
    console.log("1. Open MetaMask");
    console.log("2. Click 'Import Account'");
    console.log("3. Select 'Private Key'");
    console.log("4. Paste the private key for your role");
    console.log("5. Connect to localhost:8545 network\n");

    console.log("🎯 Recommended Demo Flow:");
    console.log("1. Authority - Setup and mint initial tokens");
    console.log("2. Farmers - Receive asset tokens and showcase inventory");
    console.log("3. Kitchens - Place orders and manage budgets");
    console.log("4. Verifier - Approve transactions and verify assets");
    console.log("5. Show cross-role token transfers\n");

    console.log("💡 Demo Tips:");
    console.log("• Each wallet starts with 10,000 ETH for gas fees");
    console.log("• Use different browser tabs/profiles for each role");
    console.log("• Private keys are deterministic - same every time");
    console.log("• Switch wallets in MetaMask to show different perspectives");
}

// Main execution
if (require.main === module) {
    generateDemoWallets()
        .then(async (wallets) => {
            await createWalletGuide(wallets);
            
            console.log("\n✅ Demo wallet generation complete!");
            console.log("💾 Wallet details have been displayed above");
            console.log("🎬 Ready for stakeholder demonstrations!");
            
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Error generating demo wallets:", error);
            process.exit(1);
        });
}