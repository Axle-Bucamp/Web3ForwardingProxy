import { render, screen } from "@testing-library/react";
import Header from "@/components/layout/Header";
import '@testing-library/jest-dom';

describe("Header Component", () => {
  it("renders navigation links", () => {
    render(<Header />);
    expect(screen.getByText("SKALE Web3 Proxy")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Proxy")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Learn More")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});

