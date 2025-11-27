<template>
  <div
    class="flex items-center justify-between gap-4 w-full"
    role="tablist"
    aria-label="View mode"
  >
    <UFieldGroup
      size="sm"
      class="mx-auto"
    >
      <UButton
        size="sm"
        :variant="mode==='person' ? 'solid' : 'outline'"
        color="primary"
        class="font-medium px-2 md:px-4"
        @click="setMode('person')"
      >
        <UIcon name="i-lucide-user" class="md:hidden size-3.5" />
        <span class="hidden md:inline ">People</span>
      </UButton>
      <UButton
        size="sm"
        :variant="mode==='project' ? 'solid' : 'outline'"
        color="primary"
        class="font-medium px-2 md:px-4"
        @click="setMode('project')"
      >
        <UIcon name="i-lucide-briefcase" class="md:hidden size-3.5" />
        <span class="hidden md:inline ">Projects</span>
      </UButton>
    </UFieldGroup>
    <div class="hidden md:inline-flex items-center gap-1">
      <UFieldGroup size="xs">
        <UButton
          size="xs"
          square
          variant="outline"
          color="neutral"
          :icon="'i-lucide-minus'"
          aria-label="Zoom out"
          @click="zoom(-1)"
        />
        <UButton
          size="xs"
          square
          variant="outline"
          color="neutral"
          :icon="'i-lucide-plus'"
          aria-label="Zoom in"
          @click="zoom(1)"
        />
      </UFieldGroup>
      <UBadge
        size="xs"
        color="neutral"
        variant="soft"
        class="whitespace-nowrap"
      >
        {{ store.view.px_per_day }} px/day
      </UBadge>
    </div>
    <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-heroicons-chevron-left-20-solid"
        @click="shift(-1)"
      />
      <UButton
        size="xs"
        variant="ghost"
        class="relative"
        color="neutral"
        label="Today"
        @click="today"
      />
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-heroicons-chevron-right-20-solid"
        @click="shift(1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'

const store = usePlannerStore()
const { view } = storeToRefs(store)
const mode = computed(() => view.value.mode)

const emit = defineEmits<{
  'go-to-today': []
  'add-weeks': [{ direction: 'previous' | 'next', weeks: number }]
}>()

function setMode(m: 'person' | 'project') { store.switchMode(m) }
function today() {
  emit('go-to-today')
}
function zoom(delta: number) { 
  const currentZoom = view.value.px_per_day
  const newZoomLevel = currentZoom + delta * 4
  
  // If zooming out (delta < 0), check if timeline width would be smaller than window width
  if (delta < 0) {
    // Estimate weekdays from total days (roughly 5/7 of total days)
    const estimatedWeekdays = Math.floor(view.value.days * 5 / 7)
    const timelineWidth = estimatedWeekdays * newZoomLevel
    const windowWidth = window.innerWidth
    const sidebarWidth = window.innerWidth > 768 ?  LEFT_SIDEBAR_WIDTH : 0  // Left column width for labels
    const availableWidth = windowWidth - sidebarWidth
    
    // Prevent zoom out if timeline would be smaller than available width
    if (timelineWidth < availableWidth) {
      return // Don't allow this zoom level
    }
  }
  
  // Apply CSS class for small cells
  if(newZoomLevel < 48){
    document.body.classList.add('cell-small');
  }else {
    document.body.classList.remove('cell-small');
  }
  
  store.setPxPerDay(newZoomLevel) 
}

const todayLabel = computed(() => {
  const d = new Date(); d.setUTCHours(0,0,0,0)
  return d.toISOString().slice(8,10) + ' ' + d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
})
function shift(delta: number) { 
  if (delta < 0) {
    // Add previous weeks without losing current data
    emit('add-weeks', { direction: 'previous', weeks: Math.abs(delta) })
  } else {
    // Add next weeks without losing current data  
    emit('add-weeks', { direction: 'next', weeks: delta })
  }
}
</script>
