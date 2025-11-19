/**
 * Avatar utility functions for generating initials and colors
 */

/**
 * Generate initials from a person's name
 * @param name - Full name of the person
 * @returns 2-letter initials (uppercase)
 */
export function getInitials(name: string): string {
    const parts = name.trim().split(' ').filter(p => p.length > 0)
    if (parts.length >= 2) {
        const first = parts[0]?.[0]
        const last = parts[parts.length - 1]?.[0]
        if (first && last) {
            return (first + last).toUpperCase()
        }
    }
    return name.substring(0, 2).toUpperCase()
}

/**
 * Generate a consistent avatar color based on name
 * @param name - Person's name
 * @returns Tailwind CSS background color class
 */
export function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
        'bg-orange-500',
        'bg-cyan-500'
    ]

    // Generate consistent hash from name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
}

/**
 * Get text color class for avatar (always white for contrast)
 */
export function getAvatarTextColor(): string {
    return 'text-white'
}
