import { ethers } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Local Hardhat Node Configuration
const LOCAL_HARDHAT_RPC_URL = "http://127.0.0.1:8545";
const LOCAL_HARDHAT_CHAIN_ID = 31337;

// SKALE Europa Testnet Configuration (kept for reference, but local will be used for integration testing)
// const SKALE_EUROPA_TESTNET_RPC_URL = "https://testnet.skalenodes.com/v1/juicy-low-small-testnet";
// const SKALE_EUROPA_TESTNET_CHAIN_ID = 1444673419; // 0x561bf78b

// Placeholder for Web3Auth Client ID - Replace with your actual Client ID
const WEB3AUTH_CLIENT_ID = "YOUR_WEB3AUTH_CLIENT_ID_GOES_HERE"; 

// Deployed Contract Addresses (Local Hardhat Node)
const ENTRY_POINT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
const FORWARDING_PROXY_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; 
const PAYMASTER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 

// ABIs (simplified for brevity, import from JSON in a real app)
const ENTRY_POINT_ABI = [
    "event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)",
    "function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] calldata ops, address payable beneficiary)",
    "function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) calldata userOp) view returns (bytes32)",
    "function getNonce(address sender, uint256 key) view returns (uint256)"
];
const SIMPLE_ACCOUNT_FACTORY_ABI = [
    "event AccountCreated(address indexed account, address indexed owner, address entryPoint)",
    "function createAccount(address owner, address entryPointAddress) returns (address)",
    "function getAddress(address owner, uint256 salt) view returns (address)"
];
const FORWARDING_PROXY_ABI = [
    "function execute(address dest, uint256 value, bytes calldata func) external returns (bytes memory)"
];

let web3auth: Web3Auth | null = null;
let provider: ethers.providers.Web3Provider | null = null;
let signer: ethers.Signer | null = null;

export const initWeb3Auth = async () => {
    if (web3auth) return web3auth;

    try {
        const chainConfig = {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + LOCAL_HARDHAT_CHAIN_ID.toString(16), // Use local chain ID
            rpcTarget: LOCAL_HARDHAT_RPC_URL, // Use local RPC URL
            displayName: "Local Hardhat Node",
            blockExplorer: "N/A", // No block explorer for local node
            ticker: "ETH",
            tickerName: "Ethereum",
        };

        web3auth = new Web3Auth({
            clientId: WEB3AUTH_CLIENT_ID,
            web3AuthNetwork: "sapphire_devnet", 
            chainConfig: chainConfig,
        });

        await web3auth.initModal();
        console.log("Web3Auth initialized for Local Hardhat Node");
        return web3auth;
    } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        return null;
    }
};

export const connectWallet = async () => {
    if (!web3auth) {
        await initWeb3Auth();
        if (!web3auth) throw new Error("Web3Auth not initialized");
    }

    try {
        const web3authProvider = await web3auth.connect();
        if (!web3authProvider) throw new Error("Web3Auth connection failed");

        provider = new ethers.providers.Web3Provider(web3authProvider as SafeEventEmitterProvider);
        signer = provider.getSigner();
        console.log("Wallet connected, signer obtained");
        return { provider, signer };
    } catch (error) {
        console.error("Error connecting wallet:", error);
        return null;
    }
};

export const disconnectWallet = async () => {
    if (!web3auth) return;
    try {
        await web3auth.logout();
        provider = null;
        signer = null;
        web3auth = null; 
        console.log("Wallet disconnected");
    } catch (error) {
        console.error("Error disconnecting wallet:", error);
    }
};

export const getSignerAddress = async () => {
    if (!signer) {
        const connection = await connectWallet();
        if (!connection?.signer) return null;
    }
    return await signer.getAddress();
};

export const getProvider = () => {
    if (!provider) {
        return new ethers.providers.JsonRpcProvider(LOCAL_HARDHAT_RPC_URL);
    }
    return provider;
};

export const getOrCreateSmartAccount = async (ownerAddress: string) => {
    if (!signer) throw new Error("Signer not available. Connect wallet first.");

    const factoryContract = new ethers.Contract(SIMPLE_ACCOUNT_FACTORY_ADDRESS, SIMPLE_ACCOUNT_FACTORY_ABI, signer);
    
    try {
        // Using getAddress with salt 0 to predict the smart account address
        const predictedAddress = await factoryContract.getAddress(ownerAddress, 0);
        const code = await getProvider().getCode(predictedAddress);

        if (code === "0x" || code === "0x0") { // Not deployed
            console.log(`Smart account for ${ownerAddress} not found at ${predictedAddress}, creating...`);
            const tx = await factoryContract.createAccount(ownerAddress, ENTRY_POINT_ADDRESS);
            const receipt = await tx.wait();
            console.log("Smart account creation transaction:", receipt.transactionHash);
            const event = receipt.events?.find((e: any) => e.event === "AccountCreated");
            if (event && event.args && event.args.account) {
                console.log("Smart account created at:", event.args.account);
                if (event.args.account.toLowerCase() !== predictedAddress.toLowerCase()) {
                    console.warn("Predicted address does not match created address. Check factory logic.");
                    return event.args.account; // Return the actual created address
                }
                return predictedAddress;
            }
            throw new Error("Smart account creation failed or address not found in event.");
        } else {
            console.log(`Smart account for ${ownerAddress} already exists at ${predictedAddress}`);
            return predictedAddress;
        }
    } catch (error) {
        console.error("Error getting or creating smart account:", error);
        throw error;
    }
};

export const sendProxiedRequestViaEntryPoint = async (smartAccountAddress: string, targetUrl: string) => {
    if (!signer || !provider) throw new Error("Signer/Provider not available. Connect wallet first.");

    const entryPointContract = new ethers.Contract(ENTRY_POINT_ADDRESS, ENTRY_POINT_ABI, signer);
    const smartAccountInterface = new ethers.utils.Interface([
        "function execute(address dest, uint256 value, bytes calldata func)"
    ]);

    // Encode the callData for the SmartAccount.execute() function, which will call the ForwardingProxy
    const innerCallData = new ethers.utils.Interface(FORWARDING_PROXY_ABI).encodeFunctionData("execute", [
        "0x000000000000000000000000000000000000dEaD", // Placeholder target for the proxy, replace if needed
        0, 
        ethers.utils.defaultAbiCoder.encode(["string"], [targetUrl]) 
    ]);

    const callDataForSmartAccount = smartAccountInterface.encodeFunctionData("execute", [
        FORWARDING_PROXY_ADDRESS, // Smart Account calls the ForwardingProxy
        0,                        // Value (ETH)
        innerCallData             // The call data for ForwardingProxy.execute()
    ]);

    const userOp = {
        sender: smartAccountAddress,
        nonce: await entryPointContract.getNonce(smartAccountAddress, 0), 
        initCode: "0x", 
        callData: callDataForSmartAccount, 
        callGasLimit: 500000, 
        verificationGasLimit: 400000, 
        preVerificationGas: 100000, 
        maxFeePerGas: ethers.utils.parseUnits("10", "gwei"), 
        maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"), 
        paymasterAndData: PAYMASTER_ADDRESS, 
        signature: "0x"
    };

    const userOpHash = await entryPointContract.getUserOpHash(userOp);
    const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
    userOp.signature = signature;

    try {
        console.log("Sending UserOperation:", userOp);
        const tx = await entryPointContract.handleOps([userOp], await signer.getAddress()); 
        const receipt = await tx.wait();
        console.log("UserOperation sent, transaction receipt:", receipt);
        // Look for UserOperationEvent to confirm success
        const event = receipt.events?.find((e: any) => e.event === "UserOperationEvent" && e.args.userOpHash === userOpHash);
        if (event && event.args) {
            console.log("UserOperationEvent:", event.args);
            if (!event.args.success) {
                throw new Error(`UserOperation failed. Success: ${event.args.success}`);
            }
        }
        return receipt;
    } catch (error) {
        console.error("Error sending UserOperation:", error);
        throw error;
    }
};

