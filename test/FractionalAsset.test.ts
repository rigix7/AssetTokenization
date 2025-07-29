import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { 
  FractionalAsset,
  IdentityRegistry,
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  MockOnchainID
} from "../typechain-types";

describe("FractionalAsset", function () {
  let fractionalAsset: FractionalAsset;
  let identityRegistry: IdentityRegistry;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let mockOnchainID: MockOnchainID;
  
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

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

    // Deploy fractional asset
    const FractionalAssetFactory = await ethers.getContractFactory("FractionalAsset");
    fractionalAsset = await FractionalAssetFactory.deploy(
      "Fractional Farm Assets",
      "FFA",
      "Farm Fractions",
      "FFRAC",
      await identityRegistry.getAddress(),
      await owner.getAddress()
    );

    // Register identities for testing
    await identityRegistry.registerIdentity(
      await user1.getAddress(),
      await mockOnchainID.getAddress(),
      840 // US country code
    );

    await identityRegistry.registerIdentity(
      await user2.getAddress(),
      await mockOnchainID.getAddress(),
      840
    );

    await identityRegistry.registerIdentity(
      await user3.getAddress(),
      await mockOnchainID.getAddress(),
      840
    );
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await fractionalAsset.name()).to.equal("Farm Fractions");
      expect(await fractionalAsset.symbol()).to.equal("FFRAC");
      expect(await fractionalAsset.identityRegistry()).to.equal(await identityRegistry.getAddress());
      expect(await fractionalAsset.FRACTIONS_PER_NFT()).to.equal(10000);
    });
  });

  describe("Asset Creation", function () {
    it("Should create asset as NFT", async function () {
      const tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"), // 1M value
        await user1.getAddress(),
        false // Start as NFT
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );

      expect(await fractionalAsset.ownerOf(tokenId)).to.equal(await user1.getAddress());
      expect(await fractionalAsset.nftExempt(await user1.getAddress(), tokenId)).to.be.true;

      const assetInfo = await fractionalAsset.getAssetInfo(tokenId);
      expect(assetInfo.assetType).to.equal("FARMLAND");
      expect(assetInfo.location).to.equal("Farm Location A");
      expect(assetInfo.totalValue).to.equal(ethers.parseEther("1000000"));
      expect(assetInfo.isActive).to.be.true;
    });

    it("Should create asset as fractional", async function () {
      const tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "EQUIPMENT",
        "Tractor Location B",
        ethers.parseEther("500000"),
        await user1.getAddress(),
        true // Start as fractional
      );

      await expect(
        fractionalAsset.connect(owner).createAsset(
          "EQUIPMENT",
          "Tractor Location B",
          ethers.parseEther("500000"),
          await user1.getAddress(),
          true
        )
      )
        .to.emit(fractionalAsset, "AssetFractionalized")
        .withArgs(tokenId, 10000);

      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(10000);
      expect(await fractionalAsset.isFractionalized(tokenId)).to.be.true;
    });

    it("Should fail to create asset for unverified owner", async function () {
      const [unverifiedUser] = await ethers.getSigners();

      await expect(
        fractionalAsset.connect(owner).createAsset(
          "FARMLAND",
          "Farm Location A",
          ethers.parseEther("1000000"),
          await unverifiedUser.getAddress(),
          false
        )
      ).to.be.revertedWith("Owner not verified");
    });
  });

  describe("Fractionalization", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );
    });

    it("Should fractionalize NFT", async function () {
      await expect(fractionalAsset.connect(user1).fractionalize(tokenId))
        .to.emit(fractionalAsset, "AssetFractionalized")
        .withArgs(tokenId, 10000);

      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(10000);
      expect(await fractionalAsset.isFractionalized(tokenId)).to.be.true;
      expect(await fractionalAsset.nftExempt(await user1.getAddress(), tokenId)).to.be.false;

      // NFT should be burned
      await expect(fractionalAsset.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should fail to fractionalize if not owner", async function () {
      await expect(
        fractionalAsset.connect(user2).fractionalize(tokenId)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should fail to fractionalize already fractionalized asset", async function () {
      await fractionalAsset.connect(user1).fractionalize(tokenId);

      await expect(
        fractionalAsset.connect(user1).fractionalize(tokenId)
      ).to.be.revertedWith("Already fractionalized");
    });
  });

  describe("Defunctionalization", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true // Start as fractional
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );
    });

    it("Should defunctionalize fractional tokens back to NFT", async function () {
      await expect(fractionalAsset.connect(user1).defunctionalize(tokenId))
        .to.emit(fractionalAsset, "AssetDefunctionalized")
        .withArgs(tokenId);

      expect(await fractionalAsset.ownerOf(tokenId)).to.equal(await user1.getAddress());
      expect(await fractionalAsset.nftExempt(await user1.getAddress(), tokenId)).to.be.true;
      expect(await fractionalAsset.isFractionalized(tokenId)).to.be.false;
      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(10000); // Should still show full ownership
    });

    it("Should fail to defunctionalize without owning all fractions", async function () {
      // Transfer some fractions to another user
      await fractionalAsset.connect(user1).transferFractional(
        tokenId,
        await user2.getAddress(),
        5000
      );

      await expect(
        fractionalAsset.connect(user1).defunctionalize(tokenId)
      ).to.be.revertedWith("Must own all fractions");
    });
  });

  describe("Fractional Transfers", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );
    });

    it("Should transfer fractional tokens", async function () {
      const transferAmount = 3000;

      await expect(
        fractionalAsset.connect(user1).transferFractional(
          tokenId,
          await user2.getAddress(),
          transferAmount
        )
      )
        .to.emit(fractionalAsset, "FractionalTransfer")
        .withArgs(tokenId, await user1.getAddress(), await user2.getAddress(), transferAmount);

      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(7000);
      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user2.getAddress()))
        .to.equal(3000);
    });

    it("Should fail transfer to unverified address", async function () {
      const [unverifiedUser] = await ethers.getSigners();

      await expect(
        fractionalAsset.connect(user1).transferFractional(
          tokenId,
          await unverifiedUser.getAddress(),
          1000
        )
      ).to.be.revertedWith("Recipient not verified");
    });

    it("Should fail transfer with insufficient balance", async function () {
      await expect(
        fractionalAsset.connect(user1).transferFractional(
          tokenId,
          await user2.getAddress(),
          15000 // More than total supply
        )
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail transfer from NFT holder", async function () {
      // First defunctionalize to NFT
      await fractionalAsset.connect(user1).defunctionalize(tokenId);

      await expect(
        fractionalAsset.connect(user1).transferFractional(
          tokenId,
          await user2.getAddress(),
          1000
        )
      ).to.be.revertedWith("Sender holds NFT, not fractions");
    });
  });

  describe("Exemption Management", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );
    });

    it("Should set exemption to convert fractions to NFT", async function () {
      await expect(fractionalAsset.connect(user1).setExemption(tokenId, true))
        .to.emit(fractionalAsset, "ExemptionChanged")
        .withArgs(await user1.getAddress(), tokenId, true);

      expect(await fractionalAsset.nftExempt(await user1.getAddress(), tokenId)).to.be.true;
      expect(await fractionalAsset.ownerOf(tokenId)).to.equal(await user1.getAddress());
    });

    it("Should set exemption to convert NFT to fractions", async function () {
      // First convert to NFT
      await fractionalAsset.connect(user1).setExemption(tokenId, true);

      // Then convert back to fractions
      await expect(fractionalAsset.connect(user1).setExemption(tokenId, false))
        .to.emit(fractionalAsset, "ExemptionChanged")
        .withArgs(await user1.getAddress(), tokenId, false);

      expect(await fractionalAsset.nftExempt(await user1.getAddress(), tokenId)).to.be.false;
      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(10000);
    });

    it("Should fail to set exemption without owning all fractions", async function () {
      // Transfer some fractions away
      await fractionalAsset.connect(user1).transferFractional(
        tokenId,
        await user2.getAddress(),
        3000
      );

      await expect(
        fractionalAsset.connect(user1).setExemption(tokenId, true)
      ).to.be.revertedWith("Must own all fractions");
    });
  });

  describe("NFT Transfers", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );
    });

    it("Should transfer NFT between verified addresses", async function () {
      await fractionalAsset.connect(user1).transferFrom(
        await user1.getAddress(),
        await user2.getAddress(),
        tokenId
      );

      expect(await fractionalAsset.ownerOf(tokenId)).to.equal(await user2.getAddress());
      expect(await fractionalAsset.nftExempt(await user1.getAddress(), tokenId)).to.be.false;
      expect(await fractionalAsset.nftExempt(await user2.getAddress(), tokenId)).to.be.true;
    });

    it("Should fail to transfer NFT to unverified address", async function () {
      const [unverifiedUser] = await ethers.getSigners();

      await expect(
        fractionalAsset.connect(user1).transferFrom(
          await user1.getAddress(),
          await unverifiedUser.getAddress(),
          tokenId
        )
      ).to.be.revertedWith("Recipient not verified");
    });

    it("Should fail to transfer fractionalized token as NFT", async function () {
      await fractionalAsset.connect(user1).fractionalize(tokenId);

      await expect(
        fractionalAsset.connect(user1).transferFrom(
          await user1.getAddress(),
          await user2.getAddress(),
          tokenId
        )
      ).to.be.revertedWith("Token is fractionalized");
    });
  });

  describe("Asset Management", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );
    });

    it("Should update asset information", async function () {
      await fractionalAsset.connect(owner).updateAssetInfo(
        tokenId,
        "New Location",
        ethers.parseEther("1200000")
      );

      const assetInfo = await fractionalAsset.getAssetInfo(tokenId);
      expect(assetInfo.location).to.equal("New Location");
      expect(assetInfo.totalValue).to.equal(ethers.parseEther("1200000"));
    });

    it("Should deactivate asset", async function () {
      await fractionalAsset.connect(owner).deactivateAsset(tokenId);

      const assetInfo = await fractionalAsset.getAssetInfo(tokenId);
      expect(assetInfo.isActive).to.be.false;
    });

    it("Should fail to get info for inactive asset", async function () {
      await fractionalAsset.connect(owner).deactivateAsset(tokenId);

      await expect(
        fractionalAsset.getAssetInfo(tokenId)
      ).to.be.revertedWith("Asset not active");
    });
  });

  describe("Emergency Functions", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );

      // Distribute fractions to multiple users
      await fractionalAsset.connect(user1).transferFractional(
        tokenId,
        await user2.getAddress(),
        3000
      );
      await fractionalAsset.connect(user1).transferFractional(
        tokenId,
        await user3.getAddress(),
        2000
      );
    });

    it("Should resolve fractional ownership issues", async function () {
      await fractionalAsset.connect(owner).emergencyResolve(tokenId, await user2.getAddress());

      expect(await fractionalAsset.ownerOf(tokenId)).to.equal(await user2.getAddress());
      expect(await fractionalAsset.nftExempt(await user2.getAddress(), tokenId)).to.be.true;
      expect(await fractionalAsset.isFractionalized(tokenId)).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to create assets", async function () {
      await expect(
        fractionalAsset.connect(user1).createAsset(
          "FARMLAND",
          "Farm Location A",
          ethers.parseEther("1000000"),
          await user1.getAddress(),
          false
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to update asset info", async function () {
      const tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        false
      );

      await expect(
        fractionalAsset.connect(user1).updateAssetInfo(
          tokenId,
          "New Location",
          ethers.parseEther("1200000")
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to set identity registry", async function () {
      await expect(
        fractionalAsset.connect(user1).setIdentityRegistry(await identityRegistry.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Balance Queries", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      tokenId = await fractionalAsset.connect(owner).createAsset.staticCall(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );

      await fractionalAsset.connect(owner).createAsset(
        "FARMLAND",
        "Farm Location A",
        ethers.parseEther("1000000"),
        await user1.getAddress(),
        true
      );
    });

    it("Should return correct fractional balance", async function () {
      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(10000);

      await fractionalAsset.connect(user1).transferFractional(
        tokenId,
        await user2.getAddress(),
        3000
      );

      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(7000);
      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user2.getAddress()))
        .to.equal(3000);
    });

    it("Should return correct balance for NFT holder", async function () {
      await fractionalAsset.connect(user1).defunctionalize(tokenId);

      expect(await fractionalAsset.fractionalBalanceOf(tokenId, await user1.getAddress()))
        .to.equal(10000);
    });
  });

  describe("ERC-20 Transfer Restrictions", function () {
    it("Should revert on generic ERC-20 transfers", async function () {
      await expect(
        fractionalAsset.connect(user1).transfer(await user2.getAddress(), 1000)
      ).to.be.revertedWith("Use transferFractional for specific tokens");

      await expect(
        fractionalAsset.connect(user1).transferFrom(
          await user1.getAddress(),
          await user2.getAddress(),
          1000
        )
      ).to.be.revertedWith("Use transferFractional for specific tokens");
    });
  });
});
