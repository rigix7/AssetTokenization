import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of Simplified Agricultural Asset Tokenization Platform...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", await deployer.getAddress());
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.getAddress())), "ETH\n");

  // 1. Deploy Central Authority
  console.log("📋 1. Deploying SimpleCentralAuthority...");
  const CentralAuthorityFactory = await ethers.getContractFactory("SimpleCentralAuthority");
  const centralAuthority = await CentralAuthorityFactory.deploy(await deployer.getAddress());
  await centralAuthority.waitForDeployment();
  console.log("✅ SimpleCentralAuthority deployed to:", await centralAuthority.getAddress());

  // 2. Deploy Agriculture Tokens
  console.log("\n📋 2. Deploying Agricultural Tokens...");
  
  const TokenFactory = await ethers.getContractFactory("SimpleAgricultureToken");
  
  // Deploy tCHICKEN token
  const tChickenToken = await TokenFactory.deploy(
    "Tokenized Chicken",
    "tCHICKEN",
    "CHICKEN",
    await centralAuthority.getAddress(),
    await deployer.getAddress()
  );
  await tChickenToken.waitForDeployment();
  console.log("🐔 tCHICKEN token deployed to:", await tChickenToken.getAddress());

  // Deploy tEGG token
  const tEggToken = await TokenFactory.deploy(
    "Tokenized Egg",
    "tEGG",
    "EGG",
    await centralAuthority.getAddress(),
    await deployer.getAddress()
  );
  await tEggToken.waitForDeployment();
  console.log("🥚 tEGG token deployed to:", await tEggToken.getAddress());

  // Deploy tIDR token
  const tIdrToken = await TokenFactory.deploy(
    "Tokenized Indonesian Rupiah",
    "tIDR",
    "IDR",
    await centralAuthority.getAddress(),
    await deployer.getAddress()
  );
  await tIdrToken.waitForDeployment();
  console.log("💰 tIDR token deployed to:", await tIdrToken.getAddress());

  // 3. Deploy Asset Escrow
  console.log("\n📋 3. Deploying SimpleAssetEscrow...");
  const EscrowFactory = await ethers.getContractFactory("SimpleAssetEscrow");
  const assetEscrow = await EscrowFactory.deploy(
    await centralAuthority.getAddress(),
    await deployer.getAddress(), // Fee collector
    await deployer.getAddress()  // Owner
  );
  await assetEscrow.waitForDeployment();
  console.log("✅ SimpleAssetEscrow deployed to:", await assetEscrow.getAddress());

  // 4. Setup Initial Configuration
  console.log("\n⚙️  Setting up initial configuration...");

  // Register tokens in central authority
  console.log("📝 Registering tokens in central authority...");
  await centralAuthority.registerToken(await tChickenToken.getAddress(), "CHICKEN");
  await centralAuthority.registerToken(await tEggToken.getAddress(), "EGG");
  await centralAuthority.registerToken(await tIdrToken.getAddress(), "IDR");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses Summary:");
  console.log("==========================================");
  console.log("SimpleCentralAuthority:", await centralAuthority.getAddress());
  console.log("tCHICKEN Token:", await tChickenToken.getAddress());
  console.log("tEGG Token:", await tEggToken.getAddress());
  console.log("tIDR Token:", await tIdrToken.getAddress());
  console.log("SimpleAssetEscrow:", await assetEscrow.getAddress());
  console.log("==========================================");

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: await deployer.getAddress(),
    contracts: {
      SimpleCentralAuthority: await centralAuthority.getAddress(),
      tCHICKEN: await tChickenToken.getAddress(),
      tEGG: await tEggToken.getAddress(),
      tIDR: await tIdrToken.getAddress(),
      SimpleAssetEscrow: await assetEscrow.getAddress()
    }
  };

  console.log("\n💾 Deployment info saved to deploymentInfo object");
  console.log("\n🔗 You can now interact with the contracts using the addresses above");
  console.log("📖 Run 'npx hardhat run scripts/setup-simple.ts' to setup demo scenarios");

  return deploymentInfo;
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});