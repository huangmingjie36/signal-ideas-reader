import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Signal — 高质量思想流",
    short_name: "Signal",
    description: "只刷值得你注意的思想。",
    start_url: "/",
    display: "standalone",
    background_color: "#11110f",
    theme_color: "#11110f",
    orientation: "portrait",
  };
}
