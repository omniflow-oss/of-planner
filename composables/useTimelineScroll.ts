import { nextTick, type Ref, ref } from 'vue'
import { addDaysISO, calendarSpanForWeekdays } from '@/composables/useDate'

// Business-day aware infinite scroll for the timeline
export function useTimelineScroll(view: Ref<{ start:string; days:number; px_per_day:number }>, scrollArea: Ref<HTMLElement | null>) {
  const extending = ref(false)
  
  // Cache scroll container dimensions to avoid repeated DOM measurements
  let cachedClientWidth = 0
  let cachedScrollWidth = 0
  let lastScrollLeft = 0
  let resizeObserver: ResizeObserver | null = null

  async function prependWeekdays(w: number, nextPrev: boolean = false) {
    const el = scrollArea.value
    if (!el) return
    const half = el.clientWidth / 2
    const anchor = el.scrollLeft + half
    const cal = calendarSpanForWeekdays(view.value.start, w, -1)
    view.value.start = addDaysISO(view.value.start, -cal)
    view.value.days = view.value.days + cal
    await nextTick();
    if (scrollArea.value) {
      if(!nextPrev){
        scrollArea.value.scrollLeft = anchor + w * view.value.px_per_day - half
      }else{
        scrollArea.value.scrollLeft = el.scrollLeft - (w * view.value.px_per_day);
      }
    }
  }

  async function appendWeekdays(w: number, nextPrev: boolean = false) {
    const el = scrollArea.value;
    if (!el) return
    const half = el.clientWidth / 2
    const anchor = el.scrollLeft + half
    const endISO = addDaysISO(view.value.start, view.value.days - 1)
    const cal = calendarSpanForWeekdays(endISO, w, +1)
    view.value.days = view.value.days + cal
    await nextTick()

    if (scrollArea.value) {  
      if(!nextPrev){
        scrollArea.value.scrollLeft = anchor - half;
      }else{
        scrollArea.value.scrollLeft =  el.scrollLeft + (w * view.value.px_per_day);
      }
    }
  }

  // Update cached dimensions without causing forced reflow
  function updateCachedDimensions() {
    const el = scrollArea.value
    if (!el) return
    
    // Only read DOM properties when absolutely necessary
    requestAnimationFrame(() => {
      if (!el) return
      cachedClientWidth = el.clientWidth
      cachedScrollWidth = el.scrollWidth
    })
  }

  function onScroll() {
    const el = scrollArea.value
    if (!el || extending.value) return
    
    // Only read scrollLeft - this is unavoidable but minimize other DOM reads
    const currentScrollLeft = el.scrollLeft
    
    // Skip if scroll position hasn't changed meaningfully (debounce micro-scrolls)
    if (Math.abs(currentScrollLeft - lastScrollLeft) < 2) return
    lastScrollLeft = currentScrollLeft
    
    // Use cached dimensions instead of live DOM measurements
    const threshold = view.value.px_per_day * 4
    const chunk = 5
    
    const nearLeft = currentScrollLeft < threshold
    const nearRight = currentScrollLeft + cachedClientWidth > cachedScrollWidth - threshold
    
    if (nearLeft) { 
      extending.value = true
      prependWeekdays(chunk).finally(() => { 
        extending.value = false
        // Update cache after timeline changes
        updateCachedDimensions()
      })
    }
    else if (nearRight) { 
      extending.value = true
      appendWeekdays(chunk).finally(() => { 
        extending.value = false
        // Update cache after timeline changes
        updateCachedDimensions()
      })
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
    if (scrollArea.value) {
      scrollArea.value.scrollLeft = 0
      lastScrollLeft = 0
    }
    
    // Initialize cached dimensions
    updateCachedDimensions()
    
    // Set up resize observer to update cached dimensions when container resizes
    if (resizeObserver) resizeObserver.disconnect()
    resizeObserver = new ResizeObserver(() => {
      updateCachedDimensions()
    })
    resizeObserver.observe(el)
  }

  // Cleanup function
  function cleanup() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  return { onScroll, init, prependWeekdays, appendWeekdays, cleanup }
}
