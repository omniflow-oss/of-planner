import { ref, onMounted, onUnmounted } from 'vue'
import { businessDaysBetweenInclusive } from '@/composables/useDate'
import { indexFromX, businessSegment } from '@/utils/grid'

// Constants for drag-to-create behavior
const AUTO_SCROLL_SPEED = 8 // px per frame
const LONG_PRESS_DELAY = 200 // ms - delay before showing drag preview
const RIGHT_CLICK_DELAY = 200 // ms - threshold for distinguishing right-click from long press
const CONTEXT_MENU_RESET_DELAY = 10 // ms - delay to reset right-click state

export function useDragToCreate(
  days: Ref<string[]>,
  pxPerDay: Ref<number>,
  dayOffsets: Ref<number[]>,
  startISO: Ref<string>,
  filteredSubrows: Ref<any[]>,
  onResizeEvent: Ref<boolean>
) {
  // Drag-to-create state
  const dragState = ref({
    active: false,
    rowKey: '',
    startX: 0,
    currentX: 0,
    startDayIndex: 0,
    endDayIndex: 0,
    previewLeft: 0,
    previewWidth: 0,
    longClickTimer: null as number | null,
    isLongClick: false
  })

  // Auto-scroll state
  const autoScrollState = ref({
    isScrolling: false,
    direction: 0, // -1 for left, 1 for right, 0 for no scroll
    animationId: null as number | null
  })

  // Consolidated interaction and right-click state
  const rightMouseState = ref({
    isDown: false,
    startTime: 0,
    timer: null as number | null,
    blocked: false,
    interactionCounter: 0
  })

  function getDayIndexFromX(x: number): number {
    return indexFromX(x, dayOffsets.value, pxPerDay.value, days.value.length)
  }

  function updatePreviewBar() {
    const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
    const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
    
    if (startIndex < 0 || endIndex < 0 || startIndex >= days.value.length || endIndex >= days.value.length) return
    const startDay = days.value[startIndex]
    const endDay = days.value[endIndex]
    if (startDay && endDay) {
      const seg = businessSegment(startISO.value, startDay, endDay, pxPerDay.value)
      dragState.value.previewLeft = seg.left
      dragState.value.previewWidth = seg.width
    }
  }

  // Auto-scroll helper functions
  function startAutoScroll(direction: number, timelineContainer: HTMLElement) {
    if (autoScrollState.value.isScrolling && autoScrollState.value.direction === direction) {
      return // Already scrolling in this direction
    }
    
    stopAutoScroll()
    autoScrollState.value.isScrolling = true
    autoScrollState.value.direction = direction
    
    const scroll = () => {
      if (!autoScrollState.value.isScrolling || !dragState.value.active) {
        return
      }
      
      timelineContainer.scrollLeft += direction * AUTO_SCROLL_SPEED
      
      // Update drag state after scroll
      if (dragState.value.rowKey) {
        const activeRow = document.querySelector(`[data-row-key="${dragState.value.rowKey}"]`)
        if (activeRow) {
          updateDragFromScroll()
        }
      }
      
      autoScrollState.value.animationId = requestAnimationFrame(scroll)
    }
    
    autoScrollState.value.animationId = requestAnimationFrame(scroll)
  }

  function stopAutoScroll() {
    if (autoScrollState.value.animationId) {
      cancelAnimationFrame(autoScrollState.value.animationId)
      autoScrollState.value.animationId = null
    }
    autoScrollState.value.isScrolling = false
    autoScrollState.value.direction = 0
  }

  function updateDragFromScroll() {
    if (dragState.value.active && dragState.value.rowKey) {
      const activeRow = document.querySelector(`[data-row-key="${dragState.value.rowKey}"]`)
      if (activeRow) {
        const x = dragState.value.currentX // Keep the relative mouse position
        dragState.value.endDayIndex = getDayIndexFromX(x)
        updatePreviewBar()
      }
    }
  }

  function resetDragState() {
    // Decrement interaction counter and unblock right clicks
    if (rightMouseState.value.interactionCounter > 0) {
      rightMouseState.value.interactionCounter--
    }
    
    // Only unblock right clicks when counter reaches 0
    if (rightMouseState.value.interactionCounter === 0) {
      rightMouseState.value.blocked = false
    }
    
    dragState.value.active = false
    dragState.value.isLongClick = false
    dragState.value.rowKey = ''
    dragState.value.startX = 0
    dragState.value.currentX = 0
    dragState.value.startDayIndex = 0
    dragState.value.endDayIndex = 0
    dragState.value.previewLeft = 0
    dragState.value.previewWidth = 0
    
    // Stop any active auto-scrolling
    stopAutoScroll()
  }

  function startDragCreate(e: MouseEvent, sr: any) {
    // Only trigger on left mouse button (button 0)
    if (e.button !== 0) return
    if (onResizeEvent.value) return
    
    // Increment interaction counter and block right clicks
    rightMouseState.value.interactionCounter++
    rightMouseState.value.blocked = true
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Save all critical state immediately before any mouse movement
    dragState.value.rowKey = sr.key
    dragState.value.startX = x
    dragState.value.currentX = x
    dragState.value.startDayIndex = getDayIndexFromX(x)
    dragState.value.endDayIndex = dragState.value.startDayIndex
    
    // Start long click timer (now just for preview display timing)
    dragState.value.longClickTimer = window.setTimeout(() => {
      dragState.value.active = true
      dragState.value.isLongClick = true
      updatePreviewBar()
    }, LONG_PRESS_DELAY)
  }

  function updateDragCreate(e: MouseEvent, sr: any) {
    // Only process if drag is active and this is the correct row, or if rowKey matches but sr.key is different (mouse moved outside)
    if (!dragState.value.active) return
    if (dragState.value.rowKey && dragState.value.rowKey !== sr.key) {
      // Mouse moved outside the original row; keep state bound to original row
      return
    }
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    
    dragState.value.currentX = x
    dragState.value.endDayIndex = getDayIndexFromX(x)
    updatePreviewBar()
  }

  function endDragCreate(e: MouseEvent, sr: any) {
    // Clear long click timer
    if (dragState.value.longClickTimer) {
      clearTimeout(dragState.value.longClickTimer)
      dragState.value.longClickTimer = null
    }
    
    // If drag is not active, handle as regular click
    if (!dragState.value.active) {
      resetDragState()
      return { success: false }
    }
    
    // If we have a saved rowKey but mouse ended on different row, still create assignment on original row
    if (dragState.value.rowKey && dragState.value.rowKey !== sr.key) {
      // Find the original subrow data using the saved rowKey
      const originalSubrow = filteredSubrows.value.find(subrow => subrow.key === dragState.value.rowKey)
      if (originalSubrow) {
        sr = originalSubrow // Use the original subrow for assignment creation
      }
    }
    
    // Calculate assignment details using business days logic (same as AssignmentBar)
    const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
    const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
    
    if (startIndex >= 0 && endIndex >= 0 && startIndex < days.value.length && endIndex < days.value.length) {
      const startDay = days.value[startIndex]
      const endDay = days.value[endIndex]
      
      // Calculate duration using business days (matching Timeline's onCreate expectation)
      if (startDay && endDay) {
        const duration = Math.max(1, businessDaysBetweenInclusive(startDay, endDay))
        
        resetDragState()
        
        // Return the assignment data instead of emitting directly
        return {
          success: true,
          assignment: {
            person_id: sr.person_id,
            project_id: sr.project_id,
            start: startDay,
            duration: duration,
            allocation: 1 // Default allocation
          }
        }
      }
    }
    
    resetDragState()
    return { success: false }
  }

  function cancelDragCreate() {
    // Clear long click timer
    if (dragState.value.longClickTimer) {
      clearTimeout(dragState.value.longClickTimer)
      dragState.value.longClickTimer = null
    }
    
    resetDragState()
  }

  function handleMouseDown(e: MouseEvent, sr: any) {
    if (e.button === 2) {
      // Right mouse button pressed
      rightMouseState.value.isDown = true
      rightMouseState.value.startTime = Date.now()
      rightMouseState.value.blocked = false // Start unblocked
      
      // Start timer to block context menu after long press threshold
      rightMouseState.value.timer = window.setTimeout(() => {
        if (rightMouseState.value.isDown) {
          rightMouseState.value.blocked = true
        }
      }, RIGHT_CLICK_DELAY)
      
      return { handled: true }
    }
    
    // Left mouse button or other - delegate to drag create
    startDragCreate(e, sr)
    return { handled: true }
  }

  function handleMouseUp(e: MouseEvent, sr: any) {
    if (e.button === 2) {
      // Right mouse button released
      rightMouseState.value.isDown = false
      
      // Clear the long press timer
      if (rightMouseState.value.timer) {
        clearTimeout(rightMouseState.value.timer)
        rightMouseState.value.timer = null
      }
      
      // Reset block state after a short delay to allow contextmenu event to fire
      setTimeout(() => {
        rightMouseState.value.blocked = false
      }, CONTEXT_MENU_RESET_DELAY)
      
      return { handled: true }
    }
    
    // Left mouse button or other - delegate to drag end
    return endDragCreate(e, sr)
  }

  // Handle context menu - only show create popup on simple right-click
  function handleContextMenu(e: MouseEvent) {
    // Always prevent default context menu
    e.preventDefault()
    e.stopPropagation()
    
    // Only show create popup if right clicks are not blocked
    return !rightMouseState.value.blocked && !dragState.value.active && !dragState.value.isLongClick && !dragState.value.longClickTimer && rightMouseState.value.interactionCounter === 0
  }

  // Global mouse event handlers for drag operations
  function createGlobalMouseHandlers() {
    const handleGlobalMouseUp = (_e: MouseEvent) => {
      if (dragState.value.active && dragState.value.rowKey) {
        // Find the original subrow data using the saved rowKey
        const originalSubrow = filteredSubrows.value.find(subrow => subrow.key === dragState.value.rowKey)
        if (originalSubrow) {
          // Calculate assignment details using business days logic
          const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
          const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
          
          if (startIndex >= 0 && endIndex >= 0 && startIndex < days.value.length && endIndex < days.value.length) {
            const startDay = days.value[startIndex]
            const endDay = days.value[endIndex]
            
            // Calculate duration using business days
            if (startDay && endDay) {
              const duration = Math.max(1, businessDaysBetweenInclusive(startDay, endDay))
              
              resetDragState()
              
              // Return assignment data for parent to handle
              return {
                person_id: originalSubrow.person_id,
                project_id: originalSubrow.project_id,
                start: startDay,
                duration: duration,
                allocation: 1
              }
            }
          }
        }
        
        resetDragState()
      } else if (dragState.value.active) {
        // Just cancel if no rowKey saved
        cancelDragCreate()
      }
      return null
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // This allows dragging to continue even when mouse leaves the row area
      if (dragState.value.active && dragState.value.rowKey) {
        // Find the active timeline track element
        const activeRow = document.querySelector(`[data-row-key="${dragState.value.rowKey}"]`)
        if (activeRow) {
          const rect = activeRow.getBoundingClientRect()
          const x = e.clientX - rect.left
          dragState.value.currentX = x
          dragState.value.endDayIndex = getDayIndexFromX(x)
          updatePreviewBar()
          
          // Auto-scroll when dragging beyond the edges of the timeline
          const timelineContainer = activeRow.closest('.overflow-auto') as HTMLElement || 
                                   document.querySelector('[ref="scrollArea"]') as HTMLElement ||
                                   document.querySelector('.overflow-auto') as HTMLElement
          
          if (timelineContainer) {
            const containerRect = timelineContainer.getBoundingClientRect()
            const scrollThreshold = 100 // pixels from edge to trigger scroll
            
            // Check if mouse is near right edge and should trigger auto-scroll
            if (e.clientX > containerRect.right - scrollThreshold) {
              startAutoScroll(1, timelineContainer)
            }
            // Auto-scroll left when near left edge
            else if (e.clientX < containerRect.left + scrollThreshold && timelineContainer.scrollLeft > 0) {
              startAutoScroll(-1, timelineContainer)
            }
            // Stop auto-scroll when mouse is in the middle area
            else if (autoScrollState.value.isScrolling) {
              stopAutoScroll()
            }
          }
        } else {
          // If activeRow is not found, still update currentX based on the original startX position
          // This prevents losing the drag state when mouse goes far outside
          dragState.value.currentX = e.clientX - dragState.value.startX
        }
      }
    }

    return { handleGlobalMouseUp, handleGlobalMouseMove }
  }

  // Setup and cleanup
  function cleanup() {
    if (dragState.value.longClickTimer) {
      clearTimeout(dragState.value.longClickTimer)
    }
    if (rightMouseState.value.timer) {
      clearTimeout(rightMouseState.value.timer)
    }
    stopAutoScroll()
  }

  onUnmounted(cleanup)

  return {
    // State
    dragState: readonly(dragState),
    rightMouseState: readonly(rightMouseState),

    // Methods
    handleMouseDown,
    handleMouseUp,
    updateDragCreate,
    cancelDragCreate,
    handleContextMenu,
    createGlobalMouseHandlers,
    cleanup
  }
}