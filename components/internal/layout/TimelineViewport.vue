<template>
  <div class="grid min-h-0" :style="{ gridTemplateColumns: leftWidth + 'px 1fr', gridTemplateRows: 'auto 1fr' }">
    <!-- Header row: left header area + right header area (non-scroll) -->
    <div>
      <slot name="headerLeft" />
    </div>
    <div class="relative overflow-hidden">
      <slot name="headerRight" />
    </div>

    <!-- Body rows: left (non-scroll, mirrors vertical), right (scroll master) -->
    <div class="relative overflow-hidden min-h-0" ref="leftBody">
      <div ref="leftContent" :style="{ transform: `translateY(-${scrollTop}px)` }">
        <slot name="bodyLeft" />
      </div>
    </div>
    <div class="relative overflow-auto min-h-0 border border-slate-200 rounded-md shadow-sm" ref="rightBody" @scroll.passive="onRightScroll">
      <slot name="bodyRight" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
const props = defineProps<{ leftWidth?: number }>()
const emit = defineEmits<{ (e: 'scroll', payload: { left: number; top: number }): void }>()

const leftWidth = computed(() => props.leftWidth ?? 240)
const rightBody = ref<HTMLElement | null>(null)
const leftContent = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

function onRightScroll() {
  if (!rightBody.value) return
  scrollTop.value = rightBody.value.scrollTop
  emit('scroll', { left: rightBody.value.scrollLeft, top: rightBody.value.scrollTop })
}

defineExpose({ rightBody })
</script>
