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
    
    // Asset verification tracking
    mapping(address => bool) public assetVerificationStatus;
    mapping(address => uint256) public assetExpiry;
    
    // Events
    event AssetVerified(address indexed holder, uint256 amount, string location);
    event AssetExpired(address indexed holder, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory _assetType,
        address _centralAuthority,
        address defaultAdmin
    ) ERC20(name, symbol) {
        assetType = _assetType;
        centralAuthority = _centralAuthority;
        
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
        
        _mint(to, amount);
        assetVerificationStatus[to] = true;
        assetExpiry[to] = expiryTimestamp;
        
        emit AssetVerified(to, amount, location);
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
     * @dev Returns detailed token information
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        string memory asset,
        uint256 totalSupply,
        address authority
    ) {
        return (
            name(),
            symbol(),
            assetType,
            super.totalSupply(),
            centralAuthority
        );
    }
}