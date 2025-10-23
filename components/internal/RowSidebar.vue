<template>
  <div>
    <!-- Row label -->
    <div class="px-4 py-3 border-b border-slate-200 font-medium">{{ label }}</div>
    <!-- Subrow labels + add buttons -->
    <div v-for="sr in subrows" :key="sr.key" class="flex items-center gap-2 px-4 py-2 border-b border-slate-100 text-sm">
      <template v-if="isAddRow(sr)">
        <button class="w-6 h-6 grid place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" @click="onAdd(sr)">+</button>
        <span class="text-slate-500">{{ cleanAddLabel(sr.label) }}</span>
      </template>
      <template v-else>
        <span>{{ sr.label }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ label: string; subrows: { key: string; label: string; person_id: string|null; project_id: string|null }[] }>()
const emit = defineEmits(['add'])
function isAddRow(sr: any) { return String(sr.key).includes('__add__') }
function cleanAddLabel(s: string) { return s.replace(/^\s*\+\s*/,'') }
function onAdd(sr: any) { emit('add', sr) }
</script>
