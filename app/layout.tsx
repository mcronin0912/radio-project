import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";
import { FavouritesProvider } from "@/lib/favourites-context";
import { TvFavouritesProvider } from "@/lib/tv-favourites-context";
import { ProjectModeProvider } from "@/lib/project-mode-context";
import { PlayerBar } from "@/components/player/PlayerBar";
import { TvChannelModalHost } from "@/components/channels/TvChannelModalHost";
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
      { url: `${BASE}/icon-192.png?v=20260907`, sizes: "192x192", type: "image/png" },
      { url: `${BASE}/icon-512.png?v=20260907`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: `${BASE}/apple-touch-icon.png?v=20260907`, sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        className={`bg-void font-sans text-mist antialiased${
          IS_DESKTOP
            ? " pb-24 pt-[52px]"
            : " pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
        }`}
      >
        {IS_DESKTOP ? <DesktopDragRegion /> : null}
        <PlayerProvider>
          <FavouritesProvider>
            <TvFavouritesProvider>
              <ProjectModeProvider>
                {children}
                <TvChannelModalHost />
                <PlayerBar />
              </ProjectModeProvider>
            </TvFavouritesProvider>
          </FavouritesProvider>
        </PlayerProvider>
        <PWARegister />
      </body>
    </html>
  );
}
