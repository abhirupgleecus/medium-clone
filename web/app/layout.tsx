import type { Metadata } from "next";
import { Merriweather, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

import "./globals.css";

const headingFont = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading"
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "InkWell",
  description: "A Medium-style publishing frontend in Next.js"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <AuthProvider>
          <div className="site-shell">
            <Navbar />
            <main className="page-wrap">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}