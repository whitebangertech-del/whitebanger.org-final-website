import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
})
