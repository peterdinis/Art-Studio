import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolSidebar } from '@/components/toolbar/ToolSidebar';
import { useArtStudioStore } from '@/stores/artStudioStore';
import React from 'react';

// Mock Tooltip components
vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock Separator
vi.mock('@/components/ui/separator', () => ({
    Separator: () => <hr data-testid="separator" />,
}));

describe('ToolSidebar component', () => {
    beforeEach(() => {
        const { setActiveTool, clearHistory } = useArtStudioStore.getState();
        setActiveTool('brush');
        clearHistory();
    });

    it('should render tool buttons', () => {
        render(<ToolSidebar />);
        // We can look for buttons. The ToolSidebar has many tools.
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(10);
    });

    it('should change active tool on click', () => {
        render(<ToolSidebar />);
        // The first button in the first group is "Move Tool" (select)
        const moveToolButton = screen.getAllByRole('button')[0];

        fireEvent.click(moveToolButton);
        expect(useArtStudioStore.getState().activeTool).toBe('select');
    });

    it('should handle undo/redo buttons', () => {
        render(<ToolSidebar />);

        // Undo/Redo are the last buttons before the color display
        const buttons = screen.getAllByRole('button');
        // Based on the component structure:
        // Tools... (many)
        // Separator... 
        // Tools...
        // Undo (second to last button)
        // Redo (last button)
        // Actually, color swatches are div/button too.

        // Let's find by looking for the icons or identifying them more reliably
        // In our mock, they are just buttons. 
        // Based on the code: Undo is after all tools and separators.
        const undoButton = buttons[buttons.length - 2];
        const redoButton = buttons[buttons.length - 1];

        expect(undoButton).toBeDisabled();
        expect(redoButton).toBeDisabled();
    });
});
