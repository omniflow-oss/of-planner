import { nextTick, type Ref, ref, onMounted } from 'vue'
import { addDaysISO, calendarSpanForWeekdays } from '@/composables/useDate'

// Business-day aware infinite scroll for the timeline
export function useTimelineScroll(view: Ref<{ start:string; days:number; px_per_day:number }>, scrollArea: Ref<HTMLElement | null>) {
  const extending = ref(false)
  
  // Constants
  const SCROLL_THRESHOLD_WEEKS = 4
  const CHUNK_WEEKS = 4
  const CHUNK_WEEKDAYS = CHUNK_WEEKS * 5 // 20 weekdays
  
  // Helper functions
  const getScrollThreshold = () => view.value.px_per_day * SCROLL_THRESHOLD_WEEKS
  const getScrollDistance = (weeks: number) => weeks * view.value.px_per_day
  
  const updateScrollPosition = (el: HTMLElement, scrollLeft: number) => {
    if (scrollArea.value) {
      scrollArea.value.scrollLeft = scrollLeft
    }
  }

  async function prependWeekdays(w: number, nextPrev: boolean = false) {
    const el = scrollArea.value
    if (!el) return

    const oldScrollLeft = el.scrollLeft
    const oldScrollWidth = el.scrollWidth

    let cal = calendarSpanForWeekdays(view.value.start, w, -1)
    // Guard: clamp cal to reasonable bounds
    if (cal <= 0) return
    if (cal > CHUNK_WEEKDAYS * 10) cal = CHUNK_WEEKDAYS * 10
    view.value.start = addDaysISO(view.value.start, -cal)
    view.value.days = view.value.days + cal

    await nextTick()

      const deltaWidth = el.scrollWidth - oldScrollWidth
      if (deltaWidth > 0) {
        // Maintain the visual content by offsetting scrollLeft by the increase in scrollWidth
        const newScrollLeft = Math.max(0, oldScrollLeft + deltaWidth)
        updateScrollPosition(el, newScrollLeft)
      } else {
        // Fallback to anchor math (used by tests / deterministic behavior)
        const half = el.clientWidth / 2
        const anchor = el.scrollLeft + half
        const scrollDistance = getScrollDistance(w)
        const newScrollLeft = nextPrev ? el.scrollLeft - scrollDistance : anchor + scrollDistance - half
        updateScrollPosition(el, Math.max(0, newScrollLeft))
      }
  }

  async function appendWeekdays(w: number, nextPrev: boolean = false) {
    const el = scrollArea.value
    if (!el) return
    
    const oldScrollLeft = el.scrollLeft
    const oldScrollWidth = el.scrollWidth
    const endISO = addDaysISO(view.value.start, view.value.days - 1)
    let cal = calendarSpanForWeekdays(endISO, w, +1)
    if (cal <= 0) return
    if (cal > CHUNK_WEEKDAYS * 10) cal = CHUNK_WEEKDAYS * 10
    view.value.days = view.value.days + cal

    await nextTick()

      const deltaWidth = el.scrollWidth - oldScrollWidth
      if (deltaWidth > 0) {
        // Keep left offset stable so content does not jump
        const newScrollLeft = Math.max(0, oldScrollLeft)
        updateScrollPosition(el, newScrollLeft)
      } else {
        // Fallback to anchor math for deterministic tests
        const half = el.clientWidth / 2
        const anchor = el.scrollLeft + half
        const scrollDistance = getScrollDistance(w)
        const newScrollLeft = nextPrev ? el.scrollLeft + scrollDistance : anchor - half
        updateScrollPosition(el, Math.max(0, newScrollLeft))
      }
  }
  let lastScrollLeft:number = 0
  let lastScrollTop:number = 0
  onMounted(() => {
    lastScrollLeft = scrollArea.value?.scrollLeft || 0
    lastScrollTop = scrollArea.value?.scrollTop || 0
  })

  // Simple debounce to avoid repeated append/prepend triggered by touch momentum
  let lastExtendAt = 0
  const EXTEND_DEBOUNCE_MS = 250

  function onScroll() {
    const el:any = scrollArea.value
    if (!el || extending.value) {
      // update last positions to avoid stale diffs
      lastScrollLeft = el?.scrollLeft ?? lastScrollLeft
      lastScrollTop = el?.scrollTop ?? lastScrollTop
      return
    }

    const curLeft = el.scrollLeft
    const curTop = el.scrollTop
    const dLeft = Math.abs(curLeft - lastScrollLeft)
    const dTop = Math.abs(curTop - lastScrollTop)

    // Update last positions immediately for next event
    lastScrollLeft = curLeft
    lastScrollTop = curTop

    // Ignore mostly-vertical scrolls (user is scrolling page vertically)
    if (dLeft <= dTop || dLeft < 2) return

    const left = curLeft
    const right = left + el.clientWidth
    const threshold = getScrollThreshold()
    const nearLeft = left < threshold
    const nearRight = right > el.scrollWidth - threshold

    if (nearLeft || nearRight) {
      const now = Date.now()
      if (now - lastExtendAt < EXTEND_DEBOUNCE_MS) return
      lastExtendAt = now
      extending.value = true
      const operation = nearLeft ? prependWeekdays : appendWeekdays
      operation(CHUNK_WEEKDAYS).finally(() => { extending.value = false })
    }
  }

  async function init(todayISO: string) {
    await nextTick()
    const el = scrollArea.value
    if (!el) return

    // Compute Monday of the current week (UTC), then go back 2 weeks to get week-2 Monday
    const today = new Date(todayISO)
    const dow = today.getUTCDay() // 0..6 (Sun..Sat)
    const daysFromMonday = (dow + 6) % 7 // 0 if Mon, 6 if Sun
    const thisMonday = new Date(today)
    thisMonday.setUTCDate(thisMonday.getUTCDate() - daysFromMonday)
    const thisMondayISO = thisMonday.toISOString().slice(0, 10)
    
    // Week-2 Monday: 10 weekdays back from this Monday
    const toPrev2MonCal = calendarSpanForWeekdays(thisMondayISO, 10, -1)
    const prev2MondayISO = addDaysISO(thisMondayISO, -toPrev2MonCal)
    
    // Show: week-2, week-1, current week, next 4 weeks => 7 weeks total
    const totalWeekdays = 7 * 5 // 35 weekdays
    const rightCal = calendarSpanForWeekdays(prev2MondayISO, totalWeekdays - 1, +1)
    view.value.start = prev2MondayISO
    view.value.days = rightCal + 1

    // Start with scrollLeft = 0 so the viewport begins at previous Monday
    await nextTick()
    if (scrollArea.value) scrollArea.value.scrollLeft = 0
  }

  // Helper function for timeline expansion
  async function expandTimeline(weekdays: number, direction: 'previous' | 'next') {
    const el = scrollArea.value
    if (!el) return
    
    const threshold = getScrollThreshold()
    const scrollDistance = getScrollDistance(weekdays)
    
    if (direction === 'previous') {
      const nearLeft = el.scrollLeft < threshold
      
      if (nearLeft) {
        // Near left edge - expand timeline by adding previous weeks
        const cal = calendarSpanForWeekdays(view.value.start, weekdays, -1)
        view.value.start = addDaysISO(view.value.start, -cal)
        view.value.days = view.value.days + cal
      } else {
        // Not near edge - just scroll left to show existing content
        el.scrollLeft = Math.max(0, el.scrollLeft - scrollDistance)
      }
    } else {
      const nearRight = el.scrollLeft + el.clientWidth > el.scrollWidth - threshold
      
      if (nearRight) {
        // Near right edge - expand timeline by adding next weeks
        const endISO = addDaysISO(view.value.start, view.value.days - 1)
        const cal = calendarSpanForWeekdays(endISO, weekdays, +1)
        view.value.days = view.value.days + cal
        
        // Scroll to show some of the newly added content
        await nextTick()
        updateScrollPosition(el, el.scrollLeft + scrollDistance)
      } else {
        // Not near edge - just scroll right to show existing content
        el.scrollLeft += scrollDistance
      }
    }
  }

  // Smart navigation for next/prev buttons - expand only if near edges, otherwise just scroll
  const expandPrevious = (weekdays: number) => expandTimeline(weekdays, 'previous')
  const expandNext = (weekdays: number) => expandTimeline(weekdays, 'next')

  return { onScroll, init, prependWeekdays, appendWeekdays, expandPrevious, expandNext }
}
