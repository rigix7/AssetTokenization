import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Starting clean deployment of Agricultural Asset Tokenization Platform...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Token expiry periods
  const chickenExpiryPeriod = 30 * 24 * 60 * 60; // 30 days in seconds
  const eggExpiryPeriod = 14 * 24 * 60 * 60; // 14 days in seconds
  const idrExpiryPeriod = 90 * 24 * 60 * 60; // 90 days in seconds

  console.log("\n📋 1. Deploying SimpleCentralAuthority...");
  const SimpleCentralAuthority = await ethers.getContractFactory("SimpleCentralAuthority");
  const centralAuthority = await SimpleCentralAuthority.deploy(deployer.address);
  await centralAuthority.waitForDeployment();
  console.log("✅ SimpleCentralAuthority deployed to:", await centralAuthority.getAddress());

  console.log("\n📋 2. Deploying Agricultural Tokens...");

  // Deploy tCHICKEN token
  const SimpleAgricultureToken = await ethers.getContractFactory("SimpleAgricultureToken");
  const tChickenToken = await SimpleAgricultureToken.deploy(
    "Tokenized Chicken",
    "tCHICKEN",
    "CHICKEN",
    await centralAuthority.getAddress(),
    deployer.address,
    chickenExpiryPeriod
  );
  await tChickenToken.waitForDeployment();
  console.log("🐔 tCHICKEN token deployed to:", await tChickenToken.getAddress());
  console.log("   Default expiry: 30 days");

  // Deploy tEGG token
  const tEggToken = await SimpleAgricultureToken.deploy(
    "Tokenized Egg",
    "tEGG",
    "EGG",
    await centralAuthority.getAddress(),
    deployer.address,
    eggExpiryPeriod
  );
  await tEggToken.waitForDeployment();
  console.log("🥚 tEGG token deployed to:", await tEggToken.getAddress());
  console.log("   Default expiry: 14 days");

  // Deploy tIDR token
  const tIdrToken = await SimpleAgricultureToken.deploy(
    "Tokenized IDR",
    "tIDR",
    "IDR",
    await centralAuthority.getAddress(),
    deployer.address,
    idrExpiryPeriod
  );
  await tIdrToken.waitForDeployment();
  console.log("💰 tIDR token deployed to:", await tIdrToken.getAddress());
  console.log("   Default expiry: 90 days (budget period)");

  console.log("\n📋 3. Deploying SimpleAssetEscrow...");
  const SimpleAssetEscrow = await ethers.getContractFactory("SimpleAssetEscrow");
  const assetEscrow = await SimpleAssetEscrow.deploy(
    await centralAuthority.getAddress(),
    deployer.address, // fee collector
    deployer.address  // owner
  );
  await assetEscrow.waitForDeployment();
  console.log("✅ SimpleAssetEscrow deployed to:", await assetEscrow.getAddress());

  console.log("\n⚙️  Setting up initial configuration...");
  console.log("📝 Registering tokens in central authority...");

  // Register tokens in central authority
  await centralAuthority.registerToken(await tChickenToken.getAddress(), "CHICKEN");
  await centralAuthority.registerToken(await tEggToken.getAddress(), "EGG");
  await centralAuthority.registerToken(await tIdrToken.getAddress(), "IDR");

  console.log("🎉 Deployment completed successfully!");
  
  console.log("\n📋 Contract Addresses Summary:");
  console.log("==========================================");
  console.log("SimpleCentralAuthority:", await centralAuthority.getAddress());
  console.log("tCHICKEN Token:", await tChickenToken.getAddress());
  console.log("tEGG Token:", await tEggToken.getAddress());
  console.log("tIDR Token:", await tIdrToken.getAddress());
  console.log("SimpleAssetEscrow:", await assetEscrow.getAddress());
  console.log("==========================================");

  // Save contract addresses to JSON file for frontend auto-loading
  const addresses = {
    authority: await centralAuthority.getAddress(),
    tCHICKEN: await tChickenToken.getAddress(),
    tEGG: await tEggToken.getAddress(),
    tIDR: await tIdrToken.getAddress(),
    escrow: await assetEscrow.getAddress(),
    deployedAt: new Date().toISOString(),
    network: "localhost"
  };
  
  fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("💾 Contract addresses saved to contract-addresses.json for automatic frontend loading");

  console.log("\n🎉 Clean deployment finished!");
  console.log("\n📋 Summary:");
  console.log("==========================================");
  console.log("✅ All contracts deployed successfully");
  console.log("✅ No tokens minted - clean state for testing");
  console.log("✅ Authority can mint tokens through the interface");
  console.log("✅ Farmers can burn their own assets");
  console.log("✅ Escrow system ready for secure transactions");
  console.log("✅ Contract addresses automatically saved for frontend");
  console.log("==========================================");

  console.log("\n🔗 Platform is now ready for use!");
  console.log("📖 Contract addresses:");
  console.log("- Central Authority:", await centralAuthority.getAddress());
  console.log("- tCHICKEN Token:", await tChickenToken.getAddress());
  console.log("- tEGG Token:", await tEggToken.getAddress());
  console.log("- tIDR Token:", await tIdrToken.getAddress());
  console.log("- Asset Escrow:", await assetEscrow.getAddress());
}

main().catch((error) => {
  console.error("❌ Clean deployment failed:", error);
  process.exitCode = 1;
});