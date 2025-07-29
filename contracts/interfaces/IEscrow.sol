// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title IEscrow
 * @dev Interface for escrow contract managing agricultural asset transactions
 */
interface IEscrow {
    enum OrderStatus {
        PENDING,
        PAYMENT_DEPOSITED,
        ASSETS_DELIVERED,
        COMPLETED,
        CANCELLED,
        DISPUTED
    }

    struct Order {
        uint256 orderId;
        address buyer;
        address seller;
        address paymentToken;
        address[] assetTokens;
        uint256[] assetAmounts;
        uint256 paymentAmount;
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bool buyerVerified;
        bool sellerVerified;
        bool authorityVerified;
    }

    /**
     * @dev Event emitted when an order is created
     */
    event OrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 paymentAmount
    );

    /**
     * @dev Event emitted when payment is deposited
     */
    event PaymentDeposited(uint256 indexed orderId, uint256 amount);

    /**
     * @dev Event emitted when assets are delivered
     */
    event AssetsDelivered(uint256 indexed orderId);

    /**
     * @dev Event emitted when an order is completed
     */
    event OrderCompleted(uint256 indexed orderId);

    /**
     * @dev Event emitted when an order is cancelled
     */
    event OrderCancelled(uint256 indexed orderId);

    /**
     * @dev Event emitted when a party verifies the order
     */
    event OrderVerified(uint256 indexed orderId, address indexed verifier);

    /**
     * @dev Creates a new order
     * @param seller The seller address
     * @param paymentToken The payment token address
     * @param assetTokens Array of asset token addresses
     * @param assetAmounts Array of asset amounts
     * @param paymentAmount The payment amount
     * @param expirationTime The order expiration time
     */
    function createOrder(
        address seller,
        address paymentToken,
        address[] calldata assetTokens,
        uint256[] calldata assetAmounts,
        uint256 paymentAmount,
        uint256 expirationTime
    ) external returns (uint256);

    /**
     * @dev Deposits payment for an order
     * @param orderId The order ID
     */
    function depositPayment(uint256 orderId) external;

    /**
     * @dev Delivers assets for an order
     * @param orderId The order ID
     */
    function deliverAssets(uint256 orderId) external;

    /**
     * @dev Verifies an order by buyer, seller, or authority
     * @param orderId The order ID
     */
    function verifyOrder(uint256 orderId) external;

    /**
     * @dev Completes an order and releases funds
     * @param orderId The order ID
     */
    function completeOrder(uint256 orderId) external;

    /**
     * @dev Cancels an order
     * @param orderId The order ID
     */
    function cancelOrder(uint256 orderId) external;

    /**
     * @dev Returns order details
     * @param orderId The order ID
     */
    function getOrder(uint256 orderId) external view returns (Order memory);

    /**
     * @dev Returns the total number of orders
     */
    function getOrderCount() external view returns (uint256);
}
