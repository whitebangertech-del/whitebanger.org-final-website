import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  optimizeDeps: {
    entries: [],
  },
  build: {
    copyPublicDir: false,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: './index.html' },
      external: [/^assets\//],
    },
  },
  server: {
    port: 5173,
  },
})
