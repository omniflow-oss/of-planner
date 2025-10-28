<template>
  <div class="flex items-center gap-2" role="tablist" aria-label="View mode">
    <div class="inline-flex rounded-md border border-slate-200 overflow-hidden shadow-sm">
      <button class="px-2.5 py-1 text-xs" :class="mode==='person' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'" @click="setMode('person')">People</button>
      <button class="px-2.5 py-1 text-xs" :class="mode==='project' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'" @click="setMode('project')">Projects</button>
    </div>
    <div class="w-px h-6 bg-slate-200/70 mx-2" />
    <div class="inline-flex items-center gap-1">
      <button class="px-2 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-50" @click="shift(-1)">‹</button>
      <div class="px-2.5 py-1 text-xs rounded-full bg-slate-900 text-white tracking-tight">{{ todayLabel }}</div>
      <button class="px-2 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-50" @click="shift(1)">›</button>
      <button class="ml-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-50" @click="today">Today</button>
    </div>
    <div class="inline-flex rounded-md border border-slate-200 overflow-hidden shadow-sm">
      <button class="px-2 text-xs" @click="zoom(-1)">-</button>
      <div class="px-2 text-[11px] flex items-center bg-slate-50 border-l border-r border-slate-200 text-slate-700">{{ store.view.px_per_day }} px/day</div>
      <button class="px-2 text-xs" @click="zoom(1)">+</button>
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

function setMode(m: 'person' | 'project') { store.switchMode(m) }
function today() {
  const d = new Date(); d.setUTCHours(0,0,0,0)
  const todayISO = d.toISOString().slice(0,10)
  store.setStart(todayISO)
  // Emit event to reinitialize timeline scroll position
  document.dispatchEvent(new CustomEvent('timeline:goToToday', { detail: todayISO }))
}
function zoom(delta: number) { store.setPxPerDay(view.value.px_per_day + delta * 4) }

const todayLabel = computed(() => {
  const d = new Date(); d.setUTCHours(0,0,0,0)
  return d.toISOString().slice(8,10) + ' ' + d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
})
function shift(delta: number) { store.setStart(addDaysISO(view.value.start, delta * 7)) }
</script>
