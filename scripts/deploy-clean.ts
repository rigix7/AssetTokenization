import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  console.log("🚀 Clean Deployment - Agricultural Asset Tokenization Platform...\n");

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
  
  // Define expiry periods (in seconds)
  const chickenExpiryPeriod = 30 * 24 * 60 * 60; // 30 days for chickens
  const eggExpiryPeriod = 14 * 24 * 60 * 60;     // 14 days for eggs  
  const idrExpiryPeriod = 90 * 24 * 60 * 60;     // 90 days for budget (IDR)

  // Deploy tCHICKEN token
  const tChickenToken = await TokenFactory.deploy(
    "Tokenized Chicken",
    "tCHICKEN",
    "CHICKEN",
    await centralAuthority.getAddress(),
    await deployer.getAddress(),
    chickenExpiryPeriod
  );
  await tChickenToken.waitForDeployment();
  console.log("🐔 tCHICKEN token deployed to:", await tChickenToken.getAddress());
  console.log("   Default expiry: 30 days");

  // Deploy tEGG token
  const tEggToken = await TokenFactory.deploy(
    "Tokenized Egg",
    "tEGG",
    "EGG",
    await centralAuthority.getAddress(),
    await deployer.getAddress(),
    eggExpiryPeriod
  );
  await tEggToken.waitForDeployment();
  console.log("🥚 tEGG token deployed to:", await tEggToken.getAddress());
  console.log("   Default expiry: 14 days");

  // Deploy tIDR token
  const tIdrToken = await TokenFactory.deploy(
    "Tokenized Indonesian Rupiah",
    "tIDR",
    "IDR",
    await centralAuthority.getAddress(),
    await deployer.getAddress(),
    idrExpiryPeriod
  );
  await tIdrToken.waitForDeployment();
  console.log("💰 tIDR token deployed to:", await tIdrToken.getAddress());
  console.log("   Default expiry: 90 days (budget period)");

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

  // 4. Configure Authority with Token Addresses
  console.log("\n📋 4. Configuring Central Authority...");
  await centralAuthority.registerToken(await tChickenToken.getAddress(), "CHICKEN");
  console.log("✅ tCHICKEN registered with Central Authority");
  
  await centralAuthority.registerToken(await tEggToken.getAddress(), "EGG");
  console.log("✅ tEGG registered with Central Authority");
  
  await centralAuthority.registerToken(await tIdrToken.getAddress(), "IDR");
  console.log("✅ tIDR registered with Central Authority");

  // 5. Escrow is ready to use with any tokens
  console.log("\n📋 5. Asset Escrow configured and ready for trading");

  // 6. Save contract addresses
  const contractAddresses = {
    authority: await centralAuthority.getAddress(),
    tCHICKEN: await tChickenToken.getAddress(),
    tEGG: await tEggToken.getAddress(),
    tIDR: await tIdrToken.getAddress(),
    escrow: await assetEscrow.getAddress(),
    deployedAt: new Date().toISOString(),
    network: "localhost"
  };

  writeFileSync("contract-addresses.json", JSON.stringify(contractAddresses, null, 2));
  console.log("\n📄 Contract addresses saved to contract-addresses.json");

  console.log("\n🎉 Clean deployment complete!");
  console.log("📊 System Status:");
  console.log("   ✅ All contracts deployed successfully");
  console.log("   ✅ Cross-contract references configured");
  console.log("   ⚡ Ready for token minting by Central Authority");
  console.log("   🔒 No pre-minted tokens - clean slate");
  
  console.log("\n🎯 Next Steps:");
  console.log("   1. Use Central Authority to mint tokens as needed");
  console.log("   2. Register suppliers with the Authority");
  console.log("   3. Start trading through the escrow system");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });