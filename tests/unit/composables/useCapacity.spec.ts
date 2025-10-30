import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useCapacity } from '@/composables/useCapacity'

describe('useCapacity', () => {
  it('aggregates daily capacity for a person and sums total man-days', () => {
    const days = ref(['2025-01-06','2025-01-07','2025-01-08','2025-01-09','2025-01-10']) // Mon..Fri
    const assignments = ref([
      { id: 'a1', person_id: 'p1', project_id: 'j1', start: '2025-01-06', end: '2025-01-08', allocation: 1 as const },
      { id: 'a2', person_id: 'p1', project_id: 'j2', start: '2025-01-08', end: '2025-01-10', allocation: 0.5 as const },
      { id: 'a3', person_id: 'p2', project_id: 'j1', start: '2025-01-06', end: '2025-01-10', allocation: 1 as const }, // different person
    ])

    const cap = useCapacity(assignments as any, days, { type: 'person', id: 'p1' })
    expect(cap.daily.value).toEqual([1,1,1.5,0.5,0.5])
    // Sum = 4.5
    expect(cap.totalMD.value).toBe(4.5)
    expect(cap.formattedDaily.value).toEqual(['100%','100%','150%','50%','50%'])
  })

  it('aggregates capacity by project', () => {
    const days = ref(['2025-01-06','2025-01-07','2025-01-08'])
    const assignments = ref([
      { id: 'a1', person_id: 'p1', project_id: 'j1', start: '2025-01-06', end: '2025-01-08', allocation: 0.5 as const },
      { id: 'a2', person_id: 'p2', project_id: 'j1', start: '2025-01-07', end: '2025-01-08', allocation: 1 as const },
    ])
    const cap = useCapacity(assignments as any, days, { type: 'project', id: 'j1' })
    expect(cap.daily.value).toEqual([0.5,1.5,1.5])
    expect(cap.totalMD.value).toBe(3.5)
  })
})

