import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      overlay: false
    }
  },
  optimizeDeps: {
    include: ['react-icons', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  css: {
    // postcss: './postcss.config.js',
    devSourcemap: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['react-icons'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  define: {
    global: 'globalThis'
  }
})
