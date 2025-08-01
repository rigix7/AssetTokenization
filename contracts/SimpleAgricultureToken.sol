// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SimpleAgricultureToken
 * @dev Simplified agricultural asset token for the demo
 */
contract SimpleAgricultureToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    string public assetType;
    address public centralAuthority;
    
    // Asset verification and expiry tracking
    mapping(address => bool) public assetVerificationStatus;
    mapping(address => uint256) public assetExpiry;
    mapping(address => uint256) public mintTimestamp;
    
    // Default expiry periods (in seconds)
    uint256 public defaultExpiryPeriod;
    
    // Events
    event AssetVerified(address indexed holder, uint256 amount, string location, uint256 expiryDate);
    event AssetExpired(address indexed holder, uint256 amount);
    event ExpiryPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory _assetType,
        address _centralAuthority,
        address defaultAdmin,
        uint256 _defaultExpiryPeriod
    ) ERC20(name, symbol) {
        assetType = _assetType;
        centralAuthority = _centralAuthority;
        defaultExpiryPeriod = _defaultExpiryPeriod;
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, _centralAuthority);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }
    
    /**
     * @dev Mint tokens representing verified assets
     */
    function mint(
        address to, 
        uint256 amount, 
        uint256 expiryTimestamp,
        string memory location
    ) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Invalid recipient");
        require(expiryTimestamp > block.timestamp, "Expiry must be in future");
        
        _mint(to, amount);
        assetVerificationStatus[to] = true;
        assetExpiry[to] = expiryTimestamp;
        mintTimestamp[to] = block.timestamp;
        
        emit AssetVerified(to, amount, location, expiryTimestamp);
    }
    
    /**
     * @dev Mint tokens with default expiry period
     */
    function mintWithDefaultExpiry(
        address to, 
        uint256 amount, 
        string memory location
    ) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Invalid recipient");
        require(defaultExpiryPeriod > 0, "Default expiry period not set");
        
        uint256 expiryTimestamp = block.timestamp + defaultExpiryPeriod;
        
        _mint(to, amount);
        assetVerificationStatus[to] = true;
        assetExpiry[to] = expiryTimestamp;
        mintTimestamp[to] = block.timestamp;
        
        emit AssetVerified(to, amount, location, expiryTimestamp);
    }
    
    /**
     * @dev Burn expired tokens
     */
    function burnExpiredTokens(address holder) external onlyRole(MINTER_ROLE) {
        require(
            assetExpiry[holder] > 0 && block.timestamp >= assetExpiry[holder],
            "Assets not expired"
        );
        
        uint256 balance = balanceOf(holder);
        if (balance > 0) {
            _burn(holder, balance);
            assetVerificationStatus[holder] = false;
            emit AssetExpired(holder, balance);
        }
    }

    /**
     * @dev Allow farmers to burn their own assets early (for spoilage, disposal, etc.)
     */
    function burnOwnAssets(uint256 amount, string memory reason) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        
        // If burning all tokens, reset verification status
        if (balanceOf(msg.sender) == 0) {
            assetVerificationStatus[msg.sender] = false;
        }
        
        emit AssetExpired(msg.sender, amount);
    }
    
    /**
     * @dev Check if assets are valid (verified and not expired)
     */
    function areAssetsValid(address holder) external view returns (bool) {
        return assetVerificationStatus[holder] && 
               (assetExpiry[holder] == 0 || block.timestamp < assetExpiry[holder]);
    }
    
    /**
     * @dev Override transfer to check asset validity (only for non-zero holders)
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!paused(), "Token transfers are paused");
        // Only check validity if sender has tokens and verification status
        if (balanceOf(msg.sender) > 0 && assetVerificationStatus[msg.sender]) {
            require(this.areAssetsValid(msg.sender), "Assets not valid for transfer");
        }
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to check asset validity (only for non-zero holders)
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(!paused(), "Token transfers are paused");
        // Only check validity if sender has tokens and verification status
        if (balanceOf(from) > 0 && assetVerificationStatus[from]) {
            require(this.areAssetsValid(from), "Assets not valid for transfer");
        }
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Update default expiry period (admin only)
     */
    function updateDefaultExpiryPeriod(uint256 newExpiryPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldPeriod = defaultExpiryPeriod;
        defaultExpiryPeriod = newExpiryPeriod;
        emit ExpiryPeriodUpdated(oldPeriod, newExpiryPeriod);
    }
    
    /**
     * @dev Check time remaining until expiry
     */
    function getTimeUntilExpiry(address holder) external view returns (uint256) {
        if (assetExpiry[holder] == 0) return type(uint256).max; // No expiry set
        if (block.timestamp >= assetExpiry[holder]) return 0; // Already expired
        return assetExpiry[holder] - block.timestamp;
    }
    
    /**
     * @dev Check if tokens are expired
     */
    function isExpired(address holder) external view returns (bool) {
        return assetExpiry[holder] > 0 && block.timestamp >= assetExpiry[holder];
    }
    
    /**
     * @dev Returns detailed token information including expiry
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        string memory asset,
        uint256 totalSupply,
        address authority,
        uint256 defaultExpiry
    ) {
        return (
            name(),
            symbol(),
            assetType,
            super.totalSupply(),
            centralAuthority,
            defaultExpiryPeriod
        );
    }
    
    /**
     * @dev Get detailed holder information
     */
    function getHolderInfo(address holder) external view returns (
        uint256 balance,
        bool verified,
        uint256 expiryDate,
        uint256 mintDate,
        bool expired
    ) {
        return (
            balanceOf(holder),
            assetVerificationStatus[holder],
            assetExpiry[holder],
            mintTimestamp[holder],
            this.isExpired(holder)
        );
    }
}