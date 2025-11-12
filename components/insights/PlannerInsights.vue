<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-2">Planner Insights</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Workload Level Line Chart -->
      <div class="bg-white rounded shadow p-3">
        <h3 class="text-sm font-semibold mb-2">Project Workload Over Time</h3>
         {{ projectWorkloadData }}
        <LineChart :chart-data="projectWorkloadData" />
      </div>
      <!-- Overburdened People -->
      <div class="bg-white rounded shadow p-3">
        <h3 class="text-sm font-semibold mb-2">Overburdened People</h3>
        <ul>
          <li v-for="person in overburdenedPeople" :key="person.id" class="mb-1">
            <span class="font-medium">{{ person.name }}</span> — {{ person.totalAllocation }}d
          </li>
        </ul>
      </div>
      <!-- Starting Soon Projects -->
      <div class="bg-white rounded shadow p-3">
        <h3 class="text-sm font-semibold mb-2">Projects Starting Soon</h3>
        <ul>
          <li v-for="project in startingSoonProjects" :key="project.id" class="mb-1">
            <span class="font-medium">{{ project.name }}</span> — Starts {{ project.startDate }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlannerStore } from '@/stores/usePlannerStore'
import LineChart from '@/components/insights/LineChart.vue'

const store = usePlannerStore()

// Project workload data for line chart (dummy structure, real logic needed)
const projectWorkloadData = computed(() => {
  // Example: [{ label: 'Project A', data: [1,2,3,...] }, ...]
  // TODO: Aggregate assignments per project per day
  return {
    labels: [],
    datasets: []
  }
})

// Overburdened people (allocation > threshold)
const overburdenedPeople = computed(() => {
  // TODO: Calculate total allocation per person, filter by threshold
  return []
})

// Projects starting soon (start date within next 7 days)
const startingSoonProjects = computed(() => {
  // TODO: Filter projects by start date
  return []
})
</script>

<style scoped>
/* Add any custom styles for insights here */
</style>
