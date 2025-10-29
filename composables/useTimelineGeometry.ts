import { computed, type Ref } from 'vue'

// Geometry helpers derived from days/pxPerDay/offsets
// - left(i): left position in px for day i
// - width(i): width of day i column in px
// - indexFromX(x): maps an x coordinate (within track) to the nearest day index
export function useTimelineGeometry(
  days: Ref<string[]>,
  pxPerDay: Ref<number>,
  offsets?: Ref<number[] | undefined>,
) {
  const px = computed(() => pxPerDay.value)
  const offs = computed(() => offsets?.value ?? days.value.map((_, i) => i * px.value))

  function left(i: number) {
    return offs.value[i] ?? i * px.value
  }
  function width(i: number) {
    const next = offs.value[i + 1] ?? left(i) + px.value
    return Math.max(0, next - left(i))
  }
  function indexFromX(x: number) {
    // If offsets are regular, snap by pxPerDay; otherwise scan by offsets
    if (!offsets?.value) {
      return Math.max(0, Math.min(days.value.length - 1, Math.round(x / px.value)))
    }
    let idx = 0
    for (let i = 0; i < days.value.length; i++) {
      const l = left(i)
      const w = width(i)
      if (x < l + w / 2) { idx = i; break }
      idx = i
    }
    return idx
  }

  return { left, width, indexFromX }
}

