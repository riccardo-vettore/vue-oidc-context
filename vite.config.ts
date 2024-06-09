import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import typescript from '@rollup/plugin-typescript'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        dts(),
        typescript()
    ],
    build: {
        outDir: './dist',
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: path.resolve(__dirname, "src/index.ts"),
            name: 'vue-oidc',
            fileName: (format) => `vue-oidc.${format}.js`
        },
        rollupOptions: {
            // make sure to externalize deps that should not be bundled
            // into your library
            external: ['vue'],
            output: {
                exports: "named",
                globals: {
                    vue: 'Vue',
                },
            },
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: "https://www.example.com/"
            }
        }
    },
})
