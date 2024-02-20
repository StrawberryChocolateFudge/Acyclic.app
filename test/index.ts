import { expect } from "chai";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { setUpAGPH } from "./setUp";
import {
  AGPHStruct,
  buildToken1_RegisterAgphParams,
  buildToken2_RegisterAgphParams,
  calculateDepositFeeForToken,
  calculateTokenDeposit,
  Dag,
  generateDag,
  getAGPHArrayIndex,
  getAGPHIndex,
  Option,
  RegisterNewAgphArgs,
  Result,
} from "../lib/traverseDAG";
import { BigNumber, ContractTransaction } from "ethers/lib/ethers";

describe("graphStore", function () {
  it("Should test token requests and graphStore", async function () {
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      graphStore,
      requestedTokens,
    } = await setUpAGPH();

    expect(await requestedTokens.getStatus(BTC.address)).to.equal(0);
    // Request a new token
    await requestedTokens.requestNewToken(
      BTC.address,
    );
    expect(await requestedTokens.getStatus(BTC.address)).to.equal(1);

    // Now request another token
    await requestedTokens.requestNewToken(USD.address);

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
      await graphStore.connect(bob).createNewAGPH(
        token1Addr,
        token1Rate,
        token1DecimalShift,
        token2Addr,
        token2Rate,
        token2DecimalShift,
        { value: parseEther("0.05") },
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
      await requestedTokens.requestNewToken(USD.address);
    } catch (err: any) {
      errorOccured = true;
      errorMessage = err.message;
    }

    expect(errorOccured).to.be.true;
    expect(errorMessage.includes("Request already exists!")).to.be.true;

    // I create another request with a new token now...
    await requestedTokens.requestNewToken(EUR.address);

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

    expect(await graphStore.lastIndex()).to.equal(0);

    await graphStore.connect(bob).createNewAGPH(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: parseEther("0.05") },
    );
    expect(await graphStore.lastIndex()).to.equal(1);
  });

  it("Testing deployed agph data fetching", async function () {
    // Setup a agph contract to be able to start calculating deposits and fees
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      graphStore,
      requestedTokens,
      agphFactory,
    } = await setUpAGPH();

    await requestedTokens.requestNewToken(
      BTC.address,
    );
    await requestedTokens.requestNewToken(USD.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);

    let token1Addr = BTC.address;
    let token1Rate = 1;
    let token1DecimalShift = 3;
    let token2Addr = USD.address;
    let token2Rate = 1000;
    let token2DecimalShift = 0;

    let deploymentFee = await graphStore.getDeploymentFee(
      token1Addr,
      token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: deploymentFee },
    );

    // Expect that the new AGPH exists!
    let agphs = await graphStore.getAllAGPH();
    expect(agphs.length).to.equal(1);
    const agph1 = agphs[0];
    expect(agph1.agphSymbol).to.equal("AGPH1");
    expect(agph1.agphName).to.equal("AGPH1-BTC/USD");
    expect(agph1.token1Addr).to.equal(BTC.address);
    expect(agph1.token1Symbol).to.equal("BTC");
    expect(agph1.token1Rate).to.equal(1);
    expect(agph1.token1DecimalShift).to.equal(3);

    expect(agph1.token2Addr).to.equal(USD.address);
    expect(agph1.token2Symbol).to.equal("USD");
    expect(agph1.token2Rate).to.equal(1000);
    expect(agph1.token2DecimalShift).to.equal(0);

    expect(await graphStore.isAGPHAddress(agph1.agphAddress)).to.equal(
      true,
    );

    // create a new agph contract to test isAGPHAddress checks when creating them

    token1Addr = BTC.address;
    token1Rate = 1;
    token1DecimalShift = 3;
    token2Addr = agph1.agphAddress;
    token2Rate = 1;
    token2DecimalShift = 0;

    // The AGPH2 token contains 0.001 BTC and 1 AGPH1 (which contains 0.001BTC and 1000USD)

    deploymentFee = await graphStore.getDeploymentFee(token1Addr, token2Addr);

    await graphStore.connect(bob).createNewAGPH(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: deploymentFee },
    );
    //this succeeds because AGPH1 don't need to be registered
    agphs = await graphStore.getAllAGPH();
    expect(agphs.length).to.equal(2);
    const agph2 = agphs[1];
    expect(agph2.agphSymbol).to.equal("AGPH2");
    expect(agph2.agphName).to.equal("AGPH2-BTC/AGPH1");
    expect(agph2.token1Addr).to.equal(BTC.address);
    expect(agph2.token1Symbol).to.equal("BTC");
    expect(agph2.token1Rate).to.equal(1);
    expect(agph2.token1DecimalShift).to.equal(3);

    expect(agph2.token2Addr).to.equal(agph1.agphAddress);
    expect(agph2.token2Symbol).to.equal("AGPH1");
    expect(agph2.token2Rate).to.equal(1);
    expect(agph2.token2DecimalShift).to.equal(0);

    expect(await graphStore.isAGPHAddress(agph2.agphAddress)).to.equal(
      true,
    );
    // Attach to the contract and test if the data is saved proper
    const agph2Contract = await agphFactory.attach(agph2.agphAddress);

    const backing = await agph2Contract.getBacking();
    expect(await agph2Contract.symbol()).to.equal("AGPH2");
    expect(await agph2Contract.name()).to.equal("AGPH2-BTC/AGPH1");
    expect(await agph2Contract.totalSupply()).to.equal(0);
    expect(backing[0]).to.equal(agph2.token1Addr);
    expect(backing[1]).to.equal(agph2.token1Rate);
    expect(backing[2]).to.equal(agph2.token1DecimalShift);
    expect(backing[3]).to.equal(agph2.token2Addr);
    expect(backing[4]).to.equal(agph2.token2Rate);
    expect(backing[5]).to.equal(agph2.token2DecimalShift);

    // These are tests to make sure I can decode the AGPH index from it's symbol and access it in the allAgphss ARRAY!
    let symbol = await agph2Contract.symbol();
    // I use the symbol of the AGPH contract to determine if it's valid and use it to access the array!
    let AGPHOptions = getAGPHIndex(symbol);
    expect(AGPHOptions.result).to.equal(Result.SOME);
    let allAGPHS = await graphStore.getAllAGPH();
    let agphIndexFromResult = getAGPHArrayIndex(AGPHOptions.data);
    let currentAGPH = allAGPHS[agphIndexFromResult];
    expect(currentAGPH.agphName).to.equal(await agph2Contract.name());
  });

  it("Test fee and deposit calculations, solidity vs js", async function () {
    // Test agph1 calculateTokenDeposits and calculate Fee
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      graphStore,
      requestedTokens,
      agphFactory,
    } = await setUpAGPH();

    await requestedTokens.requestNewToken(
      BTC.address,
    );
    await requestedTokens.requestNewToken(USD.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);

    let token1Addr = BTC.address;
    let token1Rate = 1;
    let token1DecimalShift = 3;
    let token2Addr = USD.address;
    let token2Rate = 1000;
    let token2DecimalShift = 0;
    let deploymentFee = await graphStore.getDeploymentFee(
      token1Addr,
      token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      token1Addr,
      token1Rate,
      token1DecimalShift,
      token2Addr,
      token2Rate,
      token2DecimalShift,
      { value: deploymentFee },
    );
    let agphs = await graphStore.getAllAGPH();
    expect(agphs.length).to.equal(1);
    // Compare the javascript decimal shift function to the on-chain view function

    const agph1Contract = await agphFactory.attach(agphs[0].agphAddress);

    expect(
      await agph1Contract.calculateTokenDeposits(
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
      await agph1Contract.calculateTokenDeposits(
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

    const feeDivider = await graphStore.getFeeDivider();

    // Now compare the fee calculations js vs solidity
    expect(
      await agph1Contract.calculateFee(parseEther("1"), token1Addr),
    ).to.equal(calculateDepositFeeForToken("1", feeDivider));

    // To calculate the amount I need for minting on the client,
    // I need to check if a the deposit is a agph token, if it is then I don't add fee.
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
      graphStore,
      requestedTokens,
      agphFactory,
    } = await setUpAGPH();

    // I want to generate a massive DAG for testing with multiple children, BTC,USD, EUR, ETH, all that will go in.

    //Setting up available tokens
    await requestedTokens.requestNewToken(
      BTC.address,
    );
    await requestedTokens.requestNewToken(USD.address);
    await requestedTokens.requestNewToken(EUR.address);
    await requestedTokens.requestNewToken(ETH.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);
    await requestedTokens.acceptTokenRequest(EUR.address);
    await requestedTokens.acceptTokenRequest(ETH.address);
    // Requested tokens setup done

    const agph1Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(BTC.address, 1, 3), //0.001 BTC
      ...buildToken2_RegisterAgphParams(USD.address, 1000, 0), // 1000 USD
    };

    const agph2Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(ETH.address, 1, 1), // 0.1ETH
      ...buildToken2_RegisterAgphParams(EUR.address, 100, 0), // 100EUR
    };

    const agph3Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(USD.address, 100, 0), //100 USD
      ...buildToken2_RegisterAgphParams(EUR.address, 100, 0), // 100 EUR
    };

    const agph4Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(BTC.address, 1, 2), // 0.01 BTC
      ...buildToken2_RegisterAgphParams(ETH.address, 1, 0), // 1 ETH
    };

    let deploymentFee = await graphStore.getDeploymentFee(
      agph1Params.token1Addr,
      agph1Params.token2Addr,
    );

    // Now I register these now
    await graphStore.connect(bob).createNewAGPH(
      agph1Params.token1Addr,
      agph1Params.token1Rate,
      agph1Params.token1DecimalShift,
      agph1Params.token2Addr,
      agph1Params.token2Rate,
      agph1Params.token2DecimalShift,
      { value: deploymentFee },
    );
    deploymentFee = await graphStore.getDeploymentFee(
      agph2Params.token1Addr,
      agph2Params.token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      agph2Params.token1Addr,
      agph2Params.token1Rate,
      agph2Params.token1DecimalShift,
      agph2Params.token2Addr,
      agph2Params.token2Rate,
      agph2Params.token2DecimalShift,
      { value: deploymentFee },
    );
    deploymentFee = await graphStore.getDeploymentFee(
      agph3Params.token1Addr,
      agph3Params.token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      agph3Params.token1Addr,
      agph3Params.token1Rate,
      agph3Params.token1DecimalShift,
      agph3Params.token2Addr,
      agph3Params.token2Rate,
      agph3Params.token2DecimalShift,
      { value: deploymentFee },
    );
    deploymentFee = await graphStore.getDeploymentFee(
      agph4Params.token1Addr,
      agph4Params.token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      agph4Params.token1Addr,
      agph4Params.token1Rate,
      agph4Params.token1DecimalShift,
      agph4Params.token2Addr,
      agph4Params.token2Rate,
      agph4Params.token2DecimalShift,
      { value: deploymentFee },
    );

    // Now I combine some AGPH tokens!
    let agph1 = await graphStore.getAGPHByIndex(0);
    let agph2 = await graphStore.getAGPHByIndex(1);
    let agph3 = await graphStore.getAGPHByIndex(2);
    let agph4 = await graphStore.getAGPHByIndex(3);

    const agph5Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(agph1.agphAddress, 1, 0), //1 AGPH1
      ...buildToken2_RegisterAgphParams(agph2.agphAddress, 1, 0), //1 AGPH2
    };

    const agph6Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(agph3.agphAddress, 1, 0), //1 AGPH3
      ...buildToken2_RegisterAgphParams(agph4.agphAddress, 1, 0), //1 AGPH4
    };

    const agph7Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(agph4.agphAddress, 1, 3), //0.001 BTC
      ...buildToken2_RegisterAgphParams(USD.address, 1000, 0), // 1000 USD
    };

    const agph8Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(BTC.address, 1, 3), //0.001 BTC
      ...buildToken2_RegisterAgphParams(USD.address, 1000, 0), // 1000 USD
    };

    deploymentFee = await graphStore.getDeploymentFee(
      agph5Params.token1Addr,
      agph5Params.token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      agph5Params.token1Addr,
      agph5Params.token1Rate,
      agph5Params.token1DecimalShift,
      agph5Params.token2Addr,
      agph5Params.token2Rate,
      agph5Params.token2DecimalShift,
      { value: deploymentFee },
    );
    deploymentFee = await graphStore.getDeploymentFee(
      agph6Params.token1Addr,
      agph6Params.token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      agph6Params.token1Addr,
      agph6Params.token1Rate,
      agph6Params.token1DecimalShift,
      agph6Params.token2Addr,
      agph6Params.token2Rate,
      agph6Params.token2DecimalShift,
      { value: deploymentFee },
    );

    deploymentFee = await graphStore.getDeploymentFee(
      agph7Params.token1Addr,
      agph7Params.token2Addr,
    );

    await graphStore.connect(bob).createNewAGPH(
      agph7Params.token1Addr,
      agph7Params.token1Rate,
      agph7Params.token1DecimalShift,
      agph7Params.token2Addr,
      agph7Params.token2Rate,
      agph7Params.token2DecimalShift,
      { value: deploymentFee },
    );

    deploymentFee = await graphStore.getDeploymentFee(
      agph8Params.token1Addr,
      agph8Params.token2Addr,
    );

    const tx: ContractTransaction = await graphStore.connect(bob).createNewAGPH(
      agph8Params.token1Addr,
      agph8Params.token1Rate,
      agph8Params.token1DecimalShift,
      agph8Params.token2Addr,
      agph8Params.token2Rate,
      agph8Params.token2DecimalShift,
      { value: deploymentFee },
    );

    await tx.wait().then(async (res) => {
      const filter = graphStore.filters.NewAGPH();
      const events = await graphStore.queryFilter(filter, res.blockHash);
      expect(events.length).to.equal(1);
      const event = events[0];
      expect(event.event).to.equal("NewAGPH");
      expect(event.args[0].agphName).to.equal("AGPH8-BTC/USD");
      const args = event.args[0];
      //I just leave it here in case I need to log it
      ({
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
      });
    });

    const allAGPHS = await graphStore.getAllAGPH();
    //now I generate a DAG for AGPH8 with amount 1

    const AGPH7dagOption = generateDag(allAGPHS, "AGPH7", "1");

    // DAG generation success, now I need to expect and verify it!
    expect(AGPH7dagOption.result).to.equal(Result.SOME);
    expect(AGPH7dagOption.data.name).to.equal("AGPH7");
    expect(AGPH7dagOption.data?.attributes?.Amount).to.equal("1");
    expect(AGPH7dagOption.data.metadata.rate).to.equal(1);
    expect(AGPH7dagOption.data.metadata.decimalShift).to.equal(0);
    expect(AGPH7dagOption.data.metadata.isAgph).to.equal(true);
    expect(AGPH7dagOption.data.children?.length).to.equal(2);
    const agph7DagChildren = AGPH7dagOption.data.children as Dag[];
    expect(agph7DagChildren[0].name).to.equal("AGPH4");
    expect(agph7DagChildren[0].children?.length).to.equal(2);
    expect(agph7DagChildren[0].metadata.isAgph).to.equal(true);
    //ETC... I did not check all DAG parameters, they look good!

    console.log(JSON.stringify(AGPH7dagOption.data));
  });

  it("Test mint and unwrap", async function () {
    //SETUP START
    const {
      owner,
      BTC,
      USD,
      EUR,
      ETH,
      alice,
      bob,
      graphStore,
      requestedTokens,
      agphFactory,
    } = await setUpAGPH();

    //Setting up available tokens
    await requestedTokens.requestNewToken(
      BTC.address,
    );
    await requestedTokens.requestNewToken(USD.address);
    await requestedTokens.requestNewToken(EUR.address);
    await requestedTokens.requestNewToken(ETH.address);

    await requestedTokens.acceptTokenRequest(BTC.address);
    await requestedTokens.acceptTokenRequest(USD.address);
    await requestedTokens.acceptTokenRequest(EUR.address);
    await requestedTokens.acceptTokenRequest(ETH.address);
    // Requested tokens setup done

    const agph1Params: RegisterNewAgphArgs = {
      ...buildToken1_RegisterAgphParams(BTC.address, 1, 3), //0.001 BTC
      ...buildToken2_RegisterAgphParams(USD.address, 1000, 0), // 1000 USD
    };

    let deploymentFee = await graphStore.getDeploymentFee(
      agph1Params.token1Addr,
      agph1Params.token2Addr,
    );

    // Now I register these now
    await graphStore.connect(bob).createNewAGPH(
      agph1Params.token1Addr,
      agph1Params.token1Rate,
      agph1Params.token1DecimalShift,
      agph1Params.token2Addr,
      agph1Params.token2Rate,
      agph1Params.token2DecimalShift,
      { value: deploymentFee },
    );

    // Now I combine some AGPH tokens!
    let agph1: AGPHStruct = await graphStore.getAGPHByIndex(0);

    // SETUP ENDS

    const AGPH1_contract = await agphFactory.attach(agph1.agphAddress);

    expect(await AGPH1_contract.symbol()).to.equal("AGPH1");

    let AGPH1_mintAmount = parseEther("1");

    const AGPH1_token1ToDeposit = await AGPH1_contract.calculateTokenDeposits(
      AGPH1_mintAmount,
      agph1.token1Rate,
      agph1.token1DecimalShift,
    );
    const AGPH1_token2ToDeposit = await AGPH1_contract.calculateTokenDeposits(
      AGPH1_mintAmount,
      agph1.token2Rate,
      agph1.token2DecimalShift,
    );

    const AGPH1_token1DepositFee = await AGPH1_contract.calculateFee(
      AGPH1_token1ToDeposit,
      agph1.token1Addr,
    );
    const AGPH1_token2DepositFee = await AGPH1_contract.calculateFee(
      AGPH1_token2ToDeposit,
      agph1.token2Addr,
    );

    expect(BTC.address).to.equal(agph1.token1Addr);
    expect(USD.address).to.equal(agph1.token2Addr);

    await BTC.transfer(
      alice.address,
      AGPH1_token1ToDeposit.add(AGPH1_token1DepositFee),
    );

    await USD.transfer(
      alice.address,
      AGPH1_token2ToDeposit.add(AGPH1_token2DepositFee),
    );

    expect(await BTC.balanceOf(alice.address)).to.equal(
      AGPH1_token1ToDeposit.add(AGPH1_token1DepositFee),
    );

    expect(
      await USD.balanceOf(
        alice.address,
      ),
    ).to.equal(
      AGPH1_token2ToDeposit.add(AGPH1_token2DepositFee),
    );

    // Now I need to approve spending these! Deposit + fee
    await BTC.connect(alice).approve(
      AGPH1_contract.address,
      AGPH1_token1ToDeposit.add(AGPH1_token1DepositFee),
    );
    await USD.connect(alice).approve(
      AGPH1_contract.address,
      AGPH1_token2ToDeposit.add(AGPH1_token2DepositFee),
    );

    // Now I am ready to mint! There are no tokens so far...
    expect(await AGPH1_contract.totalSupply()).to.equal(0);

    // Minting now!

    await AGPH1_contract.connect(alice).wrapAGPH(AGPH1_mintAmount);
    // The owner got the tokens minted
    expect(await AGPH1_contract.balanceOf(alice.address)).to.equal(
      AGPH1_mintAmount,
    );
    expect(await AGPH1_contract.totalSupply()).to.equal(parseEther("1"));

    expect(await AGPH1_contract.balanceOf(alice.address)).to.equal(
      parseEther("1"),
    );

    expect(await BTC.balanceOf(alice.address)).to.equal(
      parseEther("0"),
    );

    expect(
      await USD.balanceOf(
        alice.address,
      ),
    ).to.equal(
      parseEther("0"),
    );

    await AGPH1_contract.connect(alice).transfer(bob.address, parseEther("1"));
    expect(await AGPH1_contract.balanceOf(alice.address)).to.equal(
      parseEther("0"),
    );
    expect(await AGPH1_contract.balanceOf(bob.address)).to.equal(
      parseEther("1"),
    );

    //NOW UNWRAP IT!

    expect(await BTC.balanceOf(bob.address)).to.equal(parseEther("0"));
    expect(await USD.balanceOf(bob.address)).to.equal(parseEther("0"));

    await AGPH1_contract.connect(bob).unwrapAGPH(parseEther("1"));

    expect(await BTC.balanceOf(bob.address)).to.equal(AGPH1_token1ToDeposit);
    expect(await USD.balanceOf(bob.address)).to.equal(AGPH1_token2ToDeposit);

    // And Bob unwrapped it now and all tokens are burned!!
    expect(await AGPH1_contract.totalSupply()).to.equal(parseEther("0"));
  });
});
