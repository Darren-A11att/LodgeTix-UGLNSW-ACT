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
    proxy: {
      '/api/ipinfo': {
        target: 'https://ipapi.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ipinfo/, ''),
      },
    },
  },

  build: {
    sourcemap: true
  }
});