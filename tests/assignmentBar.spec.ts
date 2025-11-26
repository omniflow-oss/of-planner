import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AssignmentBar from '~/components/internal/AssignmentBar.vue'
import { addDaysISO } from '@/composables/useDate'

describe('AssignmentBar interactions', () => {
  const startIso = '2025-01-01'
  const assignment = {
    id: 'a_test', person_id: 'p1', project_id: 'j1', start: startIso, end: addDaysISO(startIso, 4), allocation: 1
  }
  const projectsMap = { j1: { id: 'j1', name: 'Aurora', color: '#6bc6ff', emoji: '🟦' } }

  it('emits update when dragged by ~1 day (snap)', async () => {
    const pxPerDay = 40
    const pinia = createPinia()
    const wrapper = mount(AssignmentBar as any, {
      props: { assignment, startIso, pxPerDay, projectsMap },
      global: {
        plugins: [pinia],
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
        },
      },
    })
    
    // Set the store to full load mode for consistent test behavior
    const store = (wrapper.vm as any).store
    store.isLazyLoadEnabled = false
    // Trigger mousedown on the draggable content area
    const draggableContent = wrapper.find('.draggable-content')
    await draggableContent.trigger('mousedown', { clientX: 0 })
    
    // simulate drag ~1 day to the right
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: pxPerDay + 2 }))
    
    // Manually trigger the animation frame that's used in onMouseMove
    await new Promise(resolve => {
      if (globalThis.requestAnimationFrame) {
        globalThis.requestAnimationFrame(() => resolve(undefined))
      } else {
        setTimeout(() => resolve(undefined), 16)
      }
    })
    
    window.dispatchEvent(new MouseEvent('mouseup'))

    const emitted = wrapper.emitted('update')
    expect(emitted && emitted.length).toBeGreaterThan(0)
    const last = emitted?.[emitted.length - 1]?.[0] as any
    expect(last.id).toBe('a_test')
    expect(last.start).toBe(addDaysISO(startIso, 1))
  })
})
