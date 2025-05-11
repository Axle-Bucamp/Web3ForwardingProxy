"use client";

import { useState, useEffect } from "react";
import { getSignerAddress, getOrCreateSmartAccount, sendProxiedRequestViaEntryPoint, initWeb3Auth } from "@/services/web3Service";

export default function ProxyPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proxyResult, setProxyResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEOA, setUserEOA] = useState<string | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Ensure Web3Auth is initialized (especially on page load/refresh)
        await initWeb3Auth(); 
        const address = await getSignerAddress();
        setUserEOA(address);
        if (address) {
          // Optionally, try to get/create smart account on page load if user is already logged in
          // For now, we will do it on submit to make the flow clearer
        }
      } catch (err) {
        console.warn("User not immediately available or error fetching address:", err);
        // Not necessarily an error to display, could just mean user is not logged in
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setProxyResult(null);
    setError(null);

    if (!url.trim()) {
      setError("Please enter a URL.");
      setIsLoading(false);
      return;
    }

    try {
      new URL(url); // Basic URL validation
    } catch (_) {
      setError("Invalid URL format. Please include http:// or https://");
      setIsLoading(false);
      return;
    }

    if (!userEOA) {
      setError("Please connect your wallet first (on the Login page).");
      setIsLoading(false);
      return;
    }

    try {
      let currentSmartAccount = smartAccountAddress;
      if (!currentSmartAccount) {
        console.log("No smart account address found, attempting to get or create one...");
        currentSmartAccount = await getOrCreateSmartAccount(userEOA);
        setSmartAccountAddress(currentSmartAccount);
        console.log("Smart Account Address:", currentSmartAccount);
      }
      
      if (!currentSmartAccount) {
        throw new Error("Failed to get or create a smart account.");
      }

      console.log(`Submitting URL for proxy via Smart Account ${currentSmartAccount}: ${url}`);
      
      // The sendProxiedRequestViaEntryPoint function in web3Service.ts needs to be implemented
      // to correctly interact with your ForwardingProxy contract.
      // The current implementation in web3Service is a placeholder for the actual callData construction.
      const receipt = await sendProxiedRequestViaEntryPoint(currentSmartAccount, url);
      
      // Process receipt - this is highly dependent on what your contract returns or emits.
      // For now, we just log it and show a success message.
      console.log("Proxy request transaction receipt:", receipt);
      setProxyResult(`Successfully sent proxy request for: ${url}. Transaction hash: ${receipt.transactionHash}. Check console for details. Actual proxied content display would require further implementation based on contract events or off-chain data retrieval.`);

    } catch (apiError: any) {
      console.error("Proxy request failed:", apiError);
      setError(apiError.message || "Failed to proxy the request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-green-400">SKALE Web3 Proxy Service</h1>
      
      {!userEOA && (
        <div className="my-4 bg-yellow-600 border border-yellow-800 text-white px-4 py-3 rounded-lg relative shadow-lg max-w-md w-full mx-auto text-center">
          <strong className="font-bold">Wallet Not Connected:</strong>
          <span className="block sm:inline ml-2">Please connect your wallet on the Login page to use the proxy service.</span>
        </div>
      )}

      {userEOA && smartAccountAddress && (
         <div className="mb-4 text-center text-sm text-gray-400">
            <p>Using Smart Account: {smartAccountAddress}</p>
         </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 shadow-2xl rounded-lg p-6 sm:p-8 mb-8">
        <div className="mb-6">
          <label htmlFor="urlInput" className="block text-lg font-medium text-gray-300 mb-2">
            Enter URL to Proxy
          </label>
          <input
            type="url"
            id="urlInput"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition duration-150 ease-in-out"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !userEOA}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            "Proxy Request via Smart Account"
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-700 border border-red-900 text-white px-4 py-3 rounded-lg relative mb-6 shadow-lg" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {proxyResult && (
        <div className="bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-green-400">Proxy Result</h2>
          <div className="bg-gray-700 p-4 rounded-md text-gray-300 whitespace-pre-wrap break-all">
            {proxyResult}
          </div>
        </div>
      )}

      {!isLoading && !proxyResult && !error && userEOA && (
         <div className="text-center text-gray-500 mt-10">
            <p>Enter a URL above and click "Proxy Request" to send it via your smart account.</p>
            <p className="mt-2 text-sm">Your request will be routed through the SKALE decentralized proxy network, with gas fees sponsored by the dApp.</p>
        </div>
      )}
    </div>
  );
}

