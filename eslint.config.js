// ESLint v9 flat config for Nuxt 4 + Vue 3 + TypeScript
// Keep rules minimal to avoid churn after migration.

import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default [
  // Ignore generated and vendor outputs
  {
    ignores: [
      'node_modules/',
      '.nuxt/',
      '.output/',
      'dist/',
      'coverage/',
      '**/.env*',
    ],
  },

  // Base JS recommended
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Nuxt macros
        defineNuxtConfig: 'readonly',
        defineAppConfig: 'readonly',
      },
    },
  },

  // Vue recommended (flat) – enables SFC support and core Vue rules
  ...vue.configs['flat/recommended'],

  // TypeScript for .ts files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // TypeScript handles undefined vars
      'no-undef': 'off',
      // Defer to TS rule below
      'no-unused-vars': 'off',
      // Reduce noise; keep common safety nets
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Vue SFCs using <script setup lang="ts">
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        // Vue <script setup> compiler macros
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // TypeScript handles undefined vars
      'no-undef': 'off',
      // Defer to TS rule below
      'no-unused-vars': 'off',
      // Project defaults
      'vue/multi-word-component-names': 'off',
      // Template pattern sometimes used intentionally; keep as warning
      'vue/no-use-v-if-with-v-for': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]
