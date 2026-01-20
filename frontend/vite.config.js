import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/players': 'http://localhost:3000',
      '/matches': 'http://localhost:3000',
      '/teams': 'http://localhost:3000',
      '/social-pairs': 'http://localhost:3000',
      '/ranking': 'http://localhost:3000',
      '/config': 'http://localhost:3000',
      '/export': 'http://localhost:3000',
      '/courts': 'http://localhost:3000',
    },
  },
})
