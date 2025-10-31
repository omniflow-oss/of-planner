import { computed, type Ref } from 'vue'
import type { Assignment } from '@/types/planner'
import { clampToWindow } from '@/utils/alloc'

type Group = { type: 'person' | 'project'; id: string }

export function useCapacity(assignmentsRef: Ref<Assignment[]>, daysRef: Ref<string[]>, group: Group) {
  const filtered = computed(() =>
    assignmentsRef.value.filter(a => group.type === 'person' ? a.person_id === group.id : a.project_id === group.id)
  )

  const daily = computed<number[]>(() => {
    const days = daysRef.value
    const totals = Array(days.length).fill(0)
    for (const a of filtered.value) {
      const windowIdx = clampToWindow(a.start, a.end, days)
      if (!windowIdx) continue
      const [s, e] = windowIdx
      for (let i = s; i <= e; i++) {
        totals[i] += a.allocation
      }
    }
    return totals
  })

  const totalMD = computed(() => {
    // Sum per-day allocations within window equals man-days in window
    return daily.value.reduce((acc, v) => acc + v, 0)
  })

  const formattedDaily = computed(() => daily.value.map(v => `${Math.round(v * 100)}%`))

  return { daily, totalMD, formattedDaily }
}
