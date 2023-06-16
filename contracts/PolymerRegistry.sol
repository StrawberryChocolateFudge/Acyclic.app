//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Polymer.sol";

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory _input
    ) external returns (bool);
}

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

enum BridgeDirection {
    TO,
    FROM
}

struct BridgedAsset {
    address creator;
    bytes32 commitment;
    bytes32 nullfifierHash;
    BridgeDirection direction;
    uint256 chainId;
    uint256 polymerAddress;
    uint256 amount;
}

contract PolymerRegistry {
    using SafeMath for uint256;
    bytes32 private constant _ONDEPLOYRETURN =
        keccak256("PolymerRegistry.onCreateNewPLMR");

    error InvalidDecimals();
    error OnlyOwner();

    string private prefix = "PLMR";
    address private _owner;
    uint256 public flashFee; // The fee for the flash loans
    uint256 public lastIndex; // The index of the last PLMR contract deployed!

    mapping(uint256 => RegisteredPolymer) public polymers; // The registered polymer contracts

    mapping(uint256 => BridgedAsset) public bridgedAssets;

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

    constructor(uint256 _flashFee) {
        lastIndex = 0;
        _owner = msg.sender;
        flashFee = _flashFee; // it's 500 for a 0.2% fee we divide, amount/flashFee
    }

    function setFlashFee(uint256 newFee) external {
        if (msg.sender != _owner) revert OnlyOwner();
        flashFee = newFee;
    }

    function createNewPLMR(
        address token1Addr,
        uint256 token1Rate,
        uint8 token1Decimals,
        address token2Addr,
        uint256 token2Rate,
        uint8 token2Decimals,
        bool mintable // If the contract is mintable then we can deposit and redeem else it's just for bridging
    ) external {
        if (msg.sender != _owner) revert OnlyOwner();
        if (!(token1Decimals < ERC20(token1Addr).decimals()))
            revert InvalidDecimals();
        if (!(token2Decimals < ERC20(token2Addr).decimals()))
            revert InvalidDecimals();

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
            token2Decimals,
            mintable
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

    function onCreateNewPLMR() external pure returns (bytes32) {
        return _ONDEPLOYRETURN;
    }

    function getFlashLoanFee() external view returns (uint256) {
        return flashFee;
    }

    function getFlashloanFeeReceiver() external view returns (address) {
        return _owner;
    }

    // Maybe add here cross-chain messaging for the derivatives
    // the registry could call the child contracts and mint bridged asset
    // or the registry could initiate asset bridging

    function createBridgedAsset(
        uint256 toChainId,
        uint256 amount,
        uint256 polymerId
    ) external {
        address polymerAddress = polymers[polymerId].polymerAddress;
        Polymer(polymerAddress).zkBridgeAssetBurn(msg.sender, amount);
        // I just need to broadcast
    }

    // USE ZKSNARK TO VERIFY A WITHDRAW AND MINT THE ASSET
    function claimBridgedAsset() external {}
}
