import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";

import { AuthProvider } from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import "./globals.css";

const headingFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading"
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}