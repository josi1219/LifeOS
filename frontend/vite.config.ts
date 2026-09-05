import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Same-origin from the browser's perspective, so the httpOnly refresh cookie stays same-site
      // without any CORS complexity.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
})
