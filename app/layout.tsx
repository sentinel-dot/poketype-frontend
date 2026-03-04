import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pokétype – Typ-Stärken & Schwächen",
  description:
    "Finde Typ-Stärken, Schwächen und Matchups für alle Pokémon in allen Generationen.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060d1f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
