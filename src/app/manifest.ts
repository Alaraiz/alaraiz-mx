import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Raíz · La ciudad debajo de la ciudad",
    short_name: "Raíz",
    description:
      "Experiencias de un día en la Ciudad de México, contadas por quienes la viven.",
    start_url: "/",
    display: "standalone",
    background_color: "#14110d",
    theme_color: "#14110d",
    icons: [
      {
        src: "/assets/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
