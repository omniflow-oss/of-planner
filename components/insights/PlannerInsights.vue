<template>
  <div class="space-y-6">
    <!-- Workload Level Line Chart -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-activity" class="w-4 h-4 text-gray-500" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Workload Over Time</h3>
        </div>
      </template>
      <div class="h-48 w-full">
        <LineChart :chart-data="projectWorkloadData" />
      </div>
    </UCard>

    <!-- Overburdened People -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-orange-500" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Overburdened People</h3>
        </div>
      </template>
      
      <div v-if="overburdenedPeople.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800 -m-4">
        <div 
          v-for="person in overburdenedPeople" 
          :key="person.id" 
          class="p-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div>
            <div class="font-medium text-sm text-gray-900 dark:text-white">{{ person.name }}</div>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ person.overburdenedDays }} days overloaded
            </div>
          </div>
          <UBadge color="orange" variant="subtle" size="xs">
            {{ person.overburdenedPercent }}% avg
          </UBadge>
        </div>
      </div>
      <div v-else class="text-center text-sm text-gray-500">
        No overburdened people detected.
      </div>
    </UCard>

    <!-- Starting Soon Projects -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar-clock" class="w-4 h-4 text-blue-500" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Projects Starting Soon</h3>
        </div>
      </template>

      <div v-if="startingSoonProjects.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800 -m-4">
        <div 
          v-for="project in startingSoonProjects" 
          :key="project.id" 
          class="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="font-medium text-sm text-gray-900 dark:text-white">{{ project.name }}</div>
          <div class="text-xs text-gray-500 flex items-center gap-1">
            <UIcon name="i-lucide-calendar" class="w-3 h-3" />
            {{ project.startDate }}
          </div>
        </div>
      </div>
      <div v-else class="text-center text-sm text-gray-500">
        No projects starting soon.
      </div>
    </UCard>

    <!-- Who's Free Next 2 Weeks -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user-check" class="w-4 h-4 text-green-500" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Free Next 2 Weeks</h3>
        </div>
      </template>

      <div v-if="whosFreeNext2Weeks.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800 -m-4">
        <button 
          v-for="person in whosFreeNext2Weeks" 
          :key="person.id" 
          class="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
          @click="$emit('person-click', person.id)"
        >
          <span class="font-medium text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {{ person.name }}
          </span>
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
        </button>
      </div>
      <div v-else class="text-center text-sm text-gray-500">
        Everyone is occupied in the next 2 weeks.
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import LineChart from '@/components/insights/LineChart.vue'
import { useInsights } from '@/composables/useInsights'

defineEmits<{
  'person-click': [id: string]
}>()

const {
  projectWorkloadData,
  overburdenedPeople,
  startingSoonProjects,
  whosFreeNext2Weeks
} = useInsights()
</script>
