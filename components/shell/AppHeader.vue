<template>
  <header class="sticky top-0 z-31 flex items-center justify-between px-3 py-2 border-b border-default bg-default/95 backdrop-blur">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="font-semibold tracking-tight">Capacity Planner</div>
        <UBadge size="xs" color="neutral" variant="subtle">PRD v2.9</UBadge>
      </div>
      <DataManager @go-to-today="$emit('go-to-today', $event)" />
    </div>
    <div class="flex items-center gap-2">
      <ViewSwitcher 
        @go-to-today="$emit('go-to-today', $event)"
        @add-weeks="$emit('add-weeks', $event)"
      />
      <UButton size="xs" variant="outline" :icon="colorIcon" aria-label="Toggle color mode" @click="toggleColorMode" />
    </div>
  </header>
</template>

<script setup lang="ts">
import ViewSwitcher from '@/components/ViewSwitcher.vue'
import DataManager from '@/components/DataManager.vue'
import { useColorMode } from '#imports'

defineEmits<{
  'go-to-today': [todayISO: string]
  'add-weeks': [{ direction: 'previous' | 'next', weeks: number }]
}>()

const colorMode = useColorMode()
const colorIcon = computed(() => colorMode.preference === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon')
function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
