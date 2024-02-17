//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IInitializableAGPH.sol";
import "./interfaces/IRequestedTokens.sol";
import "./clone/CloneFactory.sol";

// ╔═╗┬─┐┌─┐┌─┐┬ ┬╔═╗┌┬┐┌─┐┬─┐┌─┐
// ║ ╦├┬┘├─┤├─┘├─┤╚═╗ │ │ │├┬┘├┤ 
// ╚═╝┴└─┴ ┴┴  ┴ ┴╚═╝ ┴ └─┘┴└─└─┘
// This contract is used to deploy new Graphs to wrap tokens into.
// The contract also controls the fees and transfers the fee to the owner
// All Graph contracts must be deployed from this store to show up in the front end application!
// It uses a factory pattern to clone new contracts from a deployed library contract

contract GraphStore is Ownable, CloneFactory {
    using SafeMath for uint256;

    address private agphLib; // The contract address of the graph token library used for the factory pattern deployments

   bytes32 private constant _ONDEPLOYRETURN =
        keccak256("GraphStore.onCreateNewAGPH");

    error InvalidDecimals();
    error OnlyAcceptedToken();
    error InvalidRate();
    error OnlyOwner();
    error NotEnoughDeploymentFee();

    string private prefix = "AGPH"; // The prefix of the deployed token contracts
    address private feeReciever; // The address of the flash loan reciever
    uint256 private depositFeeDivider; // The fee for the deposit
    uint256 public lastIndex; // The index of the last AGPH contract deployed!

    IRequestedTokens private requestedTokens; // The token contract for requested tokens

    mapping(address => bool) public isAGPHAddress; // A helper mapping to check if an address is registered here

    // A struct used for easily accessing all saved Graphs on the Front end!
    struct AGPH {
        string agphName;
        string agphSymbol;
        address agphAddress;
        address token1Addr;
        string token1Symbol;
        uint256 token1Rate;
        uint8 token1DecimalShift;
        bool token1IsAgph;
        address token2Addr;
        string token2Symbol;
        uint256 token2Rate;
        uint8 token2DecimalShift;
        bool token2IsAgph;
    }

    AGPH[] private allAGPH; // All the agph are stored in an array

    // Emit a NewAGPH event. The front end will listen to this event to navigate to the next page.
    event NewAGPH(AGPH);

    // A mapping to store how many times a token pair was deployed as a AGPH token.
    // This is used for spam protection, createNewAGPH can be called by anyone, but creating more AGPH token contracts with the same pair that is already wrapped will get progressively more expensive!
    mapping(bytes32 => uint256) private deploymentCounter;
    // The base fee for a new AGPH contract deployment is 0.05 ether. The base fee is multiplied with the deploymentCounter. The first deployment is always free.
    uint256 private constant PLMRDeploymentBaseFee = 0.05 ether;

    /**
   @dev The constructor is invoked when deploying the contract
   @param depositFeeDivider_ is the variable used to divide an amount when calculating the fees for deposits
   @param requestedTokens_ is the address of the RequestedTokens contract deployed so only approved tokens can be used by  createNewAGPH
   @param agphLib_ is the address of the AGPH token contract which is cloned
    */

    constructor(
        uint256 depositFeeDivider_,
        address requestedTokens_,
        address agphLib_
    ) {
        // This is the starting index of the counter that counts deployed contracts.
        lastIndex = 0;
        // The address that recieves the fees is the deployer. It can be later updated by the owner (same address)
        feeReciever = msg.sender;
        depositFeeDivider = depositFeeDivider_; // it's 500 for a 0.2% fee we divide, amount/fee

        requestedTokens = IRequestedTokens(requestedTokens_);
        agphLib = agphLib_;
    }

    // The owner can set the fee
    function setFeeDivider(uint256 newFeeDivider) external onlyOwner {
        depositFeeDivider = newFeeDivider;
    }

    // The owner can update the address that recieves the fees
    function updateFeeReciever(address _to) external onlyOwner {
        feeReciever = _to;
    }

    // Transfer the ownership to another address. Later the contract could be transferred to a Dao to collect and vote on fees
    // This function is copied from openzeppelin and was not modified
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
     @dev Create a new AGPH with a token pair from accepted requested tokens.
    The tokens must be either already accepted token contracts or a deployed AGPH contract!
    @param token1Addr the address of the  token1 
    @param token1Rate the rate of the token1
    @param token1DecimalShift the amount we shift the decimals of the token1 when for calculating the rate
    @param token2Addr the address of the token2
    @param token2Rate the rate of the token2
    @param token2DecimalShift The amount we shift the decimals of the token2 when calculating deposits and redemptions
    The msg.value must match the totalDeploymentFee, this fee exists to mitigate a spam attack on a external function that can be called by anyone. 
    The first tokens are free to deploy, then the price is 0.05 ETH and doubles with each new deployment. it is counted per token address pairs!
     */

    function createNewAGPH(
        address token1Addr,
        uint256 token1Rate,
        uint8 token1DecimalShift,
        address token2Addr,
        uint256 token2Rate,
        uint8 token2DecimalShift
    ) external payable {
        if (!(token1DecimalShift <= ERC20(token1Addr).decimals()))
            revert InvalidDecimals();
        if (!(token2DecimalShift <= ERC20(token2Addr).decimals()))
            revert InvalidDecimals();

        if (token1Rate == 0) revert InvalidRate();
        if (token2Rate == 0) revert InvalidRate();

        _validateTokenAddresses(token1Addr, token2Addr);

        if (getDeploymentFee(token1Addr, token2Addr) != msg.value)
            revert NotEnoughDeploymentFee();

        _forwardDeploymentFee();
        _incrementDeploymentCounter(token1Addr, token2Addr);

        string[2] memory agphName = _concatTokenName(token1Addr, token2Addr);

        // Create a new AGPH contract by cloning the library

        address initializedAGPH = cloneAndInitialize(
            agphName,
            [token1Addr, token2Addr],
            [token1Rate, token2Rate],
            [token1DecimalShift, token2DecimalShift]
        );

        // Save the address of the deployed contract
        saveNewAGPHDetails(
            AGPH({
                agphName: agphName[0],
                agphSymbol: agphName[1],
                agphAddress: address(initializedAGPH),
                token1Addr: token1Addr,
                token1Symbol: ERC20(token1Addr).symbol(),
                token1Rate: token1Rate,
                token1DecimalShift: token1DecimalShift,
                token1IsAgph: isAGPHAddress[token1Addr],
                token2Addr: token2Addr,
                token2Symbol: ERC20(token2Addr).symbol(),
                token2Rate: token2Rate,
                token2DecimalShift: token2DecimalShift,
                token2IsAgph: isAGPHAddress[token2Addr]
            })
        );
    }

    // Validate the token addresses are accepted to be used
    function _validateTokenAddresses(
        address token1Addr,
        address token2Addr
    ) internal view {
        // If the address is not a PLMR address
        if (!isAGPHAddress[token1Addr]) {
            // Only allow creating token pairs that were reviewed
            if (requestedTokens.getStatus(token1Addr) != TokenStatus.ACCEPTED)
                revert OnlyAcceptedToken();
        }
        // If the address 2 is not a PLMR address
        if (!isAGPHAddress[token2Addr]) {
            // Only allow creating token pairs that were reviewed
            if (requestedTokens.getStatus(token2Addr) != TokenStatus.ACCEPTED)
                revert OnlyAcceptedToken();
        }
    }

    /**
     * @dev Forwards the funds to the feeReciever
     */
    function _forwardDeploymentFee() internal {
        payable(feeReciever).transfer(msg.value);
    }

    // This function modifies state and increments the deployment counter!
    function _incrementDeploymentCounter(
        address token1Addr,
        address token2Addr
    ) internal {
        deploymentCounter[tokenAddressHasher(token1Addr, token2Addr)] += 1;
        // Increment the counter for both alignment so it can't be bypassed by changing the order of tokens in the pair
        deploymentCounter[tokenAddressHasher(token2Addr, token1Addr)] += 1;
    }

    //Concat the Token name
    function _concatTokenName(
        address token1Addr,
        address token2Addr
    ) internal returns (string[2] memory agphName) {
        //Increment the index for the name of the token
        lastIndex++;
        //Stringify the new index so I can concat it into a name and symbol
        string memory index = Strings.toString(lastIndex);
        // agphName stores the token name and symbol in an array
        // Name should be something like AGPH4-USDT/ETH and will be the .name() of the ERC-20 token
        agphName[0] = string.concat(
            prefix,
            index,
            "-",
            ERC20(token1Addr).symbol(),
            "/",
            ERC20(token2Addr).symbol()
        );
        // Symbol should be like AGPH4, prefix+index, it will be the .symbol() of the ERC-20 token
        agphName[1] = string.concat(prefix, index);
    }

    // Call clone and initualize the new AGPH contract
    function cloneAndInitialize(
        string[2] memory name_,
        address[2] memory tokenAddr_,
        uint256[2] memory tokenRate_,
        uint8[2] memory tokenDecimalShift_
    ) internal returns (address) {
        IInitialzableAGPH a = IInitialzableAGPH(createClone(agphLib));
        a.initialize(name_, tokenAddr_, tokenRate_, tokenDecimalShift_);
        return address(a);
    }

    // Save the new deployed contracts data in storage and emit an event for the front end to pick up
    function saveNewAGPHDetails(AGPH memory agph) internal {
        isAGPHAddress[agph.agphAddress] = true;
        allAGPH.push(agph);
        emit NewAGPH(agph);
    }

    // A function called by the deployed contract to check the registry.
    // This function is here to make sure only a registry with this interface can call the AGPH contract
    // It is replaced by the FactoryBytecode checking which makes more sense,
    // but I kept it to allow external checks that this contract supports deploying new AGPH contracts
    function onCreateNewAGPH() external pure returns (bytes32) {
        return _ONDEPLOYRETURN;
    }

    // Returns the address that recieves the deposit fees
    function getFeeReceiver() external view returns (address) {
        return feeReciever;
    }

    // Returns the value used for calculating the fee
    function getFeeDivider() external view returns (uint256) {
        return depositFeeDivider;
    }

    // Returns all the deployed contracts
    function getAllAGPH() external view returns (AGPH[] memory) {
        return allAGPH;
    }

    // Returns a deployed contract by index from the array
    function getAGPHByIndex(
        uint256 index
    ) external view returns (AGPH memory) {
        return allAGPH[index];
    }

    function tokenAddressHasher(
        address token1Addr,
        address token2Addr
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(token1Addr, token2Addr));
    }

    // Get the deployment fee of a token by multiplying it with the counter
    // This is public so it's called internally but also by the front end to calculate the fees needed
    function getDeploymentFee(
        address token1Addr,
        address token2Addr
    ) public view returns (uint256) {
        return
            deploymentCounter[tokenAddressHasher(token1Addr, token2Addr)].mul(
                PLMRDeploymentBaseFee
            );
    }
}
