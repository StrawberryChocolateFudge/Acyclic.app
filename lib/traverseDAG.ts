import { BigNumber, utils } from "ethers";
const { parseEther, formatEther } = utils;

// These are functions to process the view functions results coming from the blockchain.
// Compute the Dag, calculate deposit fees and approval amounts.
// The functions in this file don't call the blockchain, that layer is implemented in another file.

export enum Result {
  SOME,
  NONE,
}
// Inspired by Rust baby, let's gooo
export type Option<T> = {
  result: Result;
  data: T;
  error: string;
};

export function isNone(opts: Option<any>): boolean {
  return opts.result === Result.NONE;
}

export type PLMR = {
  plmrName: string;
  plmrSymbol: string;
  polymerAddress: string;
  token1Addr: string;
  token1Symbol: string;
  token1Rate: number;
  token1DecimalShift: number;
  token1IsPlmr: boolean;
  token2Addr: string;
  token2Symbol: string;
  token2Rate: number;
  token2DecimalShift: number;
  token2IsPlmr: boolean;
};

// This is the interface used for the react-d3-tree chart that will display the Dag
// I adopt the use of the data structure from the start so I don't need to convert it later
export interface RawNodeDatum {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: RawNodeDatum[];
}

// This is an extended RawNodeDatum interface that can store more data
// This exists on both PLMR tokens and ERC20 tokens
// This will be converted into RawNodeDatum easily later
export interface Dag {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: Dag[];
  metadata: TokenMetadata;
}
// The token metadata exists for both PLMR and external token contracts
export type TokenMetadata = {
  address: string;
  symbol: string;
  rate: number;
  decimalShift: number;
  isPlmr: boolean;
};

export type RegisterNewPLMRToken1 = {
  token1Addr: string;
  token1Rate: number;
  token1DecimalShift: number;
};

export type RegisterNewPLMRToken2 = {
  token2Addr: string;
  token2Rate: number;
  token2DecimalShift: number;
};

export type RegisterNewPLMRArgs = RegisterNewPLMRToken1 & RegisterNewPLMRToken2;

// Takes the symbol of a ERC-20 token and checks if it's a PLMR token
// The schema is <PLMR><INDEX> which is a number
// If Option.result is SOME, then it's a valid PLMR contract and returns the index
// Else if Option.result NONE then it's not a valid PLMR contract and returns an error message and zero.
export function getPLMRIndex(symbl: string): Option<number> {
  const PLMR = symbl.substring(0, 4);
  const INDEX = symbl.substring(4, symbl.length);
  if (PLMR !== "PLMR") {
    return {
      result: Result.NONE,
      data: 0,
      error: "Not PLMR contract",
    };
  }
  try {
    if (isNaN(parseInt(INDEX))) {
      // I could return from here but if the parseInt throws I need to catch it
      // so let's throw here also and only return only from catch
      throw "";
    }
  } catch (err) {
    return {
      result: Result.NONE,
      data: 0,
      error: "Not a valid number",
    };
  }
  return {
    result: Result.SOME,
    data: parseInt(INDEX),
    error: "",
  };
}

// The polymer array index is the naming index -1
export function getPLMRArrayIndex(index: number) {
  return index - 1;
}

// To get the Dag belonging to a PLMR token, we first fetch the list of all PLMR tokens from the blockchain
// The symbol is the symbol of the top level PLMR token
// Asset amount will let me control the calculations of how much value is in the token, it should default to 1 on the front end, then it's adjustable
export function generateDag(
  plmrList: PLMR[],
  symbol: string,
  assetAmount: string,
): Option<Dag> {
  const plmrOptions = getPLMRIndex(symbol);

  if (isNone(plmrOptions)) {
    //The name is not a plmr token and I can't start making a Dag
    return {
      result: Result.NONE,
      data: {} as Dag,
      error: "Top level node not PLMR",
    };
  }

  // It definitely is PLMR and has 2 children and exists in the list,
  // I find the element index in the array
  const plmrIndex = getPLMRArrayIndex(plmrOptions.data);
  const element = plmrList[plmrIndex];

  // It returns a Some, with the PLMR
  return {
    result: Result.SOME,
    data: {
      name: symbol,
      attributes: {
        Amount: assetAmount,
      },
      children: findChildren(
        plmrList,
        symbol,
        true,
        assetAmount,
      ),
      metadata: getTopLevelNodeMetadata(element),
    },
    error: "",
  };
}

// Find the child nodes in the Dag, this function is recursive until it finds the nodes that are not PLMR nodes
function findChildren(
  plmrList: PLMR[],
  symbol: string,
  isPLMRNode: boolean,
  assetAmount: string,
): Dag[] | undefined {
  //Base case, the node is not PLMR, so no children!
  if (!isPLMRNode) {
    return undefined;
  }

  // Decode the index from the symbol
  const options = getPLMRIndex(symbol);

  // Find the array index of the PLMR token to parse
  const index = getPLMRArrayIndex(options.data);
  // Take it from the list
  const element = plmrList[index];
  //Return the child nodes and calculate deposit for token1 and token2
  return [
    {
      name: element.token1Symbol,
      attributes: {
        //Calculated based on the amount of parent tokens we use
        Amount: calculateTokenDeposit(
          assetAmount,
          element.token1Rate,
          element.token1DecimalShift,
        ),
      },
      children: findChildren(
        plmrList,
        element.token1Symbol,
        element.token1IsPlmr,
        assetAmount,
      ),
      metadata: getToken1Metadata(element),
    },
    {
      name: element.token2Symbol,
      attributes: {
        Amount: calculateTokenDeposit(
          assetAmount,
          element.token2Rate,
          element.token2DecimalShift,
        ),
      },
      children: findChildren(
        plmrList,
        element.token2Symbol,
        element.token2IsPlmr,
        assetAmount,
      ),
      metadata: getToken2Metadata(element),
    },
  ];
}

//Calculate the token deposits, this function must return the same as the on-chain view function
export function calculateTokenDeposit(
  amount: string,
  rate: number,
  decimalShift: number,
): string {
  const WEIamount = parseEther(amount);
  const depositRate = WEIamount.mul(rate);
  const ten = BigNumber.from(10);
  const shifted = depositRate.div(ten.pow(decimalShift));
  return formatEther(shifted);
}
//This is used for calculating the fee to deposit for a mint, on the front end!
// Only call this if the tokenDeposit is not a PLMR token, those have no deposit fees
//The feeDivider is fetched before from the registry contract and passed in.
export function calculateDepositFeeForToken(
  tokenDeposit: string,
  feeDivider: BigNumber,
) {
  return parseEther(tokenDeposit).div(feeDivider);
}

// This function calculates the rate and decimal shift from a floating point number string
export function convertDecimalNumberStringToRateAndDecimalShift(
  depositAmount: string,
): { rate: number; decimalShift: number } {
  // verify the amount is a valid float
  if (isNaN(parseFloat(depositAmount))) {
    throw "Not a valid float";
  }
  // Split the string at the dot.
  // if there is no dot or there is no decimal shift
  let split = depositAmount.split(".");

  if (split.length === 1) {
    // There was no dot, I got an array back with 1 element
    return {
      rate: parseInt(split[0]),
      decimalShift: 0,
    };
  } else {
    // I need to see how many numbers are after the decimal point
    return {
      // The rate is the number with removed decimal point
      rate: parseInt(split[0] + split[1]),
      // The shift is the digits after the decimal point
      decimalShift: split[1].length,
    };
  }
}

function getTopLevelNodeMetadata(from: PLMR): TokenMetadata {
  return {
    address: from.polymerAddress,
    symbol: from.plmrSymbol,
    rate: 1,
    decimalShift: 0,
    isPlmr: true,
  };
}

function getToken1Metadata(from: PLMR): TokenMetadata {
  return {
    address: from.token1Addr,
    symbol: from.token1Symbol,
    rate: from.token1Rate,
    decimalShift: from.token1DecimalShift,
    isPlmr: from.token1IsPlmr,
  };
}

function getToken2Metadata(from: PLMR): TokenMetadata {
  return {
    address: from.token2Addr,
    symbol: from.token2Symbol,
    rate: from.token2Rate,
    decimalShift: from.token2DecimalShift,
    isPlmr: from.token2IsPlmr,
  };
}

export function buildToken1_RegisterPlmrParams(
  addr: string,
  rate: number,
  shift: number,
): RegisterNewPLMRToken1 {
  return {
    token1Addr: addr,
    token1Rate: rate,
    token1DecimalShift: shift,
  };
}

export function buildToken2_RegisterPlmrParams(
  addr: string,
  rate: number,
  shift: number,
): RegisterNewPLMRToken2 {
  return {
    token2Addr: addr,
    token2Rate: rate,
    token2DecimalShift: shift,
  };
}
