// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "../GraphStore.sol";

// Verify the bytecode of the GraphStore when calling initialize on the Graph contract
// This library linked to the deployed Graph contract template and secures the initializer function to make sure only the allowed contract can call it.
// This contract stores the keccak256 hash of the GraphStore runtimeCode
// The runtimeCode is compared to the extcodehash from the contract address we want to validate

// The library is accessed with "using ... for FactoryContractVerifierstate"
// The purpose of the counter is for the struct is just to hold a variable, since we can't initialize an empty struct with a method.
struct FactoryContractVerifierState {
    uint256 count;
}

library FactoryContractVerifier {
    event Verification(uint256 count);

    bytes32 constant codeHash = keccak256(type(GraphStore).runtimeCode);

    function checkFactoryBytecode(
        FactoryContractVerifierState storage self,
        address factoryAddress
    ) external returns (bool) {
        self.count++;
        emit Verification(self.count);
        bytes32 callerCodeHash;
        assembly {
            callerCodeHash := extcodehash(factoryAddress)
        }
        return codeHash == callerCodeHash;
    }
}
