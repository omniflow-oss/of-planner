<template>
  <div class="min-h-screen flex flex-col bg-white text-slate-900 text-[13.5px]">
    <AppHeader />
    <main class="flex-1">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
  
  
  
  
</template>

<script setup lang="ts">
import AppHeader from '@/components/shell/AppHeader.vue'
import AppFooter from '@/components/shell/AppFooter.vue'
</script>
