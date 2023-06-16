import ethers from "ethers"
import MetaMaskOnboarding from "@metamask/onboarding";
enum NetworkNames {
    BSC_TESTNET = "Binance Smart Chain Testnet",
    MUMBAI_TESTNET = "Mumbai Testnet",
    ATHENS_TESTNET = "Athens Testnet",
    GOERLI_TESTNET = "Goerli Testnet"
    // Mainnets
}

enum NetworkTickers {
    BSC_TESTNET = "BNB",
    ETH_MAINNET = "ETH",
    MUMBAI_TESTNET = "MATIC",
    ATHENS_TESTNET = "aZETA",
    GOERLI_TESTNET = "ETH"
}

export enum ChainIds {
    BSC_TESTNET_ID = "0x61",
    MUMBAI_TESTNET = "0x13881",
    ATHENS_TESTNET = "0x1b59",
    GOERLI_TESTNET = "0x5"
}


enum RPCURLS {
    BSC_TESTNET = "https://data-seed-prebsc-1-s3.binance.org:8545",
    MUMBAI_TESTENT = "https://matic-mumbai.chainstacklabs.com",
    ATHENS_TESTNET = "https://api.athens2.zetachain.com/evm",
    GOERLI_TESTENT = "https://eth-goerli.public.blastapi.io"
}

enum EXPORERURLS {
    BSC_TESTNET = "https://testnet.bscscan.com/",
    ATHENS_TESTNET = "https://explorer.zetachain.com/",
    MUMBAI_TESTNET = "https://mumbai.polygonscan.com/",
    GOERLI_TESTNET = "https://goerli.etherscan.io/"
}


const networkNameFromId: { [key in ChainIds]: NetworkNames } = {
    [ChainIds.BSC_TESTNET_ID]: NetworkNames.BSC_TESTNET,
    [ChainIds.MUMBAI_TESTNET]: NetworkNames.MUMBAI_TESTNET,
    [ChainIds.ATHENS_TESTNET]: NetworkNames.ATHENS_TESTNET,
    [ChainIds.GOERLI_TESTNET]: NetworkNames.GOERLI_TESTNET
}

const rpcUrl: { [key in ChainIds]: RPCURLS } = {
    [ChainIds.BSC_TESTNET_ID]: RPCURLS.BSC_TESTNET,
    [ChainIds.MUMBAI_TESTNET]: RPCURLS.MUMBAI_TESTENT,
    [ChainIds.ATHENS_TESTNET]: RPCURLS.ATHENS_TESTNET,
    [ChainIds.GOERLI_TESTNET]: RPCURLS.GOERLI_TESTENT

}

const explorerUrl: { [key in ChainIds]: EXPORERURLS } = {
    [ChainIds.BSC_TESTNET_ID]: EXPORERURLS.BSC_TESTNET,
    [ChainIds.MUMBAI_TESTNET]: EXPORERURLS.MUMBAI_TESTNET,
    [ChainIds.ATHENS_TESTNET]: EXPORERURLS.ATHENS_TESTNET,
    [ChainIds.GOERLI_TESTNET]: EXPORERURLS.GOERLI_TESTNET
}


const walletCurrency: { [key in ChainIds]: NetworkTickers } = {
    [ChainIds.BSC_TESTNET_ID]: NetworkTickers.BSC_TESTNET,
    [ChainIds.MUMBAI_TESTNET]: NetworkTickers.MUMBAI_TESTNET,
    [ChainIds.ATHENS_TESTNET]: NetworkTickers.ATHENS_TESTNET,
    [ChainIds.GOERLI_TESTNET]: NetworkTickers.GOERLI_TESTNET
}


export function getJsonRpcProvider(chainId: string): any {
    const getProvider = (url: RPCURLS) => new ethers.providers.JsonRpcProvider(url);
    const url = rpcUrl[chainId as ChainIds];
    if (!url) {
        return undefined;
    }
    return getProvider(url);
}

export function getWalletCurrencyFromFetchedChainId(chainId: number): string {
    const hexchainId = "0x" + chainId.toString(16) as ChainIds;

    const currency = walletCurrency[hexchainId];

    if (!currency) {
        return NetworkTickers.ETH_MAINNET;
    }
    return currency;
}

export function web3Injected(): boolean {
    //@ts-ignore
    if (window.ethereum !== undefined) {
        return true;
    } else {
        return false;
    }
}

export async function getChainId(provider: any): Promise<number> {
    const { chainId } = await provider.getNetwork();
    return chainId
}

export async function getIsContract(provider: any, address: string, displayError: CallableFunction): Promise<boolean> {
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
    window.ethereum.on('chainChanged', (chainId) => {
        // Handle the new chain.
        // Correctly handling chain changes can be complicated.
        // We recommend reloading the page unless you have good reason not to.
    });
    return provider;
}

export function onBoardOrGetProvider(handleError: any): any {
    if (!web3Injected()) {
        handleError("You need to install metamask!");
        doOnBoarding();
        return false;
    } else {
        return getWeb3Provider()
    }
}

export async function requestAccounts(provider: any) {
    const accounts = await provider.send("eth_requestAccounts", []);
    return accounts[0]
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
    blockExplorerUrls: string[]) {
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
    const blockExplorerUrls = [explorerUrl[netId]]
    const switched = await switch_to_Chain(netId);

    if (!switched) {
        // If I can't switch to it, I try to add it!
        await ethereumRequestAddChain(netId, name, curr, curr, 18, rpcs, blockExplorerUrls);
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
            if (err.message !== "User rejected the request.")
                errorOccured = true;
        })
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

export async function getContract(provider: any, at: string, abiPath: string): Promise<any> {
    const artifact = await fetchAbi(abiPath);
    const signer = provider.getSigner();
    return new ethers.Contract(at, artifact.abi, signer);
}

export async function getRpcContract(provider: any, at: string, abiPath: string): Promise<any> {
    const artifact = await fetchAbi(abiPath);
    return new ethers.Contract(at, artifact.abi, provider);
}

export type CreateNewPLMRArgs = {
    token1Addr: string,
    token1Rate: number,
    token1Decimals: number,
    token2Addr: string,
    token2Rate: number,
    token2Decimals: number
}

export const PolymerRegistry = {
    createNewPLMR: async (contract: any, createNewPLMRArgs: CreateNewPLMRArgs) => {
        return await contract.createNewPLMR(
            createNewPLMRArgs.token1Addr,
            createNewPLMRArgs.token1Rate,
            createNewPLMRArgs.token1Decimals,
            createNewPLMRArgs.token2Addr,
            createNewPLMRArgs.token2Rate,
            createNewPLMRArgs.token2Decimals

        )
    },
    getLastIndex: async (contract: any) => await contract.lastIndex(),
    getPolymerByIndex: async (contract: any, index: any) => await contract.polymers(index),
    getFlashFee: async (contract: any) => await contract.getFlashFee()
}

export const Polymer = {
    calculateTokenDeposits: async (
        contract: any,
        amount: any,
        rate: any,
        decimals: number) => await contract.calculateTokenDeposits(amount, rate, decimals),
    mintPLMR: async (contract: any, amount: any) => await contract.mintPLMR(amount),
    redeemPLMR: async (contract: any, amount: any) => await contract.redeemPLMR(amount),
    getBacking: async (contract: any) => await contract.getBacking()
}

export const FlashLoans = {
    maxFlashLoan: async (contract: any, token: string) => await contract.maxFlashLoan(token),
}

export const ERC20 = {
    name: async (contract: any) => await contract.name(),
    symbol: async (contract: any) => await contract.symbol(),
    decimals: async (contract: any) => await contract.decimals(),
    totalSupply: async (contract: any) => await contract.totalSupply(),
    balanceOf: async (contract: any, account: string) => await contract.balanceOf(account),
    transfer: async (contract: any, to: string, amount: any) => await contract.transfer(to, amount),
    allowance: async (contract: any, owner: string, spender: string) => await contract.allowance(owner, spender),
    approve: async (contract: any, spender: string, amount: any) => await contract.approve(spender, amount),
}
export const PolymerX = {
    calculateAmountMinted: async (contract: any, _wei: any) => await contract.calculateAmountMinted(_wei),
    buy: async (contract: any, value: any) => await contract.buy({ value }),
}

export const WZETA = {
    deposit: async (contract: any, value: any) => await contract.deposit({ value }),
    withdraw: async (contract: any, wad: any) => await contract.withdaw(wad)
}

// TODO: To trigger withdrawal I need to do cross chain transfer 
export const Withdraw = {

}