import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  nitro: false,
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [
            /\/api\//,
            /supabase\.co\/auth\//,
            /supabase\.co\/rest\/v1\//,
            /supabase\.co\/storage\/v1\/object\/authenticated/,
            /supabase\.co\/functions\/v1\//,
          ],
        },
      }),
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  },
});



