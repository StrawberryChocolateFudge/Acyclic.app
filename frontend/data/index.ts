import { formatEther } from "ethers/lib/utils";
import { AGPHStruct, Dag, generateDag, Option } from "../../lib/traverseDAG";
import {
  AbiPath,
  ChainIds,
  contractAddresses,
  getJsonRpcProvider,
  getRpcContract,
  TestnetTokenSymbols,
} from "../web3";
import { ERC20, GraphStore_View, RequestedTokens_View } from "../web3/bindings";

export const NETWORK = ChainIds.ARBITRUM_SEPOLINA_TESTNET;

export type FetchAllGraphsResponse = {
  selectOptions: TokenType[];
  agphList: AGPHStruct[];
};

export type AgphSelectOption = {
  value: string;
  name: string;
  address: string;
  logo: string;
  valueInDollars: string;
};

export type AgphSelectOptions = AgphSelectOption[];

export const DEFAULT_AGPH_SELECT_OPTIONS = [{
  value: "",
  name: "",
  address: "",
  logo: "",
  valueInDollars: "",
}];

export async function fetchAllGraphs() {
  const JSONRPCProvider = getJsonRpcProvider(NETWORK);
  const graphStore = await getRpcContract(
    JSONRPCProvider,
    contractAddresses[NETWORK].graphStore,
    AbiPath.GraphStore,
  );

  const agphList: AGPHStruct[] = await GraphStore_View.getAllAGPH(graphStore);

  const selectOptions = agphList.map((agraphs) => {
    return {
      name: agraphs.agphName,
      value: agraphs.agphSymbol,
      address: agraphs.agphAddress,
      logo: "",
      valueInDollars: "",
    };
  });

  return {
    selectOptions,
    agphList,
  };
}

export interface TokenType {
  address: string;
  name: string;
  logo: string;
  valueInDollars: string;
}

export const supportedAssetsPlaceHolder: TokenType[] = [{
  name: "",
  address: "",
  logo: "",
  valueInDollars: "",
}];

export async function fetchAllSupportedAssets(): Promise<TokenType[]> {
  const JSONRPCProvider = getJsonRpcProvider(NETWORK);
  const requestedTokensContract = await getRpcContract(
    JSONRPCProvider,
    contractAddresses[NETWORK].requestedTokens,
    AbiPath.RequestedTokens,
  );
  const allTokens = await RequestedTokens_View.getAcceptedTokens(
    requestedTokensContract,
  );

  return await fetchAcceptedTokenDetails(allTokens, JSONRPCProvider);
}

export async function fetchAcceptedTokenDetails(
  allTokens: string[],
  provider: any,
) {
  let result: TokenType[] = [];

  for (let i = 0; i < allTokens.length; i++) {
    // const requestedTokensContract = await getRpcContract(
    //   provider,
    //   allTokens[i],
    //   AbiPath.ERC20,
    // );
    // const tokenSymbol = await ERC20.symbol(requestedTokensContract);

    //TODO: This is too slow!! I need to do some other way. the requestedTokens contract should contain this already from the start!
    //TODO: allTokens should be a struct that already contains the stuff

    const tokenSymbol = TestnetTokenSymbols[allTokens[i]];

    result.push({
      name: tokenSymbol,
      address: allTokens[i],
      logo: "",
      valueInDollars: "0",
    });
  }

  return result;
}

export async function getDeploymentCostsForTokens(
  token1Address: string,
  token2Address: string,
) {
  const JSONRPCProvider = getJsonRpcProvider(NETWORK);
  const graphStore = await getRpcContract(
    JSONRPCProvider,
    contractAddresses[NETWORK].graphStore,
    AbiPath.GraphStore,
  );

  const deploymentFee = await GraphStore_View.getDeploymentFee(
    graphStore,
    token1Address,
    token2Address,
  );

  return formatEther(deploymentFee);
}

export function generateOrgChart(
  agphList: AGPHStruct[],
  symbol: string,
  assetAmount: string,
): Option<Dag> {
  return generateDag(agphList, symbol, assetAmount);
}
