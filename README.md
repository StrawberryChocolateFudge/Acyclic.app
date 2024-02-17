```
 ____   ___   _      __ __  ___ ___    ___  ____       ___ ___   ___   ____     ___  __ __ 
|    \ /   \ | |    |  |  ||   |   |  /  _]|    \     |   |   | /   \ |    \   /  _]|  |  |
|  o  )     || |    |  |  || _   _ | /  [_ |  D  )    | _   _ ||     ||  _  | /  [_ |  |  |
|   _/|  O  || |___ |  ~  ||  \_/  ||    _]|    /     |  \_/  ||  O  ||  |  ||    _]|  ~  |
|  |  |     ||     ||___, ||   |   ||   [_ |    \  __ |   |   ||     ||  |  ||   [_ |___, |
|  |  |     ||     ||     ||   |   ||     ||  .  \|  ||   |   ||     ||  |  ||     ||     |
|__|   \___/ |_____||____/ |___|___||_____||__|\_||__||___|___| \___/ |__|__||_____||____/ 
```


##  **The ultimate portfolio diversification tool**

Polymer.money is a protocol that allows you to wrap 2 tokens to derive a new one pegged to them. These tokens can be redeemed any time, implementation is similar to weth but wrapping 2 tokens instead of 1.

The application was inspired by chemistry, I was looking at polymer chains and wondering  what if we could arrange tokens like that, hence the name. The combinations of tokens may grow in size to contain an arbitrary large amount of assets.

The created derivatives can be combined with each other to create further combinations which is structured as a **directed acyclic graph**.

A simple DAG could be visualised as:

```               
                  BTC
                 /
                /
PLMR2-PLMR1/BTC                  ETH
                \                /
                 \              /
                  PLMR1-ETH/USDC
                                \
                                 \
                                  USDC

```
The following DAG is an example. It's an ERC-20 token with a symbol PLMR2, and it's value is derived from BTC,ETH and USDC. it can be redeemed for BTC and PLMR1, which can be redeemed for ETH and USDC

A single token can hold many other and can give you exposure to more assets by holding a single token.

---

## DISCLAIMER
**The tokens created with polymer.money are not investment contracts and do not provide any extra value.**
All the value is derived from the underlying wrapped assets which may or may not be investments vehicles or store of value.

Tokens created with polymer.money will never be registered securities and should not be thought of as separate assets, but a composition of others. They allow you to store your existing tokens in a directed acyclic graph together, instead of separately scattered in a wallet.

**Cryptocurrency is high risk.** There is zero insurance that the underlying assets continue to trade for value and the derived tokens reflect only the underlying price.
There is zero insurance that PLMR tokens backed by assets can be traded anywhere. We don't provide a liquid market.

While having a diverse portfolio could protect you, polymer.money does not offer an insurance of any kind. 

The creators of the protocol are idemnified of any liabilities for losses that may occur while trading or holding crypto currencies.

**Not an investment! Use at your own risk!**

---

### Examples

An example would be to hold 0.01 ETH and 100USDC in a single token, then any ETH volatility will effect your portfolio token less due to the exposure to USDC and you may redeem the ETH and USDC any time.



### **The wrapped tokens can be visualized with a Directed Acyclic Graph (DAG).**

The wrappable tokens are always reviewed first to avoid malicious token contracts making their way into the DAG.

The review process supports a DAO integration and open participation to decentralize the protocol.
However that's not implemented so the deployer owns the contracts and manually reviews and approves/revokes proposed tokens.

---
## **Fees**

There are fees during deposit for externally deployed tokens like ARB, USDC etc but not for registered PLMR tokens.

The fees are a small added cost, during deposit only, the redemptions will always redeem 100% of the deposited backing, to make sure the price peg is accurate. 

For example: To mint a PLMR token with 0.001 ETH and 100USDC backing, with a deposit fee of 0.2% on each asset, the user must approve and deposit 0.001002 ETH and 100.02 USDC to mint 1 token. 
When redeeming this, the user will burn 1 token and recieve exactly 0.001 ETH and 100USDC as there are no redemption fees at all.

#### **There are Fees for spam protection when deploying new PLMR tokens**
When interacting with the registry to bind a new token pair, there is a deployment fee. This is used to disincentivise spam attacks.
The function call that creates a new PLMR token contract is public and can be called by anyone, so an attacker might spam the contract and create large amount of tokens as a form of DOS attack. This is solved with a deployment fee.

The contract maintains and increments an internal deployment counter and will multiply it with a base fee. This fee is required to be deposited, else the deployment fails. This allows users to create new derivatives for a cost but will mitigate a DOS Spam attack.

### **The real value of the PLMR token will always match 100% the underlying deposits.**

However, large combinations of tokens could be harder to track for price and they may depeg on Dexes. This leads to interesting arbitrage opportunities.

### Ways for profitting on price differences:
1. If the price of the PLMR tokens is **less** then the deposited assets on a DEX, that incentivises traders to purchase and redeem them to sell the underlying assets for profit.

2. If the price of the PLMR tokens is **more** than the deposited assets, that incentivises traders to purchase the underlying assets and mint new PLMR tokens to sell for profit!

These free market trading mechanisms should keep the PLMR tokens pegged and traders busy with earning arbitrage profits.

These trading mechanisms create **MEV** that can be extracted and anyone can profit, but it might require skills to participate in a competetive market.

---

## Buying and Selling entire portfolios

Another benefit of using Polymer.money is the ability to store entire portfolios in a single token in a DAG.

It allows you to buy or sell entire diverse portolios just by purchasing a single token. You can be exposed to all the popular tokens easily, without thinking much about it and volatility will affect you less, depending on your purchase.

It can reduce gas costs of transfering your portfolio, or selling them.

# Smart contracts

The protocol is made up of 3 smart contracts, the RequestedTokens, PolymerRegistry and the Polymer token contract library.

The RequestedTokens serves as a way to federate what tokens can be used, to avoid a malicious token to make it into the list. The selection of the requested tokens could be turned into a DAO later, or it might go unchecked and only a fixed amount of assets will be available. In this case, the protocol will be fully decentralized and unalterable.

PolymerRegistry is the contract that tracks and deploys all Polymer token contracts. It stores the DAG in a list and used for exploring the contents of a polymer token.
The derived tokens can be  deployed by the registry by anyone, however only Accepted tokens can be used.

The Polymer token contract is a deployed library that is cloned by the PolymerRegistry when creating a new Polymer token. It is a valid ERC-20 token contract that is compatible with all Exchanges.

The polymer token symbols follow the schema of `<PREFIX><INDEX>`. The name and symbols are created by the registry on deployment.

The prefix is `PLMR` and the index starts at 1. So token symbols will be PLMR1, PLMR2 etc..

The token name is derived from it's contents, for which the schema is: `<PREFIX><INDEX>-<TOKEN1SYMBOL>/<TOKEN2SYMBOL>` , for example PLMR12-ETH/USDC . The name of the token will reflect it's token contents.

To find out the backing of the token a getBacking function will return the addresses of the tokens, the rate and the decimalShift. The rate and the decimal shift is used to calculate the token deposits for the backing.

Let me explain:
When creating a new PLMR token using the registry, you need to specify these variables:
1. token1Addr
2. token1Rate
3. token1DecimalShift
4. token2Addr
5. token2Rate
6. token2DecimalShift
   
The rate and the decimal shift is used to implement Decimal numbers like 0.001
Ethereum does not support real decimals, 1 ETH is 10^18 WEI and PLMR tokens work the same way.
We always do calculations with WEI and unsigned integers but display decimal numbers on the front end.

To wrap 0.001ETH and 100USDC together, the parameters would be like this:

1. Address of Wrapped Ether
2. Rate of 1
3. Shift the decimal by 3 positions
4. Address of USDC contract
5. Rate of 100
6. Shift the decimal by 0 positions
   
When calculating the deposit for 1 PLMR token backed by these token parameters, the following calculation is used:

Multiply 1 PLMR with the Rate 1, then divide by 10**3. This will shift the decimal place when converting.
Then multiply 1 PLMR token by 100 and don't shift the decimal places.

This method is used to simplify calulating deposits and redemption while using WEI only for calculations, and the front end provides a simplified user experience to make it's use more straight forward.

### Computing the DAG

Each PLMR token is an element in DAG which are stored in the registry in a list. The list can contain multiple DAGs as each one starts with external token deposits then branches on.

The list provides a simple `getAllPolymers()` and `getPolymerByIndex(uint256)` function to access the DAG or an element in it by index. to fetch and recompute the DAG to explore it on the front end.



...TODO COmputing the DAG


### TODO: DEPLOY FRONT END VIA GITHUB PAGES