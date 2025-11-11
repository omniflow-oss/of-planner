import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
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
        plugins: [createPinia()],
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
        },
      },
    })
    
    // Create a mock scrollable container and append the wrapper to it
    const mockContainer = document.createElement('div')
    mockContainer.classList.add('overflow-auto')
    Object.defineProperty(mockContainer, 'scrollLeft', { value: 0, writable: true })
    Object.defineProperty(mockContainer, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: 1000, top: 0, bottom: 500 })
    })
    document.body.appendChild(mockContainer)
    mockContainer.appendChild(wrapper.element)
    
    // Trigger mousedown event
    await wrapper.trigger('mousedown', { clientX: 0 })
    
    // Allow component to process mousedown
    await wrapper.vm.$nextTick()
    
    // Simulate drag ~1 day to the right with mousemove
    window.dispatchEvent(new MouseEvent('mousemove', { 
      clientX: pxPerDay + 2,
      bubbles: true 
    }))
    
    // Wait for requestAnimationFrame to process
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Trigger mouseup to end drag
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    
    // Wait for any final processing
    await wrapper.vm.$nextTick()
    
    // Cleanup
    document.body.removeChild(mockContainer)

    const emitted = wrapper.emitted('update')
    expect(emitted && emitted.length).toBeGreaterThan(0)
    const last = emitted?.[emitted.length - 1]?.[0] as any
    expect(last.id).toBe('a_test')
    expect(last.start).toBe(addDaysISO(startISO, 1))
  })
})
