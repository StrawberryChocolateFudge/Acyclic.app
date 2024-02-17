//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

// The initialization interface used with the factory deployment pattern
interface IInitialzableAGPH {
    // The interface
    function initialize(
        string[2] memory name_,
        address[2] memory tokenAddr_,
        uint256[2] memory tokenRate_,
        uint8[2] memory tokenDecimalShift_
    ) external;
}
