import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Prevent Vite from obscuring Rust errors
  clearScreen: false,

  // Tauri expects a fixed port; don't fail if port is busy — let Vite pick next free one
  server: {
    port: 5173,
    strictPort: false,   // auto-picks next free port if 5173 is in use
    host: 'localhost',
    // Allow Tauri to access the dev server
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  // Env variables starting with TAURI_ are exposed to the frontend
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri v2 uses Chromium on Windows and WebKit on macOS/Linux
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari14',
    // Produce sourcemaps for Tauri debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'oxc' : false,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) requires manualChunks as a function
        manualChunks(id: string) {
          if (id.includes('pixi.js') || id.includes('@pixi/react')) {
            return 'pixi';
          }
          if (id.includes('react-dom') || id.includes('/react/')) {
            return 'react';
          }
        },
      },
    },
  },
});
