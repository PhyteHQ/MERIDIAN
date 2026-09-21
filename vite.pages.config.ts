import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('./pages', import.meta.url)),
  base: './',
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  plugins: [react()],
  define: { 'process.env.NEXT_PUBLIC_GITHUB_PAGES': JSON.stringify('true') },
  build: {
    outDir: fileURLToPath(new URL('./.pages-build', import.meta.url)),
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/meridian-[name]-[hash].js',
        chunkFileNames: 'assets/meridian-[name]-[hash].js',
        assetFileNames: 'assets/meridian-[name]-[hash][extname]',
      },
    },
  },
});
