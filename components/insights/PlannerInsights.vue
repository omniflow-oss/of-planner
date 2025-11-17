<template>
  <div>
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
            <span class="font-medium">{{ person.name }}</span> — <b>{{ person.overburdenedDays }}</b> days overburdened ({{ person.overburdenedPercent }}%)
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
import { addDaysISO, isWeekendISO } from '@/composables/useDate'

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
  // Map personId to per-day total allocation (business days only)
  const personDayAlloc: Record<string, Record<string, number>> = {}
  let minDate = null, maxDate = null
  // Find global min/max date
  for (const a of assignments) {
    if (!minDate || a.start < minDate) minDate = a.start
    if (!maxDate || a.end > maxDate) maxDate = a.end
  }
  // Build per-person, per-day allocation (business days only)
  for (const a of assignments) {
    let d = a.start
    while (d <= a.end) {
      if (isWeekendISO(d)) {
        d = addDaysISO(d, 1)
        continue
      }
      if (!personDayAlloc[a.person_id]) personDayAlloc[a.person_id] = {}
      if (typeof personDayAlloc[a.person_id][d] !== 'number') personDayAlloc[a.person_id][d] = 0
      personDayAlloc[a.person_id][d] += typeof a.allocation === 'number' ? a.allocation * 100 : 0
      d = addDaysISO(d, 1)
    }
  }
  // Calculate total business days in timeline
  let totalDays = 0
  if (minDate && maxDate) {
    let d = minDate
    while (d <= maxDate) {
      if (!isWeekendISO(d)) totalDays++
      d = addDaysISO(d, 1)
    }
  }
  // For each person, count days where allocation > 100% out of all business days
  return people
    .map(p => {
      const dayAlloc = personDayAlloc[p.id] || {}
      const overDays = Object.values(dayAlloc).filter(val => val > 100)
      const percent = totalDays > 0 ? Math.round(overDays.reduce((a,b) => a + b, 0) / overDays.length ) : 0
      return {
        id: p.id,
        name: p.name,
        overburdenedDays: overDays.length,
        overburdenedPercent: percent
      }
    })
    .filter(p => p.overburdenedDays > 0)
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
