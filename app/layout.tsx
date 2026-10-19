import type { Metadata } from "next";
import "./globals.css";
import "./silver.css";

export const metadata: Metadata = {
  title: "SSJ Estimation | Silver Jewellery POS",
  description: "Silver jewellery and bullion estimation, billing and customer ledger workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
