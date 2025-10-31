<template>
  <div class="flex items-center gap-2" role="tablist" aria-label="View mode">
    <UButtonGroup size="xs">
      <UButton :variant="mode==='person' ? 'solid' : 'ghost'" color="neutral" @click="setMode('person')">People</UButton>
      <UButton :variant="mode==='project' ? 'solid' : 'ghost'" color="neutral" @click="setMode('project')">Projects</UButton>
    </UButtonGroup>
    <div class="w-px h-6 bg-slate-200/70 mx-2" />
    <div class="inline-flex items-center gap-1">
      <UButton size="xs" variant="outline" :icon="'i-lucide-chevron-left'" aria-label="Previous" @click="shift(-1)" />
      <UButton size="xs" variant="outline" :disabled="true" class="whitespace-nowrap">{{ todayLabel }}</UButton>
      <UButton size="xs" variant="outline" :icon="'i-lucide-chevron-right'" aria-label="Next" @click="shift(1)" />
      <UButton size="xs" variant="outline" class="ml-1" :leading-icon="'i-lucide-calendar'" @click="today">Today</UButton>
    </div>
    <div class="inline-flex items-center gap-1">
      <UButtonGroup size="xs">
        <UButton size="xs" square variant="outline" color="neutral" :icon="'i-lucide-minus'" aria-label="Zoom out" @click="zoom(-1)" />
        <UButton size="xs" square variant="outline" color="neutral" :icon="'i-lucide-plus'" aria-label="Zoom in" @click="zoom(1)" />
      </UButtonGroup>
      <UBadge size="xs" color="neutral" variant="soft" class="whitespace-nowrap">{{ store.view.px_per_day }} px/day</UBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addDaysISO } from '@/composables/useDate'

const store = usePlannerStore()
const { view } = storeToRefs(store)
const mode = computed(() => view.value.mode)

const emit = defineEmits<{
  'go-to-today': [todayISO: string]
  'add-weeks': [{ direction: 'previous' | 'next', weeks: number }]
}>()

function setMode(m: 'person' | 'project') { store.switchMode(m) }
function today() {
  const d = new Date(); d.setUTCHours(0,0,0,0)
  const todayISO = d.toISOString().slice(0,10)
  emit('go-to-today', todayISO)
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
    const sidebarWidth = 240 // Left column width for labels
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
