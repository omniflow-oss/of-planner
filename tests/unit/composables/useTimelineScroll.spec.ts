import { describe, it, expect, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useTimelineScroll } from '@/composables/useTimelineScroll'

beforeEach(() => {
  setActivePinia(createPinia())
})

function makeScrollArea(width = 1120) {
  const el = document.createElement('div') as any
  Object.defineProperty(el, 'clientWidth', { value: width, configurable: true })
  Object.defineProperty(el, 'scrollWidth', { value: width * 2, configurable: true })
  let _scrollLeft = 0
  Object.defineProperty(el, 'scrollLeft', {
    get: () => _scrollLeft,
    set: (v) => { _scrollLeft = v },
    configurable: true
  })
  el.scrollTo = function ({ left }: { left: number }) {
    _scrollLeft = left
  }
  return el as HTMLElement
}

describe('useTimelineScroll', () => {
  it('inits 7-week (35 weekdays) window starting week-2 Monday', async () => {
    const view = ref({ start: '2025-10-20', days: 1, px_per_day: 56 })
    const scrollArea = ref<HTMLElement | null>(makeScrollArea())
    const { init } = useTimelineScroll(view as any, scrollArea)

    // Fixed Monday to make calculation stable
    const monday = '2025-10-27'
    await init(monday)

    // Expect start to be 10 weekdays before monday => week-2 Monday = 2025-10-13
    expect(view.value.start).toBe('2025-10-13')
    // Expect days to span 7 weeks of weekdays => 35 weekdays
    // Converted to calendar span; for this fixed date, it should include weekends so days > 35
    expect(view.value.days).toBeGreaterThanOrEqual(35)
    expect(scrollArea.value!.scrollLeft).toBe(0)
  })

  it('prepends weekdays and updates start, days and scrollLeft', async () => {
    const view = ref({ start: '2025-01-13', days: 14, px_per_day: 40 }) // Mon
    const el = makeScrollArea(400)
    const scrollArea = ref<HTMLElement | null>(el)
    const { prependWeekdays } = useTimelineScroll(view as any, scrollArea)

    await prependWeekdays(5)
    await nextTick()
    // 5 business days back from Mon spans 7 calendar days to previous Mon
    expect(view.value.start).toBe('2025-01-06')
    expect(view.value.days).toBe(21)
    // scrollLeft anchored by ~w*px
    expect(scrollArea.value!.scrollLeft).toBe(200)
  })

  it('appends weekdays with and without nextPrev adjustment', async () => {
    const view = ref({ start: '2025-01-06', days: 21, px_per_day: 40 })
    const el = makeScrollArea(400)
    const scrollArea = ref<HTMLElement | null>(el)
    const { appendWeekdays } = useTimelineScroll(view as any, scrollArea)

    // set current scrollLeft so anchor math is deterministic
    ;(scrollArea.value as any).scrollLeft = 200
    await appendWeekdays(5)
    await nextTick()
    // anchor - half = 200
    expect(scrollArea.value!.scrollLeft).toBe(200)

    await appendWeekdays(5, true)
    await nextTick()
    // nextPrev=true moves by +w*px
    expect(scrollArea.value!.scrollLeft).toBe(400)
  })

  it('onScroll triggers prepend near left edge', async () => {
    const view = ref({ start: '2025-01-13', days: 14, px_per_day: 40 }) // Mon
    const el = makeScrollArea(400)
    const scrollArea = ref<HTMLElement | null>(el)
    const { onScroll } = useTimelineScroll(view as any, scrollArea)

    ;(scrollArea.value as any).scrollLeft = 100 // threshold = 160
    const startBefore = view.value.start
    onScroll()
    await nextTick()
    expect(view.value.start).not.toBe(startBefore)
  })

  it('onScroll triggers append near right edge', async () => {
    const view = ref({ start: '2025-01-13', days: 14, px_per_day: 40 })
    const el = makeScrollArea(400)
    const scrollArea = ref<HTMLElement | null>(el)
    const { onScroll } = useTimelineScroll(view as any, scrollArea)

    ;(scrollArea.value as any).scrollLeft = 500 // right = 900 > 640
    const daysBefore = view.value.days
    onScroll()
    await nextTick()
    expect(view.value.days).toBeGreaterThan(daysBefore)
  })
})
