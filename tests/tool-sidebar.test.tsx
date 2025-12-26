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

    describe('Keyboard Shortcuts', () => {
        it('should change tool on key press', () => {
            render(<ToolSidebar />);

            // Press 'P' for Pen tool
            fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
            expect(useArtStudioStore.getState().activeTool).toBe('pen');

            // Press 'B' for Brush tool
            fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
            expect(useArtStudioStore.getState().activeTool).toBe('brush');
        });

        it('should swap colors on X key press', () => {
            const { setPrimaryColor, setSecondaryColor } = useArtStudioStore.getState();
            setPrimaryColor('#ff0000');
            setSecondaryColor('#0000ff');

            render(<ToolSidebar />);
            fireEvent.keyDown(window, { key: 'x', code: 'KeyX' });

            expect(useArtStudioStore.getState().primaryColor).toBe('#0000ff');
            expect(useArtStudioStore.getState().secondaryColor).toBe('#ff0000');
        });

        it('should reset colors on D key press', () => {
            const { setPrimaryColor, setSecondaryColor } = useArtStudioStore.getState();
            setPrimaryColor('#ff00ff');
            setSecondaryColor('#00ffff');

            render(<ToolSidebar />);
            fireEvent.keyDown(window, { key: 'd', code: 'KeyD' });

            expect(useArtStudioStore.getState().primaryColor).toBe('#ffffff');
            expect(useArtStudioStore.getState().secondaryColor).toBe('#000000');
        });
    });
});
