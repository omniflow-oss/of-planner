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
  if (startISO > days[days.length - 1] || endISO < days[0]) return null
  return [Math.max(0, startIdx), Math.max(0, Math.min(endIdx, days.length - 1))]
}

