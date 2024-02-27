
```
┌─┐┌─┐┬ ┬┌─┐┬  ┬┌─┐     ┌─┐┌─┐┌─┐
├─┤│  └┬┘│  │  ││       ├─┤├─┘├─┘
┴ ┴└─┘ ┴ └─┘┴─┘┴└─┘  o  ┴ ┴┴  ┴  
```


##  **Acyclic.app - Wrap a diverse portfolio into a single token**

Acyclic is a protocol that allows you to wrap 2 tokens to derive a new one pegged to them. These tokens can be unwrapped any time, implementation is similar to weth but wrapping 2 tokens instead of 1.

Tokens can be combined with each other to create combinations which are structured as a **directed acyclic graph**, hence the name Acyclic.

A simple DAG could be visualised as:

```               
                   0.01 BTC
                  /
                 /
          1 AGPH2      1 ETH
                 \     /
                  \   /
                1 AGPH1
                       \
                        \
                       1000 USDC

```
The following DAG is an example. It's an ERC-20 token with a symbol AGPH2, (AGPH stands for Acyclic graph), and it's value is derived from BTC,ETH and USDC deposits. 
In this example, 1 AGPH2 can be unwrapped for 0.01 BTC and 1 AGPH1, which can be unwrapped for 1 ETH and 1000 USDC

A single token can hold many other and can give you exposure to multiple assets.
Think of AGPH tokens as tokenized graphs that contain value.

Another example would be to hold 0.01 ETH and 100USDC in a single token, then any ETH volatility will effect your portfolio token less due to the exposure to USDC and you may unwrap the ETH and USDC any time.

The wrappable tokens are always reviewed first to avoid malicious token contracts making their way into the DAG.

The review process supports a DAO integration and later open participation to decentralize the protocol.
However that's not implemented so the deployer owns the contracts and manually adds proposed tokens but the code supports the decentralization of this decision making in the future.


---

## DISCLAIMER
**The tokens created with acyclic.app are not investment contracts and do not provide any extra value.**
All the value is derived from the underlying wrapped assets which may or may not be investments vehicles or store of value.

Tokens created with acyclic.app will never be registered securities and should not be thought of as separate assets, but a composition of others. They allow you to store your existing tokens in a directed acyclic graph together, instead of separately scattered in a wallet.

**Cryptocurrency is high risk.** There is zero insurance that the underlying assets continue to trade for value and the derived tokens reflect only the underlying price.
There is zero insurance that AGPH tokens backed by assets can be traded anywhere. We don't provide a liquid market.

While having a diverse portfolio could protect investments, acyclic.app does not offer an investmen protection or insurance of any kind. 

The creators of the protocol are idemnified of any liabilities for losses that may occur while trading or holding crypto currencies.

**Not an investment! Use at your own risk!**

---

---
## **Fees**

There are fees when wrapping tokens for external tokens like ARB, USDC etc but not for registered AGPH tokens.

The fees are a small added cost, during wrapping only, the unwrapping will always return 100% of the wrapped tokens, to make sure the price peg is accurate. 

For example: To mint a AGPH token with 0.001 ETH and 100USDC backing, with a wrapping fee of 0.2% on each asset, the user must approve and deposit 0.001002 ETH and 100.02 USDC to mint 1 token. 
When unwrapping this, the user will burn 1 token and recieve exactly 0.001 ETH and 100USDC as there are no redemption fees at all.

### Creating new AGPH token pairs
When creating a new pair (AGPH token) a fee must be paid in ETH. 
The existing pairs can be only recreated with incremented price, this is a spam protection mechanism since anyone can create a new pair (AGPH).
As an example. to create a combination of ETH and USDC the first time it's free, then 0.05ETh * deployment times. So If a pair of ETH/USDC wrapping AGPH is created 3 times, the price will be (3 * 0.05ETH) etc...

### **The real value of the AGPH token will always match 100% the underlying deposits.**
Due to the lack of fees when unwrapping tokens, the unwrapped token amount always 100% matches the value stored in the token.

However, large combinations of tokens could be harder to track for price and they may depeg on Dexes. This leads to interesting arbitrage opportunities.

---

## Ways for profitting on price differences:
1. If the price of the AGPH tokens is **less** then the deposited assets on a DEX, that incentivises traders to purchase and unwrap them to sell the underlying assets for profit.

2. If the price of the AGPH tokens is **more** than the deposited assets, that incentivises traders to purchase the underlying assets and wrap tokens to sell for profit!

These free market trading mechanisms should keep the AGPH tokens pegged and traders busy with earning arbitrage profits.

These trading mechanisms create **MEV** that can be extracted and anyone can profit, but it might require skills to participate in a competetive market.

---

## Buying and Selling entire portfolios

Another benefit of using Acyclic.app is the ability to store entire portfolios in a single token in a DAG.

It allows you to buy or sell entire diverse portolios just by purchasing a single token. You can be exposed to all the popular tokens easily, without thinking much about it and volatility will affect you less, depending on your purchase.

It can reduce gas costs of transfering your portfolio, or selling them.

# Smart contracts

The protocol is made up of 3 smart contracts, the RequestedTokens, GraphStore and the AGPH token contract library.

The RequestedTokens serves as a way to federate what tokens can be used, to avoid a malicious token to make it into the list. The selection of the requested tokens could be turned into a DAO later, or it might go unchecked and only a fixed amount of assets will be available. In this case, the protocol will be fully decentralized and unalterable.

GraphStore is the contract that tracks and deploys all AGPH token contracts. It stores a list that can be used to compute the DAG on the client for tokens.
Token contracts can be deployed by the Graphstore by anyone, however only Accepted tokens can be used and the deployment has a fee.

The AGPH token contract is a deployed library that is cloned by the Graphstore when creating a new AGPH token. It is a valid ERC-20 token contract that is compatible with all Exchanges.

The AGPH token symbols follow the schema of `<PREFIX><INDEX>`. The name and symbols are created by the GraphStore on deployment.

The prefix is `AGPH` and the index starts at 1. So token symbols will be AGPH1, AGPH2 etc..

The token name is derived from it's contents, for which the schema is: `<PREFIX><INDEX>-<TOKEN1SYMBOL>/<TOKEN2SYMBOL>` , for example AGPH12-ETH/USDC . The name of the token will reflect it's token contents.

To find out the backing of the token a getBacking function will return the addresses of the tokens, the rate and the decimalShift. The rate and the decimal shift is used to calculate the token deposits for the backing.
However there are some helper functions in the lib/traverseDAG.ts file that will compute the DAG for you to accurately calculate the token's holdings.


When creating a new AGPH token using the Graphstore, you need to specify these variables:
1. token1Addr
2. token1Rate
3. token1DecimalShift
4. token2Addr
5. token2Rate
6. token2DecimalShift
   
The rate and the decimal shift is used to implement Decimal numbers like 0.001
Ethereum does not support real decimals, 1 ETH is 10^18 WEI and AGPH tokens work the same way.
We always do calculations with WEI and unsigned integers but display decimal numbers on the front end.

To wrap 0.001ETH and 100USDC together, the parameters would be like this:

1. Address of Wrapped Ether
2. Rate of 1
3. Shift the decimal by 3 positions
4. Address of USDC contract
5. Rate of 100
6. Shift the decimal by 0 positions
   
When calculating the deposit for 1 AGPH token backed by these token parameters, the following calculation is used:

Multiply 1 AGPH with the Rate 1, then divide by 10**3. This will shift the decimal place when converting.
Then multiply 1 AGPH token by 100 and don't shift the decimal places.

This method is used to simplify calulating wrapping and unwrapping while using WEI only for calculations, and the front end provides a simplified user experience to make it's use more straight forward.

### Computing the DAG

Each AGPH token is an element in DAG which are stored in the registry in a list. The list can contain multiple DAGs as each one starts with external token deposits then branches on.

The list provides a simple `getAllAGPH()` and `getAGPHByIndex(uint256)` function to access the DAG or an element in it by index, to fetch and recompute the DAG to explore it on the front end.

The Dag is computed with a generateDag function on the client side found in /lib/traverseDAG.ts

The computed Dag contains the actual amount of value in the AGPH token, and the children's Amount is related the parent's Amount.
In the below example, 1 AGPH7 contains 0.001 AGPH4 and 1000 USD tokens. The AGPH4 tokens contain 0.001BTC but since AGPH7 only contain 0.001AGPH4 the BTC children Amount is adjusted to  0.00001 show the actual value that the Dag contains.


THIS IS AN EXAMPLE FROM THE UNIT TESTS.
```
{
  "name": "AGPH7",
  "attributes": {
    "Amount": "1"
  },
  "children": [
    {
      "name": "AGPH4",
      "attributes": {
        "Amount": "0.001"
      },
      "children": [
        {
          "name": "BTC",
          "attributes": {
            "Amount": "0.00001"
          },
          "metadata": {
            "address": "0x998abeb3E57409262aE5b751f60747921B33613E",
            "symbol": "BTC",
            "rate": {
              "type": "BigNumber",
              "hex": "0x01"
            },
            "decimalShift": 2,
            "isAgph": false
          }
        },
        {
          "name": "ETH",
          "attributes": {
            "Amount": "0.001"
          },
          "metadata": {
            "address": "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
            "symbol": "ETH",
            "rate": {
              "type": "BigNumber",
              "hex": "0x01"
            },
            "decimalShift": 0,
            "isAgph": false
          }
        }
      ],
      "metadata": {
        "address": "0x6E7A80364c02f6DA5A656a753ef77d9AF1aEFdCE",
        "symbol": "AGPH4",
        "rate": {
          "type": "BigNumber",
          "hex": "0x01"
        },
        "decimalShift": 3,
        "isAgph": true
      }
    },
    {
      "name": "USD",
      "attributes": {
        "Amount": "1000.0"
      },
      "metadata": {
        "address": "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
        "symbol": "USD",
        "rate": {
          "type": "BigNumber",
          "hex": "0x03e8"
        },
        "decimalShift": 0,
        "isAgph": false
      }
    }
  ],
  "metadata": {
    "address": "0x1417A5F39e851007bAAd5Ba06C0C66117151D34c",
    "symbol": "AGPH7",
    "rate": 1,
    "decimalShift": 0,
    "isAgph": true
  }
}
```

## Hosting

Hosted on a VPS with NGINX, it's a static site but serving is the best option as I don't have to rely on CDN caches to store the site.. I used cloudflare pages before but that is unrelyable.

VPS server setup
```
sudo apt update

sudo apt upgrade 
adduser app

usermod -aG sudo app

sudo apt install nginx

```

Snap is needed due to certbot install
```
sudo apt install snapd

sudo snap install --classic certbot

sudo ln -s /snap/bin/certbot /usr/bin/certbot

sudo certbot --nginx

```

Install nodejs

``` 
sudo apt-get install -y ca-certificates curl gnupg

sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=20

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt-get update

sudo apt-get install nodejs -y

```
Clone the git repository and build it

``` 
git clone https://github.com/StrawberryChocolateFudge/Acyclic.app.git

npm run build
npm run copy
```
It will build the repo and copy the assets to dist.

This will copy the built dist directory to be served by nginx:

```
npm run toNginx

```
