<template>
  <div
    :class="[
      'flex items-center gap-2 h-full px-3 py-2 text-sm',
      isAdd ? 'text-slate-600 bg-slate-50 hover:bg-slate-100 cursor-pointer' : 'text-slate-800'
    ]"
    @click="onClick"
  >
    <div v-if="isAdd" class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded border border-slate-300 text-slate-700">+</div>
    <div class="min-w-0">
      <div class="truncate font-medium">{{ title }}</div>
      <div v-if="subtitle" class="truncate text-[11px] text-slate-500">{{ subtitle }}</div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'click'): void }>()
defineProps<{
  title: string
  subtitle?: string
  isAdd?: boolean
}>()

function onClick() {
  emit('click')
}
</script>

