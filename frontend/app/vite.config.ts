import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Set by CI to the app's URL path prefix on the shared VM (e.g. "/pulse-awards/")
  // when this app is served under a path rather than its own domain. Local dev and
  // any future dedicated-domain deploy leave this unset, which defaults to "/".
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    // Bind all interfaces (not just localhost) so the PDF sidecar container can reach
    // static assets (e.g. the logo) via host.docker.internal during local certificate
    // generation. Dev-only — production serves built files through NGINX, not this server.
    host: true,
    allowedHosts: ['host.docker.internal'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
