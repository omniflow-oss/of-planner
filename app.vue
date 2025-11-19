<template>
  <UApp>
    <div class="h-screen flex flex-col bg-default text-default text-[13.5px] overflow-hidden">
      <AppHeader 
        :show-insights="showInsights"
        @go-to-today="handleGoToToday"
        @add-weeks="handleAddWeeks"
        @toggle-insights="showInsights = !showInsights"
        @toggle-settings="showSettings = !showSettings"
      />
      <main class="flex-1 w-full flex flex-col overflow-hidden h-full">
        <NuxtPage />
      </main>
      <AppFooter />
    </div>
    
    <SlideOverPanel :is-open="showInsights" width="w-[420px]" @close="showInsights = false" @go-to-today="handleGoToToday">
      <div class="flex flex-col h-full bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Planner Insights</h2>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            @click="showInsights = false"
          />
        </div>
        <div class="flex-1 overflow-auto p-4">
          <PlannerInsights v-if="showInsights" @person-click="handlePersonClick" />
        </div>
      </div>
    </SlideOverPanel>

    <UToaster />
    <SettingsPanel
      v-model="showSettings"
      @go-to-today="handleGoToToday"
      @close="showSettings = false"
    />
  </UApp>
</template>

<script setup lang="ts">
import AppHeader from '@/components/shell/AppHeader.vue'
import AppFooter from '@/components/shell/AppFooter.vue'
import PlannerInsights from '@/components/insights/PlannerInsights.vue'
import SettingsPanel from '@/components/shell/SettingsPanel.vue'
import SlideOverPanel from '@/components/shell/SlideOverPanel.vue'
import { ref, nextTick, provide } from 'vue'

// Reactive refs for timeline events
const goToTodayEvent = ref<string | null>(null)
const addWeeksEvent = ref<{ direction: 'previous' | 'next', weeks: number } | null>(null)
const showInsights = ref(false)
const showSettings = ref(false)

// Provide timeline events to child components
provide('timelineEvents', {
  goToTodayEvent,
  addWeeksEvent
})

// Person click event handler to forward to Timeline
import { ref as vueRef } from 'vue'
const personClickEvent = vueRef<string | null>(null)
provide('personClickEvent', personClickEvent)

function handlePersonClick(personId: string) {
  personClickEvent.value = personId
  nextTick(() => {
    personClickEvent.value = null
  })
  // Close insights panel on selection to show the result
  showInsights.value = false
}

// Handle events from ViewSwitcher using Vue emit functions
function handleGoToToday() {
  const d = new Date(); d.setUTCHours(0,0,0,0)
  const todayISO = d.toISOString().slice(0,10)
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
