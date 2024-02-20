import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

// This script will deploy on testnet, then request some tokens and accept them

export async function DeployBaseContracts() {
  console.log("Deploying RequestedTokens");

  const RequestedTokensFactory = await ethers.getContractFactory(
    "RequestedTokens",
  );
  const requestedTokens = await RequestedTokensFactory.deploy();
  await requestedTokens.deployed().then(async (requestedtokens) => {
    console.log("Requested Tokens Deployed to ", requestedtokens.address);
    console.log("Deploying FactoryContractVerifier");
    const FactoryContractVerifier = await ethers.getContractFactory(
      "FactoryContractVerifier",
    );
    const factoryContractVerifier = await FactoryContractVerifier.deploy();
    await factoryContractVerifier.deployed()
      .then(async (factorycontractverifier) => {
        console.log(
          "FactoryContractVerifier deployed to:",
          factorycontractverifier.address,
        );
        console.log("Deploying AGPH");
        const agphTokenLibFactory = await ethers.getContractFactory("AGPH", {
          libraries: {
            FactoryContractVerifier: factorycontractverifier.address,
          },
        });
        const agphTokenLibDepl = await agphTokenLibFactory.deploy();
        await agphTokenLibDepl.deployed().then(async (agphTokenLib) => {
          console.log("AGPH deployed to: ", agphTokenLib.address);

          console.log("Deploying GraphStore");

          const graphStoreFactory = await ethers.getContractFactory(
            "GraphStore",
          );
          const graphStoreDeploy = await graphStoreFactory.deploy(
            500,
            requestedTokens.address,
            agphTokenLib.address,
          ); // 500 for a 0.5 percent deposit fee on both tokens

          console.log("GraphStore deployed to", graphStoreDeploy.address);
        });
      });
  });

  // Then deploy the graphStore!
}

export async function DeployTestnetTokens() {
  console.log("Deploying testnet tokens");

  const BTCFactory = await ethers.getContractFactory("TestERC20");
  const BTCDeploy = await BTCFactory.deploy("WBTC", "WBTC", parseEther("100"));
  const BTC = await BTCDeploy.deployed();

  console.log("WBTC address: ", BTC.address);

  const USDFactory = await ethers.getContractFactory("TestERC20");
  const USDDeploy = await USDFactory.deploy(
    "USD",
    "USD",
    parseEther("100000000"),
  );
  const USD = await USDDeploy.deployed();

  console.log("USD address ", USD.address);

  const EURFactory = await ethers.getContractFactory("TestERC20");

  const EURDeploy = await EURFactory.deploy(
    "EUR",
    "EUR",
    parseEther("100000000"),
  );
  const EUR = await EURDeploy.deployed();

  console.log("EUR address ", EUR.address);

  const ETHFactory = await ethers.getContractFactory("TestERC20");
  const ETHDeploy = await ETHFactory.deploy(
    "WToken",
    "WToken",
    parseEther("100"),
  );
  const WToken = await ETHDeploy.deployed();

  console.log("Wtoken address", WToken.address);
}

export async function RequestTestnetTokens() {
  console.log("Requesting new tokens");

  const WBTCAddress = "0x1FD17CeAed82819593518AFfB9D289fE5169DCc1";
  const USDAddress = "0xA3e7617C85c7Bd6faE230fC3A785005a81d55784";
  const EURAddress = "0xe1B20C09736C5ac96d2E1204536b95084915a4Ce";
  const WTokenAddress = "0x64274Fc42aD8e327Eb63E96e1BC7f43952D78D36";

  const requestTokensAddress = "0x8A0DF947c126574567592019aCf31dfd09E9A61e";

  const requestTokensFactory = await ethers.getContractFactory(
    "RequestedTokens",
  );
  const requestedTokens = await requestTokensFactory.attach(
    requestTokensAddress,
  );

  await requestedTokens.requestNewToken(WBTCAddress);
  await requestedTokens.requestNewToken(USDAddress);
  await requestedTokens.requestNewToken(EURAddress);
  await requestedTokens.requestNewToken(WTokenAddress);

  console.log("token requesting done;");
}

export async function AcceptRequestTestnetTokens() {
  console.log("tokens tokens");
  const WBTCAddress = "0x1FD17CeAed82819593518AFfB9D289fE5169DCc1";
  const USDAddress = "0xA3e7617C85c7Bd6faE230fC3A785005a81d55784";
  const EURAddress = "0xe1B20C09736C5ac96d2E1204536b95084915a4Ce";
  const WTokenAddress = "0x64274Fc42aD8e327Eb63E96e1BC7f43952D78D36";

  const requestTokensAddress = "0x8A0DF947c126574567592019aCf31dfd09E9A61e";

  const requestTokensFactory = await ethers.getContractFactory(
    "RequestedTokens",
  );
  const requestedTokens = await requestTokensFactory.attach(
    requestTokensAddress,
  );

  await requestedTokens.acceptTokenRequest(WBTCAddress);
  await requestedTokens.acceptTokenRequest(USDAddress);
  await requestedTokens.acceptTokenRequest(EURAddress);
  await requestedTokens.acceptTokenRequest(WTokenAddress);

  console.log("tokens accepted!:");

  console.log(await requestedTokens.getAcceptedTokens());
}

async function main() {
  // await DeployBaseContracts();
  // await DeployTestnetTokens()
  // await RequestTestnetTokens();
  // await AcceptRequestTestnetTokens();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Arbitrum Sepolia testnet
// Deploying RequestedTokens
// Requested Tokens Deployed to  0x8A0DF947c126574567592019aCf31dfd09E9A61e
// Deploying FactoryContractVerifier
// FactoryContractVerifier deployed to: 0xb4643353035d234589F86456aAC98E5AF722b921
// Deploying AGPH
// AGPH deployed to:  0x02Def58cdab8b5e6606e9fF74187baD098112be3
// Deploying GraphStore
// GraphStore deployed to 0x2960614E2cAB6f74ce1e46484d85daF48605793F

// Deploying testnet tokens
// WBTC address:  0x1FD17CeAed82819593518AFfB9D289fE5169DCc1
// USD address  0xA3e7617C85c7Bd6faE230fC3A785005a81d55784
// EUR address  0xe1B20C09736C5ac96d2E1204536b95084915a4Ce
// Wtoken address 0x64274Fc42aD8e327Eb63E96e1BC7f43952D78D36

// tokens accepted!:
// [
//   '0x1FD17CeAed82819593518AFfB9D289fE5169DCc1',
//   '0xA3e7617C85c7Bd6faE230fC3A785005a81d55784',
//   '0xe1B20C09736C5ac96d2E1204536b95084915a4Ce',
//   '0x64274Fc42aD8e327Eb63E96e1BC7f43952D78D36'
// ]