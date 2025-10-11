/**
 * Vite Configuration for Obfuscated Production Build
 *
 * This configuration extends the base Vite config with obfuscation
 * and aggressive minification for maximum code protection.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import obfuscatePlugin from "./vite-plugin-obfuscate.js";

export default defineConfig({
  plugins: [
    react(),
    obfuscatePlugin({
      // Custom obfuscation options can be added here
      // These will override the defaults in the plugin
    }),
  ],

  build: {
    // Output directory
    outDir: "dist",

    // Generate sourcemaps (set to false for production)
    sourcemap: false,

    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        // Remove console.log statements
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],

        // Additional compression options
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
      },
      mangle: {
        // Mangle property names
        properties: false, // Be careful with this
        safari10: true,
      },
      format: {
        // Remove comments
        comments: false,

        // Use ASCII only
        ascii_only: true,
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          vendor: ["react", "react-dom"],
          // Add other vendor chunks as needed
        },

        // Asset file names
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },

    // Target modern browsers
    target: "es2015",

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom"],
  },

  // Define environment variables
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
