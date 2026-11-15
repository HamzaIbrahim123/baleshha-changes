import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: process.env.FIGMA ? (process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0') : undefined,
            port: process.env.FIGMA ? Number(process.env.PORT || 8443) : 5173,
            strictPort: Boolean(process.env.FIGMA) }
})
