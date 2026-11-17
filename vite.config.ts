import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function runtimeConfigSource(env: Record<string, string>): string {
  const clerkPublishableKey = env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
  if (clerkPublishableKey.startsWith('sk_')) {
    return 'throw new Error("A chave secreta da Clerk não pode ir para o frontend.");\n'
  }
  const payload = {
    clerkPublishableKey,
    apiUrl: env.VITE_API_URL || 'http://localhost:8080',
  }
  return `window.__LHAMALOG_CONFIG__ = ${JSON.stringify(payload)};\n`
}

function runtimeConfigPlugin(env: Record<string, string>): Plugin {
  const body = runtimeConfigSource(env)
  return {
    name: 'lhamalog-runtime-config',
    config() {
      const key = env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
      if (key.startsWith('sk_')) {
        throw new Error('VITE_CLERK_PUBLISHABLE_KEY não pode ser uma chave secreta. Use somente pk_test_ ou pk_live_.')
      }
    },
    configureServer(server) {
      server.middlewares.use('/config.js', (_request, response) => {
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(body)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/config.js', (_request, response) => {
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(body)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const watch = loadEnv(mode, '.', 'WATCH_')
  const usePolling = watch.WATCH_POLLING === 'true'
  return {
    plugins: [react(), tailwindcss(), runtimeConfigPlugin(env)],
    server: {
      port: 5173,
      strictPort: true,
      watch: {
        usePolling,
      },
    },
    preview: {
      port: 5173,
      strictPort: true,
    },
  }
})
