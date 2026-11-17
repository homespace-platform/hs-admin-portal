import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export function validateNotificationEnvironment(env: Record<string, string>) {
  for (const key of ['VITE_WEB_APP_URL', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_VAPID_KEY']) {
    if (!env[key]?.trim()) throw new Error(`${key} is required`)
  }
  let origin: URL
  try { origin = new URL(env.VITE_WEB_APP_URL) }
  catch { throw new Error('VITE_WEB_APP_URL must be an HTTP(S) origin') }
  if (!/^https?:$/.test(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('VITE_WEB_APP_URL must be an HTTP(S) origin')
  }
}

export default defineConfig(({ mode }) => {
  validateNotificationEnvironment(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
  plugins: [react(), tailwindcss()],
  server: {
    port: 5000,
    strictPort: true,
  },
  preview: {
    port: 5000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  }
})
