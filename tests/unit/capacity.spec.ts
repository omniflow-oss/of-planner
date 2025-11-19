import { describe, it, expect } from 'vitest'
import { manDays, clampToWindowDate } from '@/utils/alloc'
import { useCapacity } from '@/composables/useCapacity'
import { ref } from 'vue'
import type { Assignment } from '@/types/planner'

describe('utils/alloc', () => {
    describe('manDays', () => {
        it('calculates business days correctly', () => {
            // Mon to Fri = 5 days
            expect(manDays('2024-01-01', '2024-01-05', 1)).toBe(5)
            // Mon to Sun = 5 days (weekend excluded)
            expect(manDays('2024-01-01', '2024-01-07', 1)).toBe(5)
            // Sat to Sun = 0 days
            expect(manDays('2024-01-06', '2024-01-07', 1)).toBe(0)
        })

        it('applies allocation', () => {
            expect(manDays('2024-01-01', '2024-01-05', 0.5)).toBe(2.5)
        })
    })

    describe('clampToWindowDate', () => {
        it('clamps correctly', () => {
            const window = ['2024-01-01', '2024-01-31']
            expect(clampToWindowDate('2023-12-31', '2024-01-05', window[0], window[1]))
                .toEqual(['2024-01-01', '2024-01-05'])

            expect(clampToWindowDate('2024-01-10', '2024-01-15', window[0], window[1]))
                .toEqual(['2024-01-10', '2024-01-15'])

            expect(clampToWindowDate('2024-01-25', '2024-02-05', window[0], window[1]))
                .toEqual(['2024-01-25', '2024-01-31'])
        })

        it('returns null for no intersection', () => {
            const window = ['2024-01-01', '2024-01-31']
            expect(clampToWindowDate('2024-02-01', '2024-02-05', window[0], window[1])).toBeNull()
        })
    })
})

describe('useCapacity', () => {
    it('calculates total man-days for person', () => {
        const assignments = ref<Assignment[]>([
            {
                id: '1',
                person_id: 'p1',
                project_id: 'proj1',
                start: '2024-01-01', // Mon
                end: '2024-01-05',   // Fri
                allocation: 1
            }
        ])
        const days = ref(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'])

        const { totalMD, daily } = useCapacity(assignments, days, { type: 'person', id: 'p1' })

        expect(totalMD.value).toBe(5)
        expect(daily.value).toEqual([1, 1, 1, 1, 1, 0, 0]) // 0 on weekends
    })

    it('calculates total man-days for project', () => {
        const assignments = ref<Assignment[]>([
            {
                id: '1',
                person_id: 'p1',
                project_id: 'proj1',
                start: '2024-01-01',
                end: '2024-01-05',
                allocation: 0.5
            },
            {
                id: '2',
                person_id: 'p2',
                project_id: 'proj1',
                start: '2024-01-01',
                end: '2024-01-05',
                allocation: 0.5
            }
        ])
        const days = ref(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'])

        const { totalMD } = useCapacity(assignments, days, { type: 'project', id: 'proj1' })

        // 2 people * 5 days * 0.5 = 5 man-days
        expect(totalMD.value).toBe(5)
    })
})
