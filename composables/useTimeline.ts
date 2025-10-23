import { computed, type Ref } from 'vue'
import { eachDay } from '@/composables/useDate'

export function useTimeline(view: Ref<{ start:string; days:number; px_per_day:number }>) {
  const todayISO = (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })()

  const allDays = computed(() => eachDay(view.value.start, view.value.days))
  function isWeekend(iso: string) { const d = new Date(iso).getUTCDay(); return d===0 || d===6 }
  const days = computed(() => allDays.value.filter(d => !isWeekend(d)))
  const dayOffsets = computed(() => days.value.map((_, i) => i * view.value.px_per_day))
  const dayColumns = computed(() => days.value.map(() => `${view.value.px_per_day}px`).join(' '))

  function monthLabel(iso: string) { const d = new Date(iso); return d.toLocaleString('en-US', { month: 'long' }).toUpperCase() }
  function yearLabel(iso: string) { const d = new Date(iso); return String(d.getUTCFullYear()) }
  function dayLabel(iso: string) { const d = new Date(iso); const dd = String(d.getUTCDate()).padStart(2,'0'); const mm = String(d.getUTCMonth()+1).padStart(2,'0'); return `${dd}-${mm}` }

  const monthSegments = computed(() => {
    const out: { key:string; label:string; span:number }[] = []
    let current: { key:string; label:string; span:number } | null = null
    for (const iso of days.value) {
      const key = iso.slice(0,7)
      const label = monthLabel(iso)
      if (!current || current.key !== key) { if (current) out.push(current); current = { key, label, span: 0 } }
      current.span += 1
    }
    if (current) out.push(current)
    return out
  })
  const monthColumns = computed(() => monthSegments.value.map(s => `${s.span * view.value.px_per_day}px`).join(' '))

  const yearSegments = computed(() => {
    const out: { key:string; label:string; span:number }[] = []
    let current: { key:string; label:string; span:number } | null = null
    for (const iso of days.value) {
      const key = iso.slice(0,4)
      const label = yearLabel(iso)
      if (!current || current.key !== key) { if (current) out.push(current); current = { key, label, span: 0 } }
      current.span += 1
    }
    if (current) out.push(current)
    return out
  })
  const yearColumns = computed(() => yearSegments.value.map(s => `${s.span * view.value.px_per_day}px`).join(' '))

  const weekStarts = computed(() => days.value.map((d,i)=> ({i, wd: new Date(d).getUTCDay()})).filter(e=>e.wd===1).map(e=>e.i))

  return {
    todayISO,
    isWeekend,
    days,
    dayOffsets,
    dayColumns,
    dayLabel,
    monthSegments,
    monthColumns,
    yearSegments,
    yearColumns,
    weekStarts,
  }
}

