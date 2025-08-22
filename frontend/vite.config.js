import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  base: "/",                       // <<< add this line
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: { outDir: "dist" },       // optional but explicit
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        // rewrite: p => p.replace(/^\/api/, ''), // keep commented
      },
    },
  },
})
