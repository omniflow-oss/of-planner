<template>
  <div class="pointer-events-none" :style="{ transform: transformX }">
    <div v-for="(day, i) in days" :key="'bg'+i" class="day-bg" :style="{ left: geometry.left(i)+'px', width: geometry.width(i)+'px' }" />
    <div v-for="(day, i) in days" :key="'v'+i" :class="['grid-v', isWeekStart(i)?'week':'']" :style="{ left: geometry.left(i)+'px' }" />
    <div v-if="todayIdx>=0 && todayIdx<days.length" class="today-line" :style="{ left: geometry.left(todayIdx)+'px' }" />
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ days: string[]; weekStarts?: number[]; todayISO?: string; scrollLeft?: number; geometry: { left: (i:number)=>number; width: (i:number)=>number } }>()

const weekSet = computed(() => new Set(props.weekStarts ?? props.days.map((d,i)=> (new Date(d).getUTCDay()===1? i : -1)).filter(i=>i>=0)))
function isWeekStart(i:number){ return weekSet.value.has(i) }
const todayISO = computed(() => props.todayISO ?? (()=>{ const d=new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })())
const todayIdx = computed(() => props.days.findIndex(d=>d===todayISO.value))
const transformX = computed(() => props.scrollLeft ? `translateX(-${props.scrollLeft}px)` : '')
</script>
