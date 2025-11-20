import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' to load env from current directory
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: '/', 
    define: {
      // This is critical for Vercel: Polyfill 'process.env' to prevent crashes in libraries
      'process.env': {},
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    }
  };
});
