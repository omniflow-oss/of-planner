<template>
  <SlideOverPanel :is-open="isOpen" width="w-80" @close="$emit('close')">
    <div class="flex flex-col h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-l border-gray-200/50 dark:border-gray-800/50">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Settings
        </h3>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          class="-mr-2"
          @click="$emit('close')"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        
        <!-- View Options -->
        <section>
          <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            View Options
          </h4>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900 dark:text-white">Interactive Mode</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">Enable drag & drop editing</span>
              </div>
              <USwitch
                :model-value="!store.isReadOnly"
                @update:model-value="store.toggleReadOnly"
                color="primary"
              />
            </div>

            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900 dark:text-white">Lazy Loading</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">Optimize for large datasets</span>
              </div>
              <USwitch
                :model-value="store.isLazyLoadEnabled"
                @update:model-value="store.toggleLazyLoading"
                color="primary"
              />
            </div>
          </div>
        </section>

        <hr class="border-gray-200 dark:border-gray-800" />

        <!-- Data Management -->
        <section>
          <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Data Management
          </h4>
          <div class="space-y-3">
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleFileSelect"
            />
            
            <UButton
              block
              color="neutral"
              variant="outline"
              icon="i-lucide-upload"
              label="Import Data"
              @click="triggerFileInput"
            />

        <UButton
          block
          color="neutral"
          variant="outline"
          icon="i-lucide-database"
          label="Load Sample Data"
          :loading="loading"
          @click="loadSampleData"
        />

        <UButton
          block
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          label="Export Data"
          @click="store.downloadPlannerData()"
        />
        
        <div class="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>

        <UButton
          v-if="store.canReset"
          block
          color="warning"
          variant="soft"
          icon="i-lucide-rotate-ccw"
          label="Reset Changes"
          @click="store.resetToInitialData()"
        />

        <UButton
          v-if="store.hasData"
          block
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          label="Clear All Data"
          @click="clearAllData"
        />
          </div>
        </section>

        <hr class="border-gray-200 dark:border-gray-800" />

        <!-- About -->
        <section>
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Version</span>
            <span>{{ store.meta.version }}</span>
          </div>
        </section>

      </div>
    </div>
  </SlideOverPanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlannerStore } from '@/stores/usePlannerStore'
import type { ExternalPlannerData } from '@/types/planner'
import SlideOverPanel from '@/components/shell/SlideOverPanel.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['close', 'update:modelValue'])

const store = usePlannerStore()
const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const loading = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const triggerFileInput = () => {
  fileInput.value?.click()
}
// ... rest of the script


// Common function to handle data loading with lazy loading support
const processDataWithLazyLoading = async (data: ExternalPlannerData) => {
  if (store.isLazyLoadEnabled) {
    await store.enableLazyLoading(data)
  } else {
    store.loadDataFromObject(data)
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (!file.name.endsWith('.json')) {
    alert('Please select a JSON file')
    return
  }
  
  loading.value = true
  
  try {
    const text = await file.text()
    const data: ExternalPlannerData = JSON.parse(text)
    await processDataWithLazyLoading(data)    
    toast.add({ title: 'Data loaded', description: 'JSON file imported successfully', color: 'success' })
  } catch (error) {
    console.error('Error loading JSON file:', error)
    toast.add({ title: 'Load failed', description: 'Invalid JSON file', color: 'error' })
  } finally {
    loading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const loadSampleData = async () => {
  if (store.hasData) {
    const confirmed = confirm('Loading sample data will replace all current data. Continue?')
    if (!confirmed) return
  }
  
  loading.value = true
  
  try {
    const data = await store.loadDataFromJSON('planner-data.json')
    await processDataWithLazyLoading(data)
    toast.add({ title: 'Sample loaded', description: 'Sample planner data loaded', color: 'success' })
  } catch (error) {
    console.error('Error loading sample data:', error)
    toast.add({ title: 'Sample load failed', description: 'Could not load sample data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const clearAllData = () => {
  const confirmed = confirm('Are you sure you want to clear all data? This action cannot be undone.')
  if (confirmed) {
    store.clearState()
    toast.add({ title: 'Data cleared', description: 'All data removed', color: 'error' })
  }
}
</script>
