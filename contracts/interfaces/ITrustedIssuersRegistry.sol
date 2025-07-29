// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title ITrustedIssuersRegistry
 * @dev Interface for managing trusted claim issuers
 */
interface ITrustedIssuersRegistry {
    /**
     * @dev Event emitted when a trusted issuer is added
     */
    event TrustedIssuerAdded(address indexed trustedIssuer, uint256[] claimTopics);

    /**
     * @dev Event emitted when a trusted issuer is removed
     */
    event TrustedIssuerRemoved(address indexed trustedIssuer);

    /**
     * @dev Event emitted when claim topics are updated for a trusted issuer
     */
    event ClaimTopicsUpdated(address indexed trustedIssuer, uint256[] claimTopics);

    /**
     * @dev Adds a trusted issuer with claim topics
     * @param trustedIssuer The address of the trusted issuer
     * @param claimTopics Array of claim topics the issuer can issue
     */
    function addTrustedIssuer(address trustedIssuer, uint256[] calldata claimTopics) external;

    /**
     * @dev Removes a trusted issuer
     * @param trustedIssuer The address of the trusted issuer
     */
    function removeTrustedIssuer(address trustedIssuer) external;

    /**
     * @dev Updates claim topics for a trusted issuer
     * @param trustedIssuer The address of the trusted issuer
     * @param claimTopics New array of claim topics
     */
    function updateIssuerClaimTopics(address trustedIssuer, uint256[] calldata claimTopics) external;

    /**
     * @dev Returns all trusted issuers
     */
    function getTrustedIssuers() external view returns (address[] memory);

    /**
     * @dev Returns claim topics for a trusted issuer
     * @param trustedIssuer The address of the trusted issuer
     */
    function getTrustedIssuerClaimTopics(address trustedIssuer) external view returns (uint256[] memory);

    /**
     * @dev Checks if an issuer is trusted
     * @param issuer The address to check
     */
    function isTrustedIssuer(address issuer) external view returns (bool);

    /**
     * @dev Verifies if an issuer can issue a specific claim topic
     * @param issuer The issuer address
     * @param claimTopic The claim topic
     */
    function hasClaimTopic(address issuer, uint256 claimTopic) external view returns (bool);
}
