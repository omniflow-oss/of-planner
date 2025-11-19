import { businessDaysBetweenInclusive } from '@/composables/useDate'

export function manDays(startISO: string, endISO: string, allocation: number) {
  const days = Math.max(0, businessDaysBetweenInclusive(startISO, endISO))
  return days * allocation
}

// Returns [startIdx, endIdx] of intersection with days[] or null if none
export function clampToWindow(startISO: string, endISO: string, days: string[]): [number, number] | null {
  if (!days.length) return null
  const startIdx = days.findIndex(d => d >= startISO)
  const endIdx = (() => {
    let idx = -1
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] <= endISO) { idx = i; break }
    }
    return idx
  })()
  if (startIdx === -1 || endIdx === -1) return null
  const lastDay = days[days.length - 1]
  const firstDay = days[0]
  if (!lastDay || !firstDay) return null
  if (startISO > lastDay || endISO < firstDay) return null
  return [Math.max(0, startIdx), Math.max(0, Math.min(endIdx, days.length - 1))]
}


// Returns [startISO, endISO] of intersection with window [windowStart, windowEnd] or null
export function clampToWindowDate(startISO: string, endISO: string, windowStart: string, windowEnd: string): [string, string] | null {
  if (startISO > windowEnd || endISO < windowStart) return null
  const s = startISO < windowStart ? windowStart : startISO
  const e = endISO > windowEnd ? windowEnd : endISO
  return [s, e]
}
