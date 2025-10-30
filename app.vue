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
import { ref, provide } from 'vue'
import AppHeader from '@/components/shell/AppHeader.vue'
import AppFooter from '@/components/shell/AppFooter.vue'

// Create reactive refs for timeline events
const goToTodayEvent = ref<string | null>(null)
const addWeeksEvent = ref<{ direction: 'previous' | 'next', weeks: number } | null>(null)

// Provide events to child components
provide('timelineEvents', {
  goToToday: goToTodayEvent,
  addWeeks: addWeeksEvent
})

// Handle events from ViewSwitcher using Vue reactivity
function handleGoToToday(todayISO: string) {
  goToTodayEvent.value = todayISO
  // Reset after a tick to allow re-triggering
  nextTick(() => {
    goToTodayEvent.value = null
  })
}

function handleAddWeeks(data: { direction: 'previous' | 'next', weeks: number }) {
  addWeeksEvent.value = data
  // Reset after a tick to allow re-triggering
  nextTick(() => {
    addWeeksEvent.value = null
  })
}
</script>
