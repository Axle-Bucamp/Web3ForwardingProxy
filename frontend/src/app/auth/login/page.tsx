"use client";

import { useEffect, useState } from 'react';
import { initWeb3Auth, connectWallet, disconnectWallet, getSignerAddress } from '@/services/web3Service'; // Updated import
import { Web3Auth } from "@web3auth/modal"; // Keep for type if needed, or remove if web3Service abstracts it fully
import { SafeEventEmitterProvider } from "@web3auth/base";

// IMPORTANT: The Web3Auth Client ID is now managed within web3Service.ts
// However, the service itself will use the placeholder. Remind user to update it there.

export default function LoginPage() {
  // const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null); // Managed by service
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null); // Web3Auth provider, might differ from ethers provider
  const [loggedIn, setLoggedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [web3AuthClientIDMissing, setWeb3AuthClientIDMissing] = useState(false);

  useEffect(() => {
    const initializeAndCheckLogin = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const web3authInstance = await initWeb3Auth();
        if (!web3authInstance) {
          // Check if the error is due to missing client ID from the service
          if (typeof window !== "undefined" && (window as any)._web3auth_client_id_missing) {
            setError("Web3Auth Client ID is missing. Please ask the developer to configure it in web3Service.ts.");
            setWeb3AuthClientIDMissing(true);
            (window as any)._web3auth_client_id_missing = false; // Reset flag
          } else {
            setError("Failed to initialize Web3Auth. Check console for details.");
          }
          setIsLoading(false);
          return;
        }

        if (web3authInstance.provider) {
          setProvider(web3authInstance.provider);
          setLoggedIn(true);
          const address = await getSignerAddress();
          setUserAddress(address);
        } else {
          // Check if client ID was the issue during init
          const storedClientId = (web3authInstance as any).options?.clientId;
          if (!storedClientId || storedClientId === "YOUR_WEB3AUTH_CLIENT_ID_GOES_HERE") {
             setError("Web3Auth Client ID is missing. Please ask the developer to configure it in web3Service.ts.");
             setWeb3AuthClientIDMissing(true);
          }
        }
      } catch (err: any) {
        console.error("Error during initial Web3Auth setup:", err);
        setError(`Initialization Error: ${err.message || "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAndCheckLogin();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const connection = await connectWallet();
      if (connection && connection.signer) {
        // The provider from Web3Auth (for UI state) might be different from ethers provider
        // For now, let's assume web3auth.provider is what we need for UI state if available
        const web3authInstance = await initWeb3Auth(); // Re-get instance to access its provider
        if(web3authInstance?.provider) setProvider(web3authInstance.provider);
        
        setLoggedIn(true);
        const address = await getSignerAddress();
        setUserAddress(address);
        console.log("Logged in successfully!");
      } else {
        throw new Error("Connection failed or signer not available.");
      }
    } catch (err: any) {
      console.error("Error during login:", err);
      setError(`Login failed: ${err.message || "Unknown error"}`);
       // Check if the error is due to missing client ID from the service
      if (typeof window !== "undefined" && (window as any)._web3auth_client_id_missing_on_connect) {
        setError("Login failed: Web3Auth Client ID is missing. Please ask the developer to configure it in web3Service.ts.");
        setWeb3AuthClientIDMissing(true);
        (window as any)._web3auth_client_id_missing_on_connect = false; // Reset flag
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await disconnectWallet();
      setProvider(null);
      setLoggedIn(false);
      setUserAddress(null);
      console.log("Logged out successfully!");
    } catch (err: any) {
      console.error("Error during logout:", err);
      setError(`Logout failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Login / Connect Wallet</h1>
      <p className="text-gray-300 mb-8 max-w-md text-center">
        Connect your wallet to access the SKALE Web3 Proxy. We use Web3Auth for a secure, embedded wallet experience.
      </p>
      
      {isLoading && (
        <div className="my-4 text-yellow-400 flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      )}

      {error && (
        <div className="my-4 bg-red-700 border border-red-900 text-white px-4 py-3 rounded-lg relative shadow-lg max-w-md w-full" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {web3AuthClientIDMissing && !error && (
        <div className="my-4 bg-yellow-600 border border-yellow-800 text-white px-4 py-3 rounded-lg relative shadow-lg max-w-md w-full" role="alert">
          <strong className="font-bold">Configuration Needed:</strong>
          <span className="block sm:inline ml-2">Please ask the developer to replace 'YOUR_WEB3AUTH_CLIENT_ID_GOES_HERE' with a valid Web3Auth Client ID in the web3Service.ts file to enable login functionality.</span>
        </div>
      )}

      {loggedIn ? (
        <div className="text-center p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <p className="text-green-400 mb-2 text-xl font-semibold">You are connected!</p>
          {userAddress && <p className="text-gray-300 mb-4 break-all">Wallet Address: {userAddress}</p>}
          <button 
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          disabled={isLoading || web3AuthClientIDMissing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect with Web3Auth
        </button>
      )}

      <div className="mt-10 p-6 bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-3 text-center">Why Web3Auth?</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-400">
          <li>Easy social logins (Google, Facebook, etc.) or email.</li>
          <li>Non-custodial: You control your keys.</li>
          <li>No browser extensions needed.</li>
          <li>Creates a smart contract wallet for advanced features like gas sponsoring.</li>
        </ul>
      </div>
    </div>
  );
}

