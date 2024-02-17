import { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";

export async function setUpAGPH(): Promise<any> {
  const [owner, alice, bob] = await ethers.getSigners();

  // Deploy a couple of ERC20 tokens with different names and symbols for testing!
  const BTCFactory = await ethers.getContractFactory("TestERC20");
  const BTCDeploy = await BTCFactory.deploy("BTC", "BTC", parseEther("100"));
  const BTC = await BTCDeploy.deployed();

  const USDFactory = await ethers.getContractFactory("TestERC20");
  const USDDeploy = await USDFactory.deploy(
    "USD",
    "USD",
    parseEther("100000000"),
  );
  const USD = await USDDeploy.deployed();

  const EURFactory = await ethers.getContractFactory("TestERC20");

  const EURDeploy = await EURFactory.deploy(
    "EUR",
    "EUR",
    parseEther("100000000"),
  );
  const EUR = await EURDeploy.deployed();

  const ETHFactory = await ethers.getContractFactory("TestERC20");
  const ETHDeploy = await ETHFactory.deploy("ETH", "ETH", parseEther("100"));
  const ETH = await ETHDeploy.deployed();

  // Deploy the RequestedTokens contract first to request tokens to be used by the graphStore
  const RequestedTokensFactory = await ethers.getContractFactory(
    "RequestedTokens",
  );
  const requestedTokens = await RequestedTokensFactory.deploy();
  await requestedTokens.deployed();

  const FactoryContractVerifier = await ethers.getContractFactory(
    "FactoryContractVerifier",
  );
  const factoryContractVerifier = await FactoryContractVerifier.deploy();
  const factorycontractverifier = await factoryContractVerifier.deployed();

  const agphTokenLibFactory = await ethers.getContractFactory("AGPH", {
    libraries: { FactoryContractVerifier: factorycontractverifier.address },
  });
  const agphTokenLibDepl = await agphTokenLibFactory.deploy();
  const agphTokenLib = await agphTokenLibDepl.deployed();
  // Then deploy the graphStore!
  const graphStoreFactory = await ethers.getContractFactory(
    "GraphStore",
  );
  const graphStoreDeploy = await graphStoreFactory.deploy(
    500,
    requestedTokens.address,
    agphTokenLib.address,
  ); // 500 for a 0.5 percent deposit fee on both tokens

  const graphStore = await graphStoreDeploy.deployed();
  return {
    owner,
    BTC,
    USD,
    EUR,
    ETH,
    alice,
    bob,
    graphStore,
    requestedTokens,
    agphFactory: agphTokenLibFactory,
  };
}
