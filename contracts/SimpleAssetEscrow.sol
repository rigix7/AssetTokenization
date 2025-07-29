// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SimpleAgricultureToken.sol";
import "./SimpleCentralAuthority.sol";

/**
 * @title SimpleAssetEscrow
 * @dev Simplified escrow contract for agricultural asset trading
 */
contract SimpleAssetEscrow is ReentrancyGuard, Ownable {
    struct Order {
        address buyer;
        address seller;
        address paymentToken;
        address[] assetTokens;
        uint256[] assetAmounts;
        uint256 paymentAmount;
        uint256 expirationTime;
        bool paymentDeposited;
        bool assetsDelivered;
        bool buyerVerified;
        bool sellerVerified;
        bool authorityVerified;
        bool completed;
        bool cancelled;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public orderCounter;
    
    SimpleCentralAuthority public centralAuthority;
    address public feeCollector;
    uint256 public feePercentage = 100; // 1% = 100 basis points
    
    // Events
    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller);
    event PaymentDeposited(uint256 indexed orderId, uint256 amount);
    event AssetsDelivered(uint256 indexed orderId);
    event OrderVerified(uint256 indexed orderId, address indexed verifier);
    event OrderCompleted(uint256 indexed orderId);
    event OrderCancelled(uint256 indexed orderId);
    
    constructor(address _centralAuthority, address _feeCollector, address _owner) Ownable(_owner) {
        centralAuthority = SimpleCentralAuthority(_centralAuthority);
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Create a new purchase order
     */
    function createOrder(
        address seller,
        address paymentToken,
        address[] memory assetTokens,
        uint256[] memory assetAmounts,
        uint256 paymentAmount,
        uint256 expirationTime
    ) external returns (uint256) {
        require(seller != address(0), "Invalid seller");
        require(paymentToken != address(0), "Invalid payment token");
        require(assetTokens.length == assetAmounts.length, "Array length mismatch");
        require(assetTokens.length > 0, "No assets specified");
        require(paymentAmount > 0, "Invalid payment amount");
        require(expirationTime > block.timestamp, "Invalid expiration time");
        require(centralAuthority.isSupplierApproved(seller), "Seller not approved");
        
        uint256 orderId = orderCounter++;
        
        orders[orderId] = Order({
            buyer: msg.sender,
            seller: seller,
            paymentToken: paymentToken,
            assetTokens: assetTokens,
            assetAmounts: assetAmounts,
            paymentAmount: paymentAmount,
            expirationTime: expirationTime,
            paymentDeposited: false,
            assetsDelivered: false,
            buyerVerified: false,
            sellerVerified: false,
            authorityVerified: false,
            completed: false,
            cancelled: false
        });
        
        emit OrderCreated(orderId, msg.sender, seller);
        return orderId;
    }
    
    /**
     * @dev Buyer deposits payment to escrow
     */
    function depositPayment(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(msg.sender == order.buyer, "Only buyer can deposit payment");
        require(!order.paymentDeposited, "Payment already deposited");
        require(!order.cancelled, "Order cancelled");
        require(block.timestamp < order.expirationTime, "Order expired");
        
        IERC20(order.paymentToken).transferFrom(msg.sender, address(this), order.paymentAmount);
        order.paymentDeposited = true;
        
        emit PaymentDeposited(orderId, order.paymentAmount);
    }
    
    /**
     * @dev Seller delivers assets to escrow
     */
    function deliverAssets(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(msg.sender == order.seller, "Only seller can deliver assets");
        require(order.paymentDeposited, "Payment not deposited");
        require(!order.assetsDelivered, "Assets already delivered");
        require(!order.cancelled, "Order cancelled");
        require(block.timestamp < order.expirationTime, "Order expired");
        
        // Transfer all asset tokens to escrow
        for (uint256 i = 0; i < order.assetTokens.length; i++) {
            IERC20(order.assetTokens[i]).transferFrom(
                msg.sender, 
                address(this), 
                order.assetAmounts[i]
            );
        }
        
        order.assetsDelivered = true;
        emit AssetsDelivered(orderId);
    }
    
    /**
     * @dev Verify order completion (buyer, seller, or authority)
     */
    function verifyOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.paymentDeposited && order.assetsDelivered, "Order not ready for verification");
        require(!order.completed && !order.cancelled, "Order already finalized");
        require(block.timestamp < order.expirationTime, "Order expired");
        
        if (msg.sender == order.buyer) {
            order.buyerVerified = true;
        } else if (msg.sender == order.seller) {
            order.sellerVerified = true;
        } else if (msg.sender == address(centralAuthority)) {
            order.authorityVerified = true;
        } else {
            revert("Unauthorized verifier");
        }
        
        emit OrderVerified(orderId, msg.sender);
        
        // Check if order can be completed (need at least 2 verifications)
        uint256 verificationCount = 0;
        if (order.buyerVerified) verificationCount++;
        if (order.sellerVerified) verificationCount++;
        if (order.authorityVerified) verificationCount++;
        
        if (verificationCount >= 2) {
            _completeOrder(orderId);
        }
    }
    
    /**
     * @dev Cancel order (before completion)
     */
    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(
            msg.sender == order.buyer || 
            msg.sender == order.seller || 
            msg.sender == owner(),
            "Unauthorized"
        );
        require(!order.completed, "Order already completed");
        require(!order.cancelled, "Order already cancelled");
        
        order.cancelled = true;
        
        // Return payment to buyer if deposited
        if (order.paymentDeposited) {
            IERC20(order.paymentToken).transfer(order.buyer, order.paymentAmount);
        }
        
        // Return assets to seller if delivered
        if (order.assetsDelivered) {
            for (uint256 i = 0; i < order.assetTokens.length; i++) {
                IERC20(order.assetTokens[i]).transfer(order.seller, order.assetAmounts[i]);
            }
        }
        
        emit OrderCancelled(orderId);
    }
    
    /**
     * @dev Complete order and release funds/assets
     */
    function _completeOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        order.completed = true;
        
        // Calculate fee
        uint256 fee = (order.paymentAmount * feePercentage) / 10000;
        uint256 sellerPayment = order.paymentAmount - fee;
        
        // Transfer payment to seller (minus fee)
        IERC20(order.paymentToken).transfer(order.seller, sellerPayment);
        
        // Transfer fee to fee collector
        if (fee > 0) {
            IERC20(order.paymentToken).transfer(feeCollector, fee);
        }
        
        // Transfer assets to buyer
        for (uint256 i = 0; i < order.assetTokens.length; i++) {
            IERC20(order.assetTokens[i]).transfer(order.buyer, order.assetAmounts[i]);
        }
        
        emit OrderCompleted(orderId);
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
    
    /**
     * @dev Update fee percentage (only owner)
     */
    function setFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        feePercentage = newFeePercentage;
    }
    
    /**
     * @dev Update fee collector (only owner)
     */
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid fee collector");
        feeCollector = newFeeCollector;
    }
}