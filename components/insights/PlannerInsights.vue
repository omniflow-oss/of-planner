<template>
  <div class="p-4">
    {{ store.assignments }}
    <h2 class="text-lg font-bold mb-2">Planner Insights</h2>
    <div class="grid grid-cols-1 gap-4">
      <!-- Workload Level Line Chart -->
      <div class="bg-white rounded shadow p-3">
        <h3 class="text-sm font-semibold mb-2">Project Workload Over Time</h3>
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
import LineChart from '@/components/insights/LineChart.vue'
import { addDaysISO } from '@/composables/useDate'

const store = usePlannerStore()

// Project Workload Over Time: total assignation of all people per day
const projectWorkloadData = computed(() => {
  const assignments = store.assignments
  if (!assignments.length || !assignments[0]) return { labels: [], datasets: [] }

  // Find date range
  let minDate = assignments[0]?.start ?? ''
  let maxDate = assignments[0]?.end ?? ''
  for (const a of assignments) {
    if (a.start && a.start < minDate) minDate = a.start
    if (a.end && a.end > maxDate) maxDate = a.end
  }

  if (!minDate || !maxDate) return { labels: [], datasets: [] }

  // Build date labels
  const labels: string[] = []
  const dateAllocMap: Record<string, number> = {}
  let d = minDate
  while (d <= maxDate) {
    labels.push(d)
    dateAllocMap[d] = 0
    d = addDaysISO(d, 1)
  }

  // For each assignment, add allocation to each day in its range
  for (const a of assignments) {
    let d = a.start
    while (d <= a.end) {
      if (dateAllocMap[d] !== undefined && typeof a.allocation === 'number') {
        dateAllocMap[d] += a.allocation
      }
      d = addDaysISO(d, 1)
    }
  }

  // Prepare chart.js dataset
  return {
    labels,
    datasets: [
      {
        label: 'Total Assignation',
        data: labels.map(l => dateAllocMap[l]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.2
      }
    ]
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
