//HERE STARTS THE CONTRACT BINDINGS!

import { BigNumber, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { GraphStore } from "../../typechain/GraphStore";
import { AGPHStruct } from "../../lib/traverseDAG";
import { AGPH } from "../../typechain/AGPH";
import { RequestedTokens } from "../../typechain/RequestedTokens";

export type CreateNewAGPHArgs = {
  token1Addr: string;
  token1Rate: number;
  token1Decimals: number;
  token2Addr: string;
  token2Rate: number;
  token2Decimals: number;
};

export type GraphStore_View = {
  isAGPHAddress: (contract: GraphStore, address: string) => Promise<Boolean>;
  getFeeDivider: (contract: GraphStore) => Promise<BigNumber>;
  getAllAGPH: (contract: GraphStore) => Promise<any>;
  getAllAGPHByIndex: (contract: GraphStore, index: number) => Promise<any>;
  getDeploymentFee: (
    contract: GraphStore,
    token1Addr: string,
    token2Addr: string,
  ) => Promise<BigNumber>;
};

// View Functions that only need an rpc provider without private key, but work with both
export const GraphStore_View: GraphStore_View = {
  isAGPHAddress: async (contract: GraphStore, address: string) => {
    return await contract.isAGPHAddress(address);
  },
  getFeeDivider: async (contract: GraphStore) => {
    return await contract.getFeeDivider();
  },
  getAllAGPH: async (contract: GraphStore) => {
    return await contract.getAllAGPH();
  },
  getAllAGPHByIndex: async (contract: GraphStore, index: number) => {
    return await contract.getAGPHByIndex(index);
  },
  getDeploymentFee: async (
    contract: GraphStore,
    token1Addr: string,
    token2Addr: string,
  ) => {
    return await contract.getDeploymentFee(token1Addr, token2Addr);
  },
};

export type GraphStore_Interactor = {
  createNewAGPH: (
    contract: GraphStore,
    createNewAGPHArgs: CreateNewAGPHArgs,
    value: string,
  ) => Promise<ContractTransaction>;
  filterNewAGPHEvent: (
    contract: GraphStore,
    tx: ContractTransaction,
  ) => Promise<AGPHStruct>;
};

// Interactors need a wallet with private key
export const graphStore_Interactor: GraphStore_Interactor = {
  createNewAGPH: async (
    contract: GraphStore,
    createNewAGPHArgs: CreateNewAGPHArgs,
    value: string,
  ) => {
    return await contract.createNewAGPH(
      createNewAGPHArgs.token1Addr,
      createNewAGPHArgs.token1Rate,
      createNewAGPHArgs.token1Decimals,
      createNewAGPHArgs.token2Addr,
      createNewAGPHArgs.token2Rate,
      createNewAGPHArgs.token2Decimals,
      { value: parseEther(value) },
    );
  },
  filterNewAGPHEvent: async (contract: GraphStore, tx: ContractTransaction) => {
    const receipt = await tx.wait();
    const filter = contract.filters.NewAGPH();
    const events = await contract.queryFilter(filter, receipt.blockHash);
    const event = events[0];
    const args = event.args[0];
    return {
      agphName: args.agphName,
      agphSymbol: args.agphSymbol,
      agphAddress: args.agphAddress,
      token1Addr: args.token1Addr,
      token1Symbol: args.token1Symbol,
      token1Rate: args.token1Rate.toNumber(),
      token1DecimalShift: args.token1DecimalShift,
      token1IsAgph: args.token1IsAgph,
      token2Addr: args.token2Addr,
      token2Symbol: args.token2Symbol,
      token2Rate: args.token2Rate.toNumber(),
      token2DecimalShift: args.token2DecimalShift,
      token2IsAgph: args.token2IsAgph,
    } as AGPHStruct;
  },
};

export type AGPH_View = {
  calculateTokenDeposits: (
    contract: AGPH,
    amount: string,
    rate: number,
    decimalShift: number,
  ) => Promise<BigNumber>;
  calculateFee: (
    contract: AGPH,
    amount: string,
    token: string,
  ) => Promise<BigNumber>;
  getBacking: (contract: AGPH) => Promise<any>;
};

export const AGPH_View: AGPH_View = {
  calculateTokenDeposits: async (
    contract: AGPH,
    amount: string,
    rate: number,
    decimalShift: number,
  ) => {
    return await contract.calculateTokenDeposits(
      parseEther(amount),
      rate,
      decimalShift,
    );
  },
  calculateFee: async (contract: AGPH, amount: string, token: string) => {
    return await contract.calculateFee(amount, token);
  },
  getBacking: async (contract: AGPH) => {
    return await contract.getBacking();
  },
};

export type AGPH_Interactor = {
  wrapAGPH: (contract: AGPH, amount: string) => Promise<ContractTransaction>;
  unwrapAGPH: (contract: AGPH, amount: string) => Promise<ContractTransaction>;
};

export const AGPH_Interactor: AGPH_Interactor = {
  wrapAGPH: async (contract: AGPH, amount: string) => {
    return await contract.wrapAGPH(parseEther(amount));
  },
  unwrapAGPH: async (contract: AGPH, amount: string) => {
    return await contract.unwrapAGPH(parseEther(amount));
  },
};

export const ERC20 = {
  name: async (contract: any) => await contract.name(),
  symbol: async (contract: any) => await contract.symbol(),
  decimals: async (contract: any) => await contract.decimals(),
  totalSupply: async (contract: any) => await contract.totalSupply(),
  balanceOf: async (contract: any, account: string) =>
    await contract.balanceOf(account),
  transfer: async (contract: any, to: string, amount: any) =>
    await contract.transfer(to, amount),
  allowance: async (contract: any, owner: string, spender: string) =>
    await contract.allowance(owner, spender),
  approve: async (contract: any, spender: string, amount: any) =>
    await contract.approve(spender, amount),
};

export type RequestedTokens_View = {
  getAcceptedTokens: (contract: RequestedTokens) => Promise<string[]>;
};

export const RequestedTokens_View: RequestedTokens_View = {
  getAcceptedTokens: async (contract: RequestedTokens) => {
    return await contract.getAcceptedTokens();
  },
};
