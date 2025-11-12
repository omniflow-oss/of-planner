<template>
  <header class="sticky top-0 z-40 flex items-center justify-between px-3 py-2 border-b border-default bg-default/95 backdrop-blur">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="font-semibold tracking-tight">
          Capacity Planner
        </div>
        <UBadge
          size="xs"
          color="neutral"
          variant="subtle"
        >
          PRD v2.9
        </UBadge>
      </div>
      <DataManager @go-to-today="$emit('go-to-today', $event)" />
    </div>
  <div class="flex items-center gap-2">
      <!-- Insides Sidebar Toggle Button -->
      <UButton
        size="xs"
        variant="outline"
        icon="i-lucide-bar-chart-2"
        aria-label="Show workload insights"
        @click="$emit('toggle-insides')"
      >
        Insights
      </UButton>
      <ViewSwitcher 
        @go-to-today="$emit('go-to-today', $event)"
        @add-weeks="$emit('add-weeks', $event)"
      />
      
      <!-- Read-only mode toggle -->
      <div class="flex items-center gap-2 px-2 py-1">
        <USwitch v-model="isInteractiveMode" />
        <span class="text-xs text-default font-medium whitespace-nowrap">
          {{ store.isReadOnly ? 'Read-only' : 'Interactive' }}
        </span>
      </div>
      
      <!-- Lazy loading toggle -->
      <div class="flex items-center gap-2">
        <USwitch 
          v-model="isLazyLoadEnabled" 
          :loading="store.isLoadingFragments"
          :disabled="store.isLoadingFragments"
        />
        <span class="text-xs text-gray-600 font-medium whitespace-nowrap">
          {{ store.isLazyLoadEnabled ? 'Lazy Load' : 'Full Load' }}
        </span>
      </div>
      
      <UButton
        size="xs"
        variant="outline"
        :icon="colorIcon"
        aria-label="Toggle color mode"
        @click="toggleColorMode"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import ViewSwitcher from '@/components/ViewSwitcher.vue'
import DataManager from '@/components/DataManager.vue'
import { usePlannerStore } from '@/stores/usePlannerStore'

defineEmits<{
  'go-to-today': [todayISO: string]
  'add-weeks': [{ direction: 'previous' | 'next', weeks: number }]
  'toggle-insides': []
}>()

const store = usePlannerStore()

// Create a computed property with getter/setter for the switch
const isInteractiveMode = computed({
  get: () => !store.isReadOnly,
  set: (value: boolean) => {
    if (value === store.isReadOnly) {
      store.toggleReadOnly()
    }
  }
})

// Create a computed property for lazy loading toggle
const isLazyLoadEnabled = computed({
  get: () => store.isLazyLoadEnabled,
  set: async (value: boolean) => {
    if (value !== store.isLazyLoadEnabled) {
      await store.toggleLazyLoading()
    }
  }
})

const colorMode = useColorMode()
const colorIcon = computed(() => colorMode.preference === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon')
function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
