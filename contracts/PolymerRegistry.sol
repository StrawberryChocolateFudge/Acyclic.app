//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Polymer.sol";
import "./RequestedTokens.sol";


contract PolymerRegistry {
    using SafeMath for uint256;
    bytes32 private constant _ONDEPLOYRETURN =
        keccak256("PolymerRegistry.onCreateNewPLMR");

    error InvalidDecimals();
    error OnlyOwner();
    error OnlyAcceptedToken();
 
    string private prefix = "PLMR";
    address private feeReciever;
    uint256 public flashFee; // The fee for the flash loans
    uint256 public lastIndex; // The index of the last PLMR contract deployed!

    RequestedTokens private requestedTokens;

    mapping(uint256 => address) public polymers; // The registered polymer contracts

    mapping(address => bool) public isPolymerAddress;

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

    constructor(uint256 _flashFee,address requestedTokens_) {
        lastIndex = 0;
        feeReciever = msg.sender;
        flashFee = _flashFee; // it's 500 for a 0.2% fee we divide, amount/flashFee
        // The 
        requestedTokens = RequestedTokens(requestedTokens_);
    }

    function setFlashFee(uint256 newFee) external {
        if (msg.sender != feeReciever) revert OnlyOwner();
        flashFee = newFee;
    }

    function createNewPLMR(
        address token1Addr,
        uint256 token1Rate,
        address token2Addr,
        uint256 token2Rate
    ) external {
        
        // If the address is not a PLMR address
        if(!isPolymerAddress[token1Addr]){
        // Only allow creating token pairs that were reviewed      
         if(requestedTokens.status(token1Addr) != TokenStatus.ACCEPTED) revert OnlyAcceptedToken();
        }
        // If the address 2 is not a PLMR address
        if(!isPolymerAddress[token2Addr]){
        // Only allow creating token pairs that were reviewed
          if(requestedTokens.status(token2Addr) != TokenStatus.ACCEPTED) revert OnlyAcceptedToken();
        }
        //Increment the index where I save the token
        lastIndex++;
        //Stringify the new index so I can concat it into a name and symbol
        string memory index = Strings.toString(lastIndex);
        //plmrName stores the token anme and symbol in an array
        string[] memory plmrName;
        // Name should be something like PLMR4-USDT/ETH
        plmrName[0] = string.concat(
            prefix,
            index,
            "-",
            ERC20(token1Addr).name(),
            "/",
            ERC20(token2Addr).name()
        );
        // Ticker should be like PLMR4, prefix+index
        plmrName[1] = string.concat(prefix, index);
        
        // Create a new Polymer contract
        Polymer p = new Polymer(
            plmrName,
            token1Addr,
            token1Rate,
            ERC20(token1Addr).decimals(),
            token2Addr,
            token2Rate,
            ERC20(token2Addr).decimals()
        );
        
        // Save the address of the deployed contract
        polymers[lastIndex] = address(p);

        emit NewPLMR(
            address(p),
            token1Addr,
            ERC20(token1Addr).name(),
            token1Rate,
            ERC20(token1Addr).decimals(),
            token2Addr,
            ERC20(token2Addr).name(),
            token2Rate,
            ERC20(token2Addr).decimals(),
            plmrName[1]
        );
    }

    function onCreateNewPLMR() external pure returns (bytes32) {
        return _ONDEPLOYRETURN;
    }

    function getFlashLoanFee() external view returns (uint256) {
        return flashFee;
    }

    function getFlashloanFeeReceiver() external view returns (address) {
        return feeReciever;
    }
}
