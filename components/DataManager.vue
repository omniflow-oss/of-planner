<template>
  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded border">
    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileSelect"
      class="hidden"
    />
    
    <!-- Custom File Input Button -->
    <button 
      @click="triggerFileInput"
      :disabled="loading"
      class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
      title="Upload JSON data file"
    >
      📁 Choose File
    </button>

    <!-- Load Sample Data Button (only show when no data exists) -->
    <button 
      v-if="!store.hasData"
      @click="loadSampleData"
      :disabled="loading"
      class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Load sample data from /public/planner-data.json (5 people, 5 projects, 6 assignments)"
    >
      📊 Load Sample
    </button>

    <!-- Clear Data Button (only show when data exists but can't be reset) -->
    <button 
      v-if="store.hasData && !store.canReset"
      @click="clearAllData"
      :disabled="loading"
      class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Clear all data (people, projects, assignments)"
    >
      🗑️ Clear
    </button>

     <!-- Reset Data Button (only show when data can be reset) -->
    <button 
      v-if="store.canReset"
      @click="resetData"
      :disabled="loading"
      class="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Reset all changes back to initially loaded data"
    >
      🔄 Reset
    </button>
    <!-- Download Button (only show when data is modified) -->
    <button 
      v-if="store.shouldShowDownload"
      @click="downloadData" 
      class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      title="Download modified data as JSON"
    >
      📥 Download
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="text-sm text-blue-600">
      Loading...
    </div>

    <!-- Status Display -->
    <div class="text-sm text-gray-600">
      People: {{ store.people.length }} | 
      Projects: {{ store.projects.length }} | 
      Assignments: {{ store.assignments.length }}
      <span v-if="store.isDataModified" class="text-orange-600 ml-2">●</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlannerStore } from '@/stores/usePlannerStore'
import type { ExternalPlannerData } from '@/types/planner'

const store = usePlannerStore()
const fileInput = ref<HTMLInputElement>()
const loading = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
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
    
    // Load data using store method (automatically refreshes)
    store.loadDataFromObject(data)
    
  } catch (error) {
    console.error('Error loading JSON file:', error)
    alert('Failed to load JSON file. Please check the file format.')
  } finally {
    loading.value = false
    // Clear the input so the same file can be selected again
    if (fileInput.value) {
      fileInput.value.value = ''
    }
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
    await store.loadDataFromJSON('planner-data.json')
  } catch (error) {
    console.error('Error loading sample data:', error)
    alert('Failed to load sample data. Please check if planner-data.json exists in the public folder.')
  } finally {
    loading.value = false
  }
}

const resetData = () => {
  const confirmed = confirm('Reset all changes back to the initially loaded data?')
  if (confirmed) {
    store.resetToInitialData()
  }
}

const clearAllData = () => {
  const confirmed = confirm('Are you sure you want to clear all data? This action cannot be undone.')
  if (confirmed) {
    store.clearState()
  }
}

const downloadData = () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  const filename = `planner-data-${timestamp}.json`
  store.downloadPlannerData(filename)
}
</script>