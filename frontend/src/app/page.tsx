import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
        Welcome to the SKALE Web3 Proxy
      </h1>
      <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl">
        Experience a new era of web interaction. Our platform leverages SKALE's cutting-edge blockchain technology to provide you with enhanced security, privacy, and anonymity online.
      </p>
      <div className="space-y-4 sm:space-y-0 sm:space-x-4">
        <Link href="/proxy"
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
          Start Proxied Browsing
        </Link>
        <Link href="/learn-more"
          className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out">
          Learn More
        </Link>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-700 w-full max-w-3xl">
        <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
        <ul className="list-none space-y-3 text-gray-400">
          <li>✓ Account Abstraction for seamless user experience</li>
          <li>✓ Gas fees sponsored by the dApp on SKALE Network</li>
          <li>✓ Enhanced privacy through decentralized proxy</li>
          <li>✓ Secure interactions shielded by blockchain technology</li>
        </ul>
      </div>
    </div>
  );
}

