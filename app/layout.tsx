import type { Metadata } from "next";
import { Inter } from "next/font/google"; // <-- Nur noch Inter importieren
import "./globals.css";
import { cn } from "@/lib/utils";

// Assignment-Vorgabe exakt umgesetzt
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Game Project",
  description: "Milanote Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}