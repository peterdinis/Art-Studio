import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryPanel } from '@/components/panels/HistoryPanel';
import { useArtStudioStore } from '@/stores/artStudioStore';
import React from 'react';

// Mock UI components
vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
    ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

// Mock Sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
    },
}));

describe('HistoryPanel component', () => {
    beforeEach(() => {
        useArtStudioStore.setState({
            history: [
                { canvasData: 'data-1', thumbnail: '', timestamp: Date.now() - 1000, action: 'Initial' },
                { canvasData: 'data-2', thumbnail: '', timestamp: Date.now(), action: 'Brush Stroke' },
            ],
            historyIndex: 1,
        });
    });

    it('should render history states', () => {
        render(<HistoryPanel />);
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('State 1')).toBeInTheDocument();
        expect(screen.getByText('State 2')).toBeInTheDocument();
    });

    it('should restore to a historical state on click', () => {
        render(<HistoryPanel />);
        const state1Button = screen.getByText('State 1').closest('button');
        fireEvent.click(state1Button!);

        expect(useArtStudioStore.getState().historyIndex).toBe(0);
    });

    it('should clear history when clicking the clear button', () => {
        render(<HistoryPanel />);
        const buttons = screen.getAllByRole('button');
        const clearButton = buttons[0]; // First button in header is Trash icon

        fireEvent.click(clearButton);
        expect(useArtStudioStore.getState().history.length).toBe(1);
        expect(useArtStudioStore.getState().historyIndex).toBe(0);
    });
});
