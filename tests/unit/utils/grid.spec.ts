import { describe, it, expect } from 'vitest'
import { indexFromX, businessSegment } from '@/utils/grid'

describe('utils/grid', () => {
  it('maps x to day index with offsets', () => {
    const px = 56
    const days = 10
    const offsets = Array.from({ length: days }, (_, i) => i * px)
    expect(indexFromX(0, offsets, px, days)).toBe(0)
    expect(indexFromX(10, offsets, px, days)).toBe(0)
    // x just before the next boundary still maps to current index
    expect(indexFromX(55, offsets, px, days)).toBe(0)
    expect(indexFromX(56, offsets, px, days)).toBe(1)
    expect(indexFromX(112, offsets, px, days)).toBe(2)
    expect(indexFromX(9999, offsets, px, days)).toBe(days - 1)
  })

  it('maps x to day index without offsets', () => {
    const px = 56
    const days = 7
    expect(indexFromX(0, null, px, days)).toBe(0)
    expect(indexFromX(28, null, px, days)).toBe(1)
    expect(indexFromX(56, null, px, days)).toBe(1)
    expect(indexFromX(2000, null, px, days)).toBe(days - 1)
  })

  it('computes business segment left/width', () => {
    const px = 56
    const start = '2025-10-27' // Monday
    // startDay = same as start (offset 0), endDay = Wednesday => 3 business days width
    const seg = businessSegment(start, '2025-10-27', '2025-10-29', px)
    expect(seg.left).toBe(0)
    expect(seg.width).toBe(3 * px - 2)

    // Friday to next Tuesday skips weekend => 2 business days (Fri, Mon, Tue => 3 days inclusive)
    const seg2 = businessSegment(start, '2025-10-31', '2025-11-04', px)
    expect(seg2.left).toBe(4 * px) // Fri offset from Monday
    expect(seg2.width).toBe(3 * px - 2)
  })
})
