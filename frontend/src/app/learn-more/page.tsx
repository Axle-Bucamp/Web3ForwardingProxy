// Placeholder for Learn More page
export default function LearnMorePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Learn More About SKALE Web3 Proxy</h1>
      <p className="text-gray-300 mb-4">
        Discover how our platform leverages SKALE Network and Account Abstraction to provide a secure and anonymous browsing experience.
      </p>
      <h2 className="text-2xl font-semibold mb-2">Account Abstraction</h2>
      <p className="text-gray-300 mb-4">
        Account abstraction allows for smart contract wallets that can be controlled by users without needing to manage private keys directly in the traditional sense. This enables features like gas sponsoring (where the dApp pays for gas), social recovery, and more complex transaction logic, all while providing a smoother user experience.
      </p>
      <h2 className="text-2xl font-semibold mb-2">SKALE Network & sFUEL</h2>
      <p className="text-gray-300 mb-4">
        SKALE is an Ethereum-compatible network of elastic blockchains. It offers high throughput, low latency, and zero gas fees for end-users through its sFUEL mechanism. This makes it ideal for applications requiring frequent transactions or a seamless user experience without gas cost concerns.
      </p>
      <h2 className="text-2xl font-semibold mb-2">How Our Proxy Works</h2>
      <p className="text-gray-300">
        Our Web3 Proxy routes your internet requests through a decentralized system built on SKALE. Your interactions are managed by smart contracts, enhancing your privacy and security. The dApp sponsors the transaction fees (sFUEL), so you can use the service without worrying about gas.
      </p>
      {/* TODO: Add more detailed explanations, diagrams, etc. */}
    </div>
  );
}

