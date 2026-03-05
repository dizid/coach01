import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import netlify from '@netlify/vite-plugin'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue(), netlify()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  }
})
