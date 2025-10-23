<template>
  <div class="pointer-events-none">
    <div v-for="(day, i) in days" :key="'bg'+i" class="day-bg" :style="{ left: left(i)+'px', width: width(i)+'px' }" />
    <div v-for="(day, i) in days" :key="'v'+i" :class="['grid-v', isWeekStart(i)?'week':'']" :style="{ left: left(i)+'px' }" />
    <div v-if="todayIdx>=0 && todayIdx<days.length" class="today-line" :style="{ left: left(todayIdx)+'px' }" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ days: string[]; pxPerDay: number; offsets?: number[]; weekStarts?: number[]; todayISO?: string }>()

const px = computed(() => props.pxPerDay)
const offsets = computed(() => props.offsets ?? props.days.map((_,i)=> i*px.value))
function left(i:number){ return offsets.value[i] ?? i*px.value }
function width(i:number){ const next = offsets.value[i+1] ?? (left(i)+px.value); return Math.max(0, next - left(i)) }
const weekSet = computed(() => new Set(props.weekStarts ?? props.days.map((d,i)=> (new Date(d).getUTCDay()===1? i : -1)).filter(i=>i>=0)))
function isWeekStart(i:number){ return weekSet.value.has(i) }
const todayISO = computed(() => props.todayISO ?? (()=>{ const d=new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })())
const todayIdx = computed(() => props.days.findIndex(d=>d===todayISO.value))
</script>

