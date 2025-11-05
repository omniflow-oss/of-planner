import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'

export function useTimelineSorting() {
  const store = usePlannerStore()
  const { people, projects, peopleSortOrder, projectsSortOrder } = storeToRefs(store)

  // Sortable arrays for drag-and-drop reordering
  const sortablePeople = ref<typeof people.value>([])
  const sortableProjects = ref<typeof projects.value>([])

  // Update sortable arrays when store data changes, respecting sort order
  watch([people, peopleSortOrder], ([newPeople, sortOrder]) => {
    if (sortOrder.length === 0) {
      sortablePeople.value = [...newPeople]
    } else {
      // Optimize with O(1) lookups using Map/Set
      const peopleMap = new Map(newPeople.map(p => [p.id, p]))
      const sortOrderSet = new Set(sortOrder)
      
      // Sort according to stored order, placing unordered items at the end
      const ordered = sortOrder
        .map(id => peopleMap.get(id))
        .filter((p): p is typeof newPeople[number] => p !== undefined)
      const unordered = newPeople.filter(p => !sortOrderSet.has(p.id))
      sortablePeople.value = [...ordered, ...unordered]
    }
  }, { immediate: true, deep: true })

  watch([projects, projectsSortOrder], ([newProjects, sortOrder]) => {
    if (sortOrder.length === 0) {
      sortableProjects.value = [...newProjects]
    } else {
      // Optimize with O(1) lookups using Map/Set
      const projectsMap = new Map(newProjects.map(p => [p.id, p]))
      const sortOrderSet = new Set(sortOrder)
      
      // Sort according to stored order, placing unordered items at the end
      const ordered = sortOrder
        .map(id => projectsMap.get(id))
        .filter((p): p is typeof newProjects[number] => p !== undefined)
      const unordered = newProjects.filter(p => !sortOrderSet.has(p.id))
      sortableProjects.value = [...ordered, ...unordered]
    }
  }, { immediate: true, deep: true })

  // Drag-and-drop sort handlers
  function onPersonSortEnd() {
    const newOrder = sortablePeople.value.map(p => p.id)
    store.updatePeopleSortOrder(newOrder)
  }

  function onProjectSortEnd() {
    const newOrder = sortableProjects.value.map(p => p.id)
    store.updateProjectsSortOrder(newOrder)
  }

  return {
    sortablePeople,
    sortableProjects,
    onPersonSortEnd,
    onProjectSortEnd
  }
}