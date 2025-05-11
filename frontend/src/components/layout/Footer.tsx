const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 text-center">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} SKALE Web3 Proxy. All Rights Reserved.</p>
        <p className="text-sm text-gray-400 mt-1">
          Providing secure and anonymous web interactions.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

