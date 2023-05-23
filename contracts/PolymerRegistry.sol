//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Polymer.sol";

struct RegisteredPolymer {
    address token1Addr;
    uint256 token1Rate;
    uint8 token1Decimals;
    string token1Ticker;
    address token2Addr;
    uint256 token2Rate;
    uint8 token2Decimals;
    string token2Ticker;
    string ticker;
    address polymerAddress;
}

contract PolymerRegistry {
    string public prefix; // The prefix is PLMR and starts different for each chain, eg P-PLMR for Polygon and B-PLMR for BSC,E-PRML for Eth etc

    uint256 public lastIndex; // The index of the last PLMR contract deployed!

    mapping(uint256 => RegisteredPolymer) public polymers; // The registered polymer contracts

    event NewPLMR(
        address contractAddress,
        address token1Addr,
        string token1Ticker,
        uint256 token1Rate,
        uint8 token1Decimals,
        address token2Addr,
        string token2Ticker,
        uint256 token2Rate,
        uint8 token2Decimals,
        string plmrName
    );

    /**
     *  The constructor takes a network specific prefix, that will be appended to the polymer contract's name!
     * _prefix Sets the prefix, the schema should be P-PLMR for Polygon, B-PLMR for BSC etc!
     */
    constructor(string memory _prefix) {
        prefix = _prefix;
        lastIndex = 0;
    }

    function createNewPLMR(
        address token1Addr,
        uint256 token1Rate,
        uint8 token1Decimals,
        address token2Addr,
        uint256 token2Rate,
        uint8 token2Decimals
    ) external {
        require(token1Decimals < 18, "Invalid Divider");
        require(token2Decimals < 18, "Invalid Divider");

        lastIndex++;
        string memory index = Strings.toString(lastIndex);
        string memory plmrName = string.concat(prefix, index);

        Polymer p = new Polymer(
            plmrName,
            token1Addr,
            token1Rate,
            token1Decimals,
            token2Addr,
            token2Rate,
            token2Decimals
        );

        string memory token1Ticker = ERC20(token1Addr).name();
        string memory token2Ticker = ERC20(token2Addr).name();
        polymers[lastIndex].token1Addr = token1Addr;
        polymers[lastIndex].token1Rate = token1Rate;
        polymers[lastIndex].token1Decimals = token1Decimals;
        polymers[lastIndex].token1Ticker = token1Ticker;

        polymers[lastIndex].token2Addr = token2Addr;
        polymers[lastIndex].token2Rate = token2Rate;
        polymers[lastIndex].token2Decimals = token2Decimals;
        polymers[lastIndex].token2Ticker = token2Ticker;

        polymers[lastIndex].ticker = plmrName;
        polymers[lastIndex].polymerAddress = address(p);

        emit NewPLMR(
            address(p),
            token1Addr,
            token1Ticker,
            token1Rate,
            token1Decimals,
            token2Addr,
            token2Ticker,
            token2Rate,
            token2Decimals,
            plmrName
        );
    }
}
