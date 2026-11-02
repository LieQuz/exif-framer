import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EXIF Framer",
    short_name: "EXIF Framer",
    description:
      "Turn EXIF into a polaroid-style photo frame. Warm, minimal, and processed entirely in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F7F5",
    theme_color: "#F9F7F5",
    lang: "ja",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
