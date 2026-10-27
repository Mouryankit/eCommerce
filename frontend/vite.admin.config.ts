import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

// Admin Frontend Application configuration (Port 4001)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_ADMIN_PORT) || 4001;

  return {
    plugins: [
      react(),
      {
        name: 'admin-root-rewrite',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === '/' || req.url === '/index.html') {
              req.url = '/admin.html';
            }
            next();
          });
        },
      },
    ],
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
          admin: resolve(import.meta.dirname, 'admin.html'),
        },
      },
    },
  };
})
