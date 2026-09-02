import type { Metadata, Viewport } from "next";
import { Archivo_Black, Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#070807",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

/** Fallback até Sharp Grotesk local */
const displayFallback = Barlow_Condensed({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-display-fallback",
});

/** Fallback numeração de slot (Sharp Grotesk Black 10) */
const slotFallback = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-slot-fallback",
});

/** Fallback até Noka / Nexa locais — peso médio */
const sansFallback = Inter({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-sans-fallback",
});

export const metadata: Metadata = {
  title: "ORANGE CARDS | SEASON 8",
  description:
    "ABRA PACOTINHOS DIGITAIS, COLECIONE CARDS EXCLUSIVOS E CONQUISTE AS CARTAS LIMITED EDITION NA SEASON 8 DA COPA ORANGE.",
  metadataBase: new URL("https://cards.copaorange.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ORANGE CARDS | SEASON 8",
    description:
      "ABRA PACOTINHOS DIGITAIS, COLECIONE CARDS EXCLUSIVOS E CONQUISTE AS CARTAS LIMITED EDITION NA SEASON 8 DA COPA ORANGE.",
    url: "https://cards.copaorange.com.br",
    siteName: "ORANGE CARDS",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/brand/exports/booster-pack.png",
        width: 1000,
        height: 1400,
        alt: "ORANGE CARDS | SEASON 8 — Booster Pack",
      },
      {
        url: "/brand/icon.svg",
        width: 512,
        height: 512,
        alt: "ORANGE CARDS | SEASON 8",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ORANGE CARDS | SEASON 8",
    description:
      "ABRA PACOTINHOS DIGITAIS, COLECIONE CARDS EXCLUSIVOS E CONQUISTE AS CARTAS LIMITED EDITION NA SEASON 8 DA COPA ORANGE.",
    images: ["/brand/exports/booster-pack.png", "/brand/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/brand/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${displayFallback.variable} ${slotFallback.variable} ${sansFallback.variable} h-full`}
    >
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/fgw5nwn.css" />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
