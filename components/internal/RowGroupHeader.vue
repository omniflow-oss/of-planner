<template>
  <div
    class="isolate grid border-b-1 pane-border header-row isolate"
    :class="`grid-cols-[${LEFT_SIDEBAR_WIDTH}px 1fr]`"
    :style="{gridTemplateColumns: `${LEFT_SIDEBAR_WIDTH}px 1fr`}"
  >
    <!-- Group header row -->
    <div
      class="px-1 inline-block md:flex md:px-2 py-2 md:py-1 md:border-r-2 pane-border items-center gap-3 sticky left-0 z-10 md:bg-default left-label group md:border-b-2 border-slate-200 dark:border-slate-700 max-w-[30vw] md:max-w-none"
      draggable="false"
      style="-webkit-user-select: none; user-select: none;"
    >
      <!-- Drag Handle -->
      <div       
        v-if="!readonly"
        class="my-auto -mr-2.5 hidden md:block"   
      >
        <UIcon
          name="i-lucide-grip-vertical"
          class="align-middle group-drag-handle text-slate-300 size-4 cursor-grab hover:text-slate-500 focus:outline-none opacity-0 group-hover:opacity-100 "
          title="Drag to reorder"
        />
      </div>

      <!-- Expand/Collapse Caret -->
      <button
        class="hidden md:flex items-center justify-center w-6 h-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
        aria-label="Toggle"
        @click="$emit('toggle-expanded')"
      >
        <UIcon
          :name="expanded ? 'i-heroicons-chevron-down-20-solid' : 'i-heroicons-chevron-right-20-solid'"
          class="size-5 text-slate-800 dark:text-slate-200"
        />
      </button>

      <!-- Avatar & Info -->
      <div class="inline-flex md:flex items-center gap-2 flex-1 min-w-0 rounded-full bg-violet-300 pl-1 pr-2 md:pl-0 md:pr-0 py-1 shadow-md shadow-gray-500/50 md:rounded-none md:bg-transparent md:shadow-none md-py-0">
        <!-- Custom Avatar with Initials -->
        <div 
          :class="[
            'w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
            avatarBgColor,
            'text-white'
          ]"
          :title="label"
          @click="$emit('toggle-expanded')"
        >
          {{ avatarInitials }}
        </div>
        
        <!-- Name & Role/Team -->
        <div class="flex flex-col truncate flex-1">
          <span class="font-semibold text-sm text-slate-900 md:dark:text-slate-100 truncate leading-tight">
            {{ label }}
          </span>
          <span class="hidden md:inline text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight font-medium">
            {{ roleLabel }}
          </span>
        </div>
      </div>

      <!-- Capacity Badge -->
      <UBadge
        class="float-right hidden md:inline-block"
        size="sm"
        :color="badgeColor"
        variant="soft"
        :title="'Total man-days (visible window)'"
      >
        {{ totalMDBadge }}
      </UBadge>


      <!-- Actions Menu -->
      <div class="flex-shrink-0 hidden md:block" v-if="!readonly">
        <UDropdownMenu 
          :items="actionItems" 
          :ui="{ width: 'w-48' }"
          :popper="{ placement: 'bottom-start' }"
        >
          <UButton
            variant="ghost"
            icon="i-heroicons-ellipsis-vertical-20-solid"
            size="xs"
            class="opacity-0 group-hover:opacity-100"
          />
        </UDropdownMenu>
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
      class="relative border-r-2 pane-border timeline-bg bg-default/10 disabled-rows min-h-full"
      :style="{ height: headerHeight + 'px' }"
    >

      <!-- Per-day coverage overlays on header track -->
      <template
        v-for="(day, i) in capacityDisplay"
        :key="'cap' + i"
      >
        <div
          class="absolute inset-y-0"
          :class="coverageClass(day.index)"
          :style="{ left: lineLeft(day.index) + 'px', width: dayWidth(day.index) + 'px' }"
        >
          <div
            :class="{'hidden': pxPerDay < 44}"
            class="absolute top-0 right-0 px-1 py-0.5 text-[10px] text-slate-700 dark:text-slate-400"
          >
            {{ groupType === 'project' ? (capacityDaily[day.index] ?? 0) + 'd' : Math.round((capacityDaily[day.index] ?? 0) * 100) + '%' }}
          </div>
        </div>
      </template> 
    </div>
  </div>
</template>

<script setup lang="ts">

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

const capacityDisplay = computed(() => {
  const list = props.days.map((d, i) => ({day: d, index: i})).filter((d:any) => {
  //  if(props.hasUserTimeoffOnDay(props.subrow.person_id, d.day) && props.groupType === 'project') {
    if(props.capacityDaily && props.capacityDaily[d.index] !== undefined && props.capacityDaily[d.index] > 0) {
     return {day: d.day, index: d.index}
   }else {
     return null
   }
  })
  return list
})

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
    onSelect: () => props.groupType === 'person' ? emit('edit-person') : emit('edit-project')
  }],
  [{
    label: props.groupType === 'person' ? 'Assign Project' : 'Assign Person',
    icon: 'i-lucide-plus',
    onSelect: () => { setTimeout(() => { popoverOpen.value = true }, 200)  }
  }],
  // Add Time Off option only for persons
  ...(props.groupType === 'person' ? [[{
    label: 'Add Time Off',
    icon: 'i-lucide-calendar-off',
    onSelect: () => emit('add-click', { selectedId: 'TIMEOFF' })
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
}
.header-row {
  /* background-color: var(--background-color-default); */
  border-bottom-color: rgba(0,0,0,.1);
}
.dark .header-row {
  border-bottom-color: rgba(255,255,255,.25);
}
</style>