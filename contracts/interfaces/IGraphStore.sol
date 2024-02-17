//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

// The interface of the GraphStore used by the Graph contract. Interfaces are used when calling an external contract to reduce contract sizes
interface IGraphStore {
    function getFeeDivider() external view returns (uint256);

    function getFeeReceiver() external view returns (address);

    function onCreateNewAGPH() external pure returns (bytes32);

    function isAGPHAddress(address _address) external view returns (bool);

}
