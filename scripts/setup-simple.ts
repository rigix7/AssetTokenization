import { ethers } from "hardhat";

async function main() {
  console.log("🎬 Setting up demo scenarios for Simplified Agricultural Asset Tokenization...\n");

  const [deployer, supplier, buyer, kitchen] = await ethers.getSigners();
  
  console.log("👥 Using accounts:");
  console.log("📋 Deployer:", await deployer.getAddress());
  console.log("🚜 Supplier:", await supplier.getAddress());
  console.log("🏪 Buyer:", await buyer.getAddress());
  console.log("🍳 Kitchen:", await kitchen.getAddress());

  // Contract addresses from deployment (hardcoded for demo)
  const CENTRAL_AUTHORITY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CHICKEN_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const EGG_TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const IDR_TOKEN_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const ESCROW_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  // Connect to deployed contracts
  const centralAuthority = await ethers.getContractAt("SimpleCentralAuthority", CENTRAL_AUTHORITY_ADDRESS);
  const chickenToken = await ethers.getContractAt("SimpleAgricultureToken", CHICKEN_TOKEN_ADDRESS);
  const eggToken = await ethers.getContractAt("SimpleAgricultureToken", EGG_TOKEN_ADDRESS);
  const idrToken = await ethers.getContractAt("SimpleAgricultureToken", IDR_TOKEN_ADDRESS);
  const escrow = await ethers.getContractAt("SimpleAssetEscrow", ESCROW_ADDRESS);

  console.log("\n🔧 Step 1: Setting up roles and permissions...");

  // Grant verifier role to deployer
  const VERIFIER_ROLE = await centralAuthority.VERIFIER_ROLE();
  await centralAuthority.connect(deployer).grantRole(VERIFIER_ROLE, await deployer.getAddress());
  console.log("✅ Verifier role granted to deployer");

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
    await chickenToken.getAddress(),
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
    await eggToken.getAddress(),
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
    await idrToken.getAddress(),
    await kitchen.getAddress(),
    idrQuantity,
    currentTime,
    currentTime + (365 * 24 * 60 * 60), // 1 year expiry
    "Bank Account - Kitchen Payment Service"
  );

  console.log("✅ Tokens minted successfully");
  console.log(`🐔 Supplier has ${ethers.formatEther(await chickenToken.balanceOf(await supplier.getAddress()))} tCHICKEN`);
  console.log(`🥚 Supplier has ${ethers.formatEther(await eggToken.balanceOf(await supplier.getAddress()))} tEGG`);
  console.log(`💰 Kitchen has ${ethers.formatEther(await idrToken.balanceOf(await kitchen.getAddress()))} tIDR`);

  console.log("\n🛒 Step 4: Creating a sample purchase order through escrow...");

  // Kitchen wants to buy 100 chickens and 1000 eggs for 10 million IDR
  const orderChickenAmount = ethers.parseEther("100");
  const orderEggAmount = ethers.parseEther("1000");
  const paymentAmount = ethers.parseEther("10000000"); // 10 million IDR

  // Create escrow order
  const expirationTime = currentTime + (24 * 60 * 60); // 24 hours
  
  const orderId = await escrow.connect(kitchen).createOrder.staticCall(
    await supplier.getAddress(),
    await idrToken.getAddress(),
    [await chickenToken.getAddress(), await eggToken.getAddress()],
    [orderChickenAmount, orderEggAmount],
    paymentAmount,
    expirationTime
  );

  await escrow.connect(kitchen).createOrder(
    await supplier.getAddress(),
    await idrToken.getAddress(),
    [await chickenToken.getAddress(), await eggToken.getAddress()],
    [orderChickenAmount, orderEggAmount],
    paymentAmount,
    expirationTime
  );

  console.log(`✅ Order created with ID: ${orderId}`);

  // Kitchen deposits payment
  await idrToken.connect(kitchen).approve(await escrow.getAddress(), paymentAmount);
  await escrow.connect(kitchen).depositPayment(orderId);
  console.log("💰 Payment deposited to escrow");

  // Supplier delivers assets
  await chickenToken.connect(supplier).approve(await escrow.getAddress(), orderChickenAmount);
  await eggToken.connect(supplier).approve(await escrow.getAddress(), orderEggAmount);
  await escrow.connect(supplier).deliverAssets(orderId);
  console.log("📦 Assets delivered to escrow");

  console.log("\n🔍 Step 5: Verifying and completing the order...");

  // All parties verify the order
  await escrow.connect(kitchen).verifyOrder(orderId); // Buyer verification
  await escrow.connect(supplier).verifyOrder(orderId); // Seller verification

  console.log("✅ Order completed and funds released");

  // Check final balances
  console.log("\n📊 Final balances after transaction:");
  console.log(`🐔 Kitchen now has ${ethers.formatEther(await chickenToken.balanceOf(await kitchen.getAddress()))} tCHICKEN`);
  console.log(`🥚 Kitchen now has ${ethers.formatEther(await eggToken.balanceOf(await kitchen.getAddress()))} tEGG`);
  console.log(`💰 Supplier now has ${ethers.formatEther(await idrToken.balanceOf(await supplier.getAddress()))} tIDR (minus 1% escrow fee)`);

  console.log("\n🎉 Demo setup completed successfully!");
  console.log("\n📋 Summary of what was created:");
  console.log("==========================================");
  console.log("✅ Suppliers registered and approved");
  console.log("✅ Asset backing verified for chickens, eggs, and IDR");
  console.log("✅ Tokens minted: tCHICKEN, tEGG, tIDR");
  console.log("✅ Sample purchase order created and completed through escrow");
  console.log("✅ Tokens successfully exchanged between kitchen and supplier");
  console.log("==========================================");

  console.log("\n🔗 Platform is now ready for use!");
  console.log("📖 Next steps:");
  console.log("- Use the web interface at http://localhost:5000");
  console.log("- Monitor transactions and asset verification");
  console.log("- Create additional orders and transfers");
}

main().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exitCode = 1;
});