import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTimelineGeometry } from '@/composables/useTimelineGeometry'

describe('useTimelineGeometry', () => {
  it('maps x to day index with regular pxPerDay', () => {
    const days = ref(['d1','d2','d3','d4'])
    const px = ref(50)
    const { indexFromX, left, width } = useTimelineGeometry(days, px)
    expect(left(0)).toBe(0)
    expect(width(0)).toBe(50)
    expect(indexFromX(0)).toBe(0)
    expect(indexFromX(24)).toBe(0)
    expect(indexFromX(26)).toBe(1)
    expect(indexFromX(75)).toBe(2)
    expect(indexFromX(199)).toBe(4-1)
  })

  it('maps x to nearest day when using offsets', () => {
    const days = ref(['d1','d2','d3'])
    const px = ref(50)
    const offsets = ref([0, 60, 120]) // non-uniform
    const { indexFromX } = useTimelineGeometry(days, px, offsets)
    expect(indexFromX(0)).toBe(0)
    expect(indexFromX(29)).toBe(0)
    expect(indexFromX(59)).toBe(1)
    expect(indexFromX(60)).toBe(1)
    expect(indexFromX(89)).toBe(1)
    expect(indexFromX(119)).toBe(2)
    expect(indexFromX(120)).toBe(2)
  })
})
