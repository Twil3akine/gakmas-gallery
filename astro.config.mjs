import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      persist: { path: ".wrangler/state/v3" },
    },
    imageService: "passthrough",
  }),
  security: {
    checkOrigin: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
