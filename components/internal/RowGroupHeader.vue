<template>
  <div
    class="grid border-b pane-border header-row"
    style="grid-template-columns: 280px 1fr;"
  >
    <!-- Group header row -->
    <!-- Group header row -->
    <div
      class="px-4 py-2 border-r-2 pane-border flex items-center gap-3 sticky left-0 z-10 bg-default left-label group border-b-2 border-slate-200 dark:border-slate-700"
      draggable="false"
      style="-webkit-user-select: none; user-select: none;"
    >
      <!-- Drag Handle -->
      <div       
        v-if="!readonly"
        class="my-auto"        
      >
        <UIcon
          name="i-lucide-grip-vertical"
          class="group-drag-handle text-slate-300 size-4 cursor-grab hover:text-slate-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        />
      </div>

      <!-- Expand/Collapse Caret -->
      <button
        class="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Toggle"
        @click="$emit('toggle-expanded')"
      >
        <UIcon
          :name="expanded ? 'i-heroicons-chevron-down-20-solid' : 'i-heroicons-chevron-right-20-solid'"
          class="size-5 text-slate-800 dark:text-slate-200"
        />
      </button>

      <!-- Avatar & Info -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <!-- Custom Avatar with Initials -->
        <div 
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
            avatarBgColor,
            'text-white'
          ]"
          :title="label"
        >
          {{ avatarInitials }}
        </div>
        
        <!-- Name & Role/Team -->
        <div class="flex flex-col truncate flex-1">
          <span class="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">
            {{ label }}
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight font-medium">
            {{ roleLabel }}
          </span>
        </div>
      </div>

      <!-- Capacity Badge -->
      <div class="flex-shrink-0">
         <span class="text-xs font-semibold text-slate-700 dark:text-slate-300" :title="'Total man-days (visible window)'">
           {{ totalMDBadge }}
         </span>
      </div>

      <!-- Actions Menu -->
      <div class="flex-shrink-0" v-if="!readonly">
        <UDropdown 
          :items="actionItems" 
          :ui="{ width: 'w-48' }"
          :popper="{ placement: 'bottom-start' }"
        >
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-ellipsis-vertical-20-solid"
            size="xs"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </UDropdown>
      </div>
      
      <!-- Hidden Popover for 'Add Assignment' logic (keeping existing logic for now) -->
      <div class="hidden">
         <UPopover v-model:open="popoverOpen">
            <div ref="popoverTrigger"></div>
            <template #content>
                <div style="width:20rem;">
                  <UCommandPalette
                    v-model="selection"
                    :multiple="true"
                    selected-icon="i-heroicons-check-20-solid"
                    :groups="[{ id: 'items', items: itemsForPalette } ]"
                    :ui="{ input: '[&>input]:h-8 [&>input]:text-sm' }"
                    placeholder="Search..."
                    @update:model-value="onSelect"
                  >
                    <template #item="{ item }">
                      <div class="flex items-center justify-between w-full">
                        <div class="truncate">{{ item.label }}</div>
                        <div class="ml-4 text-slate-400">
                          <UIcon v-if="item?.meta?.assigned" name="i-heroicons-check-20-solid" class="size-4" />
                        </div>
                      </div>
                    </template>
                    <template #empty>
                      <div class="flex flex-col items-center justify-center ">
                        <p class="text-gray-500 dark:text-gray-400 mb-4">No matching results found.</p>
                        <UButton :label="`New ${groupType=='project' ? 'person' : 'project'}?`" :leading-icon="'i-lucide-plus'" @click="handleCreateNew" />
                      </div>
                    </template>
                  </UCommandPalette>
                </div>
            </template>
         </UPopover>
      </div>
    </div>
    <div
      class="relative border-r-2 pane-border timeline-bg disabled-rows min-h-full"
      :style="{ height: headerHeight + 'px' }"
    >
      <GridOverlay
        :days="days"
        :px-per-day="pxPerDay"
        :offsets="dayOffsets"
        :week-starts="weekStarts"
      />
      <!-- Per-day coverage overlays on header track -->
      <template
        v-for="(day, i) in days"
        :key="'cap' + i"
      >
        <div
          v-if="(capacityDaily && capacityDaily[i] !== undefined) && capacityDaily[i] > 0"
          class="absolute inset-y-0"
          :class="coverageClass(i)"
          :style="{ left: lineLeft(i) + 'px', width: dayWidth(i) + 'px' }"
        >
          <div
            v-if="pxPerDay >= 44"
            class="absolute top-0 right-0 px-1 py-0.5 text-[10px] text-slate-700 dark:text-slate-400"
          >
            {{ groupType === 'project' ? (capacityDaily[i] ?? 0) + 'd' : Math.round((capacityDaily[i] ?? 0) * 100) + '%' }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'

const props = defineProps<{
  label: string
  groupType: 'person' | 'project'
  groupId: string,
  expanded: boolean
  days: string[]
  pxPerDay: number
  dayOffsets: number[]
  weekStarts: number[]
  headerHeight: number
  capacityDaily: number[]
  totalMDBadge: string
  readonly: boolean,
  badgeColor: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  lineLeft: (i: number) => number
  dayWidth: (i: number) => number
  coverageClass: (i: number) => string
  assignments: { id: string; person_id: string; project_id: string;  estimatedDays?: number | null }[]
  assignmentsOptions: { id: string; name: string; color?: string | null; emoji?: string | null; }[]
}>()

const emit = defineEmits<{
  'toggle-expanded': []
  'add-click': [{ selectedId?: string | null }]
  'create-popover': [{ newItem?: 'project' | 'person' }]
  'edit-project': []
  'edit-person': []
}>()

import { ref, computed, watch } from 'vue'
import { getInitials, getAvatarColor } from '@/utils/avatar'
import { usePlannerStore } from '@/stores/usePlannerStore'

const store = usePlannerStore()

const selection = ref<any>(props.assignmentsOptions ?? null)
const popoverOpen = ref(false)
const popoverTrigger = ref<HTMLElement | null>(null)

// Avatar computed properties
const avatarInitials = computed(() => getInitials(props.label))
const avatarBgColor = computed(() => getAvatarColor(props.label))

// Role label - get from store if person, otherwise show "Project"
const roleLabel = computed(() => {
  if (props.groupType === 'person') {
    const person = store.people.find(p => p.id === props.groupId)
    if (person?.role && person?.team) {
      return `${person.role} • ${person.team}`
    }
    if (person?.role) {
      return person.role
    }
    if (person?.team) {
      return person.team
    }
    return 'Team Member'
  }
  return 'Project'
})

const itemsForPalette = computed(() => (props.assignmentsOptions ?? []).map((i: { id: string; name: string;  }) => ({ id: i.id, label: i.name, value: i.id, meta: { assigned: checkAssigned(i.id) }, disabled: checkAssigned(i.id) , onSelect: (e: Event) => onSelect(i) })))
const checkAssigned = (itemId: string) => {
  if (props.groupType === 'person') {
    return props.assignments.findIndex(o => o.person_id == props.groupId && o.project_id == itemId) > -1
  } else {
    return props.assignments.findIndex(o => o.project_id == props.groupId && o.person_id == itemId) > -1
  }
}

// Action menu items
const actionItems = computed(() => [
  [{
    label: props.groupType === 'person' ? 'Edit Person' : 'Edit Project',
    icon: 'i-lucide-edit-2',
    click: () => props.groupType === 'person' ? emit('edit-person') : emit('edit-project')
  }],
  [{
    label: props.groupType === 'person' ? 'Assign Project' : 'Assign Person',
    icon: 'i-lucide-plus',
    click: () => { popoverOpen.value = true }
  }],
  // Add Time Off option only for persons
  ...(props.groupType === 'person' ? [[{
    label: 'Add Time Off',
    icon: 'i-lucide-calendar-off',
    click: () => emit('add-click', { selectedId: 'TIMEOFF' })
  }]] : [])
])

function onSelect (item: any) {
  if(item.id){
    emit('add-click', { selectedId: item.id })
    popoverOpen.value = false
  }
}

function handleCreateNew() {
  // Emit a create-popover request marked as a new item so parents can route to the correct modal
  if (props.groupType === 'person') {
    emit('create-popover', { newItem: 'project' })
  } else {
    emit('create-popover', { newItem: 'person' })
  }
  popoverOpen.value = false
}

// Handle keyboard interactions for drag handle accessibility
function handleDragHandleKeydown(e: KeyboardEvent) {
  // Handle Enter and Space keys to provide keyboard alternative to drag-and-drop
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    
    // For now, we'll focus on the element and provide feedback
    // A full keyboard drag implementation would require additional state management
    // and UI feedback, which could be a future enhancement
    const target = e.target as HTMLElement
    
    // Provide visual feedback that the action was recognized
    target.classList.add('ring-2', 'ring-blue-600')
    setTimeout(() => {
      target.classList.remove('ring-2', 'ring-blue-600')
    }, 200)
    
    // Future enhancement: Could implement arrow key navigation to move items up/down
  }
  
  // Handle arrow keys for future keyboard navigation implementation
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    // Future enhancement: Implement actual reordering with arrow keys
  }
}
</script>

<style scoped>
.disabled-rows {
  pointer-events: none;
  background-color: transparent;
}

.header-row {
  background-color: var(--background-color-default);
}
</style>