import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LeftSidebarPane from '@/components/internal/LeftSidebarPane.vue'
import RightTracksPane from '@/components/internal/RightTracksPane.vue'

const assignmentsKey = Symbol.for('assignmentsRef')

function provideAssignments(wrapper: any, data: any) {
  wrapper.vm.$.appContext.provides[assignmentsKey as any] = ref(data)
}

describe('Left/Right panes alignment', () => {
  const start = '2025-10-20'
  const days = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    d.setUTCHours(0,0,0,0)
    const wd = d.getUTCDay()
    if (wd === 0 || wd === 6) return null
    return d.toISOString().slice(0,10)
  }).filter(Boolean) as string[]

  const assignments = [
    { id: 'a1', person_id: 'p1', project_id: 'j1', start: days[0], end: days[3], allocation: 1 },
    { id: 'a2', person_id: 'p1', project_id: 'j2', start: days[2], end: days[5], allocation: 0.5 },
  ]

  it('header heights match between panes', async () => {
    const provide = { [assignmentsKey as any]: ref(assignments) }
  const subrows = [{ kind:'item' as const, key: 'k1', label: 'Nebula', person_id: 'p1', project_id: 'j1' }]
    const left = mount(LeftSidebarPane, { props: { label: 'Alice', startISO: start, subrows, groupType: 'person', groupId: 'p1' }, global: { provide } })
    const right = mount(RightTracksPane, { props: { label: 'Alice', groupType: 'person', groupId: 'p1', startISO: start, subrows, days, pxPerDay: 56, dayOffsets: days.map((_,i)=>i*56), weekStarts: [], projectsMap: {} }, global: { provide } })

    await Promise.resolve()
    const leftHeader = left.find('div.px-3')
    const rightHeader = right.find('div.relative.border-b')
    expect(leftHeader.attributes('style')).toMatch(/height: \d+px/)
    expect(leftHeader.attributes('style')).toBe(rightHeader.attributes('style'))
  })
})
