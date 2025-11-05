import { ref, watch, computed } from 'vue'
import { usePlannerStore } from '@/stores/usePlannerStore'

export interface SubrowItem {
  key: string
  label: string
  person_id: string | null
  project_id: string | null
  isTimeOff?: boolean
}

export function useRowSorting(
  groupId: Ref<string>,
  subrows: Ref<SubrowItem[]>
) {
  const store = usePlannerStore()
  
  // Filter out the add rows since we now have the + button in the header
  const filteredSubrows = computed(() => {
    return subrows.value.filter(sr => !isAddRow(sr))
  })

  // Sortable subrows for drag and drop
  const sortableSubrows = ref<SubrowItem[]>([])

  function isAddRow(sr: SubrowItem) { 
    return String(sr.key).includes('__add__') || sr.person_id === null || sr.project_id === null 
  }

  // Update sortableSubrows when filteredSubrows changes, respecting stored sort order
  watch(filteredSubrows, (newSubrows) => {
    const storedOrder = store.getSubrowSortOrder(groupId.value)
    
    if (storedOrder.length === 0) {
      // No stored order exists, just use current order for display
      // Note: Store will be initialized later when user actually reorders items
      sortableSubrows.value = [...newSubrows]
    } else {
      // Apply stored order, placing unordered items at the end
      // Optimize with O(1) lookups using Map/Set
      const subrowsMap = new Map(newSubrows.map(sr => [sr.key, sr]))
      const storedOrderSet = new Set(storedOrder)
      
      const ordered = storedOrder
        .map(key => subrowsMap.get(key))
        .filter((sr): sr is SubrowItem => sr !== undefined)
      const unordered = newSubrows.filter(sr => !storedOrderSet.has(sr.key))
      
      // Ensure disable-drag items (timeoff rows) always stay at the top
      const disabledOrdered = ordered.filter(sr => sr.isTimeOff)
      const enabledOrdered = ordered.filter(sr => !sr.isTimeOff)
      const disabledUnordered = unordered.filter(sr => sr.isTimeOff)
      const enabledUnordered = unordered.filter(sr => !sr.isTimeOff)
      
      sortableSubrows.value = [...disabledOrdered, ...disabledUnordered, ...enabledOrdered, ...enabledUnordered]
      
      // Note: Do not update the store here for new items. Store will only be updated 
      // when user explicitly reorders items via drag & drop (onSortEnd).
    }
  }, { immediate: true })

  // Handle drag end event
  function onSortEnd() {  
    // Ensure disable-drag items (timeoff rows) always stay at the top
    const disabledItems = sortableSubrows.value.filter(sr => sr.isTimeOff)
    const enabledItems = sortableSubrows.value.filter(sr => !sr.isTimeOff)
    
    // Reorder: disabled items first, then enabled items
    sortableSubrows.value = [...disabledItems, ...enabledItems]
    
    // Save the new order to the store
    const newOrder = sortableSubrows.value.map(sr => sr.key)
    store.updateSubrowSortOrder(groupId.value, newOrder)
  }

  return {
    filteredSubrows,
    sortableSubrows,
    onSortEnd
  }
}