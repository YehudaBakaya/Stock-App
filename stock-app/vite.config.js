import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // עכשיו @ = src
    },
  },
  server: {
    port: 5173,       // הפורט הרצוי
    strictPort: true, // אם תפוס, השרת לא ינסה פורט אחר
  },
  preview: {
    allowedHosts: ['stock-app-1-fsk1.onrender.com'],
  },
})
