<template>
  <header class="h-16 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md grid grid-cols-3 items-center px-6 sticky top-0 z-40 ">
    <!-- Left: Logo & Title -->
    <div class="flex items-center justify-start gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
          <UIcon name="i-lucide-calendar-days" class="w-5 h-5" />
        </div>
        <h1 class="font-bold text-lg text-gray-900 dark:text-white tracking-tight hidden sm:block">
          Capacity Planner
        </h1>
      </div>
    </div>

    <!-- Center: Navigation & View Controls -->
    <div class="flex items-center justify-center gap-4">
      <ViewSwitcher 
        @go-to-today="$emit('go-to-today')"
        @add-weeks="$emit('add-weeks', $event)"
      />
      
    </div>

    <!-- Right: Actions & Settings -->
    <div class="flex items-center justify-end gap-2">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-bar-chart-3"
        :label="showInsights ? 'Hide Insights' : 'Insights'"
        @click="$emit('toggle-insights')"
      />
      
      <div class="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

      <ColorModeButton />
      
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-settings-2"
        aria-label="Settings"
        @click="$emit('toggle-settings')"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ViewSwitcher from '@/components/ViewSwitcher.vue'
import ColorModeButton from './ColorModeButton.vue'

defineProps<{
  showInsights: boolean
}>()

defineEmits<{
  'toggle-insights': []
  'toggle-settings': []
  'go-to-today': []
  'add-weeks': [{ direction: 'previous' | 'next', weeks: number }]
}>()
</script>
