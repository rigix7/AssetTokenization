import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { 
  AssetEscrow,
  AgricultureToken,
  IdentityRegistry,
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  DefaultCompliance,
  MockOnchainID,
  CentralAuthority
} from "../typechain-types";

describe("AssetEscrow", function () {
  let escrow: AssetEscrow;
  let paymentToken: AgricultureToken;
  let assetToken: AgricultureToken;
  let identityRegistry: IdentityRegistry;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let compliance: DefaultCompliance;
  let centralAuthority: CentralAuthority;
  let mockOnchainID: MockOnchainID;
  
  let owner: Signer;
  let authority: Signer;
  let buyer: Signer;
  let seller: Signer;
  let feeCollector: Signer;
  let verifier: Signer;

  beforeEach(async function () {
    [owner, authority, buyer, seller, feeCollector, verifier] = await ethers.getSigners();

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
    centralAuthority = await CentralAuthorityFactory.deploy(await authority.getAddress());

    // Deploy tokens
    const AgricultureTokenFactory = await ethers.getContractFactory("AgricultureToken");
    
    paymentToken = await AgricultureTokenFactory.deploy(
      "Test IDR Token",
      "tIDR",
      "IDR",
      18,
      await identityRegistry.getAddress(),
      await compliance.getAddress(),
      await mockOnchainID.getAddress(),
      await centralAuthority.getAddress(),
      await owner.getAddress()
    );

    assetToken = await AgricultureTokenFactory.deploy(
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

    // Deploy escrow
    const AssetEscrowFactory = await ethers.getContractFactory("AssetEscrow");
    escrow = await AssetEscrowFactory.deploy(
      await centralAuthority.getAddress(),
      await feeCollector.getAddress(),
      await owner.getAddress()
    );

    // Setup identities
    await identityRegistry.registerIdentity(
      await buyer.getAddress(),
      await mockOnchainID.getAddress(),
      840
    );

    await identityRegistry.registerIdentity(
      await seller.getAddress(),
      await mockOnchainID.getAddress(),
      840
    );

    // Bind compliance to tokens
    await compliance.bindToken(await paymentToken.getAddress());
    await compliance.bindToken(await assetToken.getAddress());

    // Setup central authority
    await centralAuthority.connect(authority).grantRole(
      await centralAuthority.VERIFIER_ROLE(),
      await verifier.getAddress()
    );

    // Register suppliers and tokens
    await centralAuthority.connect(authority).registerSupplier(
      await seller.getAddress(),
      "Test Farm",
      "Test Location",
      ["CHICKEN"]
    );

    await centralAuthority.connect(verifier).approveSupplier(await seller.getAddress());

    await centralAuthority.connect(authority).registerToken(
      await paymentToken.getAddress(),
      "IDR"
    );

    await centralAuthority.connect(authority).registerToken(
      await assetToken.getAddress(),
      "CHICKEN"
    );

    // Mint tokens for testing
    const paymentAmount = ethers.parseEther("1000");
    const assetAmount = ethers.parseEther("100");
    const productionDate = Math.floor(Date.now() / 1000);
    const expiryDate = productionDate + (30 * 24 * 60 * 60);

    // Verify and mint payment tokens
    await centralAuthority.connect(verifier).verifyAssetBacking(
      await buyer.getAddress(),
      "IDR",
      paymentAmount,
      "Bank A",
      "Payment verification"
    );

    await centralAuthority.connect(verifier).authorizeTokenMinting(
      await paymentToken.getAddress(),
      await buyer.getAddress(),
      paymentAmount,
      productionDate,
      expiryDate,
      "Bank A"
    );

    // Verify and mint asset tokens
    await centralAuthority.connect(verifier).verifyAssetBacking(
      await seller.getAddress(),
      "CHICKEN",
      assetAmount,
      "Farm A",
      "Asset verification"
    );

    await centralAuthority.connect(verifier).authorizeTokenMinting(
      await assetToken.getAddress(),
      await seller.getAddress(),
      assetAmount,
      productionDate,
      expiryDate,
      "Farm A"
    );
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await escrow.centralAuthority()).to.equal(await centralAuthority.getAddress());
      expect(await escrow.feeCollector()).to.equal(await feeCollector.getAddress());
      expect(await escrow.escrowFeeBasisPoints()).to.equal(100); // 1%
    });
  });

  describe("Order Creation", function () {
    it("Should create an order successfully", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

      const tx = await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      await expect(tx)
        .to.emit(escrow, "OrderCreated")
        .withArgs(1, await buyer.getAddress(), await seller.getAddress(), paymentAmount);

      const order = await escrow.getOrder(1);
      expect(order.buyer).to.equal(await buyer.getAddress());
      expect(order.seller).to.equal(await seller.getAddress());
      expect(order.paymentAmount).to.equal(paymentAmount);
      expect(order.status).to.equal(0); // PENDING
    });

    it("Should fail to create order with invalid parameters", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) - 1; // Past time

      await expect(
        escrow.connect(buyer).createOrder(
          await seller.getAddress(),
          await paymentToken.getAddress(),
          [await assetToken.getAddress()],
          [assetAmount],
          paymentAmount,
          expirationTime
        )
      ).to.be.revertedWith("Expiration time in the past");
    });

    it("Should fail to create order with same buyer and seller", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await expect(
        escrow.connect(buyer).createOrder(
          await buyer.getAddress(), // Same as caller
          await paymentToken.getAddress(),
          [await assetToken.getAddress()],
          [assetAmount],
          paymentAmount,
          expirationTime
        )
      ).to.be.revertedWith("Buyer and seller cannot be the same");
    });
  });

  describe("Payment Deposit", function () {
    let orderId: number;

    beforeEach(async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      orderId = 1;

      // Approve payment token transfer
      await paymentToken.connect(buyer).approve(
        await escrow.getAddress(),
        paymentAmount
      );
    });

    it("Should deposit payment successfully", async function () {
      const paymentAmount = ethers.parseEther("100");

      const tx = await escrow.connect(buyer).depositPayment(orderId);

      await expect(tx)
        .to.emit(escrow, "PaymentDeposited")
        .withArgs(orderId, paymentAmount);

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(1); // PAYMENT_DEPOSITED
    });

    it("Should fail if not buyer", async function () {
      await expect(
        escrow.connect(seller).depositPayment(orderId)
      ).to.be.revertedWith("Only buyer can deposit payment");
    });

    it("Should fail if payment already deposited", async function () {
      await escrow.connect(buyer).depositPayment(orderId);

      await expect(
        escrow.connect(buyer).depositPayment(orderId)
      ).to.be.revertedWith("Invalid order status");
    });
  });

  describe("Asset Delivery", function () {
    let orderId: number;

    beforeEach(async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      orderId = 1;

      // Approve and deposit payment
      await paymentToken.connect(buyer).approve(
        await escrow.getAddress(),
        paymentAmount
      );
      await escrow.connect(buyer).depositPayment(orderId);

      // Approve asset token transfer
      await assetToken.connect(seller).approve(
        await escrow.getAddress(),
        assetAmount
      );
    });

    it("Should deliver assets successfully", async function () {
      const tx = await escrow.connect(seller).deliverAssets(orderId);

      await expect(tx)
        .to.emit(escrow, "AssetsDelivered")
        .withArgs(orderId);

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(2); // ASSETS_DELIVERED
    });

    it("Should fail if not seller", async function () {
      await expect(
        escrow.connect(buyer).deliverAssets(orderId)
      ).to.be.revertedWith("Only seller can deliver assets");
    });

    it("Should fail if payment not deposited", async function () {
      // Create new order without payment
      const paymentAmount = ethers.parseEther("50");
      const assetAmount = ethers.parseEther("5");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      await expect(
        escrow.connect(seller).deliverAssets(2)
      ).to.be.revertedWith("Payment not deposited");
    });
  });

  describe("Order Verification and Completion", function () {
    let orderId: number;

    beforeEach(async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      orderId = 1;

      // Complete the deposit and delivery process
      await paymentToken.connect(buyer).approve(
        await escrow.getAddress(),
        paymentAmount
      );
      await escrow.connect(buyer).depositPayment(orderId);

      await assetToken.connect(seller).approve(
        await escrow.getAddress(),
        assetAmount
      );
      await escrow.connect(seller).deliverAssets(orderId);
    });

    it("Should verify order by all parties and complete automatically", async function () {
      // Buyer verification
      await expect(escrow.connect(buyer).verifyOrder(orderId))
        .to.emit(escrow, "OrderVerified")
        .withArgs(orderId, await buyer.getAddress());

      // Seller verification
      await expect(escrow.connect(seller).verifyOrder(orderId))
        .to.emit(escrow, "OrderVerified")
        .withArgs(orderId, await seller.getAddress());

      // Authority verification (should trigger completion)
      await expect(escrow.connect(centralAuthority).verifyOrder(orderId))
        .to.emit(escrow, "OrderVerified")
        .withArgs(orderId, await centralAuthority.getAddress())
        .and.to.emit(escrow, "OrderCompleted")
        .withArgs(orderId);

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(3); // COMPLETED
      expect(order.buyerVerified).to.be.true;
      expect(order.sellerVerified).to.be.true;
      expect(order.authorityVerified).to.be.true;
    });

    it("Should transfer tokens correctly on completion", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const feeAmount = paymentAmount * BigInt(100) / BigInt(10000); // 1% fee
      const sellerPayment = paymentAmount - feeAmount;

      const initialBuyerPaymentBalance = await paymentToken.balanceOf(await buyer.getAddress());
      const initialSellerPaymentBalance = await paymentToken.balanceOf(await seller.getAddress());
      const initialBuyerAssetBalance = await assetToken.balanceOf(await buyer.getAddress());
      const initialSellerAssetBalance = await assetToken.balanceOf(await seller.getAddress());
      const initialFeeCollectorBalance = await paymentToken.balanceOf(await feeCollector.getAddress());

      // Complete verification process
      await escrow.connect(buyer).verifyOrder(orderId);
      await escrow.connect(seller).verifyOrder(orderId);
      await escrow.connect(centralAuthority).verifyOrder(orderId);

      // Check final balances
      expect(await paymentToken.balanceOf(await buyer.getAddress()))
        .to.equal(initialBuyerPaymentBalance - paymentAmount);
      
      expect(await paymentToken.balanceOf(await seller.getAddress()))
        .to.equal(initialSellerPaymentBalance + sellerPayment);
      
      expect(await paymentToken.balanceOf(await feeCollector.getAddress()))
        .to.equal(initialFeeCollectorBalance + feeAmount);
      
      expect(await assetToken.balanceOf(await buyer.getAddress()))
        .to.equal(initialBuyerAssetBalance + assetAmount);
      
      expect(await assetToken.balanceOf(await seller.getAddress()))
        .to.equal(initialSellerAssetBalance - assetAmount);
    });
  });

  describe("Order Cancellation", function () {
    it("Should cancel pending order", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      const orderId = 1;

      await expect(escrow.connect(buyer).cancelOrder(orderId))
        .to.emit(escrow, "OrderCancelled")
        .withArgs(orderId);

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(4); // CANCELLED
    });

    it("Should refund payment when cancelling after deposit", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      const orderId = 1;
      const initialBalance = await paymentToken.balanceOf(await buyer.getAddress());

      // Deposit payment
      await paymentToken.connect(buyer).approve(
        await escrow.getAddress(),
        paymentAmount
      );
      await escrow.connect(buyer).depositPayment(orderId);

      // Cancel order
      await escrow.connect(buyer).cancelOrder(orderId);

      // Check refund
      expect(await paymentToken.balanceOf(await buyer.getAddress()))
        .to.equal(initialBalance);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to set central authority", async function () {
      const [newAuthority] = await ethers.getSigners();

      await expect(
        escrow.connect(buyer).setCentralAuthority(await newAuthority.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to set escrow fee", async function () {
      await expect(
        escrow.connect(buyer).setEscrowFee(200)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow central authority to resolve disputes", async function () {
      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await escrow.connect(buyer).createOrder(
        await seller.getAddress(),
        await paymentToken.getAddress(),
        [await assetToken.getAddress()],
        [assetAmount],
        paymentAmount,
        expirationTime
      );

      const orderId = 1;

      await expect(
        escrow.connect(buyer).resolveDispute(orderId, true)
      ).to.be.revertedWith("Only central authority can call");
    });
  });

  describe("Emergency Functions", function () {
    it("Should pause and unpause contract", async function () {
      await escrow.connect(owner).pauseContract();
      expect(await escrow.contractPaused()).to.be.true;

      const paymentAmount = ethers.parseEther("100");
      const assetAmount = ethers.parseEther("10");
      const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      await expect(
        escrow.connect(buyer).createOrder(
          await seller.getAddress(),
          await paymentToken.getAddress(),
          [await assetToken.getAddress()],
          [assetAmount],
          paymentAmount,
          expirationTime
        )
      ).to.be.revertedWith("Contract is paused");

      await escrow.connect(owner).unpauseContract();
      expect(await escrow.contractPaused()).to.be.false;
    });
  });
});
