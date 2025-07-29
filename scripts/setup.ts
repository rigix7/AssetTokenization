import { ethers } from "hardhat";
import { Signer } from "ethers";

// Contract interfaces
import {
  CentralAuthority,
  AgricultureToken,
  IdentityRegistry,
  AssetEscrow,
  FractionalAsset,
  MockOnchainID
} from "../typechain-types";

async function main() {
  console.log("🎬 Setting up demo scenarios for Agricultural Asset Tokenization...\n");

  const [deployer, supplier, buyer, verifier, kitchen] = await ethers.getSigners();
  
  console.log("👥 Using accounts:");
  console.log("📋 Deployer:", await deployer.getAddress());
  console.log("🚜 Supplier:", await supplier.getAddress());
  console.log("🏪 Buyer/Kitchen:", await buyer.getAddress());
  console.log("✅ Verifier:", await verifier.getAddress());
  console.log("🍳 Kitchen:", await kitchen.getAddress());

  // Get deployed contract addresses (you'll need to update these after deployment)
  // For demo purposes, we'll assume contracts are already deployed
  const CENTRAL_AUTHORITY_ADDRESS = process.env.CENTRAL_AUTHORITY_ADDRESS || "";
  const IDENTITY_REGISTRY_ADDRESS = process.env.IDENTITY_REGISTRY_ADDRESS || "";
  const CHICKEN_TOKEN_ADDRESS = process.env.CHICKEN_TOKEN_ADDRESS || "";
  const EGG_TOKEN_ADDRESS = process.env.EGG_TOKEN_ADDRESS || "";
  const IDR_TOKEN_ADDRESS = process.env.IDR_TOKEN_ADDRESS || "";
  const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "";
  const FRACTIONAL_ASSET_ADDRESS = process.env.FRACTIONAL_ASSET_ADDRESS || "";
  const MOCK_ONCHAIN_ID_ADDRESS = process.env.MOCK_ONCHAIN_ID_ADDRESS || "";

  if (!CENTRAL_AUTHORITY_ADDRESS) {
    console.log("❌ Please set contract addresses in environment variables or update the script");
    console.log("ℹ️  Run deployment script first: npx hardhat run scripts/deploy.ts");
    return;
  }

  // Connect to deployed contracts
  const centralAuthority = await ethers.getContractAt("CentralAuthority", CENTRAL_AUTHORITY_ADDRESS) as CentralAuthority;
  const identityRegistry = await ethers.getContractAt("IdentityRegistry", IDENTITY_REGISTRY_ADDRESS) as IdentityRegistry;
  const chickenToken = await ethers.getContractAt("AgricultureToken", CHICKEN_TOKEN_ADDRESS) as AgricultureToken;
  const eggToken = await ethers.getContractAt("AgricultureToken", EGG_TOKEN_ADDRESS) as AgricultureToken;
  const idrToken = await ethers.getContractAt("AgricultureToken", IDR_TOKEN_ADDRESS) as AgricultureToken;
  const escrow = await ethers.getContractAt("AssetEscrow", ESCROW_ADDRESS) as AssetEscrow;
  const fractionalAsset = await ethers.getContractAt("FractionalAsset", FRACTIONAL_ASSET_ADDRESS) as FractionalAsset;
  const mockOnchainID = await ethers.getContractAt("MockOnchainID", MOCK_ONCHAIN_ID_ADDRESS) as MockOnchainID;

  console.log("\n🔧 Step 1: Setting up roles and permissions...");

  // Grant roles to verifier
  await centralAuthority.connect(deployer).grantRole(
    await centralAuthority.VERIFIER_ROLE(),
    await verifier.getAddress()
  );

  await centralAuthority.connect(deployer).grantRole(
    await centralAuthority.OPERATOR_ROLE(),
    await deployer.getAddress()
  );

  console.log("✅ Roles granted to verifier and operator");

  console.log("\n🆔 Step 2: Registering identities...");

  // Register identities for all participants
  const participants = [supplier, buyer, kitchen];
  for (const participant of participants) {
    await identityRegistry.connect(deployer).registerIdentity(
      await participant.getAddress(),
      await mockOnchainID.getAddress(),
      840 // US country code
    );
    console.log(`✅ Identity registered for ${await participant.getAddress()}`);
  }

  console.log("\n🏭 Step 3: Registering suppliers...");

  // Register chicken supplier
  await centralAuthority.connect(deployer).registerSupplier(
    await supplier.getAddress(),
    "Happy Farm Chicken Supplier",
    "Rural Farm Location A",
    ["CHICKEN", "EGG"]
  );

  // Approve supplier
  await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());
  console.log("✅ Chicken supplier registered and approved");

  console.log("\n🏦 Step 4: Setting up kitchen/buyer as IDR token holder...");

  // Register kitchen as IDR supplier (bank/payment provider)
  await centralAuthority.connect(deployer).registerSupplier(
    await kitchen.getAddress(),
    "Kitchen Payment Service",
    "Kitchen Location",
    ["IDR"]
  );

  await centralAuthority.connect(verifier).approveSupplier(await kitchen.getAddress());
  console.log("✅ Kitchen registered as payment service provider");

  console.log("\n📊 Step 5: Verifying assets and creating inventory...");

  const currentTime = Math.floor(Date.now() / 1000);

  // Verify chicken assets
  const chickenQuantity = ethers.parseEther("1000"); // 1000 chickens
  await centralAuthority.connect(verifier).verifyAssetBacking(
    await supplier.getAddress(),
    "CHICKEN",
    chickenQuantity,
    "Farm A - Chicken Coop 1",
    "Physical inspection completed - 1000 healthy chickens"
  );

  // Verify egg assets
  const eggQuantity = ethers.parseEther("5000"); // 5000 eggs
  await centralAuthority.connect(verifier).verifyAssetBacking(
    await supplier.getAddress(),
    "EGG",
    eggQuantity,
    "Farm A - Chicken Coop 1",
    "Daily egg collection - 5000 fresh eggs"
  );

  // Verify IDR assets (kitchen's payment capability)
  const idrQuantity = ethers.parseEther("500000000"); // 500 million IDR
  await centralAuthority.connect(verifier).verifyAssetBacking(
    await kitchen.getAddress(),
    "IDR",
    idrQuantity,
    "Bank Account - Kitchen Payment Service",
    "Bank verification - 500M IDR available for payments"
  );

  console.log("✅ Asset verification completed");

  console.log("\n🪙 Step 6: Minting tokens...");

  // Mint chicken tokens
  await centralAuthority.connect(verifier).authorizeTokenMinting(
    await chickenToken.getAddress(),
    await supplier.getAddress(),
    chickenQuantity,
    currentTime,
    currentTime + (90 * 24 * 60 * 60), // 90 days expiry
    "Farm A - Chicken Coop 1"
  );

  // Mint egg tokens
  await centralAuthority.connect(verifier).authorizeTokenMinting(
    await eggToken.getAddress(),
    await supplier.getAddress(),
    eggQuantity,
    currentTime,
    currentTime + (7 * 24 * 60 * 60), // 7 days expiry for eggs
    "Farm A - Chicken Coop 1"
  );

  // Mint IDR tokens for kitchen
  await centralAuthority.connect(verifier).authorizeTokenMinting(
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

  console.log("\n🛒 Step 7: Creating a sample purchase order through escrow...");

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

  console.log("\n🔍 Step 8: Verifying and completing the order...");

  // All parties verify the order
  await escrow.connect(kitchen).verifyOrder(orderId); // Buyer verification
  await escrow.connect(supplier).verifyOrder(orderId); // Seller verification
  await escrow.connect(centralAuthority).verifyOrder(orderId); // Authority verification (auto-completes)

  console.log("✅ Order completed and funds released");

  // Check final balances
  console.log("\n📊 Final balances after transaction:");
  console.log(`🐔 Kitchen now has ${ethers.formatEther(await chickenToken.balanceOf(await kitchen.getAddress()))} tCHICKEN`);
  console.log(`🥚 Kitchen now has ${ethers.formatEther(await eggToken.balanceOf(await kitchen.getAddress()))} tEGG`);
  console.log(`💰 Supplier now has ${ethers.formatEther(await idrToken.balanceOf(await supplier.getAddress()))} tIDR (minus 1% escrow fee)`);

  console.log("\n🏗️ Step 9: Demonstrating fractional ownership...");

  // Create a fractional asset (shared farming equipment)
  const equipmentTokenId = await fractionalAsset.connect(deployer).createAsset.staticCall(
    "TRACTOR",
    "Shared Farm Equipment Facility",
    ethers.parseEther("1000000"), // 1M IDR value
    await supplier.getAddress(),
    true // Start as fractional
  );

  await fractionalAsset.connect(deployer).createAsset(
    "TRACTOR",
    "Shared Farm Equipment Facility",
    ethers.parseEther("1000000"),
    await supplier.getAddress(),
    true
  );

  console.log(`🚜 Created fractional tractor asset with ID: ${equipmentTokenId}`);

  // Transfer some fractions to the kitchen
  await fractionalAsset.connect(supplier).transferFractional(
    equipmentTokenId,
    await kitchen.getAddress(),
    3000 // 30% ownership
  );

  console.log(`✅ Kitchen now owns 30% of the tractor (3000/10000 fractions)`);

  console.log("\n🎉 Demo setup completed successfully!");
  console.log("\n📋 Summary of what was created:");
  console.log("==========================================");
  console.log("✅ Identities registered for all participants");
  console.log("✅ Suppliers registered and approved");
  console.log("✅ Asset backing verified for chickens, eggs, and IDR");
  console.log("✅ Tokens minted: tCHICKEN, tEGG, tIDR");
  console.log("✅ Sample purchase order created and completed through escrow");
  console.log("✅ Fractional ownership demonstrated with shared tractor");
  console.log("==========================================");

  console.log("\n🔗 Contract Interaction Examples:");
  console.log("- Check token balances");
  console.log("- Create new escrow orders");
  console.log("- Verify additional assets");
  console.log("- Transfer fractional ownership");
  console.log("- Monitor compliance and expiry");

  console.log("\n📖 Next steps:");
  console.log("- Use the web interface at http://localhost:5000");
  console.log("- Monitor transactions and compliance");
  console.log("- Create additional orders and transfers");
  console.log("- Explore fractional asset features");
}

main().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exitCode = 1;
});
