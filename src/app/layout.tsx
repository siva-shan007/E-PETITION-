import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AccessibilityPanel } from "@/components/shared/AccessibilityPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "e-Petition Portal – MLA Office",
  description: "Digital e-Petition & Constituency Management Portal for paperless governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gov-bg text-gov-text font-sans">
        <Providers>
          <div className="flex-1 flex flex-col pb-10">
            {children}
          </div>
          {/* Floating accessibility controller */}
          <AccessibilityPanel />
        </Providers>
      </body>
    </html>
  );
}
