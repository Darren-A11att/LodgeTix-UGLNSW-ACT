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
    },
    mcpServers: {
      "filesystem": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/Users/darrenallatt"
        ]
      },
      "memory": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-memory"
        ]
      },
      "brave-search": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-brave-search"
        ],
        "env": {
          "BRAVE_API_KEY": "BSABOT9A_AG4varpZu3FuuulrpCYYqf"
        }
      },
      "sequential-thinking": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-sequential-thinking"
        ]
      },
      "desktop-commander": {
        "command": "npx",
        "args": [
          "-y",
          "@wonderwhy-er/desktop-commander"
        ]
      },
      "browsermcp": {
        "command": "npx",
        "args": ["@browsermcp/mcp@latest"]
      },
      "supabase": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--access-token",
          "sbp_1ad2d9935da527a67d3748263c9884c822a993c8"
        ]
      },
      "claude-code": {
        "command": "claude",
        "args": ["mcp", "serve"],
        "env": {}
      },
      "Code Agent": {
        "command": "python3",
        "args": ["/Users/darrenallatt/Claude-Code/claude-code-server/src/server.py"],
        "env": {},
        "cwd": "/Users/darrenallatt/Claude-Code/claude-code-server"
      }
    }
  },

  build: {
    sourcemap: true
  }
});