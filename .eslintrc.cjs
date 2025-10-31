module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['vue', '@typescript-eslint'],
  ignorePatterns: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/no-use-v-if-with-v-for': 'off'
  },
  globals: {
    // Nuxt auto-imported Vue utilities used in <script setup>
    ref: 'readonly',
    reactive: 'readonly',
    computed: 'readonly',
    watch: 'readonly',
    watchEffect: 'readonly',
    onMounted: 'readonly',
    onUnmounted: 'readonly',
    provide: 'readonly',
    inject: 'readonly',
    nextTick: 'readonly',
    // Nuxt UI composables auto-imported
    useToast: 'readonly',
    useColorMode: 'readonly',
    Ref: 'readonly'
  },
  overrides: [
    {
      files: ['tests/**/*', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}
