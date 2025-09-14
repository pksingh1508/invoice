import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Invoice Generator - Professional Invoice Management",
  description: "Create, manage, and send professional invoices with ease. Generate PDF invoices and track payments."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SignedOut>
            <header className="border-b bg-white">
              <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Invoice Generator</h1>
                </div>
                <div className="flex items-center gap-4">
                  <SignInButton>
                    <button className="text-gray-700 hover:text-gray-900 font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="bg-blue-600 text-white rounded-lg font-medium text-sm px-4 py-2 hover:bg-blue-700 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </header>
          </SignedOut>
          
          <SignedIn>
            <Navigation />
          </SignedIn>
          
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
