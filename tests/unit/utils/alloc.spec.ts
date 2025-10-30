import { describe, it, expect } from 'vitest'
import { manDays, clampToWindow } from '@/utils/alloc'

describe('utils/alloc', () => {
  it('computes man-days from business days and allocation', () => {
    // Mon to Fri inclusive = 5 business days, at 0.5 allocation = 2.5
    expect(manDays('2025-01-06', '2025-01-10', 0.5)).toBe(2.5)
    // inverted range yields 0 after clamp in manDays
    expect(manDays('2025-01-10', '2025-01-06', 1)).toBe(0)
  })

  it('clamps assignment range to visible window day indices', () => {
    const days = ['2025-01-06','2025-01-07','2025-01-08','2025-01-09','2025-01-10']
    // fully inside
    expect(clampToWindow('2025-01-07', '2025-01-09', days)).toEqual([1, 3])
    // starting before window, ending inside -> clamp to 0
    expect(clampToWindow('2025-01-01', '2025-01-08', days)).toEqual([0, 2])
    // entirely outside returns null
    expect(clampToWindow('2024-12-01', '2024-12-31', days)).toBeNull()
  })
})

