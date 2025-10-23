import type { Assignment } from '@/types/planner'
import { parseISO } from '@/composables/useDate'

export type Laned = Assignment & { _lane: number; _startIndex: number; _endIndex: number }

export function toDayIndex(baseISO: string, dateISO: string) {
  const b = parseISO(baseISO).getTime()
  const d = parseISO(dateISO).getTime()
  return Math.round((d - b) / 86400000)
}

export function computeLanes(baseISO: string, items: Assignment[]): { items: Laned[]; laneCount: number } {
  const sorted = [...items].sort((a,b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
  const lanesLastEnd: number[] = []
  const out: Laned[] = []
  for (const a of sorted) {
    const s = toDayIndex(baseISO, a.start)
    const e = toDayIndex(baseISO, a.end)
    let lane = 0
    while (lane < lanesLastEnd.length && lanesLastEnd[lane] >= s) lane++
    if (lane === lanesLastEnd.length) lanesLastEnd.push(e)
    else lanesLastEnd[lane] = e
    out.push({ ...a, _lane: lane, _startIndex: s, _endIndex: e })
  }
  return { items: out, laneCount: lanesLastEnd.length || 1 }
}

