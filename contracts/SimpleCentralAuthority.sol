// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SimpleAgricultureToken.sol";

/**
 * @title SimpleCentralAuthority
 * @dev Simplified central authority for agricultural asset verification
 */
contract SimpleCentralAuthority is AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    struct Supplier {
        string name;
        string location;
        string[] assetTypes;
        bool isApproved;
        uint256 registrationTime;
    }
    
    struct AssetVerification {
        address supplier;
        string assetType;
        uint256 quantity;
        string location;
        string verificationNotes;
        uint256 timestamp;
        address verifier;
    }
    
    mapping(address => Supplier) public suppliers;
    mapping(address => mapping(string => address)) public registeredTokens; // supplier => assetType => token
    mapping(uint256 => AssetVerification) public assetVerifications;
    uint256 public verificationCounter;
    
    // Events
    event SupplierRegistered(address indexed supplier, string name);
    event SupplierApproved(address indexed supplier);
    event TokenRegistered(address indexed tokenAddress, string assetType);
    event AssetVerified(uint256 indexed verificationId, address indexed supplier, string assetType, uint256 quantity);
    event TokenMinted(address indexed token, address indexed recipient, uint256 amount);
    
    constructor(address defaultAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(VERIFIER_ROLE, defaultAdmin);
        _grantRole(OPERATOR_ROLE, defaultAdmin);
    }
    
    /**
     * @dev Register a new supplier
     */
    function registerSupplier(
        address supplierAddress,
        string memory name,
        string memory location,
        string[] memory assetTypes
    ) external onlyRole(OPERATOR_ROLE) {
        require(supplierAddress != address(0), "Invalid supplier address");
        require(suppliers[supplierAddress].registrationTime == 0, "Supplier already registered");
        
        suppliers[supplierAddress] = Supplier({
            name: name,
            location: location,
            assetTypes: assetTypes,
            isApproved: false,
            registrationTime: block.timestamp
        });
        
        emit SupplierRegistered(supplierAddress, name);
    }
    
    /**
     * @dev Approve a registered supplier
     */
    function approveSupplier(address supplierAddress) external onlyRole(VERIFIER_ROLE) {
        require(suppliers[supplierAddress].registrationTime > 0, "Supplier not registered");
        suppliers[supplierAddress].isApproved = true;
        emit SupplierApproved(supplierAddress);
    }
    
    /**
     * @dev Register a token for an asset type
     */
    function registerToken(address tokenAddress, string memory assetType) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenAddress != address(0), "Invalid token address");
        registeredTokens[msg.sender][assetType] = tokenAddress;
        emit TokenRegistered(tokenAddress, assetType);
    }
    
    /**
     * @dev Verify asset backing for a supplier
     */
    function verifyAssetBacking(
        address supplier,
        string memory assetType,
        uint256 quantity,
        string memory location,
        string memory verificationNotes
    ) external onlyRole(VERIFIER_ROLE) returns (uint256) {
        require(suppliers[supplier].isApproved, "Supplier not approved");
        
        uint256 verificationId = verificationCounter++;
        
        assetVerifications[verificationId] = AssetVerification({
            supplier: supplier,
            assetType: assetType,
            quantity: quantity,
            location: location,
            verificationNotes: verificationNotes,
            timestamp: block.timestamp,
            verifier: msg.sender
        });
        
        emit AssetVerified(verificationId, supplier, assetType, quantity);
        return verificationId;
    }
    
    /**
     * @dev Authorize token minting after asset verification
     */
    function authorizeTokenMinting(
        address tokenAddress,
        address recipient,
        uint256 amount,
        uint256 createdAt,
        uint256 expiryTimestamp,
        string memory location
    ) external onlyRole(VERIFIER_ROLE) {
        require(tokenAddress != address(0), "Invalid token address");
        require(suppliers[recipient].isApproved, "Recipient not approved supplier");
        
        SimpleAgricultureToken token = SimpleAgricultureToken(tokenAddress);
        token.mint(recipient, amount, expiryTimestamp, location);
        
        emit TokenMinted(tokenAddress, recipient, amount);
    }
    
    /**
     * @dev Emergency burn expired tokens
     */
    function emergencyBurnExpiredTokens(address tokenAddress, address holder) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        SimpleAgricultureToken(tokenAddress).burnExpiredTokens(holder);
    }
    
    /**
     * @dev Check if supplier is approved
     */
    function isSupplierApproved(address supplier) external view returns (bool) {
        return suppliers[supplier].isApproved;
    }
    
    /**
     * @dev Get supplier information
     */
    function getSupplierInfo(address supplier) external view returns (
        string memory name,
        string memory location,
        string[] memory assetTypes,
        bool isApproved,
        uint256 registrationTime
    ) {
        Supplier memory sup = suppliers[supplier];
        return (sup.name, sup.location, sup.assetTypes, sup.isApproved, sup.registrationTime);
    }
    
    /**
     * @dev Get asset verification details
     */
    function getAssetVerification(uint256 verificationId) external view returns (AssetVerification memory) {
        return assetVerifications[verificationId];
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}