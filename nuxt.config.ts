// Nuxt 3 configuration for Capacity Planner
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    shim: false,
    strict: true
  },
  css: ["~/assets/tailwind.css"],
  modules: [
    ["@pinia/nuxt", { autoImports: ["defineStore"] }],
    "@nuxtjs/tailwindcss"
  ],
  app: {
    head: {
      title: "Capacity Planner",
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }]
    }
  }
})
