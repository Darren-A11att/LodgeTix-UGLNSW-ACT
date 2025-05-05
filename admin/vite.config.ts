import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/admin/',
  plugins: [react(), sentryVitePlugin({
    org: "mylodgeio",
    project: "uglnsw-lodgetix-admin"
  })],

  // Specify the admin entry point
  build: {
    outDir: '../dist/admin',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },

  resolve: {
    alias: {
      '@admin': path.resolve(__dirname, './'),
      '@src': path.resolve(__dirname, '../src'),
      '@shared': path.resolve(__dirname, '../shared')
    },
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    port: 5174, // Use a different port from the main app
    proxy: {
      '/api/ipinfo': {
        target: 'https://ipapi.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ipinfo/, ''),
      },
    }
  },
});