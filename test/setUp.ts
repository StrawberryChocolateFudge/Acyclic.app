import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";

export async function setUpPLRM(): Promise<any> {
    const [owner, alice, bob] = await ethers.getSigners();

    const BTCFactory = await ethers.getContractFactory("TestERC20");
    const BTCDeploy = await BTCFactory.deploy("BTC", "BTC", parseEther("100"));
    const BTC = await BTCDeploy.deployed();

    const USDFactory = await ethers.getContractFactory("TestERC20");
    const USDDeploy = await USDFactory.deploy("USD", "USD", parseEther("100000000"));
    const USD = await USDDeploy.deployed();

    const EURFactory = await ethers.getContractFactory("TestERC20");

    const EURDeploy = await EURFactory.deploy("EUR", "EUR", parseEther("100000000"));
    const EUR = await EURDeploy.deployed();


    const ETHFactory = await ethers.getContractFactory("TestERC20");
    const ETHDeploy = await ETHFactory.deploy("ETH", "ETH", parseEther("100"));
    const ETH = await ETHDeploy.deployed();

    // Deploy a couple of ERC20 tokens with different names and symbols for testing!

    // Then deploy the PolymerRegistry!
    const registryFactory = await ethers.getContractFactory("PolymerRegistry");
    const registryDeploy = await registryFactory.deploy(500); // 500 for a 0.5 percent flash loan fee
    const registry = await registryDeploy.deployed();

    return { owner, BTC, USD, EUR, ETH, alice, bob, registry }
}