//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Polymer.sol";
import "./RequestedTokens.sol";

//  _______  _______  _______ _________ _______ _________ _______
// (  ____ )(  ____ \(  ____ \\__   __/(  ____ \\__   __/(  ____ )|\     /|
// | (    )|| (    \/| (    \/   ) (   | (    \/   ) (   | (    )|( \   / )
// | (____)|| (__    | |         | |   | (_____    | |   | (____)| \ (_) /
// |     __)|  __)   | | ____    | |   (_____  )   | |   |     __)  \   /
// | (\ (   | (      | | \_  )   | |         ) |   | |   | (\ (      ) (
// | ) \ \__| (____/\| (___) |___) (___/\____) |   | |   | ) \ \__   | |
// |/   \__/(_______/(_______)\_______/\_______)   )_(   |/   \__/   \_/

// This contract is used to deploy new Polymer contracts to wrap tokens with.
// The contract also controls the flash loan fee and transfers the fee to the owner
// All official Polymer contracts must be deployed from this registry to show up in the front end application!
contract PolymerRegistry is Ownable {
    using SafeMath for uint256;
    bytes32 private constant _ONDEPLOYRETURN =
        keccak256("PolymerRegistry.onCreateNewPLMR");

    error InvalidDecimals();
    error OnlyAcceptedToken();
    error InvalidRate();

    string private prefix = "PLMR"; // The prefix of the deployed token contracts
    address private feeReciever; // The address of the flash loan reciever
    uint256 private depositFeeDivider; // The fee for the deposit
    uint256 public lastIndex; // The index of the last PLMR contract deployed!

    RequestedTokens private requestedTokens;

    mapping(uint256 => address) public polymers; // The registered polymer contract addresses

    mapping(address => bool) public isPolymerAddress; // A helper mapping to check if an address is registered here

    // A struct used for easily accessing all saved Polymers on the Front end!
    struct PLMR {
        address polymerAddress;
        address token1Addr;
        string token1Ticker;
        uint256 token1Rate;
        uint8 token1DecimalShift;
        address token2Addr;
        string token2Ticker;
        uint256 token2Rate;
        uint8 token2DecimalShift;
        string plmrName;
    }

    PLMR[] private allpolymers;

    event NewPLMR(PLMR);

    constructor(uint256 _depositFeeDivider, address requestedTokens_) {
        lastIndex = 0;
        feeReciever = msg.sender;
        depositFeeDivider = _depositFeeDivider; // it's 500 for a 0.2% fee we divide, amount/fee
        // The
        requestedTokens = RequestedTokens(requestedTokens_);
    }

    // The owner can set the flash loan fee
    function setFeeDivider(uint256 newFeeDivider) external onlyOwner {
        depositFeeDivider = newFeeDivider;
    }

    // The owner can update the address that recieves the fees
    function updateFeeReciever(address _to) external onlyOwner {
        feeReciever = _to;
    }

    // Transfer the ownership to another address. Later the contract could be transferred to a Dao to collect and vote on fees
    function transferOwnership(
        address newOwner
    ) public virtual override onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }

    /**
     @dev Create a new Polymer token pair from accepted requested tokens.
          The tokens must be either an already registered contract or a deployed PLMR contract!
    @param token1Addr the address of the  token1 
    @param token1Rate the rate of the token1
    @param token1DecimalShift the amount we shift the decimals of the token1 when for calculating the rate
    @param token2Addr the address of the token2
    @param token2Rate the rate of the token2
    @param token2DecimalShift The amount we shift the decimals of the token2 when calculating deposits and redemptions
     */

    function createNewPLMR(
        address token1Addr,
        uint256 token1Rate,
        uint8 token1DecimalShift,
        address token2Addr,
        uint256 token2Rate,
        uint8 token2DecimalShift
    ) external {
        if (!(token1DecimalShift <= ERC20(token1Addr).decimals()))
            revert InvalidDecimals();
        if (!(token2DecimalShift <= ERC20(token2Addr).decimals()))
            revert InvalidDecimals();

        if (token1Rate == 0) revert InvalidRate();
        if (token2Rate == 0) revert InvalidRate();

        // If the address is not a PLMR address
        if (!isPolymerAddress[token1Addr]) {
            // Only allow creating token pairs that were reviewed
            if (requestedTokens.status(token1Addr) != TokenStatus.ACCEPTED)
                revert OnlyAcceptedToken();
        }
        // If the address 2 is not a PLMR address
        if (!isPolymerAddress[token2Addr]) {
            // Only allow creating token pairs that were reviewed
            if (requestedTokens.status(token2Addr) != TokenStatus.ACCEPTED)
                revert OnlyAcceptedToken();
        }
        //Increment the index where I save the token
        lastIndex++;
        //Stringify the new index so I can concat it into a name and symbol
        string memory index = Strings.toString(lastIndex);
        //plmrName stores the token anme and symbol in an array
        string[2] memory plmrName;
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
            [token1Addr, token2Addr],
            [token1Rate, token2Rate],
            [token1DecimalShift, token2DecimalShift]
        );

        // Save the address of the deployed contract
        polymers[lastIndex] = address(p);
        saveNewPLMRDetails(
            PLMR(
                address(p),
                token1Addr,
                ERC20(token1Addr).name(),
                token1Rate,
                token1DecimalShift,
                token2Addr,
                ERC20(token2Addr).name(),
                token2Rate,
                token2DecimalShift,
                plmrName[1]
            )
        );
    }

    function saveNewPLMRDetails(PLMR memory plmr) internal {
        allpolymers.push(plmr);
        emit NewPLMR(plmr);
    }

    function onCreateNewPLMR() external pure returns (bytes32) {
        return _ONDEPLOYRETURN;
    }

    function getFeeReceiver() external view returns (address) {
        return feeReciever;
    }

    function getFeeDivider() external view returns (uint256) {
        return depositFeeDivider;
    }

    function getAllPolymers() external view returns (PLMR[] memory) {
        return allpolymers;
    }
}
