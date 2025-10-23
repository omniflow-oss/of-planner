import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './stores/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff', 100: '#d9ecff', 200: '#b6dbff', 300: '#86c4ff', 400: '#56a5ff', 500: '#3b8cff', 600: '#2e6fe6', 700: '#275ab8', 800: '#244e99', 900: '#223f78'
        }
      },
      borderRadius: { xl: '12px' }
    }
  }
}

