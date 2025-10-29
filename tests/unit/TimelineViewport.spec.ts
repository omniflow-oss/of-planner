import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineViewport from '@/components/internal/layout/TimelineViewport.vue'

function nextTickMs(ms=0){ return new Promise(r=>setTimeout(r,ms)) }

describe('TimelineViewport', () => {
  it('mirrors vertical scroll from right to left', async () => {
    const wrapper = mount(TimelineViewport, {
      slots: {
        headerLeft: '<div>HL</div>',
        headerRight: '<div>HR</div>',
        bodyLeft: '<div style="height: 1000px">L</div>',
        bodyRight: '<div style="height: 1000px">R</div>',
      }
    })
    const right = wrapper.vm.$.exposed!.rightBody as any
    // set scrollTop and trigger scroll
    right.value.scrollTop = 123
    right.value.dispatchEvent(new Event('scroll'))
    await nextTickMs(0)
    const leftContent = wrapper.find('[ref="leftContent"]')
    // Access style via element since ref is not directly queryable by selector
    const elem = (wrapper.findComponent(TimelineViewport).element as HTMLElement)
    const content = elem.querySelector('[ref="leftContent"]') as HTMLElement | null
    // Fallback: check root HTML contains transform with scrollTop
    expect(wrapper.html()).toContain(`translateY(-123px)`) // transform style set
  })
})

