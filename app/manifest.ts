import type { MetadataRoute } from "next";

// Manifeste PWA — Next.js le sert automatiquement sur /manifest.webmanifest
// et ajoute le lien correspondant dans le <head>, pas besoin d'y toucher
// dans layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcolaPay",
    short_name: "EcolaPay",
    description:
      "Recouvrement des scolarités par WhatsApp pour les écoles privées.",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF2FF",
    theme_color: "#3730A3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
