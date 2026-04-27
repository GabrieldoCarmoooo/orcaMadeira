import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Ambiente jsdom para simular o browser nos testes unitários
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Necessário para ci antes da criação dos primeiros arquivos de teste
    passWithNoTests: true,
  },
  resolve: {
    // Alias @/ espelhando a configuração do vite.config.ts para que imports de testes resolvam igual ao app
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
