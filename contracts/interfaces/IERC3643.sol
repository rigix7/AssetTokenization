// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC3643
 * @dev Interface for ERC3643 compliant tokens (T-REX standard)
 * Based on the official ERC-3643 implementation
 */
interface IERC3643 is IERC20 {
    /**
     * @dev Event emitted when tokens are issued to an investor
     */
    event UpdatedTokenInformation(string newName, string newSymbol, uint8 newDecimals, string newVersion, address newOnchainID);
    
    /**
     * @dev Event emitted when the identity registry is updated
     */
    event IdentityRegistryAdded(address indexed identityRegistry);
    
    /**
     * @dev Event emitted when the compliance contract is updated
     */
    event ComplianceAdded(address indexed compliance);

    /**
     * @dev Returns the compliance contract address
     */
    function getCompliance() external view returns (address);

    /**
     * @dev Returns the identity registry contract address
     */
    function getIdentityRegistry() external view returns (address);

    /**
     * @dev Returns the onchain ID of the token
     */
    function onchainID() external view returns (address);

    /**
     * @dev Returns the version of the token
     */
    function version() external view returns (string memory);

    /**
     * @dev Sets the identity registry address
     * @param identityRegistry_ The address of the identity registry
     */
    function setIdentityRegistry(address identityRegistry_) external;

    /**
     * @dev Sets the compliance contract address
     * @param compliance_ The address of the compliance contract
     */
    function setCompliance(address compliance_) external;

    /**
     * @dev Updates token information
     */
    function setTokenInformation(
        string calldata name_,
        string calldata symbol_,
        uint8 decimals_,
        string calldata version_,
        address onchainID_
    ) external;

    /**
     * @dev Mints tokens to a specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Burns tokens from a specified address
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * @dev Force transfer tokens (for compliance purposes)
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     */
    function forcedTransfer(address from, address to, uint256 amount) external;

    /**
     * @dev Batch force transfer tokens
     */
    function batchForcedTransfer(
        address[] calldata from,
        address[] calldata to,
        uint256[] calldata amounts
    ) external;

    /**
     * @dev Freezes tokens for a specific address
     * @param userAddress The address to freeze tokens for
     * @param amount The amount of tokens to freeze
     */
    function freezePartialTokens(address userAddress, uint256 amount) external;

    /**
     * @dev Unfreezes tokens for a specific address
     * @param userAddress The address to unfreeze tokens for
     * @param amount The amount of tokens to unfreeze
     */
    function unfreezePartialTokens(address userAddress, uint256 amount) external;

    /**
     * @dev Returns the amount of frozen tokens for an address
     * @param userAddress The address to check
     */
    function getFrozenTokens(address userAddress) external view returns (uint256);

    /**
     * @dev Pauses all token transfers
     */
    function pause() external;

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external;

    /**
     * @dev Returns whether the token is paused
     */
    function paused() external view returns (bool);
}
