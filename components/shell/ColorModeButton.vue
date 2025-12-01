<template>
  <UButton
    size="xs"
    variant="ghost"
    color="neutral"
    :icon="colorIcon"
    aria-label="Toggle color mode"
    @click="toggleColorMode"
  />
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const colorIcon = computed(() => colorMode.preference === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon')

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
