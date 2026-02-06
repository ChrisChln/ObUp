import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Chrome blocks 6000 as an unsafe port (X11). Use a safe port for LAN access.
    port: 6080,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
