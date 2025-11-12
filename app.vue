<template>
  <UApp>
    <div class="h-screen flex flex-col bg-default text-default text-[13.5px] overflow-hidden">
      <AppHeader 
        @go-to-today="handleGoToToday"
        @add-weeks="handleAddWeeks"
        @toggle-insides="showInsides = !showInsides"
      />
      <main class="flex-1 w-full flex flex-col overflow-hidden h-full">
        <NuxtPage />
        <div v-if="showInsides" class="fixed top-0 right-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
          <div class="flex items-center justify-between px-4 py-2 border-b">
            <span class="font-semibold text-[15px]">Workload Insights</span>
            <button class="text-xs px-2 py-1" @click="showInsides = false">Close</button>
          </div>
          <div class="flex-1 overflow-auto p-4">
            <PlannerInsights />
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
    <UToaster />
  </UApp>
</template>

<script setup lang="ts">
import AppHeader from '@/components/shell/AppHeader.vue'
import AppFooter from '@/components/shell/AppFooter.vue'
import PlannerInsights from '@/components/insights/PlannerInsights.vue'
import { ref, nextTick, provide } from 'vue'

// Reactive refs for timeline events
const goToTodayEvent = ref<string | null>(null)
const addWeeksEvent = ref<{ direction: 'previous' | 'next', weeks: number } | null>(null)
const showInsides = ref(false)

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
