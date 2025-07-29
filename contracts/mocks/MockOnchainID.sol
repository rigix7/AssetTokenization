// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title MockOnchainID
 * @dev Mock implementation of OnchainID for testing purposes
 */
contract MockOnchainID {
    address public owner;
    mapping(bytes32 => mapping(address => bool)) public keyHasPurpose;
    mapping(uint256 => mapping(address => bytes)) public claims;

    constructor(address _owner) {
        owner = _owner;
    }

    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType) external returns (bool success) {
        keyHasPurpose[_key][msg.sender] = true;
        return true;
    }

    function addClaim(
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes calldata _signature,
        bytes calldata _data,
        string calldata _uri
    ) external returns (bool success) {
        claims[_topic][_issuer] = _data;
        return true;
    }

    function getClaim(uint256 _topic, address _issuer) external view returns (bytes memory) {
        return claims[_topic][_issuer];
    }

    function getClaimIdsByTopic(uint256 _topic) external pure returns (bytes32[] memory) {
        bytes32[] memory claimIds = new bytes32[](1);
        claimIds[0] = keccak256(abi.encodePacked(_topic));
        return claimIds;
    }
}
