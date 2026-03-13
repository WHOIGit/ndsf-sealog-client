import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'build',
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 4 uses deprecated Sass features; silence until Bootstrap 5 upgrade
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function', 'abs-percent'],
      },
    },
  },
  resolve: {
    alias: {
      'client_config': path.resolve(import.meta.dirname, 'src/shims/client_config/index.js'),
      'map_tilelayers': path.resolve(import.meta.dirname, 'src/shims/map_tilelayers/index.js'),
    },
  },
  server: {
    proxy: {
      '/sealog-server': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
