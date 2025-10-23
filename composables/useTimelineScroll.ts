import { nextTick, type Ref, ref } from 'vue'
import { addDaysISO } from '@/composables/useDate'

// Business-day aware infinite scroll for the timeline
export function useTimelineScroll(view: Ref<{ start:string; days:number; px_per_day:number }>, scrollArea: Ref<HTMLElement | null>) {
  const extending = ref(false)

  function calendarSpanForWeekdays(baseISO: string, weekdays: number, dir: 1|-1) {
    let span = 0
    let counted = 0
    while (counted < weekdays) {
      span += 1
      const d = new Date(baseISO)
      d.setUTCHours(0,0,0,0)
      d.setUTCDate(d.getUTCDate() + dir * span)
      const wd = d.getUTCDay()
      if (wd !== 0 && wd !== 6) counted += 1
    }
    return span
  }

  async function prependWeekdays(w: number) {
    const el = scrollArea.value
    if (!el) return
    const half = el.clientWidth / 2
    const anchor = el.scrollLeft + half
    const cal = calendarSpanForWeekdays(view.value.start, w, -1)
    view.value.start = addDaysISO(view.value.start, -cal)
    view.value.days = view.value.days + cal
    await nextTick()
    if (scrollArea.value) scrollArea.value.scrollLeft = anchor + w * view.value.px_per_day - half
  }

  async function appendWeekdays(w: number) {
    const el = scrollArea.value
    if (!el) return
    const half = el.clientWidth / 2
    const anchor = el.scrollLeft + half
    const endISO = addDaysISO(view.value.start, view.value.days - 1)
    const cal = calendarSpanForWeekdays(endISO, w, +1)
    view.value.days = view.value.days + cal
    await nextTick()
    if (scrollArea.value) scrollArea.value.scrollLeft = anchor - half
  }

  function onScroll() {
    const el = scrollArea.value
    if (!el) return
    const left = el.scrollLeft
    const right = left + el.clientWidth
    const threshold = view.value.px_per_day * 4
    const nearLeft = left < threshold
    const nearRight = right > el.scrollWidth - threshold
    const chunk = 5
    if (!extending.value) {
      if (nearLeft) { extending.value = true; prependWeekdays(chunk).finally(() => { extending.value = false }) }
      else if (nearRight) { extending.value = true; appendWeekdays(chunk).finally(() => { extending.value = false }) }
    }
  }

  async function init(todayISO: string) {
    await nextTick()
    const el = scrollArea.value
    if (!el) return
    const px = view.value.px_per_day
    const visibleWeekdays = Math.ceil(el.clientWidth / px)
    const leftBufferW = 14
    const rightBufferW = 28
    const leftCal = calendarSpanForWeekdays(todayISO, leftBufferW, -1)
    const rightCal = calendarSpanForWeekdays(todayISO, visibleWeekdays + rightBufferW, +1)
    view.value.start = addDaysISO(todayISO, -leftCal)
    view.value.days = leftCal + rightCal + 1
    await nextTick()
    if (scrollArea.value) scrollArea.value.scrollLeft = leftBufferW * px
  }

  return { onScroll, init }
}

