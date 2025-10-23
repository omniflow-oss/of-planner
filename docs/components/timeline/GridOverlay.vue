<template>
  <div class="absolute inset-0">
    <!-- Day/Week grid lines -->
    <div
      class="grid h-full"
      :style="{ gridTemplateColumns: dayColumns, transform: `translateX(-${scrollLeft}px)` }"
    >
      <div v-for="(iso, idx) in days" :key="iso + ':' + idx" class="relative h-full">
        <div :class="['absolute inset-y-0 left-0 border-l', isWeekStart(iso) ? weekBorderClass : dayBorderClass]" />
      </div>
    </div>

    <!-- Today marker -->
    <div
      v-if="todayIndex >= 0"
      class="grid h-full pointer-events-none"
      :style="{ gridTemplateColumns: dayColumns, transform: `translateX(-${scrollLeft}px)` }"
    >
      <div v-for="(iso, idx) in days" :key="'t:'+iso+':'+idx" class="relative">
        <div v-if="idx === todayIndex" :class="['absolute inset-y-0 left-0 w-[2px]', todayClass]" />
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
const props = defineProps<{
  days: string[]
  dayColumns: string
  scrollLeft: number
  dayBorderClass?: string
  weekBorderClass?: string
  todayClass?: string
}>()

function isWeekStart(iso: string) {
  const d = new Date(iso)
  // Monday as start of week (1)
  const dow = d.getUTCDay()
  return dow === 1
}

function todayIsoUTC(): string {
  const now = new Date()
  // YYYY-MM-DD from UTC
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

const todayIndex = computed(() => props.days.indexOf(todayIsoUTC()))

const dayBorderClass = computed(() => props.dayBorderClass ?? 'border-slate-100')
const weekBorderClass = computed(() => props.weekBorderClass ?? 'border-slate-300')
const todayClass = computed(() => props.todayClass ?? 'bg-amber-500/90')
</script>
