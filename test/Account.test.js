const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// Helper to convert string to bytes32, if needed for some parameters
function stringToBytes32(str) {
    let bytes = ethers.toUtf8Bytes(str);
    if (bytes.length > 32) { throw new Error("string too long"); }
    return ethers.hexlify(ethers.concat([bytes, ethers.ZeroHash])).slice(0, 66);
}

describe("Account Abstraction Contracts", function () {
    // We define a fixture to reuse the same setup in every test.
    async function deployContractsFixture() {
        // Get signers
        const [owner, user1, user2, bundler, otherAccount] = await ethers.getSigners();

        // Deploy the EntryPoint contract
        const EntryPointFactory = await ethers.getContractFactory("@account-abstraction/contracts/core/EntryPoint.sol:EntryPoint", owner);
        const entryPoint = await EntryPointFactory.deploy(); 

        // Deploy our SimpleAccountFactory
        const SimpleAccountFactoryFactory = await ethers.getContractFactory("SimpleAccountFactory", owner);
        const simpleAccountFactory = await SimpleAccountFactoryFactory.deploy(entryPoint.target);

        // Deploy Paymaster
        const PaymasterFactory = await ethers.getContractFactory("Paymaster", owner);
        const paymaster = await PaymasterFactory.deploy(entryPoint.target);

        // Pre-fund the paymaster by calling its deposit function and also directly depositing into EntryPoint for it
        await paymaster.connect(owner).deposit(ethers.parseEther("2"), { value: ethers.parseEther("2") }); 
        await entryPoint.connect(owner).depositTo(paymaster.target, { value: ethers.parseEther("2") });

        return { entryPoint, simpleAccountFactory, paymaster, owner, user1, user2, bundler, otherAccount };
    }

    describe("SimpleAccountFactory", function () {
        it("Should deploy SimpleAccountFactory and set the correct EntryPoint for accounts", async function () {
            const { simpleAccountFactory, entryPoint } = await loadFixture(deployContractsFixture);
            expect(await simpleAccountFactory.entryPointForAccounts()).to.equal(entryPoint.target);
        });

        it("Should allow owner to create a new SimpleAccount", async function () {
            const { simpleAccountFactory, user1, entryPoint } = await loadFixture(deployContractsFixture);
            
            const tx = await simpleAccountFactory.connect(user1).createAccount(user1.address);
            const receipt = await tx.wait();
            let createdAccountAddress;
            
            const accountCreatedFilter = simpleAccountFactory.filters.AccountCreated();
            const log = receipt.logs.find(l => l.topics[0] === accountCreatedFilter.fragment.topicHash); // Use fragment.topicHash
            expect(log).to.not.be.undefined;
            const decodedEvent = simpleAccountFactory.interface.parseLog({ topics: log.topics, data: log.data });
            createdAccountAddress = decodedEvent.args.account;
            
            expect(createdAccountAddress).to.not.be.undefined;
            expect(await ethers.provider.getCode(createdAccountAddress)).to.not.equal("0x");
            
            expect(decodedEvent.args.account).to.equal(createdAccountAddress);
            expect(decodedEvent.args.owner).to.equal(user1.address);
            expect(decodedEvent.args.entryPoint).to.equal(entryPoint.target);
        });

        it("Should create a SimpleAccount with the correct owner", async function () {
            const { simpleAccountFactory, user1 } = await loadFixture(deployContractsFixture);
            const tx = await simpleAccountFactory.connect(user1).createAccount(user1.address);
            const receipt = await tx.wait();
            const accountCreatedFilter = simpleAccountFactory.filters.AccountCreated();
            const log = receipt.logs.find(l => l.topics[0] === accountCreatedFilter.fragment.topicHash);
            const decodedEvent = simpleAccountFactory.interface.parseLog({ topics: log.topics, data: log.data });
            const createdAccountAddress = decodedEvent.args.account;

            const simpleAccount = await ethers.getContractAt("SimpleAccount", createdAccountAddress);
            expect(await simpleAccount.owner()).to.equal(user1.address);
        });
    });

    describe("SimpleAccount (and ForwardingProxy)", function () {
        async function deploySimpleAccountFixture() {
            const { entryPoint, simpleAccountFactory, paymaster, owner, user1, bundler, otherAccount } = await loadFixture(deployContractsFixture);
            const tx = await simpleAccountFactory.connect(user1).createAccount(user1.address);
            const receipt = await tx.wait();
            const accountCreatedFilter = simpleAccountFactory.filters.AccountCreated();
            const log = receipt.logs.find(l => l.topics[0] === accountCreatedFilter.fragment.topicHash);
            const decodedEvent = simpleAccountFactory.interface.parseLog({ topics: log.topics, data: log.data });
            const accountAddress = decodedEvent.args.account;
            const simpleAccount = await ethers.getContractAt("SimpleAccount", accountAddress);
            
            await owner.sendTransaction({ to: accountAddress, value: ethers.parseEther("1") });

            return { entryPoint, simpleAccountFactory, paymaster, owner, user1, bundler, simpleAccount, accountAddress, otherAccount };
        }

        it("Should have the correct owner and entryPoint", async function () {
            const { simpleAccount, user1, entryPoint } = await loadFixture(deploySimpleAccountFixture);
            expect(await simpleAccount.owner()).to.equal(user1.address);
            expect(await simpleAccount.entryPoint()).to.equal(entryPoint.target);
        });

        it("Should allow owner to execute a simple transfer via SimpleAccount directly", async function () {
            const { simpleAccount, user1, otherAccount } = await loadFixture(deploySimpleAccountFixture);
            const targetAddress = otherAccount.address; 
            const transferAmount = ethers.parseEther("0.1");

            await expect(simpleAccount.connect(user1).execute(targetAddress, transferAmount, "0x"))
                .to.changeEtherBalances([simpleAccount, otherAccount], [ethers.parseEther("-0.1"), transferAmount]);
        });
    });

    describe("Paymaster", function () {
        it("Should be deployed and funded", async function () {
            const { paymaster, entryPoint } = await loadFixture(deployContractsFixture);
            expect(await paymaster.entryPoint()).to.equal(entryPoint.target);
            expect(await paymaster.getDeposit()).to.be.gt(0); 
            const depositInfo = await entryPoint.getDepositInfo(paymaster.target);
            expect(depositInfo.deposit).to.be.gt(0); 
        });
    });

    describe("EntryPoint Interaction (Simplified UserOp)", function() {
        it("Should allow a sponsored transaction via Paymaster for SimpleAccount", async function() {
            const { entryPoint, simpleAccountFactory, paymaster, owner, user1, bundler, otherAccount } = await loadFixture(deployContractsFixture);

            const txCreate = await simpleAccountFactory.connect(user1).createAccount(user1.address);
            const receiptCreate = await txCreate.wait();
            const accountCreatedFilter = simpleAccountFactory.filters.AccountCreated();
            const logCreate = receiptCreate.logs.find(l => l.topics[0] === accountCreatedFilter.fragment.topicHash);
            const decodedEventCreate = simpleAccountFactory.interface.parseLog({ topics: logCreate.topics, data: logCreate.data });
            const accountAddress = decodedEventCreate.args.account;
            const simpleAccount = await ethers.getContractAt("SimpleAccount", accountAddress);

            const target = otherAccount.address;
            const value = ethers.parseEther("0"); 
            const callDataForSAExecute = simpleAccount.interface.encodeFunctionData("execute", [target, value, "0x"]);

            const userOp = {
                sender: accountAddress,
                nonce: await entryPoint.getNonce(accountAddress, 0),
                initCode: "0x",
                callData: callDataForSAExecute,
                callGasLimit: 200000n,
                verificationGasLimit: 400000n, 
                preVerificationGas: 50000n,
                maxFeePerGas: ethers.parseUnits("10", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
                paymasterAndData: paymaster.target,
                signature: "0x"
            };

            const userOpHash = await entryPoint.getUserOpHash(userOp);
            const signature = await user1.signMessage(ethers.getBytes(userOpHash));
            userOp.signature = signature;

            const tx = await entryPoint.connect(bundler).handleOps([userOp], bundler.address, { gasLimit: 1000000n });
            const receipt = await tx.wait();
            
            let opEvent;
            const userOperationEventFilter = entryPoint.filters.UserOperationEvent();
            const logOp = receipt.logs.find(l => l.topics[0] === userOperationEventFilter.fragment.topicHash);
            expect(logOp).to.not.be.undefined;
            const decodedOpEvent = entryPoint.interface.parseLog({ topics: logOp.topics, data: logOp.data });
            opEvent = decodedOpEvent;
            
            expect(opEvent).to.not.be.undefined;
            expect(opEvent.args.success).to.be.true;
            
            expect(await entryPoint.getNonce(accountAddress, 0)).to.equal(BigInt(userOp.nonce) + 1n);
        });
    });
});

