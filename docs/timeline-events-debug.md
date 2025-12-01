# Vue Emit Events Implementation

## Overview
Implemented pure Vue emit functions using provide/inject pattern instead of document events for better Vue 3 compatibility and cleaner architecture.

## Architecture

### Event Flow
1. **ViewSwitcher.vue** → emits `go-to-today` / `add-weeks`
2. **AppHeader.vue** → receives events, passes to **app.vue**
3. **app.vue** → provides reactive refs via provide/inject
4. **Timeline.vue** → injects reactive refs and watches for changes

## Implementation Details

### app.vue (Provider)
```typescript
// Reactive refs for timeline events
const goToTodayEvent = ref<string | null>(null)
const addWeeksEvent = ref<{ direction: 'previous' | 'next', weeks: number } | null>(null)

// Provide timeline events to child components
provide('timelineEvents', {
  goToTodayEvent,
  addWeeksEvent
})

// Handle events and update reactive refs
function handleGoToToday(todayIso: string) {
  goToTodayEvent.value = todayIso
  // Auto-reset to allow re-triggering same event
  nextTick(() => {
    goToTodayEvent.value = null
  })
}
```

### Timeline.vue (Consumer & Virtualization)
```typescript
// Inject timeline events from app.vue
const timelineEvents = inject<{
  goToTodayEvent: Ref<string | null>
  addWeeksEvent: Ref<{ direction: 'previous' | 'next', weeks: number } | null>
}>('timelineEvents')

// Viewport virtualization
const visibleStartIdx = ref(0)
const visibleEndIdx = ref(0)

function updateVisibleRange() {
  if (!scrollArea.value || !daysContainer.value) return
  
  const containerWidth = scrollArea.value.clientWidth
  const scrollLeft = scrollArea.value.scrollLeft
  
  // Calculate visible range with buffer
  const BUFFER = 7
  const startDay = Math.floor(scrollLeft / pxPerDay.value)
  const endDay = Math.ceil((scrollLeft + containerWidth) / pxPerDay.value)
  
  visibleStartIdx.value = Math.max(0, startDay - BUFFER)
  visibleEndIdx.value = Math.min(days.value.length - 1, endDay + BUFFER)
}

// Mobile-optimized centering with measured offsets
watch(() => timelineEvents?.goToTodayEvent.value, (todayIso) => {
  if (todayIso && scrollArea.value) {
    const measuredLeft = getMeasuredLeft()
    const todayPosition = dayOffsets.value[todayIndex.value] || 0
    const halfDay = pxPerDay.value / 2
    const containerWidth = scrollArea.value.clientWidth
    
    const targetScroll = measuredLeft + todayPosition + halfDay - containerWidth / 2
    const maxScroll = Math.max(0, timelineWidth.value - containerWidth)
    const clampedScroll = Math.max(0, Math.min(targetScroll, maxScroll))
    
    scrollArea.value.scrollLeft = clampedScroll
  }
})
```

### useTimelineScroll.ts (Mobile Safeguards)
```typescript
// Scroll safeguards with conditional behavior
function onScroll() {
  if (!el?.value || debouncing.value) return
  
  const scrollLeft = el.value.scrollLeft
  const clientWidth = el.value.clientWidth
  
  // Mobile-specific behavior for screens < 768px
  const isMobileScreen = clientWidth < 768
  
  // Near-edge detection with debounce protection
  if (scrollLeft < EDGE_THRESHOLD) {
    prependWeekdays(1, 'previous', !isMobileScreen)
  } else if (scrollLeft > maxScroll - EDGE_THRESHOLD) {
    appendWeekdays(1)
  }
}

// Preserve visual offset during expansion
function prependWeekdays(weeks: number, direction: string, adjustScroll = true) {
  const prevScrollWidth = el?.value?.scrollWidth || 0
  
  // Add weeks to timeline
  const newSpan = calendarSpanForWeekdays(newStart, view.value.start)
  view.value.start = newStart
  view.value.days = newSpan.days
  
  // Maintain visual position if adjustScroll enabled
  if (adjustScroll && el?.value) {
    nextTick(() => {
      const scrollWidthDelta = (el.value?.scrollWidth || 0) - prevScrollWidth
      if (scrollWidthDelta > 0) {
        el.value!.scrollLeft += scrollWidthDelta
      }
    })
  }
}
```

## Benefits

### ✅ Vue Native
- Uses pure Vue 3 Composition API patterns
- No DOM event dependencies
- Fully reactive and traceable in Vue DevTools

### ✅ Type Safe
- Full TypeScript support with proper interfaces
- Compile-time error checking
- IntelliSense support

### ✅ Clean Architecture
- Clear separation of concerns
- No global event pollution
- Easy to test and maintain

### ✅ High Performance
- Viewport virtualization for large timelines
- Mobile-optimized scroll handling
- Debounced operations prevent crashes
- Only renders visible elements
- Vue's optimized reactivity system
- Automatic cleanup on component unmount

### ✅ Mobile Optimized
- Touch-aware context menu handling
- Conditional scroll behavior for small screens
- Crash prevention on specific problematic dates
- Smooth centering with measured DOM offsets
- Responsive timeline expansion

## Event Types

### Go To Today
- **Trigger**: Today button click in ViewSwitcher
- **Data**: `string` (ISO date)
- **Action**: Centers timeline on specified date

### Add Weeks
- **Trigger**: ‹/› navigation buttons in ViewSwitcher
- **Data**: `{ direction: 'previous' | 'next', weeks: number }`
- **Action**: Adds weeks to timeline start/end

## Auto-Reset Pattern
Events automatically reset to `null` using `nextTick()` to allow re-triggering the same event (e.g., clicking Today button multiple times).

## Performance Monitoring

### Viewport Virtualization Debug
- Monitor `visibleStartIdx`/`visibleEndIdx` in Vue DevTools
- Check `filteredAssignments` length vs total assignments
- Verify buffer zones are working correctly

### Mobile Scroll Debug
- Watch debounce timing in network-throttled environments
- Monitor scroll delta calculations for vertical vs horizontal
- Check conditional behavior activation (screen width < 768px)

### Memory Usage
- Timeline should render ~20-50 visible days instead of full range
- Assignment bars should be limited to viewport + buffer
- Header should only render visible day labels

## Debugging
The system is fully integrated with Vue DevTools for easy debugging and state inspection. Performance metrics can be monitored through browser DevTools Performance tab.

### Key Performance Indicators
- **Rendered Elements**: Should remain constant during scroll
- **Memory Usage**: Should not grow significantly with timeline expansion
- **Scroll FPS**: Should maintain 60fps on mobile devices
- **Event Frequency**: Debounced events should not exceed reasonable limits