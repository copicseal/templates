import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get component name from environment variable or default to HelloWorld
const componentName = process.env.COMPONENT_NAME || 'HelloWorld';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, `./src/components/${componentName}/index.vue`),
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
    outDir: `dist/templates/${componentName}`,
  },
});
