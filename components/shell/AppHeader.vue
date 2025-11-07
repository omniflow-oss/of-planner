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
      <ViewSwitcher 
        @go-to-today="$emit('go-to-today', $event)"
        @add-weeks="$emit('add-weeks', $event)"
      />
      
      <!-- Read-only mode toggle -->
      <div class="flex items-center gap-2 px-2 py-1 rounded-md border border-gray-200 bg-white/50">
        <USwitch v-model="isReadOnlyMode" />
        <span class="text-xs text-gray-600 font-medium whitespace-nowrap">
          {{ store.isReadOnly ? 'Read-only' : 'Interactive' }}
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
}>()

const store = usePlannerStore()

// Create a computed property with getter/setter for the switch
const isReadOnlyMode = computed({
  get: () => !store.isReadOnly,
  set: (value: boolean) => {
    if (value === store.isReadOnly) {
      store.toggleReadOnly()
    }
  }
})

const colorMode = useColorMode()
const colorIcon = computed(() => colorMode.preference === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon')
function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
