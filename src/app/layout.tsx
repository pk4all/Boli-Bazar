import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Boli Bazar — Live Bulk Auctions for Retailers",
  description:
    "India's #1 B2B auction platform for retailers. Bid on bulk lots of mobiles, electronics, and fashion. Price increases by 1% after every purchase — act fast!",
  keywords: "bulk auction, bulk lot, B2B, retailers, India, electronics, mobiles",
  openGraph: {
    title: "Boli Bazar — Live Bulk Auctions for Retailers",
    description: "The longer you wait, the higher the price. Bid now on live bulk lots.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dc2626" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
