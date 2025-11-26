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

### Timeline.vue (Consumer)
```typescript
// Inject timeline events from app.vue
const timelineEvents = inject<{
  goToTodayEvent: Ref<string | null>
  addWeeksEvent: Ref<{ direction: 'previous' | 'next', weeks: number } | null>
}>('timelineEvents')

// Watch for events using Vue watchers
watch(() => timelineEvents?.goToTodayEvent.value, (todayIso) => {
  if (todayIso) {
    // Handle go to today logic
  }
})
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

### ✅ Performance
- No document event listeners
- Vue's optimized reactivity system
- Automatic cleanup on component unmount

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

## Debugging
The system is fully integrated with Vue DevTools for easy debugging and state inspection. No console logging needed for normal operation.