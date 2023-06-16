import { ChainIds } from "../web3";

export interface AssetDetails {
    name: string,
    chainId: string,
    zerc20Address: string
}

// I want to add here the assets that can be deposited and withdrawn from ZRC20
export const assets: Array<AssetDetails> = [
//    {
    // name: "MATIC",
    // chainId: ChainIds.MUMBAI_TESTNET,

//}

];

