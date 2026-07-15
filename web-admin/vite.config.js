import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          fluent: ['@fluentui/react-components', '@fluentui/react-icons'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
