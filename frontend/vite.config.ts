import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En développement, les appels à /api sont relayés vers le back-end NestJS :
    // le navigateur ne voit qu'une seule origine, donc pas de problème de CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
