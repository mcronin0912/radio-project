import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PWARegister } from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Australian Radio Hub",
  description: "Discover and listen to Australian community radio stations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Radio Hub",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased pb-20">
        <PlayerProvider>
          {children}
          <PlayerBar />
        </PlayerProvider>
        <PWARegister />
      </body>
    </html>
  );
}
