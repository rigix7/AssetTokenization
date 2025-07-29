import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { 
  AgricultureToken,
  IdentityRegistry,
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  DefaultCompliance,
  MockOnchainID,
  CentralAuthority
} from "../typechain-types";

describe("AgricultureToken", function () {
  let agricultureToken: AgricultureToken;
  let identityRegistry: IdentityRegistry;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let compliance: DefaultCompliance;
  let centralAuthority: CentralAuthority;
  let mockOnchainID: MockOnchainID;
  
  let owner: Signer;
  let authority: Signer;
  let supplier: Signer;
  let buyer: Signer;
  let verifier: Signer;

  beforeEach(async function () {
    [owner, authority, supplier, buyer, verifier] = await ethers.getSigners();

    // Deploy mock OnchainID
    const MockOnchainIDFactory = await ethers.getContractFactory("MockOnchainID");
    mockOnchainID = await MockOnchainIDFactory.deploy(await owner.getAddress());

    // Deploy claim topics registry
    const ClaimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry");
    claimTopicsRegistry = await ClaimTopicsRegistryFactory.deploy(await owner.getAddress());

    // Deploy trusted issuers registry
    const TrustedIssuersRegistryFactory = await ethers.getContractFactory("TrustedIssuersRegistry");
    trustedIssuersRegistry = await TrustedIssuersRegistryFactory.deploy(await owner.getAddress());

    // Deploy identity registry
    const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistryFactory.deploy(
      await claimTopicsRegistry.getAddress(),
      await trustedIssuersRegistry.getAddress(),
      await owner.getAddress()
    );

    // Deploy compliance
    const DefaultComplianceFactory = await ethers.getContractFactory("DefaultCompliance");
    compliance = await DefaultComplianceFactory.deploy(
      await identityRegistry.getAddress(),
      await owner.getAddress()
    );

    // Deploy central authority
    const CentralAuthorityFactory = await ethers.getContractFactory("CentralAuthority");
    centralAuthority = await CentralAuthorityFactory.deploy(await authority.getAddress());

    // Deploy agriculture token
    const AgricultureTokenFactory = await ethers.getContractFactory("AgricultureToken");
    agricultureToken = await AgricultureTokenFactory.deploy(
      "Test Chicken Token",
      "tCHICKEN",
      "CHICKEN",
      18,
      await identityRegistry.getAddress(),
      await compliance.getAddress(),
      await mockOnchainID.getAddress(),
      await centralAuthority.getAddress(),
      await owner.getAddress()
    );

    // Bind compliance to token
    await compliance.bindToken(await agricultureToken.getAddress());

    // Register identities for testing
    await identityRegistry.registerIdentity(
      await supplier.getAddress(),
      await mockOnchainID.getAddress(),
      840 // US country code
    );

    await identityRegistry.registerIdentity(
      await buyer.getAddress(),
      await mockOnchainID.getAddress(),
      840 // US country code
    );

    // Setup central authority roles
    await centralAuthority.connect(authority).grantRole(
      await centralAuthority.VERIFIER_ROLE(),
      await verifier.getAddress()
    );

    // Register supplier in central authority
    await centralAuthority.connect(authority).registerSupplier(
      await supplier.getAddress(),
      "Test Farm",
      "Test Location",
      ["CHICKEN"]
    );

    await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());

    // Register token in central authority
    await centralAuthority.connect(authority).registerToken(
      await agricultureToken.getAddress(),
      "CHICKEN"
    );
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await agricultureToken.name()).to.equal("Test Chicken Token");
      expect(await agricultureToken.symbol()).to.equal("tCHICKEN");
      expect(await agricultureToken.assetType()).to.equal("CHICKEN");
      expect(await agricultureToken.decimals()).to.equal(18);
    });

    it("Should set correct central authority", async function () {
      expect(await agricultureToken.centralAuthority()).to.equal(await centralAuthority.getAddress());
    });
  });

  describe("Asset Verification and Minting", function () {
    it("Should verify asset backing and mint tokens", async function () {
      const quantity = ethers.parseEther("100");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60); // 30 days
      const location = "Farm A";

      // First verify assets
      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        location,
        "Initial verification"
      );

      // Then mint tokens
      await centralAuthority.connect(verifier).authorizeTokenMinting(
        await agricultureToken.getAddress(),
        await supplier.getAddress(),
        quantity,
        productionDate,
        expiryDate,
        location
      );

      expect(await agricultureToken.balanceOf(await supplier.getAddress())).to.equal(quantity);
      expect(await agricultureToken.assetVerificationStatus(await supplier.getAddress())).to.be.true;
    });

    it("Should fail to mint without asset verification", async function () {
      const quantity = ethers.parseEther("100");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);

      await expect(
        centralAuthority.connect(verifier).authorizeTokenMinting(
          await agricultureToken.getAddress(),
          await supplier.getAddress(),
          quantity,
          productionDate,
          expiryDate,
          "Farm A"
        )
      ).to.be.revertedWith("Insufficient verified assets");
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      const quantity = ethers.parseEther("100");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);

      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        "Farm A",
        "Initial verification"
      );

      await centralAuthority.connect(verifier).authorizeTokenMinting(
        await agricultureToken.getAddress(),
        await supplier.getAddress(),
        quantity,
        productionDate,
        expiryDate,
        "Farm A"
      );
    });

    it("Should allow transfer between verified addresses", async function () {
      const transferAmount = ethers.parseEther("10");

      await agricultureToken.connect(supplier).transfer(
        await buyer.getAddress(),
        transferAmount
      );

      expect(await agricultureToken.balanceOf(await buyer.getAddress())).to.equal(transferAmount);
      expect(await agricultureToken.balanceOf(await supplier.getAddress())).to.equal(
        ethers.parseEther("90")
      );
    });

    it("Should fail transfer to unverified address", async function () {
      const [unverifiedUser] = await ethers.getSigners();
      const transferAmount = ethers.parseEther("10");

      await expect(
        agricultureToken.connect(supplier).transfer(
          await unverifiedUser.getAddress(),
          transferAmount
        )
      ).to.be.revertedWith("Recipient not verified");
    });

    it("Should fail transfer with invalid assets", async function () {
      // Mark assets as invalid
      await agricultureToken.connect(centralAuthority).verifyAssetBacking(
        await supplier.getAddress(),
        false
      );

      const transferAmount = ethers.parseEther("10");

      await expect(
        agricultureToken.connect(supplier).transfer(
          await buyer.getAddress(),
          transferAmount
        )
      ).to.be.revertedWith("Assets not valid for transfer");
    });
  });

  describe("Asset Expiry", function () {
    it("Should burn expired tokens", async function () {
      const quantity = ethers.parseEther("100");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = Math.floor(Date.now() / 1000) - 1; // Already expired

      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        "Farm A",
        "Initial verification"
      );

      await centralAuthority.connect(verifier).authorizeTokenMinting(
        await agricultureToken.getAddress(),
        await supplier.getAddress(),
        quantity,
        productionDate,
        expiryDate,
        "Farm A"
      );

      // Fast forward time (simulate in test environment)
      await agricultureToken.connect(centralAuthority).burnExpiredTokens(await supplier.getAddress());

      expect(await agricultureToken.balanceOf(await supplier.getAddress())).to.equal(0);
    });
  });

  describe("Batch Operations", function () {
    it("Should return correct batch information", async function () {
      const quantity = ethers.parseEther("100");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);

      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        "Farm A",
        "Initial verification"
      );

      await centralAuthority.connect(verifier).authorizeTokenMinting(
        await agricultureToken.getAddress(),
        await supplier.getAddress(),
        quantity,
        productionDate,
        expiryDate,
        "Farm A"
      );

      const batches = await agricultureToken.getHolderBatches(await supplier.getAddress());
      expect(batches.length).to.equal(1);

      const batchDetails = await agricultureToken.getBatchDetails(batches[0]);
      expect(batchDetails.quantity).to.equal(quantity);
      expect(batchDetails.location).to.equal("Farm A");
      expect(batchDetails.verified).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should only allow central authority to mint with verification", async function () {
      const quantity = ethers.parseEther("100");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);

      await expect(
        agricultureToken.connect(owner).mintWithAssetVerification(
          await supplier.getAddress(),
          quantity,
          productionDate,
          expiryDate,
          "Farm A"
        )
      ).to.be.revertedWith("Only central authority can call");
    });

    it("Should only allow owner to set central authority", async function () {
      const [newAuthority] = await ethers.getSigners();

      await expect(
        agricultureToken.connect(supplier).setCentralAuthority(await newAuthority.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
