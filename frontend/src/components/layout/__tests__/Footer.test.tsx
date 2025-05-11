import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";
import '@testing-library/jest-dom';

describe("Footer Component", () => {
  it("renders the footer text", () => {
    render(<Footer />);
    expect(screen.getByText(/© \d{4} SKALE Web3 Proxy. All rights reserved./i)).toBeInTheDocument();
  });
});

