//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

// The interface of the PolymerRegistry used by the Polymer contract. Interfaces are used when calling an external contract to reduce contract sizes
interface IPolymerRegistry {
    function getFeeDivider() external view returns (uint256);

    function getFeeReceiver() external view returns (address);

    function onCreateNewPLMR() external pure returns (bytes32);

    function isPolymerAddress(address _address) external view returns (bool);

}
