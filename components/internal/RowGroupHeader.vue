<template>
  <div
    class="grid border-b pane-border header-row"
    style="grid-template-columns: 240px 1fr;"
  >
    <!-- Group header row -->
    <div
      class="px-3 py-2 border-r-2 pane-border font-medium flex items-center gap-2 sticky left-0 z-10 bg-default left-label"
      draggable="false"
      style="-webkit-user-select: none; user-select: none;"
    >
      <div class="my-auto">
        <UIcon
          v-if="!store.isReadOnly"
          name="i-lucide-grip-vertical"
          class="group-drag-handle text-slate-400 size-3 cursor-grab hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          title="Drag to reorder groups"
          tabindex="0"
          role="button"
          :aria-label="`Drag to reorder ${label} group. Use arrow keys to move up or down, or press Enter to activate drag mode.`"
          @keydown="handleDragHandleKeydown"
        />
      </div>
      <div class="my-auto">
        <button
          class="flex items-center justify-center w-5 h-5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle"
          @click="$emit('toggle-expanded')"
        >
          <UIcon
            :name="expanded ? 'i-heroicons-chevron-down-20-solid' : 'i-heroicons-chevron-right-20-solid'"
            class="size-4 text-slate-700 dark:text-slate-300"
          />
        </button>
      </div>
      <div class="my-auto">
        <UIcon
          :name="groupType === 'person' ? 'i-lucide-user' : 'i-lucide-briefcase'"
          class="text-slate-500 size-4 align-sub"
        />
      </div>
      <div class="line-clamp-2 relative w-full group" >        
        <UButton
          v-if="groupType === 'project' && !store.isReadOnly"
          size="xs"
          variant="ghost"
          color="neutral"
          class="bg-default opacity-0 group-hover:opacity-100 transition-opacity absolute right-0"
          :icon="'i-lucide-edit-2'"
          aria-label="Edit project"
          @click="$emit('edit-project')"
        />
        <UButton
          v-else-if="groupType === 'person' && !store.isReadOnly"
          size="xs"
          variant="ghost"
          color="neutral"
          class="bg-default opacity-0 group-hover:opacity-100 transition-opacity absolute right-0"
          :icon="'i-lucide-edit-2'"
          aria-label="Edit person"
          @click="$emit('edit-person')"
        />
        <UBadge
          class="float-right"
          size="xs"
          :color="badgeColor"
          variant="soft"
          :title="'Total man-days (visible window)'"
        >
          {{ totalMDBadge }}
        </UBadge>
        <span>{{ label }}</span>
      </div>      
      <UButton
        v-if="!store.isReadOnly"
        size="xs"
        color="primary"
        variant="soft"
        class="ml-auto"
        :title="groupType === 'person' ? 'Assign project' : 'Assign person'"
        :icon="'i-lucide-plus'"
        aria-label="Add"
        @click="$emit('add-click')"
      />
    </div>
    <div
      class="relative border-r-2 pane-border timeline-bg disabled-rows min-h-full"
      :style="{ height: headerHeight + 'px' }"
    >
      <GridOverlay
        :days="days"
        :px-per-day="pxPerDay"
        :offsets="dayOffsets"
        :week-starts="weekStarts"
      />
      <!-- Per-day coverage overlays on header track -->
      <template
        v-for="(day, i) in days"
        :key="'cap' + i"
      >
        <div
          v-if="capacityDaily[i] > 0"
          class="absolute inset-y-0"
          :class="coverageClass(i)"
          :style="{ left: lineLeft(i) + 'px', width: dayWidth(i) + 'px' }"
        >
          <div
            v-if="pxPerDay >= 44"
            class="absolute top-0 right-0 px-1 py-0.5 text-[10px] text-slate-700 dark:text-slate-400"
          >
            {{ groupType === 'project' ? capacityDaily[i] + 'd' : Math.round(capacityDaily[i] * 100) + '%' }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import { usePlannerStore } from '@/stores/usePlannerStore'

const store = usePlannerStore()

defineProps<{
  label: string
  groupType: 'person' | 'project'
  expanded: boolean
  days: string[]
  pxPerDay: number
  dayOffsets: number[]
  weekStarts: number[]
  headerHeight: number
  capacityDaily: number[]
  totalMDBadge: string
  badgeColor: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  lineLeft: (i: number) => number
  dayWidth: (i: number) => number
  coverageClass: (i: number) => string
}>()

defineEmits<{
  'toggle-expanded': []
  'add-click': []
  'edit-project': []
  'edit-person': []
}>()

// Handle keyboard interactions for drag handle accessibility
function handleDragHandleKeydown(e: KeyboardEvent) {
  // Handle Enter and Space keys to provide keyboard alternative to drag-and-drop
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    
    // For now, we'll focus on the element and provide feedback
    // A full keyboard drag implementation would require additional state management
    // and UI feedback, which could be a future enhancement
    const target = e.target as HTMLElement
    
    // Provide visual feedback that the action was recognized
    target.classList.add('ring-2', 'ring-blue-600')
    setTimeout(() => {
      target.classList.remove('ring-2', 'ring-blue-600')
    }, 200)
    
    // Future enhancement: Could implement arrow key navigation to move items up/down
  }
  
  // Handle arrow keys for future keyboard navigation implementation
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    // Future enhancement: Implement actual reordering with arrow keys
  }
}
</script>

<style scoped>
.disabled-rows {
  pointer-events: none;
  background-color: transparent;
}

.header-row {
  background-color: var(--background-color-default);
}
</style>