import type { Metadata } from "next";
import localFont from "next/font/local";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PING",
  description: "Your team's second brain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
