<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[1000] grid place-items-center bg-black/30 popin"
  >
    <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
      <div class="text-sm font-medium mb-2">
        Edit Person
      </div>
      <div class="space-y-2">
        <!-- Person Name -->
        <UFormField
          label="Person Name"
          help="Enter the person's name"
        >
          <UInput
            v-model="form.name"
            size="xs"
            placeholder="Person name"
          />
        </UFormField>
      </div>
      <div class="mt-3 flex justify-between items-center">
        <UButton
          size="xs"
          color="error"
          variant="outline"
          :disabled="hasAssignments"
          :class="{ 
            'opacity-50 cursor-not-allowed': hasAssignments
          }"
          @click="handleDelete"
        >
          Delete Person
        </UButton>
        <div class="flex gap-2">
          <UButton
            size="xs"
            variant="outline"
            @click="closeModal"
          >
            Cancel
          </UButton>
          <UButton
            size="xs"
            @click="handleSave"
            :disabled="!form.name.trim() || nameExists"
          >
            Save Changes
          </UButton>
        </div>
      </div>
      <div v-if="nameExists" class="text-xs text-red-500 mt-1">
        A person with this name already exists
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface EditPersonForm {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  person?: {
    id: string;
    name: string;
  };
  hasAssignments?: boolean;
  existingNames?: string[];
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [person: { id: string; name: string }]
  delete: [personId: string]
}>()

const form = ref<EditPersonForm>({
  id: '',
  name: ''
})

// Check if name exists (excluding current person)
const nameExists = computed(() => {
  if (!form.value.name.trim() || !props.existingNames) return false
  
  return props.existingNames.some(name => 
    name.toLowerCase() === form.value.name.toLowerCase() && 
    props.person && 
    name.toLowerCase() !== props.person.name.toLowerCase()
  )
})

// Watch for person prop changes to populate form
watch(() => props.person, (newPerson) => {
  if (newPerson) {
    form.value = {
      id: newPerson.id,
      name: newPerson.name
    }
  }
}, { immediate: true })

// Focus input when modal opens
const { focusFirstInput } = useModalFocus()

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    focusFirstInput()
  }
})

const closeModal = () => {
  emit('close')
  // Reset form when closing
  form.value = {
    id: '',
    name: ''
  }
}

const handleSave = () => {
  if (form.value.name.trim() && !nameExists.value) {
    emit('save', {
      id: form.value.id,
      name: form.value.name.trim()
    })
    closeModal()
  }
}

const handleDelete = () => {
  if (window.confirm(`Are you sure you want to delete "${form.value.name}"? This action cannot be undone.`)) {
    emit('delete', form.value.id)
    closeModal()
  }
}
</script>