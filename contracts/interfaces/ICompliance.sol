// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title ICompliance
 * @dev Interface for compliance contract that manages transfer rules
 */
interface ICompliance {
    /**
     * @dev Event emitted when a compliance rule is added
     */
    event ComplianceRuleAdded(address indexed compliance);

    /**
     * @dev Checks if a transfer is compliant
     * @param from The address transferring tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens being transferred
     */
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);

    /**
     * @dev Called when tokens are transferred
     * @param from The address transferring tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens being transferred
     */
    function transferred(address from, address to, uint256 amount) external;

    /**
     * @dev Called when tokens are created
     * @param to The address receiving tokens
     * @param amount The amount of tokens being created
     */
    function created(address to, uint256 amount) external;

    /**
     * @dev Called when tokens are destroyed
     * @param from The address losing tokens
     * @param amount The amount of tokens being destroyed
     */
    function destroyed(address from, uint256 amount) external;

    /**
     * @dev Returns the token contract address
     */
    function getTokenBound() external view returns (address);

    /**
     * @dev Binds the compliance to a token
     * @param token The token contract address
     */
    function bindToken(address token) external;

    /**
     * @dev Unbinds the compliance from a token
     * @param token The token contract address
     */
    function unbindToken(address token) external;
}
