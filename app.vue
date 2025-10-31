<template>
  <UApp>
    <div class="h-screen flex flex-col bg-default text-default text-[13.5px]">
      <AppHeader 
        @go-to-today="handleGoToToday"
        @add-weeks="handleAddWeeks"
      />
      <main class="flex-1 w-full flex flex-col overflow-hidden h-full">
        <NuxtPage />
      </main>
      <AppFooter />
    </div>
    <UToaster />
  </UApp>
</template>

<script setup lang="ts">
import AppHeader from '@/components/shell/AppHeader.vue'
import AppFooter from '@/components/shell/AppFooter.vue'

// Reactive refs for timeline events
const goToTodayEvent = ref<string | null>(null)
const addWeeksEvent = ref<{ direction: 'previous' | 'next', weeks: number } | null>(null)

// Provide timeline events to child components
provide('timelineEvents', {
  goToTodayEvent,
  addWeeksEvent
})

// Handle events from ViewSwitcher using Vue emit functions
function handleGoToToday(todayISO: string) {
  goToTodayEvent.value = todayISO
  // Auto-reset to allow re-triggering same event
  nextTick(() => {
    goToTodayEvent.value = null
  })
}

function handleAddWeeks(data: { direction: 'previous' | 'next', weeks: number }) {
  addWeeksEvent.value = data
  // Auto-reset to allow re-triggering same event
  nextTick(() => {
    addWeeksEvent.value = null
  })
}
</script>
