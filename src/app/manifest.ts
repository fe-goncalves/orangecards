import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORANGE CARDS | SEASON 8",
    short_name: "Orange Cards",
    description:
      "Colecione cards exclusivos da Copa Orange na Season 8.",
    start_url: "/",
    display: "standalone",
    background_color: "#070807",
    theme_color: "#070807",
    lang: "pt-BR",
    icons: [
      {
        src: "/brand/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/brand/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
