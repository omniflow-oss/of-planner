import { nextTick, type Ref } from 'vue'
import type { Person, Project } from '@/types/planner'

// Constants for DOM rendering and scrolling behavior
const DOM_RENDER_DELAY = 100 // ms - delay to ensure DOM is fully rendered after view switch
const SCROLL_PADDING = 10 // px - padding below sticky header when scrolling to target
const APPROXIMATE_ROW_HEIGHT = 150 // px - fallback height estimate when DOM element not found

/**
 * Composable for handling view switching and scrolling to specific items
 */
export const useViewNavigation = (
  scrollArea: Ref<HTMLElement | null>,
  sortablePeople: Ref<Person[]>,
  sortableProjects: Ref<Project[]>,
  switchMode: (mode: 'person' | 'project') => void
) => {
  // Generic function to handle view switching and scrolling to a specific item
  function handleViewSwitchAndScroll(targetId: string, targetMode: 'person' | 'project') {
    // Switch to the target view mode
    switchMode(targetMode)
    
    // Wait for the view to update then scroll to the target item
    nextTick(() => {
      // Wait a bit more for the DOM to fully render with the new view
      setTimeout(() => {
        if (!scrollArea.value) return
        
        // Try to find the actual DOM element for the target group
        const targetSelector = `.drag-group-row[data-group-id="${targetId}"]`
        const groupElement = scrollArea.value.querySelector(targetSelector) as HTMLElement
        
        if (groupElement) {
          // Use the actual DOM element position for precise scrolling
          const containerRect = scrollArea.value.getBoundingClientRect()
          const targetRect = groupElement.getBoundingClientRect()
          const currentScrollTop = scrollArea.value.scrollTop
          
          // Calculate the position relative to the scroll container
          const targetScrollPosition = currentScrollTop + (targetRect.top - containerRect.top)
          
          // Account for sticky header height - find the TimelineHeader element
          const headerElement = scrollArea.value.querySelector('.header-grid') as HTMLElement
          const headerHeight = headerElement ? headerElement.offsetHeight : 0
          
          // Add some offset to show the target below the sticky header with padding
          const scrollOffset = headerHeight + SCROLL_PADDING
          
          scrollArea.value.scrollTo({
            top: Math.max(0, targetScrollPosition - scrollOffset),
            behavior: 'smooth'
          })
        } else {
          // Fallback to approximate calculation if DOM element not found
          const sortedList = targetMode === 'person' ? sortablePeople.value : sortableProjects.value
          const targetIndex = sortedList.findIndex(item => item.id === targetId)
          
          if (targetIndex >= 0) {
            // Use a more conservative estimate
            const scrollPosition = targetIndex * APPROXIMATE_ROW_HEIGHT
            
            scrollArea.value.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            })
          }
        }
      }, DOM_RENDER_DELAY)
    })
  }

  // Handle click on project name to switch view and scroll to project
  function handleProjectClick(projectId: string) {
    handleViewSwitchAndScroll(projectId, 'project')
  }

  // Handle click on person name to switch view and scroll to person
  function handlePersonClick(personId: string) {
    handleViewSwitchAndScroll(personId, 'person')
  }

  return {
    handleViewSwitchAndScroll,
    handleProjectClick,
    handlePersonClick
  }
}