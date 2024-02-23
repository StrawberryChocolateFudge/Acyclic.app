import { BigNumber } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import {
  AGPHStruct,
  calculateDepositFeeForToken,
  calculateTokenDeposit,
  Dag,
  generateDag,
  Option,
} from "../../lib/traverseDAG";
import {
  ApprovalInfo,
  WrapFeeDetails,
} from "../components/stateless/WrapInteractions";
import {
  AbiPath,
  ChainIds,
  contractAddresses,
  getContract,
  getJsonRpcProvider,
  getRpcContract,
  handleNetworkSelect,
  TestnetTokenSymbols,
} from "../web3";
import {
  AGPH_Interactor,
  AGPH_View,
  ERC20,
  GraphStore_View,
  RequestedTokens_View,
} from "../web3/bindings";

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
  const feeDivider = await GraphStore_View.getFeeDivider(graphStore);

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
    feeDivider: feeDivider.toNumber(),
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

export function getTokenAddressFromSelectedName(
  selectedName: string,
  agphTokens: AgphSelectOptions,
) {
  let selectedAddress = "";
  for (let i = 0; i < agphTokens.length; i++) {
    if (agphTokens[i].value === selectedName) {
      selectedAddress = agphTokens[i].address;
    }
  }
  return selectedAddress;
}

export async function getBalanceOf(
  token: string,
  address: string,
): Promise<string> {
  const provider = await handleNetworkSelect(NETWORK, console.error);
  const contract = await getContract(provider, token, "/ERC20.json");
  const balance = await ERC20.balanceOf(contract, address);
  return formatEther(balance);
}

export async function getAllowanceAndBalanceOfTokens(
  connectedAddress: string,
  spenderContract: string,
): Promise<ApprovalInfo> {
  const provider = await handleNetworkSelect(NETWORK, console.error);

  const agphContract = await getContract(
    provider,
    spenderContract,
    "/AGPH.json",
  );

  const backing = await AGPH_View.getBacking(agphContract);

  const token1Addr = backing[0];
  const token1Rate = backing[1];
  const token1DecimalShift = backing[2];
  const token2Addr = backing[3];
  const token2Rate = backing[4];
  const token2DecimalShift = backing[5];

  const token1Contract = await getContract(provider, token1Addr, "/ERC20.json");
  const token2Contract = await getContract(provider, token2Addr, "/ERC20.json");

  const token1Balance = await ERC20.balanceOf(token1Contract, connectedAddress);
  const token2Balance = await ERC20.balanceOf(token2Contract, connectedAddress);

  const token1Symbol = await ERC20.symbol(token1Contract);
  const token2Symbol = await ERC20.symbol(token2Contract);

  const token1Allowance = await ERC20.allowance(
    token1Contract,
    connectedAddress,
    spenderContract,
  );
  const token2Allowance = await ERC20.allowance(
    token2Contract,
    connectedAddress,
    spenderContract,
  );

  return {
    token1Balance: formatEther(token1Balance),
    token2Balance: formatEther(token2Balance),
    token1Rate: token1Rate.toNumber(),
    token1DecimalShift: token1DecimalShift,
    token1Allowance: formatEther(token1Allowance),
    token1Address: token1Addr,
    token2Allowance: formatEther(token2Allowance),
    token1Symbol,
    token2Symbol,
    token2Rate: token2Rate.toNumber(),
    token2DecimalShift: token2DecimalShift,
    token2Address: token2Addr,
    spenderAddress: spenderContract,
  };
}

export function calculateApproveAmount(
  amount: string,
  rate: number,
  shift: number,
  feeDivider: number,
): WrapFeeDetails | undefined {
  if (amount === "") {
    return;
  }

  const wrappedAmount = calculateTokenDeposit(amount, rate, shift);
  const depositFee = calculateDepositFeeForToken(
    wrappedAmount,
    BigNumber.from(feeDivider),
  );
  const totalApprovalAmount = parseEther(wrappedAmount).add(depositFee);

  return {
    totalApprovalAmount: formatEther(totalApprovalAmount),
    depositFee: formatEther(depositFee),
    wrappedAmount,
  };
}

export async function approveAllowance(
  tokenAddress: string,
  spenderContract: string,
  amount: string,
) {
  const provider = await handleNetworkSelect(NETWORK, console.error);
  const tokenContract = await getContract(
    provider,
    tokenAddress,
    "/ERC20.json",
  );

  const tx = await ERC20.approve(
    tokenContract,
    spenderContract,
    parseEther(amount),
  );

  const receipt = await tx.wait();

  return receipt;
}

export async function doDepositAction(agphAddress: string, amount: string) {
  const provider = await handleNetworkSelect(NETWORK, console.error);

  const agphContract = await getContract(
    provider,
    agphAddress,
    "/AGPH.json",
  );

  await AGPH_Interactor.wrapAGPH(agphContract, amount);
}

export async function doWithdrawAction(agphAddress: string, amount: string) {
  const provider = await handleNetworkSelect(NETWORK, console.error);
  const agphContract = await getContract(
    provider,
    agphAddress,
    "/AGPH.json",
  );
  await AGPH_Interactor.unwrapAGPH(agphContract, amount);
}
