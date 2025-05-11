import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page"; // Assuming this is the correct path to your HomePage component
import '@testing-library/jest-dom';

// Mock next/router for Link components
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

describe("HomePage Component", () => {
  it("renders the main heading and introductory text", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /Welcome to the SKALE Web3 Proxy/i })).toBeInTheDocument();
    expect(screen.getByText(/Experience enhanced privacy and security/i)).toBeInTheDocument();
    expect(screen.getByText(/Our platform leverages SKALE Network's unique architecture/i)).toBeInTheDocument();
  });

  it("renders key feature sections", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /Account Abstraction/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Gasless Transactions/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Enhanced Privacy/i })).toBeInTheDocument();
  });

  it("renders call to action buttons", () => {
    render(<HomePage />);
    // Updated link text to match the actual component
    expect(screen.getByRole("link", { name: /Start Proxying Now/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Learn More About SKALE & AA/i })).toBeInTheDocument();
  });
});

