<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
  >
    <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
      <div class="text-sm font-medium mb-2">
        New person
      </div>
      <div class="space-y-2">
        <UFormField
          label="Name"
          help="Enter a unique person name"
        >
          <UInput
            v-model="personName"
            size="xs"
            placeholder="e.g. Ada"
          />
        </UFormField>
        <div
          v-if="error"
          class="text-xs text-error"
        >
          {{ error }}
        </div>
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <UButton
          size="xs"
          variant="outline"
          @click="$emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          size="xs"
          color="primary"
          @click="handleCreate"
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
  externalError?: string
}>()

const emit = defineEmits<{
  close: []
  create: [string]
}>()

const personName = ref('')
const error = ref('')

function handleCreate() {
  const name = personName.value.trim()
  if (!name) { 
    error.value = 'Name is required'
    return 
  }
  emit('create', name)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    personName.value = ''
    error.value = ''
  }
})

// Watch for external errors
watch(() => props.externalError, (newError) => {
  if (newError) {
    error.value = newError
  }
})
</script>