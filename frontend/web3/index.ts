import { ethers } from "ethers";
import MetaMaskOnboarding from "@metamask/onboarding";

export const MintOnTestnet = {
  USD: {
    amount: "10000",
    address: "0xA3e7617C85c7Bd6faE230fC3A785005a81d55784",
    symbol: "USD",
  },
  EUR: {
    amount: "10000",
    address: "0xe1B20C09736C5ac96d2E1204536b95084915a4Ce",
    symbol: "EUR",
  },
  WToken: {
    amount: "100",
    address: "0x64274Fc42aD8e327Eb63E96e1BC7f43952D78D36",
    symbol: "WToken",
  },
  WBTC: {
    amount: "100",
    address: "0x1FD17CeAed82819593518AFfB9D289fE5169DCc1",
    symbol: "WBTC",
  },
};

export const TestnetTokenSymbols = {
  [MintOnTestnet.USD.address]: MintOnTestnet.USD.symbol,
  [MintOnTestnet.EUR.address]: MintOnTestnet.EUR.symbol,
  [MintOnTestnet.WToken.address]: MintOnTestnet.WToken.symbol,
  [MintOnTestnet.WBTC.address]: MintOnTestnet.WBTC.symbol,
};

enum NetworkNames {
  ARBITRUM_SEPOLINA_TESTNET = "Arbitrum Sepolia Testnet",
}

enum NetworkTickers {
  ARBITRUM_SEPOLINA_TESTNET = "ETH",
}

export enum ChainIds {
  ARBITRUM_SEPOLINA_TESTNET = "0x66eee", //421614
}

enum RPCURLS {
  ARBITRUM_SEPOLINA_TESTNET = "https://sepolia-rollup.arbitrum.io/rpc",
}

enum EXPORERURLS {
  ARBITRUM_SEPOLINA_TESTNET = "https://sepolia.arbiscan.io/",
}

const networkNameFromId: { [key in ChainIds]: NetworkNames } = {
  [ChainIds.ARBITRUM_SEPOLINA_TESTNET]: NetworkNames.ARBITRUM_SEPOLINA_TESTNET,
};

const rpcUrl: { [key in ChainIds]: RPCURLS } = {
  [ChainIds.ARBITRUM_SEPOLINA_TESTNET]: RPCURLS.ARBITRUM_SEPOLINA_TESTNET,
};

const explorerUrl: { [key in ChainIds]: EXPORERURLS } = {
  [ChainIds.ARBITRUM_SEPOLINA_TESTNET]: EXPORERURLS.ARBITRUM_SEPOLINA_TESTNET,
};

const walletCurrency: { [key in ChainIds]: NetworkTickers } = {
  [ChainIds.ARBITRUM_SEPOLINA_TESTNET]:
    NetworkTickers.ARBITRUM_SEPOLINA_TESTNET,
};

export const explorerAddressPath: { [key in ChainIds]: string } = {
  [ChainIds.ARBITRUM_SEPOLINA_TESTNET]: EXPORERURLS.ARBITRUM_SEPOLINA_TESTNET +
    "address/",
};

export const contractAddresses: {
  [key in ChainIds]: { requestedTokens: string; graphStore: string };
} = {
  [ChainIds.ARBITRUM_SEPOLINA_TESTNET]: {
    requestedTokens: "0x8A0DF947c126574567592019aCf31dfd09E9A61e",
    graphStore: "0x2960614E2cAB6f74ce1e46484d85daF48605793F",
  },
};

export const AbiPath = {
  AGPH: "/AGPH.json",
  ERC20: "/ERC20.json",
  GraphStore: "/GraphStore.json",
  RequestedTokens: "/RequestedTokens.json",
  TestERC20: "/TestERC20.json",
};

// THIS IS THE PROVIDER TO USE WHEN FETCHIGN DATA WITHOUT CONNETCING THE WALLET
export function getJsonRpcProvider(chainId: string): any {
  const getProvider = (url: RPCURLS) =>
    new ethers.providers.JsonRpcProvider(url);
  const url = rpcUrl[chainId as ChainIds];
  if (!url) {
    return undefined;
  }
  return getProvider(url);
}

// CHECK IF WEB3 IS INJECTED AND A WALLET IS PRESENT
export function web3Injected(): boolean {
  //@ts-ignore
  if (window.ethereum !== undefined) {
    return true;
  } else {
    return false;
  }
}

export function getWalletCurrencyFromFetchedChainId(chainId: number): string {
  const hexchainId = "0x" + chainId.toString(16) as ChainIds;

  const currency = walletCurrency[hexchainId];

  if (!currency) {
    return NetworkTickers.ARBITRUM_SEPOLINA_TESTNET;
  }
  return currency;
}

export async function getChainId(provider: any): Promise<number> {
  const { chainId } = await provider.getNetwork();
  return chainId;
}

export async function getIsContract(
  provider: any,
  address: string,
  displayError: CallableFunction,
): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    if (code !== "0x") return true;
  } catch (err) {
    return false;
  }
  return false;
}

export function doOnBoarding() {
  const onboarding = new MetaMaskOnboarding();
  onboarding.startOnboarding();
}

export async function handleNetworkSelect(networkId: any, handleError: any) {
  const onboardSuccess = await onboardOrSwitchNetwork(networkId, handleError);
  if (!onboardSuccess) {
    return false;
  } else {
    const provider = getWeb3Provider();

    return provider;
  }
}

function getWeb3Provider() {
  //@ts-ignore
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  //@ts-ignore
  window.ethereum.on("chainChanged", (chainId) => {
    // Handle the new chain.
    // Correctly handling chain changes can be complicated.
    // We recommend reloading the page unless you have good reason not to.
  });
  return provider;
}

export function handleOnAccountChanged(handle: CallableFunction) {
  //@ts-ignore
  window.ethereum.on("accountsChanged", handle);
}

export function onBoardOrGetProvider(handleError: any): any {
  if (!web3Injected()) {
    handleError("You need to install metamask!");
    doOnBoarding();
    return false;
  } else {
    return getWeb3Provider();
  }
}

export async function requestAccounts(provider: any) {
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export async function watchAsset(erc20Params: any, onError: any) {
  //@ts-ignore
  await window.ethereum
    .request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: erc20Params.address,
          symbol: erc20Params.symbol,
          decimals: erc20Params.decimals,
        },
      },
    })
    .then((success: any) => {
      if (success) {
      } else {
        onError();
      }
    })
    .catch(console.error);
}

export async function onboardOrSwitchNetwork(networkId: any, handleError: any) {
  if (!web3Injected()) {
    handleError("You need to install metamask!");
    await doOnBoarding();
    return false;
  }
  return switchNetworkByChainId(networkId);
}

async function ethereumRequestAddChain(
  hexchainId: string,
  chainName: string,
  name: string,
  symbol: string,
  decimals: number,
  rpcUrls: string[],
  blockExplorerUrls: string[],
) {
  //@ts-ignore
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: hexchainId,
        chainName,
        nativeCurrency: {
          name,
          symbol,
          decimals,
        },
        rpcUrls,
        blockExplorerUrls,
      },
    ],
  });
}

export async function switchNetworkByChainId(netId: ChainIds) {
  const name = networkNameFromId[netId];
  if (!name) {
    // If I can't find the name, the rest will fail too
    return false;
  }
  const curr = walletCurrency[netId];
  const rpcs = [rpcUrl[netId]];
  const blockExplorerUrls = [explorerUrl[netId]];
  const switched = await switch_to_Chain(netId);

  if (!switched) {
    // If I can't switch to it, I try to add it!
    await ethereumRequestAddChain(
      netId,
      name,
      curr,
      curr,
      18,
      rpcs,
      blockExplorerUrls,
    );
  }

  return true;
}

async function switch_to_Chain(chainId: string) {
  try {
    let errorOccured = false;
    //@ts-ignore
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    }).catch((err: any) => {
      if (err.message !== "User rejected the request.") {
        errorOccured = true;
      }
    });
    if (errorOccured) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    return false;
  }
}

export async function fetchAbi(at: string) {
  const res = await fetch(at);
  return res.json();
}

// Use this to connect to the contract to have msg.sender and transactions
export async function getContract(
  provider: any,
  at: string,
  abiPath: string,
): Promise<any> {
  const artifact = await fetchAbi(abiPath);
  const signer = provider.getSigner();
  return new ethers.Contract(at, artifact.abi, signer);
}

// Use this to fetch data without connecting the wallet!
export async function getRpcContract(
  provider: any,
  at: string,
  abiPath: string,
): Promise<any> {
  const artifact = await fetchAbi(abiPath);
  return new ethers.Contract(at, artifact.abi, provider);
}
