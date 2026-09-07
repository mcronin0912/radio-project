import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import { FavouritesProvider } from "@/lib/favourites-context";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PWARegister } from "@/components/PWARegister";
import { DesktopDragRegion } from "@/components/DesktopDragRegion";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-variable",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-berkeley-mono",
  display: "swap",
  weight: "400",
});

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const IS_DESKTOP = process.env.NEXT_PUBLIC_DESKTOP === "1";

export const metadata: Metadata = {
  title: "Radio Project",
  description: "Discover and listen to Australian commercial and community radio stations",
  manifest: `${BASE}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Radio Project",
  },
  icons: {
    icon: [
      { url: `${BASE}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: `${BASE}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <head>
        {BASE ? (
          <meta
            httpEquiv="Content-Security-Policy"
            content="upgrade-insecure-requests"
          />
        ) : null}
      </head>
      <body
        className={`bg-void font-sans text-mist antialiased pb-24${
          IS_DESKTOP ? " pt-[52px]" : ""
        }`}
      >
        {IS_DESKTOP ? <DesktopDragRegion /> : null}
        <PlayerProvider>
          <FavouritesProvider>
            {children}
            <PlayerBar />
          </FavouritesProvider>
        </PlayerProvider>
        <PWARegister />
      </body>
    </html>
  );
}
