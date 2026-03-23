import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ParamparaChain — Sovereign Traceability Platform",
  description: "Blockchain-enabled supply chain traceability for indigenous artisan products. Track, verify, and ensure fair value distribution.",
  keywords: ["blockchain", "supply-chain", "traceability", "artisan", "hyperledger"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-gray-950 text-white font-sans">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
