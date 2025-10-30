export function toISO(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return d.toISOString().slice(0, 10)
}

export function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDaysISO(s: string, days: number) {
  const d = parseISO(s)
  d.setUTCDate(d.getUTCDate() + days)
  return toISO(d)
}

export function daysBetweenInclusive(startISO: string, endISO: string) {
  const s = parseISO(startISO)
  const e = parseISO(endISO)
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

export function eachDay(startISO: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDaysISO(startISO, i))
}

export function clampDateRange(startISO: string, endISO: string) {
  const s = parseISO(startISO)
  const e = parseISO(endISO)
  if (e < s) return { start: toISO(e), end: toISO(s) }
  return { start: toISO(s), end: toISO(e) }
}

// Business day helpers (Mon–Fri)
export function isWeekendISO(s: string) {
  const d = parseISO(s).getUTCDay()
  return d === 0 || d === 6
}

// Count weekdays between two ISO dates inclusive of both ends (order-agnostic)
export function businessDaysBetweenInclusive(aISO: string, bISO: string) {
  let a = parseISO(aISO)
  let b = parseISO(bISO)
  let sign = 1
  if (b < a) { const t = a; a = b; b = t; sign = -1 }
  let count = 0
  const cur = new Date(a)
  while (cur <= b) {
    const d = cur.getUTCDay()
    if (d !== 0 && d !== 6) count++
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return count * sign
}

// Offset in business days from base to date (base -> 0). Negative if before.
export function businessOffset(baseISO: string, dateISO: string) {
  const base = parseISO(baseISO)
  const date = parseISO(dateISO)
  if (date.getTime() === base.getTime()) return 0
  let count = 0
  const step = date > base ? 1 : -1
  const cur = new Date(base)
  while (cur.getTime() !== date.getTime()) {
    cur.setUTCDate(cur.getUTCDate() + step)
    const d = cur.getUTCDay()
    if (d !== 0 && d !== 6) count += step
  }
  return count
}

// Convert a number of weekdays into the equivalent calendar-day span
// starting from a base date (exclusive), moving forward (dir=+1) or backward (dir=-1).
export function calendarSpanForWeekdays(baseISO: string, weekdays: number, dir: 1|-1) {
  let span = 0
  let counted = 0
  while (counted < weekdays) {
    span += 1
    const d = parseISO(baseISO)
    d.setUTCDate(d.getUTCDate() + dir * span)
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) counted += 1
  }
  return span
}

// Add business days to a date (skipping weekends)
export function addBusinessDaysISO(startISO: string, businessDays: number) {
  if (businessDays <= 0) return startISO
  
  const d = parseISO(startISO)
  let added = 0
  
  while (added < businessDays) {
    d.setUTCDate(d.getUTCDate() + 1)
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) added += 1
  }
  
  return toISO(d)
}
