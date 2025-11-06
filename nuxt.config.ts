// Nuxt 3 configuration for Capacity Planner
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  typescript: {
    shim: false,
    strict: true
  },
  css: [
    "~/assets/tailwind.css"
  ],
  modules: [
    ["@pinia/nuxt", { autoImports: ["defineStore"] }],
    "@nuxt/ui"
  ],
  app: {
    // Set base URL for GitHub Pages deployments. The workflow sets BASE_URL=/repo-name/
    baseURL: process.env.BASE_URL || "/",
    head: {
      title: "Capacity Planner",
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }]
    }
  },
  nitro: {
    // Generate a static site tailored for GitHub Pages hosting
    preset: "github-pages",
    compatibilityDate: "2025-11-06"
  }
})
