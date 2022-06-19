import path from 'path'
import { UserConfigFn, Plugin } from 'vite'

const config: UserConfigFn = async ({ command }) => {
  const isProd = command === 'build'
  const plugins: Plugin[] = []
  if (!isProd) {
    plugins.push((await import('@vitejs/plugin-vue')).default())
    plugins.push(
      (await import('vite-plugin-eslint')).default({
        fix: true,
        exclude: 'node_modules',
        extensions: ['.ts', '.tsx'],
      })
    )
  } else {
    plugins.push(
      (await import('vite-plugin-dts')).default({
        tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.json'),
        exclude: ['./src/internal-interface.ts'],
        outputDir: path.resolve(process.cwd(), 'dist/@types'),
      })
    )
  }
  return {
    plugins,

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
      sourcemap: false,
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
