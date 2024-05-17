import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from "path"
import typescript from '@rollup/plugin-typescript'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        dts(),
        /*dts({
            insertTypesEntry: true,
        }),
         */
        typescript(/*{
            include: ["src/!**!/!*.vue"],
            compilerOptions: {
                outDir: "dist"
            },
            exclude: ["vite.config.ts"]
        }*/)
    ],
    build: {
        outDir: './dist',
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: path.resolve(__dirname, "src/index.ts"),
            name: 'vue-oidc-context',
            fileName: (format) => `vue-oidc-context.${format}.js`
            //fileName: 'vue-oidc-context'
        },
        rollupOptions: {
            // make sure to externalize deps that should not be bundled
            // into your library
            /*input: {
                main: path.resolve(__dirname, "src/index.ts")
            },*/
            external: ['vue'],
            output: {
                exports: "named",
                globals: {
                    vue: 'Vue',
                },
            },
        }
    }
})
