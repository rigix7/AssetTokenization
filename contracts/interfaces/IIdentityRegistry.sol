// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title IIdentityRegistry
 * @dev Interface for identity registry that manages investor identities
 */
interface IIdentityRegistry {
    /**
     * @dev Event emitted when an identity is registered
     */
    event IdentityRegistered(address indexed investorAddress, address indexed identity);

    /**
     * @dev Event emitted when an identity is removed
     */
    event IdentityRemoved(address indexed investorAddress, address indexed identity);

    /**
     * @dev Event emitted when an identity is updated
     */
    event IdentityUpdated(address indexed investorAddress, address indexed oldIdentity, address indexed newIdentity);

    /**
     * @dev Event emitted when a country is updated for an identity
     */
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);

    /**
     * @dev Registers an identity for an investor
     * @param userAddress The address of the investor
     * @param identity The address of the identity contract
     * @param country The country code of the investor
     */
    function registerIdentity(address userAddress, address identity, uint16 country) external;

    /**
     * @dev Removes an identity for an investor
     * @param userAddress The address of the investor
     */
    function deleteIdentity(address userAddress) external;

    /**
     * @dev Updates an identity for an investor
     * @param userAddress The address of the investor
     * @param identity The new identity contract address
     */
    function updateIdentity(address userAddress, address identity) external;

    /**
     * @dev Updates the country for an investor
     * @param userAddress The address of the investor
     * @param country The new country code
     */
    function updateCountry(address userAddress, uint16 country) external;

    /**
     * @dev Returns the identity contract address for an investor
     * @param userAddress The address of the investor
     */
    function identity(address userAddress) external view returns (address);

    /**
     * @dev Returns the country code for an investor
     * @param userAddress The address of the investor
     */
    function investorCountry(address userAddress) external view returns (uint16);

    /**
     * @dev Checks if an address is verified (has a registered identity)
     * @param userAddress The address to check
     */
    function isVerified(address userAddress) external view returns (bool);

    /**
     * @dev Batch registers identities
     */
    function batchRegisterIdentity(
        address[] calldata userAddresses,
        address[] calldata identities,
        uint16[] calldata countries
    ) external;
}
