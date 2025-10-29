import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import { useTimelineGeometry } from '@/composables/useTimelineGeometry'
import { ref } from 'vue'

describe('GridOverlay scrollLeft transform', () => {
  it('applies translateX when scrollLeft provided', () => {
    const days = ['2025-10-20','2025-10-21','2025-10-22','2025-10-23','2025-10-24']
    const geom = useTimelineGeometry(ref(days), ref(56), ref(days.map((_,i)=>i*56)))
    const wrapper = mount(GridOverlay, { props: { days, weekStarts: [], scrollLeft: 112, geometry: geom } })
    expect(wrapper.html()).toContain('translateX(-112px)')
  })
})
