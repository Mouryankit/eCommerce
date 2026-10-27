import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

// Universal Multi-Application Vite Configuration
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT || env.VITE_CUSTOMER_PORT) || 4000;

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port,
    },
    preview: {
      host: 'localhost',
      port,
    },
    build: {
      rollupOptions: {
        input: {
          customer: resolve(import.meta.dirname, 'index.html'),
          admin: resolve(import.meta.dirname, 'admin.html'),
        },
      },
    },
  };
})
