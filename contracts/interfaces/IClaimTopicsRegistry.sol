// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title IClaimTopicsRegistry
 * @dev Interface for managing trusted claim topics
 */
interface IClaimTopicsRegistry {
    /**
     * @dev Event emitted when a claim topic is added
     */
    event ClaimTopicAdded(uint256 indexed claimTopic);

    /**
     * @dev Event emitted when a claim topic is removed
     */
    event ClaimTopicRemoved(uint256 indexed claimTopic);

    /**
     * @dev Adds a trusted claim topic
     * @param claimTopic The claim topic to add
     */
    function addClaimTopic(uint256 claimTopic) external;

    /**
     * @dev Removes a trusted claim topic
     * @param claimTopic The claim topic to remove
     */
    function removeClaimTopic(uint256 claimTopic) external;

    /**
     * @dev Returns all trusted claim topics
     */
    function getClaimTopics() external view returns (uint256[] memory);

    /**
     * @dev Checks if a claim topic is trusted
     * @param claimTopic The claim topic to check
     */
    function isClaimTopicTrusted(uint256 claimTopic) external view returns (bool);
}
