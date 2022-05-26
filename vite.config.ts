import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), eslint({ fix: true, exclude: 'node_modules', extensions: ['.ts', '.tsx'] })],

  server: {
    port: 3001
  },

  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },

  build: {
    outDir: 'site',
    assetsDir: 'assets'
  }
})
