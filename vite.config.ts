import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "mylodgeio",
    project: "uglnsw-lodgetix"
  })],

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
    sourcemap: true
  }
});