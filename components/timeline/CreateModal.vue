<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
  >
    <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3 overflow-visible">
      <div class="flex items-center justify-between text-xs mb-2">
        <div>Quick create</div>
        <UButton
          size="xs"
          variant="outline"
          :icon="'i-lucide-x'"
          aria-label="Close"
          @click.stop="$emit('close')"
        />
      </div>
      <div class="mt-1 flex items-center gap-2 text-sm">
        <label class="w-20">Durée</label>
        <UInput
          v-model.number="duration"
          size="xs"
          class="w-full"
          type="number"
          min="1"
        />
      </div>
      <div class="mt-2 flex items-center gap-2 text-sm">
        <label class="w-20">Allocation</label>
        <USelect
          v-model="allocation"
          size="xs"
          class="w-full"
          :items="[
            { label: '1', value: 1 },
            { label: '0.75', value: 0.75 },
            { label: '0.5', value: 0.5 },
            { label: '0.25', value: 0.25 }
          ]"
        />
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <UButton
          size="xs"
          variant="outline"
          @click.stop="$emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          @click.stop="handleCreate"
        >
          Create
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  createState: { dayISO: string; person_id: string|null; project_id: string|null } | null
}>()

const emit = defineEmits<{
  close: []
  create: [{ person_id: string|null; project_id: string|null; start: string; duration: number; allocation: 1|0.75|0.5|0.25 }]
}>()

const duration = ref(5)
const allocation = ref(1 as 1|0.75|0.5|0.25)

function handleCreate() {
  if (!props.createState) return
  emit('create', { 
    person_id: props.createState.person_id, 
    project_id: props.createState.project_id, 
    start: props.createState.dayISO, 
    duration: duration.value, 
    allocation: allocation.value 
  })
}
</script>