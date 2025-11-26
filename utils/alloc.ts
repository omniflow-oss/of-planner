import { businessDaysBetweenInclusive } from '@/composables/useDate'

export function manDays(startIso: string, endISO: string, allocation: number) {
  const days = Math.max(0, businessDaysBetweenInclusive(startIso, endISO))
  return days * allocation
}

// Returns [startIdx, endIdx] of intersection with days[] or null if none
export function clampToWindow(startIso: string, endISO: string, days: string[]): [number, number] | null {
  if (!days.length) return null
  const startIdx = days.findIndex(d => d >= startIso)
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
  if (startIso > lastDay || endISO < firstDay) return null
  return [Math.max(0, startIdx), Math.max(0, Math.min(endIdx, days.length - 1))]
}


// Returns [startIso, endISO] of intersection with window [windowStart, windowEnd] or null
export function clampToWindowDate(startIso: string, endISO: string, windowStart: string, windowEnd: string): [string, string] | null {
  if (startIso > windowEnd || endISO < windowStart) return null
  const s = startIso < windowStart ? windowStart : startIso
  const e = endISO > windowEnd ? windowEnd : endISO
  return [s, e]
}

// Only handle context menu on non-touch / desktop devices
export function isTouchDevice() {
  try {
    if (typeof window === 'undefined') return false
    if ('ontouchstart' in window) return true
    if ((navigator as any)?.maxTouchPoints > 0) return true
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true
  } catch (err) {
    return false
  }
  return false
}


// Helper to determine best text color (black or white) based on background hex
export function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#0f172a' : '#ffffff'; // slate-900 or white
}