<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
  >
    <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
      <div class="text-sm font-medium mb-2">
        Delete assignment
      </div>
      <div class="text-sm">
        This action cannot be undone. Continue?
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <UButton
          size="xs"
          variant="outline"
          @click="$emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          size="xs"
          color="error"
          @click="$emit('confirm')"
        >
          Delete
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>