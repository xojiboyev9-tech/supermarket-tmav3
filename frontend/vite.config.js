// JOYI: frontend/vite.config.js  (GitHub'da shu yo'l bilan yarating)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
