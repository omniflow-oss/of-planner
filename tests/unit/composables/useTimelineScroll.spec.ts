import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTimelineScroll } from '@/composables/useTimelineScroll'

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
})
