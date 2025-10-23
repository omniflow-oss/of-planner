<template>
  <header class="sticky top-0 z-30 flex items-center justify-between px-3 py-2 border-b border-slate-200/70 bg-white/95 backdrop-blur">
    <div class="flex items-center gap-2">
      <div class="font-semibold tracking-tight">Capacity Planner</div>
      <span class="text-[10px] rounded px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600">PRD v2.9</span>
    </div>
    <ViewSwitcher />
  </header>
</template>

<script setup lang="ts">
import ViewSwitcher from '@/components/ViewSwitcher.vue'
</script>

