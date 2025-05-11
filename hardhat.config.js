require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // To load environment variables
require("hardhat-dependency-compiler"); // Added for compiling external dependencies

/** @type import(\'hardhat/config\').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun" // Specify EVM version compatible with tload/tstore
    },
  },
  networks: {
    hardhat: {
        // allowUnlimitedContractSize: true // Optional: if contracts are very large
    },
    skaleTestnet: {
      url: "https://testnet.skalenodes.com/v1/juicy-low-small-testnet", // SKALE Europa Testnet RPC
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Loaded from .env
      chainId: 1444673419,
    },
    // Add skaleMainnet configuration similarly when ready
    // skaleMainnet: {
    //   url: "YOUR_SKALE_MAINNET_RPC_URL",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: YOUR_SKALE_MAINNET_CHAIN_ID,
    // },
  },
  etherscan: {
    // If you need to verify contracts on SKALE\'s explorer (if supported)
    // apiKey: {
    //   skaleTestnet: "YOUR_BLOCKSCOUT_API_KEY_IF_NEEDED" // Or equivalent for SKALE explorer
    // },
    // customChains: [
    //   {
    //     network: "skaleTestnet",
    //     chainId: 1444673419,
    //     urls: {
    //       apiURL: "https://juicy-low-small-testnet.explorer.testnet.skalenodes.com/api", // Replace with actual API URL for contract verification if available
    //       browserURL: "https://juicy-low-small-testnet.explorer.testnet.skalenodes.com/"
    //     }
    //   }
    // ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 60000 // Increased timeout for potentially longer compilation/tests
  },
  dependencyCompiler: { // Configuration for hardhat-dependency-compiler
    paths: [
      "@account-abstraction/contracts/core/EntryPoint.sol",
      "@account-abstraction/contracts/interfaces/IAccount.sol",
      "@account-abstraction/contracts/interfaces/IAggregator.sol",
      "@account-abstraction/contracts/interfaces/IEntryPoint.sol",
      "@account-abstraction/contracts/interfaces/INonceManager.sol",
      "@account-abstraction/contracts/interfaces/IPaymaster.sol",
      "@account-abstraction/contracts/interfaces/IStakeManager.sol",
      // OpenZeppelin contracts that might be causing issues if not explicitly compiled with cancun
      "@openzeppelin/contracts/utils/Create2.sol",
      "@openzeppelin/contracts/utils/Address.sol",
      "@openzeppelin/contracts/utils/StorageSlot.sol",
      "@openzeppelin/contracts/token/ERC20/IERC20.sol"
    ],
    // Explicitly set compiler settings for dependencies if the global one isn't enough
    // It should inherit the global evmVersion: "cancun" setting.
  }
};

