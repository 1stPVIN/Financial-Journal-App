import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { SupabaseProvider } from "@/components/SupabaseProvider";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Financial Book",
  description: "A personal financial ledger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased transition-colors duration-300`}
      >
        <LanguageProvider>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
