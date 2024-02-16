//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

enum TokenStatus {
    EMPTY,
    PENDING,
    ACCEPTED,
    REJECTED
}


// The initialization interface used with the factory deployment pattern
interface IRequestedTokens {
    // The interface
    function getStatus(address statusOf) external view returns (TokenStatus);
}

