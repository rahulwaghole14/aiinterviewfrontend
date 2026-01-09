import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Use environment variable if set, otherwise default to Talaro AI backend
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://talaroai-310576915040.asia-southeast1.run.app'
    ),
  },
  optimizeDeps: {
    include: ['react-is', 'recharts'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    historyApiFallback: true,
  },
})
