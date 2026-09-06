import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import { FavouritesProvider } from "@/lib/favourites-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PWARegister } from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Australian Radio Hub",
  description: "Discover and listen to Australian community radio stations",
  manifest: `${BASE}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Radio Hub",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {BASE ? (
          <meta
            httpEquiv="Content-Security-Policy"
            content="upgrade-insecure-requests"
          />
        ) : null}
      </head>
      <body className="bg-background font-sans text-foreground antialiased pb-20">
        <ThemeProvider>
          <PlayerProvider>
            <FavouritesProvider>
              {children}
              <PlayerBar />
            </FavouritesProvider>
          </PlayerProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
