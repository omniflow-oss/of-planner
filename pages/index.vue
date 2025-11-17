<template>
  <Timeline />
</template>

<script setup lang="ts">
import Timeline from '@/components/Timeline.vue'
import { inject } from 'vue'

// Inject personClickEvent from app.vue and forward to Timeline
const personClickEvent = inject('personClickEvent', null)
</script>
