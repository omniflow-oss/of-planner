<template>
  <div>
    <canvas 
      ref="lineChart"
      class="chart">
    </canvas>
  </div>
</template>

<script setup lang="ts">

import { Chart, registerables } from 'chart.js';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

Chart.register(...registerables);

const props = defineProps<{ chartData: any }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let lineChart: any = ref(null);

const datasets:any = ref([{
  backgroundColor: function(context:any) {
    const chart = context.chart;
    const { ctx, chartArea } = chart;

    if (!chartArea) {
        // This case happens on initial render
        return;
    }

    // Create a vertical linear gradient from bottom to top
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(125, 22, 255, 0.1)'); // Couleur de départ
    gradient.addColorStop(1, 'rgba(125, 22, 255, 0)'); // Couleur de fin  

    return gradient;
  },
  fill: true,
  tension: 0.5,
  pointRadius: 0,
  borderColor: "#8551C8",
  borderWidth: 2,
}]);
let line:any = null;
const useGetChart = () => {
  if (props.chartData && props.chartData.datasets && props.chartData.datasets[0] && Array.isArray(props.chartData.datasets[0].data)) {
    if (datasets.value && datasets.value[0]) {
      datasets.value[0].data = props.chartData.datasets[0].data
    }
  } else {
    if (datasets.value && datasets.value[0]) {
      datasets.value[0].data = []
    }
  }
  line = new Chart(lineChart.value, {
    type: 'line',
    data: {
      labels: props.chartData?.labels,
      datasets: datasets.value,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      tension: 0.4,
      scales: {
        x: {
          grid: {
            display: false,
            drawTicks: true,
          },
        },
        y: {
          beginAtZero: true,
          border: { dash: [5, 5] },
          grid: {
            drawTicks: false,
          },
        },
      },
      elements: {},

      plugins: {
        tooltip: {
          cornerRadius: 0,
          bodyFont: {
            family: "'SF-Bold', sans-serif",
          },
        },
        legend: {
          display: false,
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 20,
              family: "'SF-Bold', sans-serif",
            },
          },
        },
      },
    },
  });
};

onBeforeUnmount(()=>{
  destroyCharts();
})
const destroyCharts = () => {
  if(line){
    line.destroy();
  }
}
onMounted(() => {
  if(lineChart.value){
    useGetChart();
  }
});
watch(() => props.chartData, (newData) => {
  if (line && newData) {
    destroyCharts();
    useGetChart();
    line.update()
  }
})
</script>
