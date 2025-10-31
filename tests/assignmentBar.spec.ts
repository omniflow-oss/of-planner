import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import { addDaysISO } from '@/composables/useDate'

describe('AssignmentBar interactions', () => {
  const startISO = '2025-01-01'
  const assignment = {
    id: 'a_test', person_id: 'p1', project_id: 'j1', start: startISO, end: addDaysISO(startISO, 4), allocation: 1
  }
  const projectsMap = { j1: { id: 'j1', name: 'Aurora', color: '#6bc6ff', emoji: '🟦' } }

  it('emits update when dragged by ~1 day (snap)', async () => {
    const pxPerDay = 40
    const wrapper = mount(AssignmentBar as any, {
      props: { assignment, startISO, pxPerDay, projectsMap },
      global: {
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
        },
      },
    })
    await wrapper.trigger('mousedown', { clientX: 0 })
    // simulate drag ~1 day to the right
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: pxPerDay + 2 }))
    window.dispatchEvent(new MouseEvent('mouseup'))

    const emitted = wrapper.emitted('update')
    expect(emitted && emitted.length).toBeGreaterThan(0)
    const last = emitted![emitted!.length - 1][0] as any
    expect(last.id).toBe('a_test')
    expect(last.start).toBe(addDaysISO(startISO, 1))
  })
})
