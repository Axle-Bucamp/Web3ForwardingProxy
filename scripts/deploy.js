const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy EntryPoint (from @account-abstraction/contracts)
  // The EntryPoint from @account-abstraction/contracts@0.6.0 has a parameterless constructor
  const EntryPoint = await hre.ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.waitForDeployment();
  const entryPointAddress = await entryPoint.getAddress();
  console.log("EntryPoint deployed to:", entryPointAddress);

  // Deploy SimpleAccountFactory (which includes SimpleAccount logic)
  // It requires the EntryPoint address in its constructor
  const SimpleAccountFactory = await hre.ethers.getContractFactory("SimpleAccountFactory");
  const simpleAccountFactory = await SimpleAccountFactory.deploy(entryPointAddress);
  await simpleAccountFactory.waitForDeployment();
  const simpleAccountFactoryAddress = await simpleAccountFactory.getAddress();
  console.log("SimpleAccountFactory deployed to:", simpleAccountFactoryAddress);

  // Deploy Paymaster
  // It requires the EntryPoint address in its constructor
  const Paymaster = await hre.ethers.getContractFactory("Paymaster");
  const paymaster = await Paymaster.deploy(entryPointAddress);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("Paymaster deployed to:", paymasterAddress);
  
  // Fund the Paymaster with some ETH for gas sponsoring (on local node)
  // On SKALE, this would involve sFUEL management
  const tx = await deployer.sendTransaction({
    to: paymasterAddress,
    value: hre.ethers.parseEther("1.0") // Send 1 ETH for testing
  });
  await tx.wait();
  console.log(`Sent 1 ETH to Paymaster (${paymasterAddress})`);
  
  // The Paymaster contract in Account.sol has a deposit function that needs to be called by the EntryPoint
  // For testing, we can also directly add stake and deposit for the paymaster with the entrypoint
  // This is typically done by the paymaster owner after deployment.
  // await entryPoint.depositTo(paymasterAddress, { value: hre.ethers.parseEther("0.1") }); // Deposit for paymaster
  // await paymaster.addStake(86400, { value: hre.ethers.parseEther("0.01") }); // Stake for 1 day

  // Deploy ForwardingProxy
  const ForwardingProxy = await hre.ethers.getContractFactory("ForwardingProxy");
  const forwardingProxy = await ForwardingProxy.deploy();
  await forwardingProxy.waitForDeployment();
  const forwardingProxyAddress = await forwardingProxy.getAddress();
  console.log("ForwardingProxy deployed to:", forwardingProxyAddress);

  console.log("\n--- Deployed Contract Addresses ---");
  console.log("EntryPoint:", entryPointAddress);
  console.log("SimpleAccountFactory:", simpleAccountFactoryAddress);
  console.log("Paymaster:", paymasterAddress);
  console.log("ForwardingProxy:", forwardingProxyAddress);
  console.log("-----------------------------------");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

