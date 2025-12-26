import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ColorPanel } from '@/components/panels/ColorPanel';
import { useArtStudioStore } from '@/stores/artStudioStore';
import React from 'react';

describe('ColorPanel component', () => {
    beforeEach(() => {
        useArtStudioStore.setState({
            primaryColor: "#ffffff",
            secondaryColor: "#000000",
            recentColors: ["#ffffff", "#000000", "#ff0000"],
        });
    });

    it('should render color values', () => {
        render(<ColorPanel />);
        // Check for hex values in inputs
        const inputs = screen.getAllByRole('textbox');
        expect(inputs[0]).toHaveValue('#FFFFFF');
        expect(inputs[1]).toHaveValue('#000000');
    });

    it('should swap colors when clicking the swap button', () => {
        render(<ColorPanel />);
        // The Swap button is the third button (after primary and secondary swatch buttons)
        const buttons = screen.getAllByRole('button');
        const swapButton = buttons[2];

        fireEvent.click(swapButton);

        const state = useArtStudioStore.getState();
        expect(state.primaryColor).toBe('#000000');
        expect(state.secondaryColor).toBe('#ffffff');
    });

    it('should update primary color when clicking a recent color', () => {
        render(<ColorPanel />);
        // Recent colors are at the end, let's find the one with title #ff0000
        const redRecentColor = screen.getByTitle('#ff0000');

        fireEvent.click(redRecentColor);
        expect(useArtStudioStore.getState().primaryColor).toBe('#ff0000');
    });
});
