import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api-proxy': {
        target: 'https://scam-project-backend.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        headers: {
          Origin: 'https://sentry-phishing-rafie1715.netlify.app',
        },
      },
    },
  },
  preview: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api-proxy': {
        target: 'https://scam-project-backend.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        headers: {
          Origin: 'https://sentry-phishing-rafie1715.netlify.app',
        },
      },
    },
  },
})
