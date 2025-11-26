<template>
  <header class="h-16 border-b pane-border backdrop-blur-md flex justify-between items-center px-3 md:px-6 sticky top-0 z-40 gap-2">
    <!-- Left: Logo & Title -->
    <div class="flex items-center justify-start gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
          <UIcon name="i-lucide-calendar-days" class="w-5 h-5" />
        </div>
        <h1 class="font-bold text-lg text-gray-900 dark:text-white tracking-tight hidden md:block leading-none">
          Capacity Planner
        </h1>
      </div>
    </div>

    <!-- Center: Navigation & View Controls -->
    <div class="flex items-center justify-center gap-1 md:gap-4 md:ml-auto">
      <ViewSwitcher 
        @go-to-today="$emit('go-to-today')"
        @add-weeks="$emit('add-weeks', $event)"
      />      
    </div>

    <!-- Right: Actions & Settings -->
    <div class="flex items-center justify-end gap-1 md:gap-2">
      <UInput 
        v-model="searchLocal" 
        placeholder="Search in projects or peoples" 
        size="sm" 
        class="lg:w-64 mr-2 hidden md:block" 
        :ui="{ trailing: 'pe-1' }"
      >
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            :icon="searchLocal ? 'i-lucide-x' : 'i-lucide-search'"
            :aria-label="searchLocal ? 'Clear search' : 'Search'"
            aria-controls="search"
            @click="searchLocal = ''"
          />
        </template>
      </UInput>
      <UButton
        color="neutral"
        variant="ghost"
        class="p-1.5"
        @click="$emit('toggle-insights')"
      >
        <UIcon name="i-lucide:bar-chart-3" class="shrink-0 size-5" />
        <span class="truncate hidden md:inline">{{showInsights ? 'Hide Insights' : 'Insights'}}</span>
      </UButton>
      
      <div class="hidden md:block h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

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
import { ref, watch } from 'vue'
import ViewSwitcher from '@/components/shell/ViewSwitcher.vue'
import ColorModeButton from './ColorModeButton.vue'

const props = defineProps<{
  showInsights: boolean
  searchQuery?: string | null
}>()

const emit = defineEmits<{
  'toggle-insights': []
  'toggle-settings': []
  'go-to-today': []
  'add-weeks': [{ direction: 'previous' | 'next', weeks: number }]
  'update:searchQuery': [string]
}>()

const searchLocal = ref(props.searchQuery ?? '')

watch(searchLocal, (v) => {
  emit('update:searchQuery', v)
})

watch(() => props.searchQuery, (v) => {
  if (v !== searchLocal.value) searchLocal.value = v ?? ''
})
</script>
