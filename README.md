
# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

---

## 🔒 Limitation

This project is designed as a forwarding proxy using **Account Abstraction (ERC-4337)** and supports **Chainlink Functions** to forward HTTP-like data to external APIs. While this allows smart contracts to operate like HTTP clients, there are current limitations:

* **Chainlink External Functions** must be correctly implemented and authorized, requiring an oracle and off-chain computation layer.
* The forwarding process is asynchronous and may involve latency or data size limits imposed by Chainlink.
* **IP obfuscation** is an advantage of this architecture: since the request is routed through an oracle, the **originating user’s IP address is hidden**, improving privacy and resistance to tracking or censorship.

---

## 💰 Cost on SKALE Network

This project is optimized for use on the **SKALE Network**, a gasless EVM-compatible blockchain. Key cost considerations:

* **End-User Gas**: \$0. All gas costs are abstracted away from the user thanks to SKALE's zero-gas fee model using `sFUEL`.
* **Developer Cost**: You pay a **flat monthly fee (\~\$833 for a small chain)** to host your dApp chain.
* **Chainlink Function Calls**: Estimated at **\$0.02–\$0.03 per API call**. With 30 calls per day, expect a monthly off-chain compute cost of **\$18–\$27**.

📌 **Total monthly operating cost**: approximately **\$850/month**, including oracle services and chain hosting.

---

## ✅ TODO

* [ ] Correct generated Solidity code for edge cases
* [ ] Thoroughly test meta-transaction and API forwarding functionality
* [ ] Finish Chainlink Functions implementation
* [ ] Optimize for gasless interactions and minimal off-chain compute load
* [ ] Set up an off-chain proxy server for enhanced routing and debugging

---

## 🤝 Contribute

Contributions are welcome!

1. Fork the repository
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

All contributions must be tested and aligned with the goals of gasless, private-forwarded smart contract interaction.

---

## 📝 License

This project is licensed under the **MIT License**, which allows open use, distribution, modification, and sublicensing while giving credit to the original creator.

---

