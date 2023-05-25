import { expect } from "chai";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { setUpPLRM } from "./setUp";

describe("Polymer registry", function () {
  it("Should deploy, mint and redeem", async function () {
    const { owner, BTC, USD, EUR, ETH, alice, bob, registry } = await setUpPLRM();

    expect(await registry.lastIndex()).to.equal(0);

    // I want to deposit 0.001 BTC and 1000 USD!

    const token1Addr = BTC.address;
    const token1Rate = 1;
    const token1Decimals = 3; // I want 3 decimals
    const token2Addr = USD.address;
    const token2Rate = 1000;
    const token2Decimals = 0;

    //use theregistry to create a PLRM
    const tx = await registry.createNewPLMR(
      token1Addr,
      token1Rate,
      token1Decimals,
      token2Addr,
      token2Rate,
      token2Decimals
    );

    await tx.wait().then((receipt: any) => {
      const events = receipt.events;
      const event = events[0];
      expect(event.event).to.equal("NewPLMR");
    })

    let index = await registry.lastIndex();
    let registeredDetails = await registry.polymers(index);
    let details = await registeredDetails;
    expect(details.token1Addr).to.equal(token1Addr);
    expect(details.token1Rate).to.equal(token1Rate);
    expect(details.token1Decimals).to.equal(token1Decimals);
    expect(details.token2Addr).to.equal(token2Addr);
    expect(details.token2Rate).to.equal(token2Rate);
    expect(details.token2Decimals).to.equal(token2Decimals);
    expect(details.ticker).to.equal("PLMR1");
    expect(details.token1Ticker).to.equal("BTC");
    expect(details.token2Ticker).to.equal("USD");

    const PLMR1_Address = await registeredDetails.polymerAddress;

    // // Gonna attach to this address
    const polymerFactory = await ethers.getContractFactory("Polymer");
    const PLMR1 = await polymerFactory.attach(PLMR1_Address);

    expect(await PLMR1.name()).to.equal("PLMR1");

    const backing = await PLMR1.getBacking();
    expect(backing[0]).to.equal(details.token1Addr);
    expect(backing[1]).to.equal(details.token1Rate);
    expect(backing[2]).to.equal(details.token1Decimals);
    expect(backing[3]).to.equal(details.token2Addr);
    expect(backing[4]).to.equal(details.token2Rate);
    expect(backing[5]).to.equal(details.token2Decimals);


    const token1ToDeposit = await PLMR1.calculateTokenDeposits(
      parseEther("1"),
      token1Rate,
      token1Decimals
    );
    expect(formatEther(token1ToDeposit)).to.equal("0.001");

    const token2ToDeposit = await PLMR1.calculateTokenDeposits(
      parseEther("1"),
      token2Rate,
      token2Decimals
    )
    expect(formatEther(token2ToDeposit)).to.equal("1000.0");


    // // Now I check the totalSupply of this PLMR token and mint some
    expect(await PLMR1.totalSupply()).to.equal(0);

    let errorOccured = false;
    let errorMessage = "";

    try {
      await PLMR1.mintPLMR(parseEther("1"))
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }
    expect(errorOccured).to.be.true;
    expect(errorMessage.includes("ERC20: insufficient allowance"));

    // // now I approve spend from the owner's balance
    await BTC.approve(PLMR1.address, token1ToDeposit);
    await USD.approve(PLMR1.address, token2ToDeposit);

    await PLMR1.mintPLMR(parseEther("1"))

    expect(await PLMR1.balanceOf(owner.address)).to.equal(parseEther("1"));

    // I want eth 0.2 and  eur 1000
    const plmr2Token = {
      token1Addr: ETH.address,
      token1Rate: 2,
      token1Decimals: 1,// I want 3 decimals
      token2Addr: EUR.address,
      token2Rate: 1000,
      token2Decimals: 0
    }

    // Now I deploy HPLRM2 with EUR/ETH backing

    const newTx = await registry.createNewPLMR(
      plmr2Token.token1Addr,
      plmr2Token.token1Rate,
      plmr2Token.token1Decimals,
      plmr2Token.token2Addr,
      plmr2Token.token2Rate,
      plmr2Token.token2Decimals
    );
    await newTx.wait();
    index = await registry.lastIndex();
    registeredDetails = await registry.polymers(index);
    details = await registeredDetails;

    const H_PLMR2 = await polymerFactory.attach(details.polymerAddress);

    const hplrm2Backing = await H_PLMR2.getBacking();
    expect(hplrm2Backing[0]).to.equal(ETH.address);
    expect(hplrm2Backing[1]).to.equal(plmr2Token.token1Rate)
    expect(hplrm2Backing[2]).to.equal(plmr2Token.token1Decimals)
    expect(hplrm2Backing[3]).to.equal(plmr2Token.token2Addr)
    expect(hplrm2Backing[4]).to.equal(plmr2Token.token2Rate)
    expect(hplrm2Backing[5]).to.equal(plmr2Token.token2Decimals)

    // redeem tokens
    // Try to redeem without having any tokens
    errorOccured = true;
    try {
      await PLMR1.connect(alice).redeemPLMR(parseEther("100"));
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }

    expect(errorOccured).to.be.true;
    expect(errorMessage.includes("ERC20: burn amount exceeds balance")).to.be.true;

    // Now I will redeem the backing and destroy the token!

    // Now I transfer it to alice who will redeem it

    await PLMR1.transfer(alice.address, parseEther("1"));

    expect(await PLMR1.balanceOf(alice.address)).to.equal(parseEther("1"));
    expect(await PLMR1.balanceOf(owner.address)).to.equal(parseEther("0"));

    // I redeem half only!
    await PLMR1.connect(alice).redeemPLMR(parseEther("0.5"));
    expect(await BTC.balanceOf(alice.address)).to.equal(parseEther("0.0005"));
    expect(await USD.balanceOf(alice.address)).to.equal(parseEther("500"));
  });
});
