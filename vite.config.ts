import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // BEZPIECZEŃSTWO: Przekazujemy tylko konkretny klucz API_KEY.
      // Nie przekazujemy całego obiektu 'env', aby uniknąć wycieku innych zmiennych.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000,
    }
  };
});