import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RightTracksPane from '@/components/internal/RightTracksPane.vue'

const assignmentsKey = Symbol.for('assignmentsRef')

describe('RightTracksPane expanded prop', () => {
  const start = '2025-10-20'
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    d.setUTCHours(0,0,0,0)
    const wd = d.getUTCDay()
    if (wd === 0 || wd === 6) return null
    return d.toISOString().slice(0,10)
  }).filter(Boolean) as string[]

  const subrows = [{ kind:'item' as const, key: 'k1', person_id: 'p1', project_id: 'j1', label: 'Nebula' }]

  it('hides subrow tracks when expanded=false', async () => {
    const provide = { [assignmentsKey as any]: { value: [] } }
    const wrapper = mount(RightTracksPane, {
      props: {
        label: 'Alice', groupType: 'person', groupId: 'p1', expanded: false,
        subrows, startISO: start, days, pxPerDay: 56, dayOffsets: days.map((_, i) => i * 56), weekStarts: [], projectsMap: {}
      },
      global: { provide }
    })
    // Only header track is rendered; subrow container should not exist
    const subrowEls = wrapper.findAll('div.relative.border-b.pane-border.timeline-bg')
    // First is header, second would be subrow if expanded
    expect(subrowEls.length).toBe(1)
  })
})
