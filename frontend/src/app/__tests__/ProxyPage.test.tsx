import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProxyPage from "@/app/proxy/page";
import Web3Service from "@/services/web3Service";
import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/proxy',
      pathname: '/proxy',
      query: '',
      asPath: '/proxy',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn()
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null)
    };
  }
}));

// Mock Web3Service
let mockIsLoggedInProxy = true;
let mockUserAddressProxy = '0x1234567890123456789012345678901234567890';
let mockAccountAddressProxy = '0x0987654321098765432109876543210987654321';
let mockHandleUserOpResultProxy = { success: true, transactionHash: '0xtestHash123' };

const mockWeb3ServiceProxyImplementation = () => ({
    isLoggedIn: jest.fn(() => mockIsLoggedInProxy),
    getUserAddress: jest.fn(() => mockUserAddressProxy),
    getAccountAddress: jest.fn(() => Promise.resolve(mockAccountAddressProxy)),
    handleUserOperation: jest.fn(() => Promise.resolve(mockHandleUserOpResultProxy)),
    // Ensure all methods used by the component are mocked, even if not directly in tests
    initWeb3Auth: jest.fn(() => Promise.resolve()),
    login: jest.fn(() => Promise.resolve({})),
    logout: jest.fn(() => Promise.resolve()),
});

jest.mock('@/services/web3Service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(mockWeb3ServiceProxyImplementation)
}));


// Mock Web3Auth for LoginPage, though not directly used here, good practice if there are shared contexts
const mockWeb3Auth = {
  provider: {},
  initModal: jest.fn(),
  connect: jest.fn(() => Promise.resolve({ provider: {} })),
  logout: jest.fn(() => Promise.resolve()),
  getUserInfo: jest.fn(() => Promise.resolve({ email: "test@example.com", name: "Test User" })),
};

jest.mock('@web3auth/modal', () => ({
  Web3Auth: jest.fn(() => mockWeb3Auth)
}));

describe("ProxyPage Component", () => {
  let mockWeb3ServiceInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoggedInProxy = true; // Default to logged in for most tests
    mockHandleUserOpResultProxy = { success: true, transactionHash: '0xtestHash123' }; // Reset to default success

    mockWeb3ServiceInstance = mockWeb3ServiceProxyImplementation();
    Web3Service.mockImplementation(() => mockWeb3ServiceInstance);
  });

  it("renders the proxy form and elements when logged in", () => {
    render(<ProxyPage />);
    expect(screen.getByRole("heading", { name: /SKALE Web3 Proxy Service/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter URL to proxy/i)).toBeInTheDocument();
    // The button text changes based on loading state, so we find by a more general role or partial text
    expect(screen.getByRole("button", { name: /Proxy Request/i })).toBeInTheDocument();
  });

  it("allows user to type into the URL input", () => {
    render(<ProxyPage />);
    const urlInput = screen.getByPlaceholderText(/Enter URL to proxy/i);
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    expect(urlInput.value).toBe("https://example.com");
  });

  it("calls handleUserOperation on form submission with valid URL", async () => {
    render(<ProxyPage />);
    const urlInput = screen.getByPlaceholderText(/Enter URL to proxy/i);
    const submitButton = screen.getByRole("button", { name: /Proxy Request/i });

    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockWeb3ServiceInstance.handleUserOperation).toHaveBeenCalledTimes(1);
      expect(mockWeb3ServiceInstance.handleUserOperation).toHaveBeenCalledWith(
        mockAccountAddressProxy, // accountAddress
        expect.any(String), // target (ForwardingProxy address - this will be hardcoded or from env)
        0, // value
        expect.any(String) // callData for ForwardingProxy.execute
      );
    });
    expect(await screen.findByText(/Transaction successful! Hash: 0xtestHash123/i)).toBeInTheDocument();
  });

  it("shows an error message if URL is invalid", async () => {
    render(<ProxyPage />);
    const urlInput = screen.getByPlaceholderText(/Enter URL to proxy/i);
    const submitButton = screen.getByRole("button", { name: /Proxy Request/i });

    fireEvent.change(urlInput, { target: { value: "invalid-url" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Please enter a valid URL/i)).toBeInTheDocument();
    expect(mockWeb3ServiceInstance.handleUserOperation).not.toHaveBeenCalled();
  });

  it("shows an error message if handleUserOperation fails", async () => {
    mockHandleUserOpResultProxy = { success: false, error: "UserOp failed" };
    mockWeb3ServiceInstance.handleUserOperation.mockResolvedValueOnce(mockHandleUserOpResultProxy);

    render(<ProxyPage />);
    const urlInput = screen.getByPlaceholderText(/Enter URL to proxy/i);
    const submitButton = screen.getByRole("button", { name: /Proxy Request/i });

    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockWeb3ServiceInstance.handleUserOperation).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/Error processing transaction: UserOp failed/i)).toBeInTheDocument();
  });

   it("displays user and account addresses if logged in", async () => {
    render(<ProxyPage />);
    expect(await screen.findByText(/Your EOA: 0x12345...567890/i)).toBeInTheDocument();
    expect(await screen.findByText(/Smart Account: 0x09876...54321/i)).toBeInTheDocument();
  });

  it("prompts to login if not logged in", async () => {
    mockIsLoggedInProxy = false;
    // Re-initialize the mock with isLoggedIn returning false
    mockWeb3ServiceInstance.isLoggedIn.mockReturnValue(false);
    render(<ProxyPage />);
    // Updated text to match actual component output
    expect(await screen.findByText(/Wallet Not Connected:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please connect your wallet on the Login page to use the proxy service./i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Enter URL to proxy/i)).not.toBeInTheDocument();
  });

});

