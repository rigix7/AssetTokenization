import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { 
  CentralAuthority,
  AgricultureToken,
  IdentityRegistry,
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  DefaultCompliance,
  MockOnchainID
} from "../typechain-types";

describe("CentralAuthority", function () {
  let centralAuthority: CentralAuthority;
  let agricultureToken: AgricultureToken;
  let identityRegistry: IdentityRegistry;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let compliance: DefaultCompliance;
  let mockOnchainID: MockOnchainID;
  
  let owner: Signer;
  let admin: Signer;
  let verifier: Signer;
  let auditor: Signer;
  let operator: Signer;
  let supplier: Signer;

  beforeEach(async function () {
    [owner, admin, verifier, auditor, operator, supplier] = await ethers.getSigners();

    // Deploy mock OnchainID
    const MockOnchainIDFactory = await ethers.getContractFactory("MockOnchainID");
    mockOnchainID = await MockOnchainIDFactory.deploy(await owner.getAddress());

    // Deploy registries
    const ClaimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry");
    claimTopicsRegistry = await ClaimTopicsRegistryFactory.deploy(await owner.getAddress());

    const TrustedIssuersRegistryFactory = await ethers.getContractFactory("TrustedIssuersRegistry");
    trustedIssuersRegistry = await TrustedIssuersRegistryFactory.deploy(await owner.getAddress());

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
    centralAuthority = await CentralAuthorityFactory.deploy(await admin.getAddress());

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

    // Grant roles
    await centralAuthority.connect(admin).grantRole(
      await centralAuthority.VERIFIER_ROLE(),
      await verifier.getAddress()
    );

    await centralAuthority.connect(admin).grantRole(
      await centralAuthority.AUDITOR_ROLE(),
      await auditor.getAddress()
    );

    await centralAuthority.connect(admin).grantRole(
      await centralAuthority.OPERATOR_ROLE(),
      await operator.getAddress()
    );

    // Register identity for supplier
    await identityRegistry.registerIdentity(
      await supplier.getAddress(),
      await mockOnchainID.getAddress(),
      840 // US country code
    );
  });

  describe("Deployment", function () {
    it("Should deploy with correct admin role", async function () {
      expect(
        await centralAuthority.hasRole(
          await centralAuthority.DEFAULT_ADMIN_ROLE(),
          await admin.getAddress()
        )
      ).to.be.true;
    });

    it("Should have default supported asset types", async function () {
      expect(await centralAuthority.supportedAssetTypes("CHICKEN")).to.be.true;
      expect(await centralAuthority.supportedAssetTypes("EGG")).to.be.true;
      expect(await centralAuthority.supportedAssetTypes("IDR")).to.be.true;
      expect(await centralAuthority.supportedAssetTypes("RICE")).to.be.true;
    });
  });

  describe("Asset Type Management", function () {
    it("Should add new asset type", async function () {
      await expect(centralAuthority.connect(admin).addAssetType("BEEF"))
        .to.emit(centralAuthority, "AssetTypeAdded")
        .withArgs("BEEF");

      expect(await centralAuthority.supportedAssetTypes("BEEF")).to.be.true;
    });

    it("Should fail to add existing asset type", async function () {
      await expect(
        centralAuthority.connect(admin).addAssetType("CHICKEN")
      ).to.be.revertedWith("Asset type already supported");
    });

    it("Should remove asset type", async function () {
      await expect(centralAuthority.connect(admin).removeAssetType("CHICKEN"))
        .to.emit(centralAuthority, "AssetTypeRemoved")
        .withArgs("CHICKEN");

      expect(await centralAuthority.supportedAssetTypes("CHICKEN")).to.be.false;
    });

    it("Should only allow admin to manage asset types", async function () {
      await expect(
        centralAuthority.connect(verifier).addAssetType("BEEF")
      ).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Token Registration", function () {
    it("Should register token for asset type", async function () {
      await expect(
        centralAuthority.connect(admin).registerToken(
          await agricultureToken.getAddress(),
          "CHICKEN"
        )
      )
        .to.emit(centralAuthority, "TokenRegistered")
        .withArgs(await agricultureToken.getAddress(), "CHICKEN");

      const tokens = await centralAuthority.getTokensForAssetType("CHICKEN");
      expect(tokens).to.include(await agricultureToken.getAddress());
    });

    it("Should fail to register token for unsupported asset type", async function () {
      await expect(
        centralAuthority.connect(admin).registerToken(
          await agricultureToken.getAddress(),
          "UNSUPPORTED"
        )
      ).to.be.revertedWith("Asset type not supported");
    });

    it("Should deregister token", async function () {
      await centralAuthority.connect(admin).registerToken(
        await agricultureToken.getAddress(),
        "CHICKEN"
      );

      await expect(
        centralAuthority.connect(admin).deregisterToken(await agricultureToken.getAddress())
      )
        .to.emit(centralAuthority, "TokenDeregistered")
        .withArgs(await agricultureToken.getAddress());

      const tokens = await centralAuthority.getTokensForAssetType("CHICKEN");
      expect(tokens).to.not.include(await agricultureToken.getAddress());
    });
  });

  describe("Supplier Management", function () {
    it("Should register supplier", async function () {
      await expect(
        centralAuthority.connect(operator).registerSupplier(
          await supplier.getAddress(),
          "Test Farm LLC",
          "Farm Location",
          ["CHICKEN", "EGG"]
        )
      )
        .to.emit(centralAuthority, "SupplierRegistered")
        .withArgs(await supplier.getAddress(), "Test Farm LLC");

      const supplierDetails = await centralAuthority.getSupplierDetails(await supplier.getAddress());
      expect(supplierDetails.companyName).to.equal("Test Farm LLC");
      expect(supplierDetails.approved).to.be.false;
    });

    it("Should approve supplier", async function () {
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN"]
      );

      await expect(
        centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress())
      )
        .to.emit(centralAuthority, "SupplierApproved")
        .withArgs(await supplier.getAddress());

      const supplierDetails = await centralAuthority.getSupplierDetails(await supplier.getAddress());
      expect(supplierDetails.approved).to.be.true;
    });

    it("Should suspend supplier", async function () {
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN"]
      );

      await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());

      await expect(
        centralAuthority.connect(verifier).suspendSupplier(await supplier.getAddress())
      )
        .to.emit(centralAuthority, "SupplierSuspended")
        .withArgs(await supplier.getAddress());

      const supplierDetails = await centralAuthority.getSupplierDetails(await supplier.getAddress());
      expect(supplierDetails.approved).to.be.false;
    });

    it("Should fail to register supplier with unsupported asset types", async function () {
      await expect(
        centralAuthority.connect(operator).registerSupplier(
          await supplier.getAddress(),
          "Test Farm LLC",
          "Farm Location",
          ["UNSUPPORTED"]
        )
      ).to.be.revertedWith("Unsupported asset type");
    });
  });

  describe("Asset Verification", function () {
    beforeEach(async function () {
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN"]
      );

      await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());
    });

    it("Should verify asset backing", async function () {
      const quantity = ethers.parseEther("100");

      await expect(
        centralAuthority.connect(verifier).verifyAssetBacking(
          await supplier.getAddress(),
          "CHICKEN",
          quantity,
          "Farm A",
          "Initial verification"
        )
      )
        .to.emit(centralAuthority, "AssetVerificationCompleted")
        .withArgs(await supplier.getAddress(), await verifier.getAddress(), quantity)
        .and.to.emit(centralAuthority, "InventoryUpdated")
        .withArgs(await supplier.getAddress(), "CHICKEN", quantity);

      const inventory = await centralAuthority.getSupplierInventory(
        await supplier.getAddress(),
        "CHICKEN"
      );
      expect(inventory.totalQuantity).to.equal(quantity);
      expect(inventory.availableQuantity).to.equal(quantity);
    });

    it("Should fail to verify for unapproved supplier", async function () {
      const [unapprovedSupplier] = await ethers.getSigners();
      const quantity = ethers.parseEther("100");

      await expect(
        centralAuthority.connect(verifier).verifyAssetBacking(
          await unapprovedSupplier.getAddress(),
          "CHICKEN",
          quantity,
          "Farm A",
          "Initial verification"
        )
      ).to.be.revertedWith("Supplier not approved");
    });

    it("Should fail to verify unsupported asset type", async function () {
      const quantity = ethers.parseEther("100");

      await expect(
        centralAuthority.connect(verifier).verifyAssetBacking(
          await supplier.getAddress(),
          "UNSUPPORTED",
          quantity,
          "Farm A",
          "Initial verification"
        )
      ).to.be.revertedWith("Asset type not supported");
    });
  });

  describe("Token Minting Authorization", function () {
    beforeEach(async function () {
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN"]
      );

      await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());

      await centralAuthority.connect(admin).registerToken(
        await agricultureToken.getAddress(),
        "CHICKEN"
      );

      // Verify assets first
      const quantity = ethers.parseEther("100");
      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        "Farm A",
        "Initial verification"
      );
    });

    it("Should authorize token minting", async function () {
      const quantity = ethers.parseEther("50");
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
      )
        .to.emit(centralAuthority, "InventoryUpdated")
        .withArgs(await supplier.getAddress(), "CHICKEN", ethers.parseEther("50"));

      expect(await agricultureToken.balanceOf(await supplier.getAddress())).to.equal(quantity);

      const inventory = await centralAuthority.getSupplierInventory(
        await supplier.getAddress(),
        "CHICKEN"
      );
      expect(inventory.availableQuantity).to.equal(ethers.parseEther("50"));
    });

    it("Should fail to mint more than available inventory", async function () {
      const quantity = ethers.parseEther("150"); // More than verified
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

    it("Should fail to mint for unregistered token", async function () {
      const [otherToken] = await ethers.getSigners();
      const quantity = ethers.parseEther("50");
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);

      await expect(
        centralAuthority.connect(verifier).authorizeTokenMinting(
          await otherToken.getAddress(),
          await supplier.getAddress(),
          quantity,
          productionDate,
          expiryDate,
          "Farm A"
        )
      ).to.be.revertedWith("Token not registered");
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN", "EGG"]
      );

      await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());
    });

    it("Should batch verify assets", async function () {
      const suppliers = [await supplier.getAddress(), await supplier.getAddress()];
      const assetTypes = ["CHICKEN", "EGG"];
      const quantities = [ethers.parseEther("100"), ethers.parseEther("200")];
      const locations = ["Farm A", "Farm B"];

      await centralAuthority.connect(verifier).batchVerifyAssets(
        suppliers,
        assetTypes,
        quantities,
        locations
      );

      const chickenInventory = await centralAuthority.getSupplierInventory(
        await supplier.getAddress(),
        "CHICKEN"
      );
      const eggInventory = await centralAuthority.getSupplierInventory(
        await supplier.getAddress(),
        "EGG"
      );

      expect(chickenInventory.totalQuantity).to.equal(ethers.parseEther("100"));
      expect(eggInventory.totalQuantity).to.equal(ethers.parseEther("200"));
    });

    it("Should fail batch verification with mismatched arrays", async function () {
      const suppliers = [await supplier.getAddress()];
      const assetTypes = ["CHICKEN", "EGG"]; // Mismatched length
      const quantities = [ethers.parseEther("100")];
      const locations = ["Farm A"];

      await expect(
        centralAuthority.connect(verifier).batchVerifyAssets(
          suppliers,
          assetTypes,
          quantities,
          locations
        )
      ).to.be.revertedWith("Array length mismatch");
    });
  });

  describe("Access Control", function () {
    it("Should enforce role-based access control", async function () {
      // Only admin can add asset types
      await expect(
        centralAuthority.connect(verifier).addAssetType("BEEF")
      ).to.be.revertedWith("AccessControl: account");

      // Only operator can register suppliers
      await expect(
        centralAuthority.connect(verifier).registerSupplier(
          await supplier.getAddress(),
          "Test Farm",
          "Location",
          ["CHICKEN"]
        )
      ).to.be.revertedWith("AccessControl: account");

      // Only verifier can verify assets
      await expect(
        centralAuthority.connect(operator).verifyAssetBacking(
          await supplier.getAddress(),
          "CHICKEN",
          ethers.parseEther("100"),
          "Farm A",
          "Verification"
        )
      ).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Emergency Functions", function () {
    it("Should pause and unpause contract", async function () {
      await centralAuthority.connect(admin).pause();
      expect(await centralAuthority.paused()).to.be.true;

      await expect(
        centralAuthority.connect(verifier).verifyAssetBacking(
          await supplier.getAddress(),
          "CHICKEN",
          ethers.parseEther("100"),
          "Farm A",
          "Verification"
        )
      ).to.be.revertedWith("Pausable: paused");

      await centralAuthority.connect(admin).unpause();
      expect(await centralAuthority.paused()).to.be.false;
    });

    it("Should allow emergency token burning", async function () {
      // Setup for minting
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN"]
      );

      await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());

      await centralAuthority.connect(admin).registerToken(
        await agricultureToken.getAddress(),
        "CHICKEN"
      );

      const quantity = ethers.parseEther("100");
      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        "Farm A",
        "Initial verification"
      );

      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate - 1; // Already expired

      await centralAuthority.connect(verifier).authorizeTokenMinting(
        await agricultureToken.getAddress(),
        await supplier.getAddress(),
        quantity,
        productionDate,
        expiryDate,
        "Farm A"
      );

      // Emergency burn expired tokens
      await centralAuthority.connect(admin).emergencyBurnExpiredTokens(
        await agricultureToken.getAddress(),
        await supplier.getAddress()
      );

      expect(await agricultureToken.balanceOf(await supplier.getAddress())).to.equal(0);
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await centralAuthority.connect(operator).registerSupplier(
        await supplier.getAddress(),
        "Test Farm LLC",
        "Farm Location",
        ["CHICKEN"]
      );

      await centralAuthority.connect(admin).registerToken(
        await agricultureToken.getAddress(),
        "CHICKEN"
      );
    });

    it("Should return suppliers for asset type", async function () {
      const suppliers = await centralAuthority.getSuppliersForAssetType("CHICKEN");
      expect(suppliers).to.include(await supplier.getAddress());
    });

    it("Should return all suppliers", async function () {
      const allSuppliers = await centralAuthority.getAllSuppliers();
      expect(allSuppliers).to.include(await supplier.getAddress());
    });

    it("Should return tokens for asset type", async function () {
      const tokens = await centralAuthority.getTokensForAssetType("CHICKEN");
      expect(tokens).to.include(await agricultureToken.getAddress());
    });

    it("Should return verification details", async function () {
      await centralAuthority.connect(verifier).approveSupplier(await supplier.getAddress());
      
      const quantity = ethers.parseEther("100");
      await centralAuthority.connect(verifier).verifyAssetBacking(
        await supplier.getAddress(),
        "CHICKEN",
        quantity,
        "Farm A",
        "Test verification"
      );

      const verificationDetails = await centralAuthority.getVerificationDetails(
        await supplier.getAddress(),
        0
      );

      expect(verificationDetails.verifier).to.equal(await verifier.getAddress());
      expect(verificationDetails.quantity).to.equal(quantity);
      expect(verificationDetails.location).to.equal("Farm A");
      expect(verificationDetails.notes).to.equal("Test verification");
      expect(verificationDetails.verified).to.be.true;
    });
  });
});
