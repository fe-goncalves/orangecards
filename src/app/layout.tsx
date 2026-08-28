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
  title: "ORANGE CARDS",
  description: "Álbum digital da temporada — colecione na janela do drop.",
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
