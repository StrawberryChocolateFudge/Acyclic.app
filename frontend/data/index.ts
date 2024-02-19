import { AGPHStruct } from "../../lib/traverseDAG";

//Sleep to mock network latency
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type FetchAllGraphsResponse = {
  selectOptions: TokenType[],
  agphList: AGPHStruct[]
}

//TODO: THIS IS MOCKED, REPLACE IT LATEr
export async function fetchAllGraphs()  {
  // sleep for 2 seconds

  // Then return the mock data

  await sleep(10); // sleep 2 seconds
  // THIS FUNCTION MUST GET the agphList: AGPHStruct[] from the blockchain
  // Then generate a return compatible to show on the drop down select
  // and also return the raw response too
  //TODO: MAP THE selectOptions from the agphList then return them both
  return {
    
    selectOptions:[
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
      name: "APGH3-AGPH1/AGPH2",
      value: "AGPH3",
      address: "0x0000000000000000000000000000000000000000",
      logo: "",
      valueInDollars: "10",
    },
  ],
  agphList: []
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
  await sleep(10); // sleep 2 seconds
  return [
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
}

export async function calculateTVL() {
}

export async function calculatTokenPrices() {}
