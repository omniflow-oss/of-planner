<template>
  <div class="min-h-screen flex flex-col bg-white text-slate-900 text-[13.5px]">
    <AppHeader 
      @go-to-today="handleGoToToday"
      @add-weeks="handleAddWeeks"
    />
    <main class="flex-1 w-full flex flex-col">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
  
  
  
  
</template>

<script setup lang="ts">
import AppHeader from '@/components/shell/AppHeader.vue'
import AppFooter from '@/components/shell/AppFooter.vue'

// Handle events from ViewSwitcher and dispatch as document events for Timeline
function handleGoToToday(todayISO: string) {
  document.dispatchEvent(new CustomEvent('timeline:goToToday', { detail: todayISO }))
}

function handleAddWeeks(data: { direction: 'previous' | 'next', weeks: number }) {
  document.dispatchEvent(new CustomEvent('timeline:addWeeks', { detail: data }))
}
</script>
