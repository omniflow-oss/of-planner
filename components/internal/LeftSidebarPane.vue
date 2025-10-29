<template>
  <div>
    <!-- Group header row (match height with right header track) -->
    <div class="px-3 border-b pane-border font-medium flex items-center gap-2 bg-white" :style="{ height: headerHeight + 'px' }">
      <button class="w-5 h-5 grid place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50" @click="$emit('toggle')">{{ expanded ? '–' : '+' }}</button>
      <slot name="headerPrefix" />
      <span class="truncate">{{ label }}</span>
    </div>

    <!-- Subrows -->
    <div v-if="expanded" v-for="sr in subrows" :key="sr.key" class="border-b pane-border bg-white" :style="{ height: rowHeights.get(sr.key) + 'px' }">
      <LeftPaneCell
        v-if="sr.kind==='item'"
        :title="sr.label"
      />
      <LeftPaneCell
        v-else
        :is-add="true"
        :title="cleanAddLabel(sr.label)"
        @click="$emit('createFromSidebar', sr)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import LeftPaneCell from '@/components/internal/LeftPaneCell.vue'
import { useRowHeights, type Subrow } from '@/composables/useRowHeights'
import { computeLanes } from '@/utils/lanes'
import { LANE_H, ROW_MIN } from '@/utils/layout'

const props = defineProps<{ label: string; subrows: Subrow[]; startISO: string; groupType?: 'person'|'project'; groupId?: string; expanded?: boolean }>()
const emit = defineEmits(['createFromSidebar','toggle'])

// Access assignments via inject (same as RowGroup)
const assignmentsKey = Symbol.for('assignmentsRef')
function usePlanner() { return inject<any>(assignmentsKey)! }
const assignmentsRef = usePlanner()

const subrowsRef = computed(() => props.subrows)
const startRef = computed(() => props.startISO)
const { rowHeights } = useRowHeights(startRef, subrowsRef, assignmentsRef)

// Match right header track height by computing lanes for the aggregated group
const headerLaneCount = computed(() => {
  if (!props.groupType || !props.groupId) return 1
  const list = assignmentsRef.value.filter((a: any) => (props.groupType === 'person' ? a.person_id === props.groupId : a.project_id === props.groupId))
  const { laneCount } = computeLanes(props.startISO, list)
  return laneCount || 1
})
const headerHeight = computed(() => Math.max(ROW_MIN, 16 + headerLaneCount.value * LANE_H))

const expanded = computed(() => props.expanded ?? true)

function cleanAddLabel(s: string) { return s.replace(/^\s*\+\s*/, '') }
</script>
