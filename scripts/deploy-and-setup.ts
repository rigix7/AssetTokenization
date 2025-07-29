import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting complete deployment and setup of Agricultural Asset Tokenization Platform...\n");

  const [deployer, supplier, buyer, kitchen] = await ethers.getSigners();
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

  // Start Setup
  console.log("\n\n🎬 Setting up demo scenarios...\n");
  
  console.log("👥 Using accounts:");
  console.log("📋 Deployer:", await deployer.getAddress());
  console.log("🚜 Supplier:", await supplier.getAddress());
  console.log("🏪 Buyer:", await buyer.getAddress());
  console.log("🍳 Kitchen:", await kitchen.getAddress());

  console.log("\n🔧 Step 1: Setting up roles and permissions...");

  // Grant verifier role to deployer (already has it from constructor)
  console.log("✅ Verifier role already granted to deployer");

  console.log("\n🏭 Step 2: Registering suppliers...");

  // Register chicken supplier
  await centralAuthority.connect(deployer).registerSupplier(
    await supplier.getAddress(),
    "Happy Farm Chicken Supplier",
    "Rural Farm Location A",
    ["CHICKEN", "EGG"]
  );

  // Approve supplier
  await centralAuthority.connect(deployer).approveSupplier(await supplier.getAddress());
  console.log("✅ Chicken supplier registered and approved");

  // Register kitchen as IDR supplier (payment provider)
  await centralAuthority.connect(deployer).registerSupplier(
    await kitchen.getAddress(),
    "Kitchen Payment Service",
    "Kitchen Location",
    ["IDR"]
  );

  await centralAuthority.connect(deployer).approveSupplier(await kitchen.getAddress());
  console.log("✅ Kitchen registered as payment service provider");

  console.log("\n📊 Step 3: Verifying assets and minting tokens...");

  const currentTime = Math.floor(Date.now() / 1000);

  // Verify and mint chicken tokens
  const chickenQuantity = ethers.parseEther("1000"); // 1000 chickens
  await centralAuthority.connect(deployer).verifyAssetBacking(
    await supplier.getAddress(),
    "CHICKEN",
    chickenQuantity,
    "Farm A - Chicken Coop 1",
    "Physical inspection completed - 1000 healthy chickens"
  );

  await centralAuthority.connect(deployer).authorizeTokenMinting(
    await tChickenToken.getAddress(),
    await supplier.getAddress(),
    chickenQuantity,
    currentTime,
    currentTime + (90 * 24 * 60 * 60), // 90 days expiry
    "Farm A - Chicken Coop 1"
  );

  // Verify and mint egg tokens
  const eggQuantity = ethers.parseEther("5000"); // 5000 eggs
  await centralAuthority.connect(deployer).verifyAssetBacking(
    await supplier.getAddress(),
    "EGG",
    eggQuantity,
    "Farm A - Chicken Coop 1",
    "Daily egg collection - 5000 fresh eggs"
  );

  await centralAuthority.connect(deployer).authorizeTokenMinting(
    await tEggToken.getAddress(),
    await supplier.getAddress(),
    eggQuantity,
    currentTime,
    currentTime + (7 * 24 * 60 * 60), // 7 days expiry for eggs
    "Farm A - Chicken Coop 1"
  );

  // Verify and mint IDR tokens for kitchen
  const idrQuantity = ethers.parseEther("500000000"); // 500 million IDR
  await centralAuthority.connect(deployer).verifyAssetBacking(
    await kitchen.getAddress(),
    "IDR",
    idrQuantity,
    "Bank Account - Kitchen Payment Service",
    "Bank verification - 500M IDR available for payments"
  );

  await centralAuthority.connect(deployer).authorizeTokenMinting(
    await tIdrToken.getAddress(),
    await kitchen.getAddress(),
    idrQuantity,
    currentTime,
    currentTime + (365 * 24 * 60 * 60), // 1 year expiry
    "Bank Account - Kitchen Payment Service"
  );

  console.log("✅ Tokens minted successfully");
  console.log(`🐔 Supplier has ${ethers.formatEther(await tChickenToken.balanceOf(await supplier.getAddress()))} tCHICKEN`);
  console.log(`🥚 Supplier has ${ethers.formatEther(await tEggToken.balanceOf(await supplier.getAddress()))} tEGG`);
  console.log(`💰 Kitchen has ${ethers.formatEther(await tIdrToken.balanceOf(await kitchen.getAddress()))} tIDR`);

  console.log("\n🛒 Step 4: Creating a sample purchase order through escrow...");

  // Kitchen wants to buy 100 chickens and 1000 eggs for 10 million IDR
  const orderChickenAmount = ethers.parseEther("100");
  const orderEggAmount = ethers.parseEther("1000");
  const paymentAmount = ethers.parseEther("10000000"); // 10 million IDR

  // Create escrow order
  const expirationTime = currentTime + (24 * 60 * 60); // 24 hours
  
  const orderId = await assetEscrow.connect(kitchen).createOrder.staticCall(
    await supplier.getAddress(),
    await tIdrToken.getAddress(),
    [await tChickenToken.getAddress(), await tEggToken.getAddress()],
    [orderChickenAmount, orderEggAmount],
    paymentAmount,
    expirationTime
  );

  await assetEscrow.connect(kitchen).createOrder(
    await supplier.getAddress(),
    await tIdrToken.getAddress(),
    [await tChickenToken.getAddress(), await tEggToken.getAddress()],
    [orderChickenAmount, orderEggAmount],
    paymentAmount,
    expirationTime
  );

  console.log(`✅ Order created with ID: ${orderId}`);

  // Kitchen deposits payment
  await tIdrToken.connect(kitchen).approve(await assetEscrow.getAddress(), paymentAmount);
  await assetEscrow.connect(kitchen).depositPayment(orderId);
  console.log("💰 Payment deposited to escrow");

  // Supplier delivers assets
  await tChickenToken.connect(supplier).approve(await assetEscrow.getAddress(), orderChickenAmount);
  await tEggToken.connect(supplier).approve(await assetEscrow.getAddress(), orderEggAmount);
  await assetEscrow.connect(supplier).deliverAssets(orderId);
  console.log("📦 Assets delivered to escrow");

  console.log("\n🔍 Step 5: Verifying and completing the order...");

  // All parties verify the order
  await assetEscrow.connect(kitchen).verifyOrder(orderId); // Buyer verification
  await assetEscrow.connect(supplier).verifyOrder(orderId); // Seller verification

  console.log("✅ Order completed and funds released");

  // Check final balances
  console.log("\n📊 Final balances after transaction:");
  console.log(`🐔 Kitchen now has ${ethers.formatEther(await tChickenToken.balanceOf(await kitchen.getAddress()))} tCHICKEN`);
  console.log(`🥚 Kitchen now has ${ethers.formatEther(await tEggToken.balanceOf(await kitchen.getAddress()))} tEGG`);
  console.log(`💰 Supplier now has ${ethers.formatEther(await tIdrToken.balanceOf(await supplier.getAddress()))} tIDR (minus 1% escrow fee)`);

  console.log("\n🎉 Complete deployment and setup finished!");
  console.log("\n📋 Summary of what was created:");
  console.log("==========================================");
  console.log("✅ All contracts deployed successfully");
  console.log("✅ Suppliers registered and approved");
  console.log("✅ Asset backing verified for chickens, eggs, and IDR");
  console.log("✅ Tokens minted: tCHICKEN, tEGG, tIDR");
  console.log("✅ Sample purchase order created and completed through escrow");
  console.log("✅ Tokens successfully exchanged between kitchen and supplier");
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
  console.error("❌ Deployment and setup failed:", error);
  process.exitCode = 1;
});