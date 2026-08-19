import type { Metadata } from "next";
import { Albert_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// ERCoffeeLab Admin Panel Root Layout


const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ERCoffeeLab Admin Panel",
  description: "Executive Management & Operations Panel for ERCoffeeLab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${albertSans.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-source bg-mist text-ink-1">
        {children}
      </body>
    </html>
  );
}
