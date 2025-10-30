import { defineConfig } from 'vitest/config'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reports: ['text', 'text-summary', 'html', 'lcov'],
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: [
        'stores/**/*.ts',
        'utils/**/*.ts',
        'composables/**/*.ts'
      ],
      exclude: [
        'app.vue',
        'nuxt.config.ts',
        'tailwind.config.ts',
        '**/*.vue',
        'components/**',
        'pages/**',
        'assets/**',
        'public/**',
        'types/**',
        'docs/**',
        '.nuxt/**',
        'node_modules/**',
        'tests/**',
        '**/*.d.ts'
      ],
      thresholds: {
        statements: 0.8,
        branches: 0.8,
        functions: 0.8,
        lines: 0.8
      }
    }
  }
})
