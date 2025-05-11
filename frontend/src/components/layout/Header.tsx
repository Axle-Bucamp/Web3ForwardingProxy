import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          SKALE Web3 Proxy
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-gray-300">Home</Link>
          <Link href="/proxy" className="hover:text-gray-300">Proxy</Link>
          <Link href="/settings" className="hover:text-gray-300">Settings</Link>
          {/* TODO: Add Login/Logout Button here based on auth state */}
        </div>
      </nav>
    </header>
  );
};

export default Header;

