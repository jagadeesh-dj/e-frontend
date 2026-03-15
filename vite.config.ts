import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ['sb-394hesp4snd1.vercel.run'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    hmr: {
      host: 'sb-394hesp4snd1.vercel.run',
      protocol: 'wss',
    },
  },
  optimizeDeps: {
    exclude: ['fabric'],
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
