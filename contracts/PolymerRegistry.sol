//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IInitializablePolymer.sol";
import "./interfaces/IRequestedTokens.sol";
import "./clone/CloneFactory.sol";

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
// It uses a factory pattern to clone new contracts from a deployed library contract
contract PolymerRegistry is Ownable, CloneFactory {
    using SafeMath for uint256;

    address private polymerLib; // The contract address of the Polymer token library used for the factory pattern deployments

    bytes32 private constant _ONDEPLOYRETURN =
        keccak256("PolymerRegistry.onCreateNewPLMR");

    error InvalidDecimals();
    error OnlyAcceptedToken();
    error InvalidRate();
    error OnlyOwner();
    error NotEnoughDeploymentFee();

    string private prefix = "PLMR"; // The prefix of the deployed token contracts
    address private feeReciever; // The address of the flash loan reciever
    uint256 private depositFeeDivider; // The fee for the deposit
    uint256 public lastIndex; // The index of the last PLMR contract deployed!

    IRequestedTokens private requestedTokens; // The token contract for requested tokens

    mapping(address => bool) public isPolymerAddress; // A helper mapping to check if an address is registered here

    // A struct used for easily accessing all saved Polymers on the Front end!
    struct PLMR {
        string plmrName;
        string plmrSymbol;
        address polymerAddress;
        address token1Addr;
        string token1Symbol;
        uint256 token1Rate;
        uint8 token1DecimalShift;
        bool token1IsPlmr;
        address token2Addr;
        string token2Symbol;
        uint256 token2Rate;
        uint8 token2DecimalShift;
        bool token2IsPlmr;
    }

    PLMR[] private allpolymers; // All the plmrs are stored in an array

    // Emit a NewPLMR event. The front end will listen to this event to navigate to the next page.
    event NewPLMR(PLMR);

    // A mapping to store how many times a token address was deployed with a PLMR token.
    // This is used for the SPAM protection, creating more PLMR token contracts with a token, that is already wrapped will get progressively more expensive! This is used to disincentivise spam attacks.
    mapping(address => uint256) private deploymentCounter;
    // The base fee for a new PLMR contract deployment is 0.05 ether. The base fee is multiplied with the deploymentCounter. The first deployment is always free.
    uint256 constant PLMRDeploymentBaseFee = 0.05 ether;

    /**
   @dev The costructor is invoked when deploying the contract
   @param depositFeeDivider_ is the variable used to divide an amount when calculating the fees for deposits
   @param requestedTokens_ is the address of the RequestedTokens contract deployed so only approved tokens can be used by  createNewPLMR
   @param polymerLib_ is the address of the Polymer token contract which is cloned
    */

    constructor(
        uint256 depositFeeDivider_,
        address requestedTokens_,
        address polymerLib_
    ) {
        // This is the starting index of the counter that counts deployed contracts.
        lastIndex = 0;
        // The address that recieves the fees is the deployer. It can be later updated by the owner (same address)
        feeReciever = msg.sender;
        depositFeeDivider = depositFeeDivider_; // it's 500 for a 0.2% fee we divide, amount/fee

        requestedTokens = IRequestedTokens(requestedTokens_);
        polymerLib = polymerLib_;
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
     @dev Create a new Polymer token pair from accepted requested tokens.
    The tokens must be either an already registered contract or a deployed PLMR contract!
    @param token1Addr the address of the  token1 
    @param token1Rate the rate of the token1
    @param token1DecimalShift the amount we shift the decimals of the token1 when for calculating the rate
    @param token2Addr the address of the token2
    @param token2Rate the rate of the token2
    @param token2DecimalShift The amount we shift the decimals of the token2 when calculating deposits and redemptions
    The msg.value must match the totalDeploymentFee, this fee exists to mitigate a spam attack on a external function that can be called by anyone. 
    The first tokens are free to deploy, then the price is 0.05 ETH and doubles with each new deployment. it is counted per token address.
     */

    function createNewPLMR(
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

        uint256 totalDeploymentFee = getDeploymentFee(token1Addr).add(
            getDeploymentFee(token2Addr)
        );

        if (totalDeploymentFee != msg.value) revert NotEnoughDeploymentFee();
        _forwardDeploymentFee();
        _incrementDeploymentCounter(token1Addr);
        _incrementDeploymentCounter(token2Addr);

        string[2] memory plmrName = _concatTokenName(token1Addr, token2Addr);

        // Create a new Polymer contract by cloning the library

        address initializedPolymer = cloneAndInitialize(
            plmrName,
            [token1Addr, token2Addr],
            [token1Rate, token2Rate],
            [token1DecimalShift, token2DecimalShift]
        );

        // Save the address of the deployed contract
        saveNewPLMRDetails(
            PLMR({
                plmrName: plmrName[0],
                plmrSymbol: plmrName[1],
                polymerAddress: address(initializedPolymer),
                token1Addr: token1Addr,
                token1Symbol: ERC20(token1Addr).symbol(),
                token1Rate: token1Rate,
                token1DecimalShift: token1DecimalShift,
                token1IsPlmr: isPolymerAddress[token1Addr],
                token2Addr: token2Addr,
                token2Symbol: ERC20(token2Addr).symbol(),
                token2Rate: token2Rate,
                token2DecimalShift: token2DecimalShift,
                token2IsPlmr: isPolymerAddress[token2Addr]
            })
        );
    }

    // Validate the token addresses are accepted to be used
    function _validateTokenAddresses(
        address token1Addr,
        address token2Addr
    ) internal view {
        // If the address is not a PLMR address
        if (!isPolymerAddress[token1Addr]) {
            // Only allow creating token pairs that were reviewed
            if (requestedTokens.getStatus(token1Addr) != TokenStatus.ACCEPTED)
                revert OnlyAcceptedToken();
        }
        // If the address 2 is not a PLMR address
        if (!isPolymerAddress[token2Addr]) {
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
    function _incrementDeploymentCounter(address ofToken) internal {
        deploymentCounter[ofToken] += 1;
    }

    //Concat the Token name
    function _concatTokenName(
        address token1Addr,
        address token2Addr
    ) internal returns (string[2] memory plmrName) {
        //Increment the index for the name of the token
        lastIndex++;
        //Stringify the new index so I can concat it into a name and symbol
        string memory index = Strings.toString(lastIndex);
        //plmrName stores the token name and symbol in an array
        // Name should be something like PLMR4-USDT/ETH and will be the .name() of the ERC-20 token
        plmrName[0] = string.concat(
            prefix,
            index,
            "-",
            ERC20(token1Addr).symbol(),
            "/",
            ERC20(token2Addr).symbol()
        );
        // Symbol should be like PLMR4, prefix+index, it will be the .symbol() of the ERC-20 token
        plmrName[1] = string.concat(prefix, index);
    }

    // Call clone and initualize the new Polymer contract
    function cloneAndInitialize(
        string[2] memory name_,
        address[2] memory tokenAddr_,
        uint256[2] memory tokenRate_,
        uint8[2] memory tokenDecimalShift_
    ) internal returns (address) {
        IInitialzablePolymer p = IInitialzablePolymer(createClone(polymerLib));
        p.initialize(name_, tokenAddr_, tokenRate_, tokenDecimalShift_);
        return address(p);
    }

    // Save the new deployed contracts data in storage and emit an event for the front end to pick up
    function saveNewPLMRDetails(PLMR memory plmr) internal {
        isPolymerAddress[plmr.polymerAddress] = true;
        allpolymers.push(plmr);
        emit NewPLMR(plmr);
    }

    // A function called by the deployed contract to check the registry.
    // This function is here to make sure only a registry with this interface can call the Polymer contract
    // It is replaced by the FactoryBytecode checking which makes more sense,
    // but I kept it to allow external checks that this contract supports deploying new PLMR contracts
    function onCreateNewPLMR() external pure returns (bytes32) {
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
    function getAllPolymers() external view returns (PLMR[] memory) {
        return allpolymers;
    }

    // Returns a deployed contract by index from the array
    function getPolymerByIndex(
        uint256 index
    ) external view returns (PLMR memory) {
        return allpolymers[index];
    }

    // Get the deployment fee of a token by multiplying it with the counter
    // This is public so it's called internally but also by the front end to calculate the fees needed
    function getDeploymentFee(address ofToken) public view returns (uint256) {
        return deploymentCounter[ofToken].mul(PLMRDeploymentBaseFee);
    }
}
