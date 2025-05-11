import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as a common, clean font
import "./globals.css";
import Layout from "@/components/layout/Layout"; // Import the custom Layout component

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SKALE Web3 Proxy - Secure & Anonymous",
  description: "Experience secure and anonymous web interactions with the SKALE Web3 Proxy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-inter antialiased">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

