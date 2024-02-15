//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PolymerRegistry.sol";

//  _______  _______  _              _______  _______  _______
// (  ____ )(  ___  )( \   |\     /|(       )(  ____ \(  ____ )
// | (    )|| (   ) || (   ( \   / )| () () || (    \/| (    )|
// | (____)|| |   | || |    \ (_) / | || || || (__    | (____)|
// |  _____)| |   | || |     \   /  | |(_)| ||  __)   |     __)
// | (      | |   | || |      ) (   | |   | || (      | (\ (
// | )      | (___) || (____/\| |   | )   ( || (____/\| ) \ \__
// |/       (_______)(_______/\_/   |/     \|(_______/|/   \__/

// This is a modified token contract that allows wrapping 2 tokens to combine them and mint a new one, or to redeem the wrapped tokens.

contract Polymer is Context, IERC20, IERC20Metadata, ReentrancyGuard {
    bytes32 private constant _ONDEPLOYRETURN =
        keccak256("PolymerRegistry.onCreateNewPLMR");

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address private _token1Addr;
    uint256 private _token1Rate;
    uint8 private _token1DecimalShift;

    address private _token2Addr;
    uint256 private _token2Rate;
    uint8 private _token2DecimalShift;

    address private registryAddress;

    event MintPLMR(address to, uint256 amount);
    event RedeemPLMR(address to, uint256 amount);

    /**
     * @dev Create a new Polymer token
     * @param name_ Sets the name and the symbol. name_[0] is the name of the token, name_[1] is the symbol
     * @param tokenAddr_ Sets the address of the token used for backing this token. tokenAddr[0] is for token1Addr and tokenAddr[1] is for token2Addr
     * @param tokenRate_ Sets the rate of tokens needed to be transferred here to back this token. tokenRate_[0] is for token1Rate and tokenRate_[1] is for token2Rate
     * @param tokenDecimalShift_ is used to calculate amounts when decimals are needed
     */
    constructor(
        string[2] memory name_,
        address[2] memory tokenAddr_,
        uint256[2] memory tokenRate_,
        uint8[2] memory tokenDecimalShift_
    ) {
        // The name and the symbols are the same for PLMR tokens
        _name = name_[0];
        _symbol = name_[1];
        _token1Addr = tokenAddr_[0];
        _token1Rate = tokenRate_[0];
        _token1DecimalShift = tokenDecimalShift_[0];
        _token2Addr = tokenAddr_[1];
        _token2Rate = tokenRate_[1];
        _token2DecimalShift = tokenDecimalShift_[1];
        // Will make sure the deployer is a contract because that's where the flashLoan fees will come from!
        require(
            PolymerRegistry(msg.sender).onCreateNewPLMR() == _ONDEPLOYRETURN,
            "Only Registry"
        );
        registryAddress = msg.sender;
    }

    /**
    * @dev : How calculateTokenDeposits works?
    * The amount represents the amount of PLMR tokens I want to mint or redeem
    * The amount is in wei always and the rate represents how many tokens I need per wei.
    * The decimalShift is used to implement decimal numbers. It will be used as a power of 10.

    * Example: I want 1 PLMR token so amount is 1 and wrap 0.001 BTC in it , then I use (amount 1 * rate 1) / 10**3
    * If I want 1 PLMR token to contain 0.69 BTC, then I use (amount 1 * rate 69) /10 ** 2

    */
    function calculateTokenDeposits(
        uint256 amount, // The amount of PLMR tokens I want to get, in WEI
        uint256 rate,
        uint8 _decimalShift // Dividing the token deposit, divider is 18 max,I divide with 10^1 to 10^18, if divider is 0 then I can't divide. Checks are implemented in the registry.
    ) public pure returns (uint256) {
        uint256 depositRate = rate.mul(amount);
        return depositRate.div(10 ** _decimalShift);
    }

    /**
     * @dev The calculateFee takes the amount, fetches the fee divider from the registry and divides the amount with it.
     * This function is only used for depositing value. It must be called by the front end to calculate how much to approve before making a deposit.
     * Example:
     * For a 1% fee, we divide the amount by 100.
     * For a 0.5% fee, we divide the amount by 200
     * For 0.25 we divide by 400
     * For a 0.2% fee we divide the amount by 500
     * For a 0.1% fee we divide the amount by 1000
     * etc...
     */
    function calculateFee(uint256 amount) public view returns (uint256) {
        uint256 feeDivider = PolymerRegistry(registryAddress).getFeeDivider();
        return amount.div(feeDivider);
    }

    // Add a mint function that requires transfer of token1 and token2 to this contract and then mints 1 token for it
    function mintPLMR(uint256 amount) external nonReentrant {
        // Transfer tokens here from the sender's address calculate how much I need
        address sender = _msgSender();

        uint256 token1Deposit = calculateTokenDeposits(
            amount,
            _token1Rate,
            _token1DecimalShift
        );
        uint256 token2Deposit = calculateTokenDeposits(
            amount,
            _token2Rate,
            _token2DecimalShift
        );

        uint256 token1Fee = calculateFee(token1Deposit);
        uint256 token2Fee = calculateFee(token2Deposit);

        // Transfer the tokens here, we need to transfer the tokens with the fee to address(this) contract
        _moveTokens(sender, _token1Addr, token1Deposit.add(token1Fee));
        _moveTokens(sender, _token1Addr, token2Deposit.add(token2Fee));

        // Forward the fee from this contract to the feeReciever
        _forwardFee(_token1Addr, token1Fee);
        _forwardFee(_token2Addr, token2Fee);

        // Now mint the token amount to the owner
        _mint(sender, amount);
        emit MintPLMR(sender, amount);
    }

    // Transfer tokens on behalf of their owner
    function _moveTokens(
        address tokenOwner,
        address tokenAddr_,
        uint256 amount
    ) internal {
        IERC20(tokenAddr_).safeTransferFrom(tokenOwner, address(this), amount);
    }

    // Transfer the fee to the feeReceiver
    function _forwardFee(address tokenAddress, uint256 feeAmount) internal {
        IERC20(tokenAddress).transfer(
            PolymerRegistry(registryAddress).getFeeReceiver(),
            feeAmount
        );
    }

    // Withdraw the tokens after redeeming them
    function _withdrawTokens(address to, uint256 amount) internal {
        IERC20(_token1Addr).transfer(to, amount);
    }

    //  The redeem function that requires the user to have tokens and will burn it and transfer the backing back to the sender
    function redeemPLMR(uint256 amount) external nonReentrant {
        address sender = _msgSender();
        // Burn the tokens, the burn function checks if the sender actually owns the balance!
        _burn(sender, amount);

        uint256 token1Withdraw = calculateTokenDeposits(
            amount,
            _token1Rate,
            _token1DecimalShift
        );

        uint256 token2Withdraw = calculateTokenDeposits(
            amount,
            _token2Rate,
            _token2DecimalShift
        );
        //Withdraw tokens to the woner of the tokens
        _withdrawTokens(sender, token1Withdraw);
        _withdrawTokens(sender, token2Withdraw);

        emit RedeemPLMR(sender, amount);
    }

    /**
      @dev returns the details of the backing tokens! 1 PLMR must be backed by 2 tokens always.
     */
    function getBacking()
        public
        view
        returns (address, uint256, uint8, address, uint256, uint8)
    {
        return (
            _token1Addr,
            _token1Rate,
            _token1DecimalShift,
            _token2Addr,
            _token2Rate,
            _token2DecimalShift
        );
    }

    //  _______  _______  _______             _______  _______
    // (  ____ \(  ____ )(  ____ \           / ___   )(  __   )
    // | (    \/| (    )|| (    \/           \/   )  || (  )  |
    // | (__    | (____)|| |         _____       /   )| | /   |
    // |  __)   |     __)| |        (_____)    _/   / | (/ /) |
    // | (      | (\ (   | |                  /   _/  |   / | |
    // | (____/\| ) \ \__| (____/\           (   (__/\|  (__) |
    // (_______/|/   \__/(_______/           \_______/(_______)

    //#########################################################################################

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(
        address owner,
        address spender
    ) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(
        address spender,
        uint256 amount
    ) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(
            currentAllowance >= subtractedValue,
            "ERC20: decreased allowance below zero"
        );
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(from, to, amount);

        uint256 fromBalance = _balances[from];
        require(
            fromBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );
        unchecked {
            _balances[from] = fromBalance - amount;
            // Overflow not possible: the sum of all balances is capped by totalSupply, and the sum is preserved by
            // decrementing then incrementing.
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);

        _afterTokenTransfer(from, to, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        unchecked {
            // Overflow not possible: balance + amount is at most totalSupply + amount, which is checked above.
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);

        _afterTokenTransfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            // Overflow not possible: amount <= accountBalance <= totalSupply.
            _totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `amount`.
     *
     * Does not update the allowance amount in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Might emit an {Approval} event.
     */
    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(
                currentAllowance >= amount,
                "ERC20: insufficient allowance"
            );
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}
}
