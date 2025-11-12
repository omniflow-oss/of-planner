<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

const props = defineProps<{ chartData: any }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => {
  if (canvas.value && props.chartData) {
    chart = new Chart(canvas.value, {
      type: 'line',
      data: props.chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: false
          }
        }
      }
    })
  }
})

watch(() => props.chartData, (newData) => {
  if (chart && newData) {
    chart.data = newData
    chart.update()
  }
})
</script>
