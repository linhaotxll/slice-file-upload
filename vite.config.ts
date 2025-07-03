import path from 'node:path'

import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

import type { UserConfigFn } from 'vite'

const config: UserConfigFn = async ({ command }) => {
  const isProd = command === 'build'

  return {
    plugins: [
      vue(),

      isProd
        ? dts({
            tsconfigPath: path.resolve(process.cwd(), 'tsconfig.json'),
            exclude: ['./src/internal-interface.ts'],
            outDir: path.resolve(process.cwd(), 'dist/@types'),
          })
        : undefined,
    ],

    server: {
      port: 3001,
    },

    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    },

    build: {
      lib: {
        entry: path.resolve(process.cwd(), 'src/index.ts'),
        fileName: format => `index.${format}.js`,
        name: 'slice-upload',
        formats: ['es'],
      },
      sourcemap: true,
      rollupOptions: {
        output: {
          dir: path.resolve(process.cwd(), 'dist'),
        },
        external: ['vue'],
      },
    },
  }
}

export default config
