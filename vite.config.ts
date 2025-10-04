import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "use-sync-external-store/shim": path.resolve(import.meta.dirname, "client", "src", "polyfills", "use-sync-external-store-shim.js"),
      "use-sync-external-store/shim/index.js": path.resolve(import.meta.dirname, "client", "src", "polyfills", "use-sync-external-store-shim.js"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    noDiscovery: true,
    exclude: [
      "use-sync-external-store/shim",
      "use-sync-external-store"
    ],
  },
  define: {
    global: 'globalThis',
  },
  ssr: {
    noExternal: ['use-sync-external-store'],
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    proxy: {
      "/api": "http://localhost:3000"
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
      allow: [path.resolve(import.meta.dirname, "shared")],
    },
  },
});
