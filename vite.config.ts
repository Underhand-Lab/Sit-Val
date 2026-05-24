import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // 프로젝트 루트 설정
  base: '/sit-val',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './@shared'),
      '@packages': resolve(__dirname, './@packages'),
      '@sit-val': resolve(__dirname, './@packages/sit-val'),
      '@apps': resolve(__dirname, './@apps'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});