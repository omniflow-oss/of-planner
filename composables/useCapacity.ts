import { computed, type Ref } from 'vue'
import type { Assignment } from '@/types/planner'
import { clampToWindow } from '@/utils/alloc'

type Group = { type: 'person' | 'project'; id: string }

export function useCapacity(assignmentsRef: Ref<Assignment[]>, daysRef: Ref<string[]>, group: Group) {
  // Cache project people to avoid recalculation
  const projectPeople = computed(() => {
    if (group.type !== 'project') return new Set<string>()
    return new Set(
      assignmentsRef.value
        .filter(a => a.project_id === group.id)
        .map(a => a.person_id)
    )
  })

  const filtered = computed(() => {
    if (group.type === 'person') {
      // For person view: include all assignments (including time off) for the person
      return assignmentsRef.value.filter(a => a.person_id === group.id)
    } else {
      // For project view: include project assignments + time off for people assigned to this project
      // Include: 1) assignments to this project, 2) time off for people assigned to this project
      return assignmentsRef.value.filter(a => 
        a.project_id === group.id || // Assignments to this project
        (a.project_id === 'TIMEOFF' && projectPeople.value.has(a.person_id)) // Time off for project team members
      )
    }
  })

  const daily = computed<number[]>(() => {
    const days = daysRef.value
    const totals = Array(days.length).fill(0)
    
    if (group.type === 'project') {
      // For project view: sum allocations of users assigned to this project (excluding time off)
      const projectAssignments = assignmentsRef.value.filter(a => a.project_id === group.id)
      for (const a of projectAssignments) {
        const windowIdx = clampToWindow(a.start, a.end, days)
        if (!windowIdx) continue
        const [s, e] = windowIdx
        for (let i = s; i <= e; i++) {
          totals[i] += a.allocation
        }
      }
    } else {
      // For person view: sum all allocations (including time off)
      for (const a of filtered.value) {
        const windowIdx = clampToWindow(a.start, a.end, days)
        if (!windowIdx) continue
        const [s, e] = windowIdx
        for (let i = s; i <= e; i++) {
          totals[i] += a.allocation
        }
      }
    }
    
    return totals
  })

  const totalMD = computed(() => {
    if (group.type === 'project') {
      // For project view: sum all person-days (allocation × days for each assignment)
      let totalPersonDays = 0
      const projectAssignments = assignmentsRef.value.filter(a => a.project_id === group.id)
      for (const a of projectAssignments) {
        const windowIdx = clampToWindow(a.start, a.end, daysRef.value)
        if (!windowIdx) continue
        const [s, e] = windowIdx
        totalPersonDays += (e - s + 1) * a.allocation // Days × allocation percentage
      }
      return totalPersonDays
    } else {
      // For person view: sum per-day allocations within window equals man-days
      return daily.value.reduce((acc, v) => acc + v, 0)
    }
  })

  const formattedDaily = computed(() => daily.value.map(v => `${Math.round(v * 100)}%`))

  return { daily, totalMD, formattedDaily }
}
