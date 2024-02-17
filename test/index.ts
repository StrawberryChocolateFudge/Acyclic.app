import { expect } from "chai";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { setUpPLRM } from "./setUp";
import {
  buildToken1_RegisterPlmrParams,
  buildToken2_RegisterPlmrParams,
  calculateDepositFeeForToken,
  calculateTokenDeposit,
  Dag,
  generateDag,
  getPLMRArrayIndex,
  getPLMRIndex,
  Option,
  RegisterNewPLMRArgs,
  Result,
} from "../lib/traverseDAG";
import { BigNumber } from "ethers/lib/ethers";

describe("Polymer registry", function () {
  it("Should test token requests and registry", async function () {
    const { owner, BTC, USD, EUR, ETH, alice, bob, registry, requestedTokens } =
      await setUpPLRM();

    expect(await requestedTokens.getStatus(BTC.address)).to.equal(0);
    // Request a new token
    await requestedTokens.connect(bob).requestNewToken(
      BTC.address,
    );
    expect(await requestedTokens.getStatus(BTC.address)).to.equal(1);

    // Now request another token
    await requestedTokens.connect(bob).requestNewToken(USD.address);

    let alltokens = await requestedTokens.getAllTokens();

    expect(alltokens.length).to.equal(2);
    let acceptedTokens = await requestedTokens.getAcceptedTokens();
    expect(acceptedTokens.length).to.equal(0);

    // I try accepting tokens with bob

    let errorOccured = false;
    let errorMessage = "";
    try {
      await requestedTokens.connect(bob).acceptTokenRequest(BTC.address);
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }
    expect(errorOccured).to.equal(true);
    expect(errorMessage.includes("Ownable: caller is not the owner"));

    // I try rejecting tokens with bob
    errorOccured = false;
    errorMessage = "";
    try {
      await requestedTokens.connect(bob).rejectTokenRequest(BTC.address);
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }
    expect(errorOccured).to.equal(true);
    expect(errorMessage.includes("Ownable: caller is not the owner"));

    // I accept tokens with owner

    await requestedTokens.acceptTokenRequest(BTC.address);
    expect(await requestedTokens.getStatus(BTC.address)).to.equal(2);

    // I reject tokens with owner
    await requestedTokens.rejectTokenRequest(USD.address);
    expect(await requestedTokens.getStatus(USD.address)).to.equal(3);

    // I test trying to register a pair with a rejected token
    let token1Addr = BTC.address;
    let token1Rate = 1;
    let token1DecimalShift = 3; // I want 3 decimals
    let token2Addr = USD.address;
    let token2Rate = 1000;
    let token2DecimalShift = 0;
    errorOccured = false;
    errorMessage = "";

    try {
      await registry.connect(bob).createNewPLMR(
        token1Addr,
        token1Rate,
        token1DecimalShift,
        token2Addr,
        token2Rate,
        token2DecimalShift,
        { value: parseEther("0") },
      );
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }

    expect(errorOccured).to.be.true;
    expect(errorMessage.includes("OnlyAcceptedToken")).to.be.true;

    // I create a request that already exists so it can't happen
    errorOccured = false;
    errorMessage = "";

    try {
      await requestedTokens.connect(bob).requestNewToken(USD.address);
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }

    expect(errorOccured).to.be.true;
    expect(errorMessage.includes("Request already exists!")).to.be.true;

    // I create another request with a new token now...
    await requestedTokens.connect(bob).requestNewToken(EUR.address);

    // Try Transfer ownership for requestedTokens with bob
    errorOccured = false;
    errorMessage = "";

    try {
      await requestedTokens.connect(bob).transferOwnership(bob.address);
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }

    expect(errorOccured).to.be.true;
    expect(errorMessage.includes("Ownable: caller is not the owner")).to
      .be.true;

    // Now transfer the requestTokens contract for real
    await requestedTokens.transferOwnership(alice.address);

    // Accept the request with the new owner
    await requestedTokens.connect(alice).acceptTokenRequest(EUR.address);

    // Create a token pair with the new token now successfully!

    // I test trying to register a pair with a rejected token
    token2Addr = EUR.address;
    token2Rate = 1000;
    token2DecimalShift = 0;
    errorOccured = false;
    errorMessage = "";

    expect(await registry.lastIndex()).to.equal(0);

    await registry.connect(bob).createNewPLMR(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: parseEther("0") },
    );
    expect(await registry.lastIndex()).to.equal(1);
  });

  it("Testing deployed plmr data fetching", async function () {
    // Setup a plmr contract to be able to start calculating deposits and fees
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      registry,
      requestedTokens,
      polymerFactory,
    } = await setUpPLRM();

    await requestedTokens.connect(bob).requestNewToken(
      BTC.address,
    );
    await requestedTokens.connect(bob).requestNewToken(USD.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);

    let token1Addr = BTC.address;
    let token1Rate = 1;
    let token1DecimalShift = 3;
    let token2Addr = USD.address;
    let token2Rate = 1000;
    let token2DecimalShift = 0;

    let token1DeploymentFee = await registry.getDeploymentFee(token1Addr);
    let token2DeploymentFee = await registry.getDeploymentFee(token2Addr);

    await registry.connect(bob).createNewPLMR(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );

    // Expect that the new PLMR exists!
    let plmrs = await registry.getAllPolymers();
    expect(plmrs.length).to.equal(1);
    const plmr1 = plmrs[0];
    expect(plmr1.plmrSymbol).to.equal("PLMR1");
    expect(plmr1.plmrName).to.equal("PLMR1-BTC/USD");
    expect(plmr1.token1Addr).to.equal(BTC.address);
    expect(plmr1.token1Symbol).to.equal("BTC");
    expect(plmr1.token1Rate).to.equal(1);
    expect(plmr1.token1DecimalShift).to.equal(3);

    expect(plmr1.token2Addr).to.equal(USD.address);
    expect(plmr1.token2Symbol).to.equal("USD");
    expect(plmr1.token2Rate).to.equal(1000);
    expect(plmr1.token2DecimalShift).to.equal(0);

    expect(await registry.isPolymerAddress(plmr1.polymerAddress)).to.equal(
      true,
    );

    // create a new PLMR contract to test isPolymerAddress checks when creating them

    token1Addr = BTC.address;
    token1Rate = 1;
    token1DecimalShift = 3;
    token2Addr = plmr1.polymerAddress;
    token2Rate = 1;
    token2DecimalShift = 0;

    // The PLMR2 token contains 0.001 BTC and 1 PLMR1 (which contains 0.001BTC and 1000USD)

    token1DeploymentFee = await registry.getDeploymentFee(token1Addr);
    token2DeploymentFee = await registry.getDeploymentFee(token2Addr);

    await registry.connect(bob).createNewPLMR(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );
    //this succeeds because PLMR1 don't need to be registered
    plmrs = await registry.getAllPolymers();
    expect(plmrs.length).to.equal(2);
    const plmr2 = plmrs[1];
    expect(plmr2.plmrSymbol).to.equal("PLMR2");
    expect(plmr2.plmrName).to.equal("PLMR2-BTC/PLMR1");
    expect(plmr2.token1Addr).to.equal(BTC.address);
    expect(plmr2.token1Symbol).to.equal("BTC");
    expect(plmr2.token1Rate).to.equal(1);
    expect(plmr2.token1DecimalShift).to.equal(3);

    expect(plmr2.token2Addr).to.equal(plmr1.polymerAddress);
    expect(plmr2.token2Symbol).to.equal("PLMR1");
    expect(plmr2.token2Rate).to.equal(1);
    expect(plmr2.token2DecimalShift).to.equal(0);

    expect(await registry.isPolymerAddress(plmr2.polymerAddress)).to.equal(
      true,
    );
    // Attach to the contract and test if the data is saved proper
    const plmr2Contract = await polymerFactory.attach(plmr2.polymerAddress);

    const backing = await plmr2Contract.getBacking();
    expect(await plmr2Contract.symbol()).to.equal("PLMR2");
    expect(await plmr2Contract.name()).to.equal("PLMR2-BTC/PLMR1");
    expect(await plmr2Contract.totalSupply()).to.equal(0);
    expect(backing[0]).to.equal(plmr2.token1Addr);
    expect(backing[1]).to.equal(plmr2.token1Rate);
    expect(backing[2]).to.equal(plmr2.token1DecimalShift);
    expect(backing[3]).to.equal(plmr2.token2Addr);
    expect(backing[4]).to.equal(plmr2.token2Rate);
    expect(backing[5]).to.equal(plmr2.token2DecimalShift);

    // These are tests to make sure I can decode the PLMR index from it's symbol and access it in the allPolymers ARRAY!
    let symbol = await plmr2Contract.symbol();
    // I use the symbol of the PLMR contract to determine if it's valid and use it to access the array!
    let PLMROptions = getPLMRIndex(symbol);
    expect(PLMROptions.result).to.equal(Result.SOME);
    let allPLMRS = await registry.getAllPolymers();
    let plmrIndexFromResult = getPLMRArrayIndex(PLMROptions.data);
    let currentPLMR = allPLMRS[plmrIndexFromResult];
    expect(currentPLMR.plmrName).to.equal(await plmr2Contract.name());
  });

  it("Test fee and deposit calculations, solidity vs js", async function () {
    // Test plmr1 calculateTokenDeposits and calculate Fee
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      registry,
      requestedTokens,
      polymerFactory,
    } = await setUpPLRM();

    await requestedTokens.connect(bob).requestNewToken(
      BTC.address,
    );
    await requestedTokens.connect(bob).requestNewToken(USD.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);

    let token1Addr = BTC.address;
    let token1Rate = 1;
    let token1DecimalShift = 3;
    let token2Addr = USD.address;
    let token2Rate = 1000;
    let token2DecimalShift = 0;
    let token1DeploymentFee = await registry.getDeploymentFee(token1Addr);
    let token2DeploymentFee = await registry.getDeploymentFee(token2Addr);

    await registry.connect(bob).createNewPLMR(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );
    let plmrs = await registry.getAllPolymers();
    expect(plmrs.length).to.equal(1);
    // Compare the javascript decimal shift function to the on-chain view function

    const plmr1Contract = await polymerFactory.attach(plmrs[0].polymerAddress);

    expect(
      await plmr1Contract.calculateTokenDeposits(
        parseEther("1"),
        token1Rate,
        token1DecimalShift,
      ),
    ).to.equal(
      parseEther(
        calculateTokenDeposit(
          "1",
          token1Rate,
          token1DecimalShift,
        ),
      ),
    );

    expect(
      await plmr1Contract.calculateTokenDeposits(
        parseEther("0.2425"),
        token1Rate,
        token1DecimalShift,
      ),
    ).to.equal(
      parseEther(
        calculateTokenDeposit(
          "0.2425",
          token1Rate,
          token1DecimalShift,
        ),
      ),
    );

    const feeDivider = await registry.getFeeDivider();

    // Now compare the fee calculations js vs solidity
    expect(
      await plmr1Contract.calculateFee(parseEther("1"), token1Addr),
    ).to.equal(calculateDepositFeeForToken("1", feeDivider));

    // To calculate the amount I need for minting on the client,
    // I need to check if a the deposit is a plmr token, if it is then I don't add fee.
    // So something like:
    let mintAmount = "1";
    const calculatedDeposit = calculateTokenDeposit(
      mintAmount,
      token1Rate,
      token1DecimalShift,
    );

    let depositWithFee = parseEther(calculatedDeposit).add(
      calculateDepositFeeForToken(calculatedDeposit, feeDivider),
    );
    expect(formatEther(depositWithFee)).to.equal("0.001002");
  });

  it("Test generating a DAG from On-chain data", async function () {
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      registry,
      requestedTokens,
      polymerFactory,
    } = await setUpPLRM();

    // I want to generate a massive DAG for testing with multiple children, BTC,USD, EUR, ETH, all that will go in.

    //Setting up available tokens
    await requestedTokens.connect(bob).requestNewToken(
      BTC.address,
    );
    await requestedTokens.connect(bob).requestNewToken(USD.address);
    await requestedTokens.connect(bob).requestNewToken(EUR.address);
    await requestedTokens.connect(bob).requestNewToken(ETH.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);
    await requestedTokens.acceptTokenRequest(EUR.address);
    await requestedTokens.acceptTokenRequest(ETH.address);
    // Requested tokens setup done

    const plmr1Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(BTC.address, 1, 3), //0.001 BTC
      ...buildToken2_RegisterPlmrParams(USD.address, 1000, 0), // 1000 USD
    };

    const plmr2Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(ETH.address, 1, 1), // 0.1ETH
      ...buildToken2_RegisterPlmrParams(EUR.address, 100, 0), // 100EUR
    };

    const plmr3Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(USD.address, 100, 0), //100 USD
      ...buildToken2_RegisterPlmrParams(EUR.address, 100, 0), // 100 EUR
    };

    const plmr4Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(BTC.address, 1, 2), // 0.01 BTC
      ...buildToken2_RegisterPlmrParams(ETH.address, 1, 0), // 1 ETH
    };

    let token1DeploymentFee = await registry.getDeploymentFee(
      plmr1Params.token1Addr,
    );
    let token2DeploymentFee = await registry.getDeploymentFee(
      plmr1Params.token2Addr,
    );

    // Now I register these now
    await registry.connect(bob).createNewPLMR(
      plmr1Params.token1Addr,
      plmr1Params.token1Rate,
      plmr1Params.token1DecimalShift,
      plmr1Params.token2Addr,
      plmr1Params.token2Rate,
      plmr1Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );
    token1DeploymentFee = await registry.getDeploymentFee(
      plmr2Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr2Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr2Params.token1Addr,
      plmr2Params.token1Rate,
      plmr2Params.token1DecimalShift,
      plmr2Params.token2Addr,
      plmr2Params.token2Rate,
      plmr2Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );
    token1DeploymentFee = await registry.getDeploymentFee(
      plmr3Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr3Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr3Params.token1Addr,
      plmr3Params.token1Rate,
      plmr3Params.token1DecimalShift,
      plmr3Params.token2Addr,
      plmr3Params.token2Rate,
      plmr3Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );
    token1DeploymentFee = await registry.getDeploymentFee(
      plmr4Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr4Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr4Params.token1Addr,
      plmr4Params.token1Rate,
      plmr4Params.token1DecimalShift,
      plmr4Params.token2Addr,
      plmr4Params.token2Rate,
      plmr4Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );

    // Now I combine some PLMR tokens!
    let plmr1 = await registry.getPolymerByIndex(0);
    let plmr2 = await registry.getPolymerByIndex(1);
    let plmr3 = await registry.getPolymerByIndex(2);
    let plmr4 = await registry.getPolymerByIndex(3);

    const plmr5Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(plmr1.polymerAddress, 1, 0), //1 PLMR1
      ...buildToken2_RegisterPlmrParams(plmr2.polymerAddress, 1, 0), //1 PLMR2
    };

    const plmr6Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(plmr3.polymerAddress, 1, 0), //1 PLMR3
      ...buildToken2_RegisterPlmrParams(plmr4.polymerAddress, 1, 0), //1 PLMR4
    };

    const plmr7Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(plmr4.polymerAddress, 1, 3), //0.001 BTC
      ...buildToken2_RegisterPlmrParams(USD.address, 1000, 0), // 1000 USD
    };

    const plmr8Params: RegisterNewPLMRArgs = {
      ...buildToken1_RegisterPlmrParams(BTC.address, 1, 3), //0.001 BTC
      ...buildToken2_RegisterPlmrParams(USD.address, 1000, 0), // 1000 USD
    };

    token1DeploymentFee = await registry.getDeploymentFee(
      plmr5Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr5Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr5Params.token1Addr,
      plmr5Params.token1Rate,
      plmr5Params.token1DecimalShift,
      plmr5Params.token2Addr,
      plmr5Params.token2Rate,
      plmr5Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );

    token1DeploymentFee = await registry.getDeploymentFee(
      plmr6Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr6Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr6Params.token1Addr,
      plmr6Params.token1Rate,
      plmr6Params.token1DecimalShift,
      plmr6Params.token2Addr,
      plmr6Params.token2Rate,
      plmr6Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );

    token1DeploymentFee = await registry.getDeploymentFee(
      plmr7Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr7Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr7Params.token1Addr,
      plmr7Params.token1Rate,
      plmr7Params.token1DecimalShift,
      plmr7Params.token2Addr,
      plmr7Params.token2Rate,
      plmr7Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );

    token1DeploymentFee = await registry.getDeploymentFee(
      plmr8Params.token1Addr,
    );
    token2DeploymentFee = await registry.getDeploymentFee(
      plmr8Params.token2Addr,
    );

    await registry.connect(bob).createNewPLMR(
      plmr8Params.token1Addr,
      plmr8Params.token1Rate,
      plmr8Params.token1DecimalShift,
      plmr8Params.token2Addr,
      plmr8Params.token2Rate,
      plmr8Params.token2DecimalShift,
      { value: token1DeploymentFee.add(token2DeploymentFee) },
    );

    const allPLMRS = await registry.getAllPolymers();
    //now I generate a DAG for PLMR8 with amount 1

    const PLMR7dagOption = generateDag(allPLMRS, "PLMR7", "1");

    // DAG generation success, now I need to expect and verify it!
    expect(PLMR7dagOption.result).to.equal(Result.SOME);
    expect(PLMR7dagOption.data.name).to.equal("PLMR7");
    expect(PLMR7dagOption.data?.attributes?.Amount).to.equal("1");
    expect(PLMR7dagOption.data.metadata.rate).to.equal(1);
    expect(PLMR7dagOption.data.metadata.decimalShift).to.equal(0);
    expect(PLMR7dagOption.data.metadata.isPlmr).to.equal(true);
    expect(PLMR7dagOption.data.children?.length).to.equal(2);
    const plmr7DagChildren = PLMR7dagOption.data.children as Dag[];
    expect(plmr7DagChildren[0].name).to.equal("PLMR4");
    expect(plmr7DagChildren[0].children?.length).to.equal(2);
    expect(plmr7DagChildren[0].metadata.isPlmr).to.equal(true);
    //ETC... I did not check all DAG parameters, they look good!
  });

  // /?TODO:TEST MINT AND REDEEM AND THEN THE CONTRACT TESTS ARE DONE!
  // it("Test mint and redeem", async function () {
  //   const { owner, BTC, USD, EUR, ETH, alice, bob, registry } =
  //     await setUpPLRM();

  //   //TODO: Use the registry to register the tokens before they can be used in createNewPLMR

  //   expect(await registry.lastIndex()).to.equal(0);

  //   // I want to deposit 0.001 BTC and 1000 USD!

  //   const token1Addr = BTC.address;
  //   const token1Rate = 1;
  //   const token1Decimals = 3; // I want 3 decimals
  //   const token2Addr = USD.address;
  //   const token2Rate = 1000;
  //   const token2Decimals = 0;

  //   //use the registry to create a PLRM
  //   const tx = await registry.createNewPLMR(
  //     token1Addr,
  //     token1Rate,
  //     token1Decimals,
  //     token2Addr,
  //     token2Rate,
  //     token2Decimals,
  //   );

  //   await tx.wait().then((receipt: any) => {
  //     const events = receipt.events;
  //     const event = events[0];
  //     expect(event.event).to.equal("NewPLMR");
  //   });

  //   let index = await registry.lastIndex();
  //   let registeredDetails = await registry.polymers(index);
  //   let details = await registeredDetails;
  //   expect(details.token1Addr).to.equal(token1Addr);
  //   expect(details.token1Rate).to.equal(token1Rate);
  //   expect(details.token1Decimals).to.equal(token1Decimals);
  //   expect(details.token2Addr).to.equal(token2Addr);
  //   expect(details.token2Rate).to.equal(token2Rate);
  //   expect(details.token2Decimals).to.equal(token2Decimals);
  //   expect(details.ticker).to.equal("PLMR1");
  //   expect(details.token1Symbol).to.equal("BTC");
  //   expect(details.token2Symbol).to.equal("USD");

  //   const PLMR1_Address = await registeredDetails.polymerAddress;

  //   // // Gonna attach to this address
  //   const polymerFactory = await ethers.getContractFactory("Polymer");
  //   const PLMR1 = await polymerFactory.attach(PLMR1_Address);

  //   expect(await PLMR1.name()).to.equal("PLMR1");

  //   const backing = await PLMR1.getBacking();
  //   expect(backing[0]).to.equal(details.token1Addr);
  //   expect(backing[1]).to.equal(details.token1Rate);
  //   expect(backing[2]).to.equal(details.token1Decimals);
  //   expect(backing[3]).to.equal(details.token2Addr);
  //   expect(backing[4]).to.equal(details.token2Rate);
  //   expect(backing[5]).to.equal(details.token2Decimals);

  //   //TODO: ADD TOKEN FEE CALCULATIONS TOO!
  //   const token1ToDeposit = await PLMR1.calculateTokenDeposits(
  //     parseEther("1"),
  //     token1Rate,
  //     token1Decimals,
  //   );
  //   expect(formatEther(token1ToDeposit)).to.equal("0.001");

  //   const token2ToDeposit = await PLMR1.calculateTokenDeposits(
  //     parseEther("1"),
  //     token2Rate,
  //     token2Decimals,
  //   );
  //   expect(formatEther(token2ToDeposit)).to.equal("1000.0");

  //   // // Now I check the totalSupply of this PLMR token and mint some
  //   expect(await PLMR1.totalSupply()).to.equal(0);

  //   let errorOccured = false;
  //   let errorMessage = "";

  //   try {
  //     await PLMR1.mintPLMR(parseEther("1"));
  //   } catch (err: any) {
  //     errorOccured = true;
  //     errorMessage = err.message;
  //   }
  //   expect(errorOccured).to.be.true;
  //   expect(errorMessage.includes("ERC20: insufficient allowance"));

  //   // // now I approve spend from the owner's balance
  //   await BTC.approve(PLMR1.address, token1ToDeposit);
  //   await USD.approve(PLMR1.address, token2ToDeposit);

  //   await PLMR1.mintPLMR(parseEther("1"));

  //   expect(await PLMR1.balanceOf(owner.address)).to.equal(parseEther("1"));

  //   // I want eth 0.2 and  eur 1000
  //   const plmr2Token = {
  //     token1Addr: ETH.address,
  //     token1Rate: 2,
  //     token1Decimals: 1, // I want 3 decimals
  //     token2Addr: EUR.address,
  //     token2Rate: 1000,
  //     token2Decimals: 0,
  //   };

  //   // Now I deploy HPLRM2 with EUR/ETH backing

  //   const newTx = await registry.createNewPLMR(
  //     plmr2Token.token1Addr,
  //     plmr2Token.token1Rate,
  //     plmr2Token.token1Decimals,
  //     plmr2Token.token2Addr,
  //     plmr2Token.token2Rate,
  //     plmr2Token.token2Decimals,
  //   );
  //   await newTx.wait();
  //   index = await registry.lastIndex();
  //   registeredDetails = await registry.polymers(index);
  //   details = await registeredDetails;

  //   const H_PLMR2 = await polymerFactory.attach(details.polymerAddress);

  //   const hplrm2Backing = await H_PLMR2.getBacking();
  //   expect(hplrm2Backing[0]).to.equal(ETH.address);
  //   expect(hplrm2Backing[1]).to.equal(plmr2Token.token1Rate);
  //   expect(hplrm2Backing[2]).to.equal(plmr2Token.token1Decimals);
  //   expect(hplrm2Backing[3]).to.equal(plmr2Token.token2Addr);
  //   expect(hplrm2Backing[4]).to.equal(plmr2Token.token2Rate);
  //   expect(hplrm2Backing[5]).to.equal(plmr2Token.token2Decimals);

  //   // redeem tokens
  //   // Try to redeem without having any tokens
  //   errorOccured = true;
  //   try {
  //     await PLMR1.connect(alice).redeemPLMR(parseEther("100"));
  //   } catch (err: any) {
  //     errorOccured = true;
  //     errorMessage = err.message;
  //   }

  //   expect(errorOccured).to.be.true;
  //   expect(errorMessage.includes("ERC20: burn amount exceeds balance")).to.be
  //     .true;

  //   // Now I will redeem the backing and destroy the token!

  //   // Now I transfer it to alice who will redeem it

  //   await PLMR1.transfer(alice.address, parseEther("1"));

  //   expect(await PLMR1.balanceOf(alice.address)).to.equal(parseEther("1"));
  //   expect(await PLMR1.balanceOf(owner.address)).to.equal(parseEther("0"));

  //   // I redeem half only!
  //   await PLMR1.connect(alice).redeemPLMR(parseEther("0.5"));
  //   expect(await BTC.balanceOf(alice.address)).to.equal(parseEther("0.0005"));
  //   expect(await USD.balanceOf(alice.address)).to.equal(parseEther("500"));
  // });

  it("Test finding and traversing the DAG", async function () {});
});
