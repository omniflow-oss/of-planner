import { describe, it, expect } from 'vitest'
import {
  toISO,
  parseISO,
  addDaysISO,
  daysBetweenInclusive,
  eachDay,
  clampDateRange,
  isWeekendISO,
  businessDaysBetweenInclusive,
  businessOffset,
  calendarSpanForWeekdays,
  addBusinessDaysISO
} from '@/composables/useDate'

describe('useDate utilities', () => {
  it('parses and formats ISO dates and adds days', () => {
    const d = new Date(Date.UTC(2025, 0, 1))
    const iso = toISO(d)
    expect(iso).toBe('2025-01-01')
    expect(parseISO(iso).toISOString().slice(0, 10)).toBe('2025-01-01')
    expect(addDaysISO(iso, 3)).toBe('2025-01-04')
  })

  it('computes inclusive day ranges and sequences', () => {
    expect(daysBetweenInclusive('2025-01-01', '2025-01-01')).toBe(1)
    expect(daysBetweenInclusive('2025-01-01', '2025-01-03')).toBe(3)
    expect(eachDay('2025-01-01', 3)).toEqual(['2025-01-01', '2025-01-02', '2025-01-03'])
  })

  it('clamps inverted date ranges', () => {
    const { start, end } = clampDateRange('2025-01-10', '2025-01-05')
    expect(start).toBe('2025-01-05')
    expect(end).toBe('2025-01-10')
  })

  it('detects weekends and counts business days', () => {
    expect(isWeekendISO('2025-01-04')).toBe(true) // Sat
    expect(isWeekendISO('2025-01-06')).toBe(false) // Mon
    // Mon 6th to Fri 10th inclusive -> 5
    expect(businessDaysBetweenInclusive('2025-01-06', '2025-01-10')).toBe(5)
    // reversed order should be negative
    expect(businessDaysBetweenInclusive('2025-01-10', '2025-01-06')).toBe(-5)
  })

  it('computes business offset and calendar span for weekdays', () => {
    // base Mon 6th -> Wed 8th is +2 business days
    expect(businessOffset('2025-01-06', '2025-01-08')).toBe(2)
    // 2 weekdays from Fri 3rd forward: Sat/Sun skipped -> Mon/Tue => span 4
    expect(calendarSpanForWeekdays('2025-01-03', 2, 1)).toBe(4)
  })

  it('adds business days (skipping weekends)', () => {
    // Add 3 business days from Thu 2nd -> Tue 7th
    expect(addBusinessDaysISO('2025-01-02', 3)).toBe('2025-01-07')
    // Zero or negative yields input
    expect(addBusinessDaysISO('2025-01-02', 0)).toBe('2025-01-02')
  })
})
