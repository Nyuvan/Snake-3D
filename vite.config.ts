import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so dist/ works at any URL, including subfolders
  // like GitHub Pages project sites.
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
  },
});
