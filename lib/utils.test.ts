import { expect, test } from 'vitest'
import { cn } from './utils'

test('cn merges classes', () => {
    // Basic concatenation
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')

    // Conflicting classes (tailwind-merge logic)
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')

    // Conditional classes
    expect(cn('bg-red-500', false && 'text-white', true && 'text-black')).toBe('bg-red-500 text-black')

    // Arrays and objects (clsx logic)
    expect(cn('bg-red-500', ['text-white', null, undefined])).toBe('bg-red-500 text-white')
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
})
