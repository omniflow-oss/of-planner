<template>
  <div>
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
            <span class="font-medium">{{ person.name }}</span> — {{ person.totalAllocationPercent }}%
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
        data: labels.map(l => dateAllocMap[l])
      }
    ]
  }
})

// Overburdened people (total allocation > 100%)
const overburdenedPeople = computed(() => {
  const people = store.people
  const assignments = store.assignments
  // Map personId to total allocation percent
  const allocationPercentMap: Record<string, number> = {}
  for (const a of assignments) {
    const person = people.find(p => p.id === a.person_id)
    
    if (!person || typeof a.allocation !== 'number' ) continue
    if (!allocationPercentMap[a.person_id]) allocationPercentMap[a.person_id] = 0
    allocationPercentMap[a.person_id] += (a.allocation * 100)
  }
  // Filter people with total allocation percent > 100
  return people
    .map(p => ({
      id: p.id,
      name: p.name,
      totalAllocationPercent: Math.round(allocationPercentMap[p.id] || 0)
    }))
    .filter(p => p.totalAllocationPercent > 100)
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
