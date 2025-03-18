import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: '@features', replacement: '/src/features' },
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://openapi.seoul.go.kr:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
