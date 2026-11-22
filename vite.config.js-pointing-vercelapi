import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'https://aijentixapi-3qnql9kbf-my-team-efa6.vercel.app/',
          changeOrigin: true,
          secure: false,
        },
      },
      watch: {
      ignored: [
        '**/server/**',
        '**/.vs/**',
        '**/bin/**',
        '**/obj/**',
        '**/node_modules/**'
      ]
    },
    },
  }
})
