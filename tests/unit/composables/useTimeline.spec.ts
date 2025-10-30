import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTimeline, useTimelineGrid } from '@/composables/useTimeline'

describe('useTimeline', () => {
  it('derives weekday-only days, offsets, segments and labels', () => {
    const view = ref({ start: '2025-01-06', days: 14, px_per_day: 56 }) // Mon Jan 6, 2025
    const t = useTimeline(view as any)

    // Filters out weekends: 14 calendar days -> 10 weekdays
    expect(t.days.value.length).toBe(10)
    // Offsets are multiples of px_per_day
    expect(t.dayOffsets.value[0]).toBe(0)
    expect(t.dayOffsets.value[1]).toBe(56)

    // Week starts at index 0 (Mon) and again at index 5 (next Mon)
    expect(t.weekStarts.value).toEqual([0, 5])

    // Month segments and columns reflect total weekdays
    const totalPx = t.days.value.length * view.value.px_per_day
    expect(t.monthSegments.value.reduce((acc, s) => acc + s.span, 0)).toBe(10)
    expect(t.monthColumns.value).toBe(`${totalPx}px`)

    // Day label format dd-mm
    const label = t.dayLabel(t.days.value[0])
    expect(label).toMatch(/^\d{2}-\d{2}$/)
  })

  it('useTimelineGrid mirrors offsets and weekStarts for provided days', () => {
    const days = ref(['2025-01-06','2025-01-07','2025-01-08','2025-01-09','2025-01-10'])
    const px = ref(40)
    const g = useTimelineGrid(days, px)
    expect(g.dayOffsets.value).toEqual([0,40,80,120,160])
    expect(g.weekStarts.value).toEqual([0])
  })
})

