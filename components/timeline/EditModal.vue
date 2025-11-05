<template>
  <div
    v-if="open && editState"
    class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
  >
    <div class="bg-default text-default border border-default rounded-md shadow-lg w-[28rem] max-w-[95vw] p-4 overflow-visible">
      <div class="flex items-center justify-between text-sm font-medium mb-3">
        <div>Edit Assignment</div>
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          :icon="'i-lucide-x'"
          aria-label="Close"
          @click="$emit('close')"
        />
      </div>
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-sm">
          <label class="w-20">Start</label>
          <UInput
            v-model="localStart"
            class="flex-1"
            type="date"
            size="xs"
          />
        </div>
        <div class="flex items-center gap-2 text-sm">
          <label class="w-20">End</label>
          <UInput
            v-model="localEnd"
            class="flex-1"
            type="date"
            size="xs"
          />
        </div>
        <div class="flex items-center gap-2 text-sm">
          <label class="w-20">Allocation</label>
          <USelect
            v-model="localAllocation"
            class="flex-1"
            size="xs"
            :items="[
              { label: '100% (1)', value: 1 },
              { label: '75% (¾)', value: 0.75 },
              { label: '50% (½)', value: 0.5 },
              { label: '25% (¼)', value: 0.25 }
            ]"
          />
        </div>
      </div>
      <div class="flex justify-between mt-4 pt-3 border-t border-default">
        <UButton
          color="error"
          size="xs"
          @click="$emit('delete')"
        >
          Delete
        </UButton>
        <div class="flex gap-2">
          <UButton
            variant="outline"
            size="xs"
            @click="$emit('close')"
          >
            Cancel
          </UButton>
          <UButton
            color="neutral"
            size="xs"
            @click="handleSave"
          >
            Save
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  editState: { id: string; start: string; end: string; allocation: 1|0.75|0.5|0.25 } | null
}>()

const emit = defineEmits<{
  close: []
  save: [editData: { start: string; end: string; allocation: 1|0.75|0.5|0.25 }]
  delete: []
}>()

// Create local reactive state to avoid mutating props
const localStart = ref('')
const localEnd = ref('')
const localAllocation = ref<1|0.75|0.5|0.25>(1)

// Watch for changes to editState prop and update local state
watch(() => props.editState, (newState) => {
  if (newState) {
    localStart.value = newState.start
    localEnd.value = newState.end
    localAllocation.value = newState.allocation
  } else {
    localStart.value = ''
    localEnd.value = ''
    localAllocation.value = 1
  }
}, { immediate: true })

// Handle save - emit the local values back to parent
function handleSave() {
  emit('save', {
    start: localStart.value,
    end: localEnd.value,
    allocation: localAllocation.value
  })
}
</script>