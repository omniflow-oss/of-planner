<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[1000] grid place-items-center bg-black/30 popin"
  >
    <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
      <div class="text-sm font-medium mb-2">
        Edit Project
      </div>
      <div class="space-y-2">
        <!-- Project Name -->
        <UFormField
          label="Project Name"
          help="Enter the name for this project"
        >
          <UInput
            v-model="form.name"
            size="xs"
            placeholder="Project name"
            required
            :color="nameError ? 'error' : undefined"
          />
        </UFormField>

        <!-- Estimated Time -->
        <UFormField
          label="Estimated Time (days)"
          help="Enter the estimated time for this project"
        >
          <UInput
            v-model.number="form.estimatedDays"
            size="xs"
            type="number"
            placeholder="Enter estimated days"
            min="0"
            step="0.5"
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
          Delete Project
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
            :disabled="!isFormValid"
          >
            Save Changes
          </UButton>
        </div>
      </div>
      <div v-if="nameError" class="text-xs text-red-500 mt-1">
        {{ nameError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface EditProjectForm {
  id: string;
  name: string;
  estimatedDays: number | null;
}

interface Props {
  open: boolean;
  project?: {
    id: string;
    name: string;
    estimatedDays?: number | null;
  } | null;
  hasAssignments?: boolean;
  projects?: { id: string; name: string }[];
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [project: { id: string; name: string; estimatedDays: number | null }]
  delete: [projectId: string]
}>()

const form = ref<EditProjectForm>({
  id: '',
  name: '',
  estimatedDays: null
})

const nameError = ref<string | null>(null)

// Check if the current name is unique (excluding the current project)
const isNameUnique = computed(() => {
  if (!props.projects || !form.value.name.trim()) return true
  
  const trimmedName = form.value.name.trim().toLowerCase()
  return !props.projects.some(p => 
    p.id !== form.value.id && p.name.toLowerCase() === trimmedName
  )
})

// Check if form is valid
const isFormValid = computed(() => {
  return form.value.name.trim() && 
         isNameUnique.value
})

// Watch name changes to update error state
watch(() => form.value.name, (newName) => {
  if (newName.trim() && !isNameUnique.value) {
    nameError.value = 'A project with this name already exists'
  } else {
    nameError.value = null
  }
}, { immediate: false })

// Watch for project prop changes to populate form
watch(() => props.project, (newProject) => {
  if (newProject) {
    form.value = {
      id: newProject.id,
      name: newProject.name,
      estimatedDays: newProject.estimatedDays || null
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
  // Reset form and error when closing
  form.value = {
    id: '',
    name: '',
    estimatedDays: null
  }
  nameError.value = null
}

const handleSave = () => {
  if (isFormValid.value) {
    emit('save', {
      id: form.value.id,
      name: form.value.name.trim(),
      estimatedDays: form.value.estimatedDays
    })
    closeModal()
  }
}

const handleDelete = () => {
  if (window.confirm(`Are you sure you want to delete the project "${form.value.name}"? This action cannot be undone.`)) {
    emit('delete', form.value.id)
    closeModal()
  }
}
</script>