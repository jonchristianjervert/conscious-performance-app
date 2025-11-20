import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to prevent Vercel build crashes
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: '/', 
    define: {
      // Safely map environment variables for the client
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1600,
    }
  };
});