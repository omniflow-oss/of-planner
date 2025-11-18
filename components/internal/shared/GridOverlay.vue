<template>
  <div class="pointer-events-none">
    <div
      v-for="(day, i) in days"
      :key="'bg'+i"
      :class="['day-bg',weekStarts && weekStarts.includes(i)?'week':'', day === toISO(new Date())?'today':'']"
      :style="{ left: left(i)+'px', width: width(i)+'px' }"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ days: string[]; pxPerDay: number; offsets?: number[]; weekStarts?: number[]; todayISO?: string }>()
import { toISO } from '@/composables/useDate'
const px = computed(() => props.pxPerDay)
const offsets = computed(() => props.offsets ?? props.days.map((_,i)=> i*px.value))
function left(i:number){ return offsets.value[i] ?? i*px.value }
function width(i:number){ const next = offsets.value[i+1] ?? (left(i)+px.value); return Math.max(0, next - left(i)) }
</script>

