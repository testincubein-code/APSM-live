// ── Vite Configuration ──────────────────────────────────────────────
// React SPA setup with HMR and path aliasing for clean imports.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ── Plugins ─────────────────────────────────────────────────────────
  plugins: [react()],

  // ── Path Resolution Aliases ─────────────────────────────────────────
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ── Dev Server Configuration ────────────────────────────────────────
  server: {
    strictPort: true,
    allowedHosts:true,
    proxy: {
      // Proxy /auth requests to the Express backend during development
      "/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy /analytics requests to the Express backend during development
      "/analytics": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy /user requests to the Express backend during development
      "/user": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy /automation requests to the Express backend during development
      "/automation": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy /reports requests to the Express backend
      "/reports": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy /api catch-all requests to the Express backend during development
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
