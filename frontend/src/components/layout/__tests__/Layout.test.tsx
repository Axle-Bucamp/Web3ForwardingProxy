import { render, screen } from "@testing-library/react";
import Layout from "@/components/layout/Layout";
import '@testing-library/jest-dom';

// Mock next/router for Link components if not already handled globally
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
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

describe("Layout Component", () => {
  it("renders Header, children, and Footer", () => {
    render(<Layout><div>Test Child</div></Layout>);
    // Check for Header presence (e.g., by a unique text from Header)
    expect(screen.getByText("SKALE Web3 Proxy")).toBeInTheDocument(); 
    // Check for children
    expect(screen.getByText("Test Child")).toBeInTheDocument();
    // Check for Footer presence (e.g., by a unique text from Footer)
    expect(screen.getByText(/© \d{4} SKALE Web3 Proxy. All rights reserved./i)).toBeInTheDocument();
  });
});

