import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kofferklaar",
    short_name: "Kofferklaar",
    description: "Jouw kast, jouw stylist: outfits en paklijst voor elke reis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e9",
    theme_color: "#b9572b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
