import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      // Stabilise HMR — prevents reloads triggered by unrelated socket errors.
      clientPort: 5173,
    },
    proxy: {
      // REST API — routed by path, standing in for nginx's location blocks
      // when running services directly instead of via docker/nginx.
      "/api/auth": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
      "/api/ai": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
