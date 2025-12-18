import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['@supabase/supabase-js'],
    preserveSymlinks: false,
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
    force: true,
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false,
    },
  },
})
