import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "mylodgeio",
    project: "uglnsw-lodgetix"
  })],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './app'),
      '@admin': path.resolve(__dirname, './admin'),
      '@shared': path.resolve(__dirname, './shared')
    },
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    // Make HTTPS optional to avoid local access issues
    // https: true, // Enabling by default can cause certificate issues
    // Run with npm run dev:https to enable HTTPS when needed for Stripe testing
    proxy: {
      '/api/ipinfo': {
        target: 'https://ipapi.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ipinfo/, ''),
      },
    }
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app/index.html'),
        admin: path.resolve(__dirname, 'admin/index.html')
      }
    }
  }
});