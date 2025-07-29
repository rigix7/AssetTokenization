import { ethers } from "hardhat";
import { Signer } from "ethers";

async function main() {
  console.log("🚀 Starting deployment of Agricultural Asset Tokenization Smart Contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", await deployer.getAddress());
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.getAddress())), "ETH\n");

  // 1. Deploy Mock OnchainID for testing
  console.log("📋 1. Deploying MockOnchainID...");
  const MockOnchainIDFactory = await ethers.getContractFactory("MockOnchainID");
  const mockOnchainID = await MockOnchainIDFactory.deploy(await deployer.getAddress());
  await mockOnchainID.waitForDeployment();
  console.log("✅ MockOnchainID deployed to:", await mockOnchainID.getAddress());

  // 2. Deploy Claim Topics Registry
  console.log("\n📋 2. Deploying ClaimTopicsRegistry...");
  const ClaimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistryFactory.deploy(await deployer.getAddress());
  await claimTopicsRegistry.waitForDeployment();
  console.log("✅ ClaimTopicsRegistry deployed to:", await claimTopicsRegistry.getAddress());

  // 3. Deploy Trusted Issuers Registry
  console.log("\n📋 3. Deploying TrustedIssuersRegistry...");
  const TrustedIssuersRegistryFactory = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistryFactory.deploy(await deployer.getAddress());
  await trustedIssuersRegistry.waitForDeployment();
  console.log("✅ TrustedIssuersRegistry deployed to:", await trustedIssuersRegistry.getAddress());

  // 4. Deploy Identity Registry
  console.log("\n📋 4. Deploying IdentityRegistry...");
  const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistryFactory.deploy(
    await claimTopicsRegistry.getAddress(),
    await trustedIssuersRegistry.getAddress(),
    await deployer.getAddress()
  );
  await identityRegistry.waitForDeployment();
  console.log("✅ IdentityRegistry deployed to:", await identityRegistry.getAddress());

  // 5. Deploy Compliance Contract
  console.log("\n📋 5. Deploying DefaultCompliance...");
  const DefaultComplianceFactory = await ethers.getContractFactory("DefaultCompliance");
  const compliance = await DefaultComplianceFactory.deploy(
    await identityRegistry.getAddress(),
    await deployer.getAddress()
  );
  await compliance.waitForDeployment();
  console.log("✅ DefaultCompliance deployed to:", await compliance.getAddress());

  // 6. Deploy Central Authority
  console.log("\n📋 6. Deploying CentralAuthority...");
  const CentralAuthorityFactory = await ethers.getContractFactory("CentralAuthority");
  const centralAuthority = await CentralAuthorityFactory.deploy(await deployer.getAddress());
  await centralAuthority.waitForDeployment();
  console.log("✅ CentralAuthority deployed to:", await centralAuthority.getAddress());

  // 7. Deploy Agriculture Tokens
  console.log("\n📋 7. Deploying AgricultureTokens...");
  
  const AgricultureTokenFactory = await ethers.getContractFactory("AgricultureToken");
  
  // Deploy tCHICKEN token
  const tChickenToken = await AgricultureTokenFactory.deploy(
    "Tokenized Chicken",
    "tCHICKEN",
    "CHICKEN",
    18,
    await identityRegistry.getAddress(),
    await compliance.getAddress(),
    await mockOnchainID.getAddress(),
    await centralAuthority.getAddress(),
    await deployer.getAddress()
  );
  await tChickenToken.waitForDeployment();
  console.log("🐔 tCHICKEN token deployed to:", await tChickenToken.getAddress());

  // Deploy tEGG token
  const tEggToken = await AgricultureTokenFactory.deploy(
    "Tokenized Egg",
    "tEGG",
    "EGG",
    18,
    await identityRegistry.getAddress(),
    await compliance.getAddress(),
    await mockOnchainID.getAddress(),
    await centralAuthority.getAddress(),
    await deployer.getAddress()
  );
  await tEggToken.waitForDeployment();
  console.log("🥚 tEGG token deployed to:", await tEggToken.getAddress());

  // Deploy tIDR token
  const tIdrToken = await AgricultureTokenFactory.deploy(
    "Tokenized Indonesian Rupiah",
    "tIDR",
    "IDR",
    18,
    await identityRegistry.getAddress(),
    await compliance.getAddress(),
    await mockOnchainID.getAddress(),
    await centralAuthority.getAddress(),
    await deployer.getAddress()
  );
  await tIdrToken.waitForDeployment();
  console.log("💰 tIDR token deployed to:", await tIdrToken.getAddress());

  // 8. Deploy Asset Escrow
  console.log("\n📋 8. Deploying AssetEscrow...");
  const AssetEscrowFactory = await ethers.getContractFactory("AssetEscrow");
  const assetEscrow = await AssetEscrowFactory.deploy(
    await centralAuthority.getAddress(),
    await deployer.getAddress(), // Fee collector
    await deployer.getAddress()
  );
  await assetEscrow.waitForDeployment();
  console.log("✅ AssetEscrow deployed to:", await assetEscrow.getAddress());

  // 9. Deploy Fractional Asset
  console.log("\n📋 9. Deploying FractionalAsset...");
  const FractionalAssetFactory = await ethers.getContractFactory("FractionalAsset");
  const fractionalAsset = await FractionalAssetFactory.deploy(
    "Fractional Farm Assets",
    "FFA",
    "Farm Fractions",
    "FFRAC",
    await identityRegistry.getAddress(),
    await deployer.getAddress()
  );
  await fractionalAsset.waitForDeployment();
  console.log("✅ FractionalAsset deployed to:", await fractionalAsset.getAddress());

  // 10. Setup Initial Configuration
  console.log("\n⚙️  Setting up initial configuration...");

  // Bind compliance to tokens
  console.log("🔗 Binding compliance to tokens...");
  await compliance.bindToken(await tChickenToken.getAddress());
  await compliance.bindToken(await tEggToken.getAddress());
  await compliance.bindToken(await tIdrToken.getAddress());

  // Register tokens in central authority
  console.log("📝 Registering tokens in central authority...");
  await centralAuthority.registerToken(await tChickenToken.getAddress(), "CHICKEN");
  await centralAuthority.registerToken(await tEggToken.getAddress(), "EGG");
  await centralAuthority.registerToken(await tIdrToken.getAddress(), "IDR");

  // Add some default claim topics
  console.log("📋 Adding default claim topics...");
  await claimTopicsRegistry.addClaimTopic(1); // KYC
  await claimTopicsRegistry.addClaimTopic(2); // AML
  await claimTopicsRegistry.addClaimTopic(3); // Asset Verification

  // Add deployer as trusted issuer
  console.log("🔐 Adding deployer as trusted issuer...");
  await trustedIssuersRegistry.addTrustedIssuer(await deployer.getAddress(), [1, 2, 3]);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses Summary:");
  console.log("==========================================");
  console.log("MockOnchainID:", await mockOnchainID.getAddress());
  console.log("ClaimTopicsRegistry:", await claimTopicsRegistry.getAddress());
  console.log("TrustedIssuersRegistry:", await trustedIssuersRegistry.getAddress());
  console.log("IdentityRegistry:", await identityRegistry.getAddress());
  console.log("DefaultCompliance:", await compliance.getAddress());
  console.log("CentralAuthority:", await centralAuthority.getAddress());
  console.log("tCHICKEN Token:", await tChickenToken.getAddress());
  console.log("tEGG Token:", await tEggToken.getAddress());
  console.log("tIDR Token:", await tIdrToken.getAddress());
  console.log("AssetEscrow:", await assetEscrow.getAddress());
  console.log("FractionalAsset:", await fractionalAsset.getAddress());
  console.log("==========================================");

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: await deployer.getAddress(),
    contracts: {
      MockOnchainID: await mockOnchainID.getAddress(),
      ClaimTopicsRegistry: await claimTopicsRegistry.getAddress(),
      TrustedIssuersRegistry: await trustedIssuersRegistry.getAddress(),
      IdentityRegistry: await identityRegistry.getAddress(),
      DefaultCompliance: await compliance.getAddress(),
      CentralAuthority: await centralAuthority.getAddress(),
      tCHICKEN: await tChickenToken.getAddress(),
      tEGG: await tEggToken.getAddress(),
      tIDR: await tIdrToken.getAddress(),
      AssetEscrow: await assetEscrow.getAddress(),
      FractionalAsset: await fractionalAsset.getAddress()
    }
  };

  console.log("\n💾 Deployment info saved to deploymentInfo object");
  console.log("\n🔗 You can now interact with the contracts using the addresses above");
  console.log("📖 Run 'npx hardhat run scripts/setup.ts' to setup demo scenarios");

  return deploymentInfo;
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
