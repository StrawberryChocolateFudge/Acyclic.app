import { AGPHStruct, Dag, generateDag, Option } from "../../lib/traverseDAG";

const SLEEPTIME = 10;

//Sleep to mock network latency
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export const DEFAULT_AGPH_SELECT_OPTIONS = [{ value: "", name: "", address: "", logo: "", valueInDollars: "" }];


//TODO: THIS IS MOCKED, REPLACE IT LATEr
export async function fetchAllGraphs() {
  // Then return the mock data

  await sleep(SLEEPTIME);
  //TODO: get the provider on testnet with RPC
  //TODO: get contract with the provider
  //TODO: // getAllAGPH from the contract store
  const agphList = [];
  //TODO: Iterate over the agph list and create selectOptions from it!

  const selectOptions = [
    {
      name: "AGPH1-ETH/USD",
      value: "AGPH1",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "10",
    },
    {
      name: "AGPH2-ARB/ETH",
      value: "AGPH2",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "10",
    },
    {
      name: "AGPH3-AGPH1/AGPH2",
      value: "AGPH3",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "10",
    },
  ];

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
  //TODO: Get the RPC provider for testnet
  //TODO: get the RequestedTokens contract
  // getAllTokens() from the blockchain

  const allTokens = [];

  // Use the token addresses to get the logos and the value in dollars from somewhere!
  // Return that

  const fetchedValueAndLogo = [
    {
      name: "USDC",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "10",
    },
    {
      name: "EURC",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "10",
    },
    {
      name: "USDT",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "134",
    },
    {
      name: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "12",
    },
  ];

  await sleep(SLEEPTIME);
  return fetchedValueAndLogo;
}

export function generateOrgChart(
  agphList: AGPHStruct[],
  symbol: string,
  assetAmount: string,
): Option<Dag> {
  return generateDag(agphList, symbol, assetAmount);
}

// This is a simplified example of an org chart with a depth of 2.
// Note how deeper levels are defined recursively via the `children` property.
export const orgChart = {
  name: "PLMR2",
  children: [
    {
      name: "PLMR1",
      attributes: {
        Amount: "1",
      },
      children: [
        {
          name: "USDC",
          attributes: {
            Amount: "100",
          },
        },
        {
          name: "WETH",
          attributes: {
            Amount: "0.001",
          },
        },
      ],
    },
    {
      name: "ETH",
      attributes: {
        Amount: "0.01",
      },
    },
  ],
};
