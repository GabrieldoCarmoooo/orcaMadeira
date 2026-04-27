import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core e roteamento — carregados em todas as rotas
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) {
            return 'vendor'
          }
          // Cliente Supabase — Auth + Postgres + Storage
          if (id.includes('@supabase')) {
            return 'supabase'
          }
          // Geração de PDF — carregado só quando o carpinteiro clica em gerar PDF
          if (id.includes('@react-pdf') || id.includes('@pdf-lib') || id.includes('pdfkit')) {
            return 'pdf'
          }
          // Bibliotecas de formulário e validação — carregadas nas rotas de wizard/catálogo
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform') ||
            id.includes('node_modules/zod')
          ) {
            return 'forms'
          }
        },
      },
    },
  },
})