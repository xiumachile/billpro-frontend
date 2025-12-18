import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'BillPro POS',
        short_name: 'BillPro',
        description: 'Sistema de Gestión de Restaurante',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // ✅ Permite acceso desde cualquier IP (incluye Tailscale)
    port: 1420,
    strictPort: true,
    hmr: {
      host: '192.168.4.126', // ✅ Para desarrollo local
      port: 1420,
      protocol: 'ws'
    }
    // ❌ ELIMINA el proxy - ya no lo necesitas con Tailscale
    // El frontend se conectará directamente a la IP de Tailscale
  },
})
