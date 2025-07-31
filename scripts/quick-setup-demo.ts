import { ethers } from "hardhat";

async function quickSetupDemo() {
  console.log("🎬 Quick Demo Setup - Initializing stakeholder presentation...\n");

  const [deployer, supplier, buyer, kitchen] = await ethers.getSigners();
  
  // Check if contracts are already deployed by trying to connect to known addresses
  try {
    // Try to connect to existing contracts first
    const knownCentralAuthority = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const centralAuthority = await ethers.getContractAt("SimpleCentralAuthority", knownCentralAuthority);
    
    // Test connection
    await centralAuthority.owner();
    console.log("✅ Found existing contracts - demo ready!");
    
    // Display current balances
    const tChickenToken = await ethers.getContractAt("SimpleAgricultureToken", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    const tEggToken = await ethers.getContractAt("SimpleAgricultureToken", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
    const tIdrToken = await ethers.getContractAt("SimpleAgricultureToken", "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
    
    const supplierChickens = await tChickenToken.balanceOf(supplier.address);
    const supplierEggs = await tEggToken.balanceOf(supplier.address);
    const kitchenIDR = await tIdrToken.balanceOf(kitchen.address);
    const kitchenChickens = await tChickenToken.balanceOf(kitchen.address);
    const kitchenEggs = await tEggToken.balanceOf(kitchen.address);
    
    console.log("\n📊 Current Demo State:");
    console.log("🚜 Supplier Assets:");
    console.log(`   🐔 tCHICKEN: ${ethers.formatUnits(supplierChickens, 0)}`);
    console.log(`   🥚 tEGG: ${ethers.formatUnits(supplierEggs, 0)}`);
    console.log("\n🍳 Kitchen Assets:");
    console.log(`   💰 tIDR: ${ethers.formatUnits(kitchenIDR, 0)}`);
    console.log(`   🐔 tCHICKEN: ${ethers.formatUnits(kitchenChickens, 0)}`);
    console.log(`   🥚 tEGG: ${ethers.formatUnits(kitchenEggs, 0)}`);
    
    console.log("\n🎯 Demo is ready for stakeholder presentation!");
    
  } catch (error) {
    console.log("⚠️  Contracts not found - running full deployment...");
    
    // Run full deployment script if contracts don't exist
    const { spawn } = require('child_process');
    const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy-and-setup.ts', '--network', 'localhost'], {
      stdio: 'inherit'
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log("\n🎉 Full setup complete - demo ready for stakeholders!");
      } else {
        console.log("\n❌ Setup failed - please check the deployment logs");
      }
    });
  }
}

// Allow this script to be run directly
if (require.main === module) {
  quickSetupDemo()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { quickSetupDemo };