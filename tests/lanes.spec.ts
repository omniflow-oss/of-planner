import { describe, it, expect } from 'vitest'
import { computeLanes } from '@/utils/lanes'

describe('computeLanes', () => {
  it('stacks overlapping assignments into lanes', () => {
    const base = '2025-01-01'
    const items = [
      { id:'a1', person_id:'p1', project_id:'j1', start:'2025-01-03', end:'2025-01-07', allocation:1 },
      { id:'a2', person_id:'p1', project_id:'j1', start:'2025-01-05', end:'2025-01-10', allocation:1 },
      { id:'a3', person_id:'p1', project_id:'j1', start:'2025-01-11', end:'2025-01-12', allocation:1 },
    ] as any
    const { items: laned, laneCount } = computeLanes(base, items)
    // first two overlap -> lanes 0 and 1; third fits lane 0
    const map = Object.fromEntries(laned.map(i => [i.id, i._lane]))
    expect(map.a1).toBe(0)
    expect(map.a2).toBe(1)
    expect(map.a3).toBe(0)
    expect(laneCount).toBe(2)
  })
})

