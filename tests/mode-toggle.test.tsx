import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { useTheme } from "next-themes";
import React from "react";

// Mock next-themes
vi.mock("next-themes", () => ({
    useTheme: vi.fn(),
}));

// Mock DropdownMenu as it was done in previous tests
vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dropdown-content">{children}</div>
    ),
    DropdownMenuItem: ({
        children,
        onClick,
    }: { children: React.ReactNode; onClick?: () => void }) => (
        <div data-testid="dropdown-item" onClick={onClick}>
            {children}
        </div>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dropdown-trigger">{children}</div>
    ),
}));

describe("ModeToggle component", () => {
    it("should call setTheme when theme options are clicked", () => {
        const setTheme = vi.fn();
        (useTheme as any).mockReturnValue({ setTheme });

        render(<ModeToggle />);

        // In our mock, DropdownMenuContent is always displayed
        const lightItem = screen.getByText("Light");
        const darkItem = screen.getByText("Dark");
        const systemItem = screen.getByText("System");

        fireEvent.click(lightItem);
        expect(setTheme).toHaveBeenCalledWith("light");

        fireEvent.click(darkItem);
        expect(setTheme).toHaveBeenCalledWith("dark");

        fireEvent.click(systemItem);
        expect(setTheme).toHaveBeenCalledWith("system");
    });
});
