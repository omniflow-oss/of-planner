/**
 * Generate a unique, consistent color for a given string ID
 * Uses djb2 hash algorithm with golden ratio distribution for optimal color spacing
 * @param id - The string identifier (e.g., person_id, user_id)
 * @returns HSL color string in format "hsl(hue, saturation%, lightness%)"
 */
export function generateUserColor(id: string): string {
  // Better hash function using djb2 algorithm
  let hash = 5381
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) + id.charCodeAt(i)
  }

  // Use golden ratio to distribute colors more evenly across the spectrum
  const goldenRatio = 0.618033988749
  const hue = ((Math.abs(hash) * goldenRatio) % 1) * 360

  // Vary saturation and lightness slightly for more distinction
  // Use different parts of the hash to ensure independence
  const saturation = 65 + ((Math.abs(hash) >> 8) % 20) // 65-84%
  const lightness = 45 + ((Math.abs(hash) >> 16) % 20)  // 45-64%

  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`
}

/**
 * Generate a palette of predefined colors (optional alternative)
 * Useful when you want a curated set of colors instead of algorithmic generation
 */
export const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
] as const

/**
 * Get a color from the predefined palette based on index
 * @param index - The index to select color (will cycle if > palette length)
 * @returns Hex color string
 */
export function getPaletteColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length]
}

/**
 * Semantic allocation colors for assignment bars
 */

import type { Allocation } from '@/types/planner'

/**
 * Get semantic background color based on allocation level
 * @param allocation - Allocation value (0.25, 0.5, 0.75, 1.0)
 * @returns Hex color code
 */
export function getAllocationColor(allocation: Allocation): string {
  if (allocation >= 0.9) {
    return '#10b981' // green-500 - fully assigned (90-100%)
  } else if (allocation >= 0.2) {
    return '#f59e0b' // amber-500 - partially assigned (20-89%)
  } else if (allocation > 1.0) {
    return '#ef4444' // red-500 - overloaded (>100%)
  }
  return '#6b7280' // gray-500 - minimal (<20%)
}

/**
 * Get text color for allocation bar (white for good contrast)
 * @param allocation - Allocation value
 * @returns Hex color code for text
 */
export function getAllocationTextColor(allocation: Allocation): string {
  return '#ffffff' // white text on all colored backgrounds
}

/**
 * Enhance project color saturation for better visibility
 * @param color - Original project color (hex)
 * @returns Enhanced color or default gray
 */
export function enhanceProjectColor(color: string | null | undefined): string {
  if (!color) return '#6b7280' // gray-500 default

  // Return as-is for now (can add saturation boost later if needed)
  return color
}