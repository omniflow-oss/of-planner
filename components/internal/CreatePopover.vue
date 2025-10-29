<template>
  <div class="fixed z-50" :style="{ left: x + 'px', top: y + 'px' }">
    <div class="bg-white border border-slate-200 rounded-md p-3 shadow-md w-56">
      <div class="flex items-center justify-between text-xs text-slate-500">
        <div>Quick create</div>
        <button class="px-2 py-1 border border-slate-200 rounded" @click.stop="$emit('cancel')">✕</button>
      </div>
      <div class="mt-2 flex items-center gap-2 text-sm">
        <label class="w-20 text-slate-500">Durée</label>
        <input class="px-2 py-1 border border-slate-200 rounded w-full" type="number" v-model.number="localDuration" min="1" />
      </div>
      <div class="mt-2 flex items-center gap-2 text-sm">
        <label class="w-20 text-slate-500">Allocation</label>
        <select class="px-2 py-1 border border-slate-200 rounded w-full" v-model.number="localAllocation">
          <option :value="1">1</option>
          <option :value="0.75">0.75</option>
          <option :value="0.5">0.5</option>
          <option :value="0.25">0.25</option>
        </select>
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <button class="px-2 py-1 text-sm border border-slate-200 rounded" @click.stop="$emit('cancel')">Cancel</button>
        <button class="px-2 py-1 text-sm bg-slate-900 text-white rounded" @click.stop="confirm">Create</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  x: number
  y: number
  duration?: number
  allocation?: 1 | 0.75 | 0.5 | 0.25
}>()
const emit = defineEmits<{
  (e: 'confirm', payload: { duration: number; allocation: 1 | 0.75 | 0.5 | 0.25 }): void
  (e: 'cancel'): void
}>()

const localDuration = ref(props.duration ?? 5)
const localAllocation = ref<(1 | 0.75 | 0.5 | 0.25)>(props.allocation ?? 1)

watch(() => props.duration, (d) => { if (d) localDuration.value = d })
watch(() => props.allocation, (a) => { if (a) localAllocation.value = a })

function confirm() {
  emit('confirm', { duration: Math.max(1, Number(localDuration.value) || 1), allocation: localAllocation.value })
}
</script>

