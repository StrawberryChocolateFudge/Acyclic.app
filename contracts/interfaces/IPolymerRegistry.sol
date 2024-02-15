//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

interface IPolymerRegistry {
    function getFeeDivider() external view returns (uint256);

    function getFeeReceiver() external view returns (address);

    function onCreateNewPLMR() external pure returns (bytes32);
}
