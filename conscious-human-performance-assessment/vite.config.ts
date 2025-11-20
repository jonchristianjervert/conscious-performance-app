
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Low Memory Settings
      minify: 'esbuild',
      target: 'es2015',
      cssCodeSplit: false, // Bundle CSS in one file to save memory overhead
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
          output: {
              manualChunks: undefined, // Let Vite handle chunks automatically to prevent complex logic
              inlineDynamicImports: false,
          }
      }
    }
  };
});
