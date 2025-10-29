import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LeftSidebarPane from '@/components/internal/LeftSidebarPane.vue'

const assignmentsKey = Symbol.for('assignmentsRef')

describe('LeftSidebarPane expand toggle', () => {
  it('emits toggle on button click and controls subrow visibility', async () => {
    const provide = { [assignmentsKey as any]: { value: [] } }
    const wrapper = mount(LeftSidebarPane, { props: { label: 'Alice', startISO: '2025-10-20', subrows: [{ key:'k1', label:'Nebula', person_id:'p1', project_id:'j1' }], expanded: true }, global: { provide } })
    // Initially expanded renders subrow
    expect(wrapper.text()).toContain('Nebula')
    // Click toggle emits event
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })
})

