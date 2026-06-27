/// <reference types="vitest" />
import { defineConfig } from 'vite';

// Mobile-friendly, relative-base build so the game can be hosted from any subpath.
export default defineConfig({
  base: './',
  // Unit tests run the game's pure logic systems (no Phaser/DOM needed).
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./test/setup.ts']
  },
  server: {
    host: true, // expose on LAN so you can test on a real phone
    port: Number(process.env.PORT) || 5173
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Split Phaser into its own chunk for better caching.
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
