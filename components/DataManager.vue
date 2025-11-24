<template>
  <div class="flex items-center gap-2 p-2 bg-elevated rounded border border-default">
    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleFileSelect"
    >
    
    <!-- Custom File Input Button -->
    <UButton 
      :disabled="loading || store.isReadOnly"
      color="neutral"
      variant="outline"
      size="xs"
      :leading-icon="'i-lucide-folder-open'"
      title="Upload JSON data file"
      @click="triggerFileInput"
    >
      Choose File
    </UButton>

    <!-- Load Sample Data Button (only show when no data exists) -->
    <UButton 
      v-if="!store.hasData"
      :disabled="loading || store.isReadOnly"
      color="primary"
      size="xs"
      :leading-icon="'i-lucide-database'"
      title="Load sample data from /public/planner-data.json (5 people, 5 projects, 6 assignments)"
      @click="loadSampleData"
    >
      Load Sample
    </UButton>

    <!-- Clear Data Button (only show when data exists but can't be reset) -->
    <UButton 
      v-if="store.hasData && !store.canReset"
      :disabled="loading || store.isReadOnly"
      color="error"
      variant="outline"
      size="xs"
      :leading-icon="'i-lucide-trash-2'"
      title="Clear all data (people, projects, assignments)"
      @click="clearAllData"
    >
      Clear
    </UButton>

    <!-- Reset Data Button (only show when data can be reset) -->
    <UButton 
      v-if="store.canReset"
      :disabled="loading || store.isReadOnly"
      color="warning"
      variant="outline"
      size="xs"
      :leading-icon="'i-lucide-rotate-ccw'"
      title="Reset all changes back to initially loaded data"
      @click="resetData"
    >
      Reset
    </UButton>
    <!-- Download Button (only show when data is modified) -->
    <UButton 
      v-if="store.shouldShowDownload"
      :disabled="loading || store.isReadOnly"
      color="success" 
      size="xs"
      :leading-icon="'i-lucide-download'"
      title="Download modified data as JSON"
      @click="downloadData"
    >
      Download
    </UButton>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-sm text-blue-600"
    >
      Loading...
    </div>

    <!-- Status Display -->
    <div class="text-xs text-gray-600">
      People: {{ store.people.length }} | 
      Projects: {{ store.projects.length }} | 
      Assignments: {{ store.assignments.length }}
      <span
        v-if="store.isDataModified"
        class="text-orange-600 ml-2"
      >●</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlannerStore } from '@/stores/usePlannerStore'
import type { ExternalPlannerData } from '@/types/planner'

const store = usePlannerStore()
const globalSearch = inject('globalSearch') as Ref<string> | undefined
const fileInput = ref<HTMLInputElement>()
const loading = ref(false)
const toast = useToast()

// Define emits for navigation
const emit = defineEmits<{
  'go-to-today': []
}>()

// Helper function to navigate to today
const navigateToToday = () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayISO = today.toISOString().slice(0, 10)
  
  emit('go-to-today')
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

// Common function to handle data loading
const processData = async (data: ExternalPlannerData) => {
  store.loadDataFromObject(data)
  navigateToToday()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Validate file type
  if (!file.name.endsWith('.json')) {
    alert('Please select a JSON file')
    return
  }
  
  loading.value = true
  
  try {
    // Read file content
    const text = await file.text()
    const data: ExternalPlannerData = JSON.parse(text)
    
    // Process data 
    await processData(data)    
    toast.add({ title: 'Data loaded', description: 'JSON file imported successfully', color: 'success' })
    
  } catch (error) {
    console.error('Error loading JSON file:', error)
    toast.add({ title: 'Load failed', description: 'Invalid JSON file', color: 'error' })
  } finally {
    loading.value = false
    // Clear the input so the same file can be selected again
    if (fileInput.value) {
      fileInput.value.value = ''
    }
      // Clear global search when loading a new file
      if (globalSearch) globalSearch.value = ''
  }
}

const loadSampleData = async () => {
  // Show confirmation if there's existing data
  if (store.hasData) {
    const confirmed = confirm('Loading sample data will replace all current data. Continue?')
    if (!confirmed) return
  }
  
  loading.value = true
  
  try {
    const data = await store.loadDataFromJSON('planner-data.json')
    
    // Process data
    await processData(data)
    
    toast.add({ title: 'Sample loaded', description: 'Sample planner data loaded', color: 'success' })
  } catch (error) {
    console.error('Error loading sample data:', error)
    toast.add({ title: 'Sample load failed', description: 'Could not load sample data', color: 'error' })
  } finally {
    loading.value = false
    if (globalSearch) globalSearch.value = ''
  }
}

const resetData = () => {
  const confirmed = confirm('Reset all changes back to the initially loaded data?')
  if (confirmed) {
    store.resetToInitialData()
    toast.add({ title: 'Reset complete', description: 'State restored to initial data', color: 'warning' })
    if (globalSearch) globalSearch.value = ''
  }
}

const clearAllData = () => {
  const confirmed = confirm('Are you sure you want to clear all data? This action cannot be undone.')
  if (confirmed) {
    store.clearState()
    toast.add({ title: 'Data cleared', description: 'All data removed', color: 'error' })
    // Navigate to today after clearing data
    navigateToToday()
    // No need to set hasData, it is a getter
    if (globalSearch) globalSearch.value = ''
  }
}

const downloadData = () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  const filename = `planner-data-${timestamp}.json`
  store.downloadPlannerData(filename)
  toast.add({ title: 'Download started', description: filename, color: 'success' })
}
</script>
