import { businessDaysBetweenInclusive, businessOffset } from '@/composables/useDate'

export const LEFT_SIDEBAR_WIDTH = 280  // width of the left sidebar in pixels

// Map an x offset within a row to the nearest day index using offsets if provided.
export function indexFromX(x: number, offsets: number[] | undefined | null, pxPerDay: number, daysLength: number): number {
  if (offsets && offsets.length === daysLength) {
    let idx = 0
    for (let i = 0; i < daysLength; i++) {
      const left = offsets[i] ?? i * pxPerDay
      const next = offsets[i + 1] ?? left + pxPerDay
      if (x < next) { idx = i; break }
      idx = i
    }
    return Math.max(0, Math.min(daysLength - 1, idx))
  }
  const approx = Math.round(x / pxPerDay)
  return Math.max(0, Math.min(daysLength - 1, approx))
}

// Compute left/width for a business-day segment, matching AssignmentBar visual math.
export function businessSegment(startIso: string, startDayISO: string, endDayISO: string, pxPerDay: number) {
  const startIndex = Math.max(0, businessOffset(startIso, startDayISO))
  const dayCount = Math.max(1, businessDaysBetweenInclusive(startDayISO, endDayISO))
  return {
    left: startIndex * pxPerDay,
    width: Math.max(1, dayCount * pxPerDay - 2), // -2 to mirror bar border
  }
}

