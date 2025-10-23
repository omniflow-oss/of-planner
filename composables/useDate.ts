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
