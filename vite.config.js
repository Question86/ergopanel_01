import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), wasm()],
  server: {
    proxy: {
      '/transactions': {
        target: 'http://localhost:9053',
        changeOrigin: true,
        secure: false,
      },
      '/blocks': {
        target: 'http://localhost:9053',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/proxy': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
