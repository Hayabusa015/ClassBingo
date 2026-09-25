/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths: works when opened via file:// (Electron's
  // packaged app) as well as when served from any subpath on the web.
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
