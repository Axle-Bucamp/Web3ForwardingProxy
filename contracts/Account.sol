// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./external/@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./external/@account-abstraction/contracts/interfaces/IAccount.sol";
import "./external/@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "./external/@account-abstraction/contracts/interfaces/UserOperation.sol"; // Explicitly import UserOperation

contract ForwardingProxy is Ownable {
    event Forwarded(address indexed destination, uint256 value, bytes data, bool success); 
    // use external function and api call to forward poxy using chain link method

    receive() external payable {}

    // Corrected Ownable constructor for OpenZeppelin v4.x
    constructor() Ownable() {}

    function execute(address dest, uint256 value, bytes calldata func) external onlyOwner returns (bytes memory) {
        (bool success, bytes memory result) = dest.call{value: value}(func);
        emit Forwarded(dest, value, func, success);
        require(success, "ForwardingProxy: execution failed");
        return result;
    }

    // This method gets triggered by Chainlink with user data
    function receiveOffchainData(bytes calldata result) external {
        require(msg.sender == chainlinkOracleAddress, "Not authorized");

        // Decode result (e.g., user agent string, session ID, payload)
        (string memory userAgent, string memory session, bytes memory apiData) = abi.decode(result, (string, string, bytes));

        // Forward data to intended dApp smart contract
        address destination = resolveDestination(userAgent, session); // you define logic
        execute(destination, 0, apiData);
    }
}

contract SimpleAccount is IAccount {
    address public owner;
    IEntryPoint public immutable entryPoint;

    constructor(address _owner, address _entryPointAddress) {
        owner = _owner;
        entryPoint = IEntryPoint(_entryPointAddress);
    }

    // onlyOwner modifier is removed from execute as EntryPoint will be the caller
    function execute(address dest, uint256 value, bytes calldata func) external {
        (bool success, ) = dest.call{value: value}(func);
        require(success, "SimpleAccount: execution failed");
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == address(entryPoint), "SimpleAccount: caller must be EntryPoint");
        require(userOp.sender == address(this), "SimpleAccount: Mismatched sender in UserOp");

        bytes32 hash = entryPoint.getUserOpHash(userOp);
        require(userOpHash == hash, "SimpleAccount: Invalid userOpHash");
        
        bytes32 EIP191Hash = ECDSA.toEthSignedMessageHash(userOpHash);
        address recoveredSigner = ECDSA.recover(EIP191Hash, userOp.signature);
        require(recoveredSigner == owner, "SimpleAccount: Invalid signature");

        if (missingAccountFunds > 0) {
            return 1; // SIG_VALIDATION_FAILED is 1 as per IAccount.sol comments
        }
        return 0; 
    }

    receive() external payable {}
    fallback() external payable {}
}

contract SimpleAccountFactory {
    event AccountCreated(address indexed account, address indexed owner, address indexed entryPoint);
    IEntryPoint public immutable entryPointForAccounts;

    constructor(address _entryPointForAccounts) {
        entryPointForAccounts = IEntryPoint(_entryPointForAccounts);
    }

    function createAccount(address _owner) public returns (address accountAddress) {
        SimpleAccount account = new SimpleAccount(_owner, address(entryPointForAccounts));
        accountAddress = address(account);
        emit AccountCreated(accountAddress, _owner, address(entryPointForAccounts));
        return accountAddress;
    }

    function getAddress(address _owner, uint256 salt) public view returns (address) {
        bytes32 bytecodeHash = keccak256(type(SimpleAccount).creationCode);
        bytes32 saltBytes = bytes32(salt);
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            saltBytes,
            bytecodeHash
        )))));
    }
}

contract Paymaster is IPaymaster {
    IEntryPoint public immutable entryPoint;
    address public immutable paymasterOwner;
    mapping(address => bool) public sponsoredDApps;

    constructor(address _entryPointAddress) {
        entryPoint = IEntryPoint(_entryPointAddress);
        paymasterOwner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == paymasterOwner, "Paymaster: not owner");
        _;
    }

    function addSponsoredDApp(address dAppContractAddress) external onlyOwner {
        sponsoredDApps[dAppContractAddress] = true;
    }

    function removeSponsoredDApp(address dAppContractAddress) external onlyOwner {
        sponsoredDApps[dAppContractAddress] = false;
    }

    function getDeposit() public view returns (uint256) {
        return entryPoint.getDepositInfo(address(this)).deposit;
    }

    function deposit(uint256 amount) public payable onlyOwner {
        entryPoint.depositTo{value: amount}(address(this));
    }

    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == address(entryPoint), "Paymaster: caller must be EntryPoint");
        return (bytes(""), 0);
    }

    // Corrected postOp signature to match IPaymaster interface
    function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) external override {
        require(msg.sender == address(entryPoint), "Paymaster: caller must be EntryPoint");
    }

    receive() external payable {}
}

