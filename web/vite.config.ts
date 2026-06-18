import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.0.50', // 👈 On force Vite à utiliser ton IP Ethernet
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://192.168.0.50:4000', // 👈 On pointe vers le backend sur la même IP
        changeOrigin: true,
        secure: false,
      }
    }
  }
})