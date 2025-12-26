import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
        expect(cn('class1', false && 'class-false', true && 'class-true')).toBe('class1 class-true');
    });

    it('should resolve tailwind conflicts (via twMerge)', () => {
        // px-2 and px-4 conflict; last one wins
        expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle undefined or null inputs', () => {
        expect(cn('class1', undefined, null)).toBe('class1');
    });
});
