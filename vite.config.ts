/* eslint-disable node/prefer-global/process */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const componentName = process.env.COMPONENT_NAME;
const componentPath = process.env.COMPONENT_PATH || componentName;

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [vue(), vueJsx()],
    server: {
    // 将 dist 目录代理到 /dist 路径，方便开发时访问构建产物
      fs: {
        strict: false,
        allow: ['..'],
      },
    },
    build: componentName
      ? ({
          lib: {
            entry: resolve(__dirname, `./src/templates/${componentPath}/index.vue`),
            formats: ['iife'],
            name: componentName,
            fileName(_format) {
              return 'index.js';
            },
          },
          rollupOptions: {
            external: ['vue'],
            output: {
              globals: {
                vue: 'Vue',
              },
              assetFileNames: (assetInfo) => {
                if (assetInfo.name?.endsWith('.css')) {
                  return 'index.css';
                }
                return assetInfo.name || 'asset.[ext]';
              },
              format: 'iife',
              exports: 'default',
            },
          },
          emptyOutDir: false, // Don't empty dist on each build
          outDir: `dist/templates/${componentPath}`,
        })
      : {
          emptyOutDir: false,
        },
  };
});
