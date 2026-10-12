import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { contentSecurityPolicy } from './scripts/vite/contentSecurityPolicy.ts'

export default defineConfig(({ command }) => ({
  base: '/green-api-test/',
  plugins: [react(), contentSecurityPolicy(command === 'serve')],
  build: {
    sourcemap: false,
  },
}))
