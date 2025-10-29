import { computed, type Ref } from 'vue'
import { computeLanes } from '@/utils/lanes'
import { LANE_H, PAD_Y, ROW_MIN } from '@/utils/layout'
import type { Assignment } from '@/types/planner'

export type Subrow =
  | { kind: 'item'; key: string; label: string; person_id: string; project_id: string }
  | { kind: 'add'; key: string; label: string; add: 'project' | 'person'; person_id?: string; project_id?: string }

// Computes per-subrow heights using lane stacking
export function useRowHeights(
  startISO: Ref<string>,
  subrows: Ref<Subrow[]>,
  assignments: Ref<Assignment[]>,
) {
  const heights = computed(() => {
    const map = new Map<string, number>()
    for (const sr of subrows.value) {
      if (sr.kind === 'add') {
        map.set(sr.key, ROW_MIN)
        continue
      }
      const list = assignments.value.filter(
        (a) => a.person_id === sr.person_id && a.project_id === sr.project_id,
      )
      const { laneCount } = computeLanes(startISO.value, list)
      const total = PAD_Y * 2 + laneCount * LANE_H
      map.set(sr.key, Math.max(ROW_MIN, total))
    }
    return map
  })

  return { rowHeights: heights }
}
