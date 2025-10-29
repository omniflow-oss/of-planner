import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RightTracksPane from '@/components/internal/RightTracksPane.vue'

const assignmentsKey = Symbol.for('assignmentsRef')

describe('RightTracksPane quick create popover', () => {
  const start = '2025-10-20'
  const days = ['2025-10-20','2025-10-21','2025-10-22','2025-10-23','2025-10-24']
  const subrows = [{ kind:'item' as const, key: 'k1', person_id: 'p1', project_id: 'j1', label: 'Nebula' }]

  it('shows quick create on empty click', async () => {
    const provide = { [assignmentsKey as any]: { value: [] } }
    const wrapper = mount(RightTracksPane, {
      props: { label:'Alice', groupType:'person', groupId:'p1', expanded:true, subrows, startISO:start, days, pxPerDay:56, dayOffsets: days.map((_,i)=>i*56), weekStarts:[], projectsMap: {} },
      attachTo: document.body,
      global: { provide }
    })
    // Mock bounding rect so click math works
    const row = wrapper.findAll('div.relative.border-b.pane-border.timeline-bg')[1]
    ;(row.element as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 40, right: 300, bottom: 40, x:0,y:0, toJSON(){return {}} })
    await row.trigger('click', { clientX: 30, clientY: 10 })
    expect(document.body.textContent).toContain('Quick create')
  })
})
