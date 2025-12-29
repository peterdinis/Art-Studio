import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopMenuBar } from "@/components/layout/TopMenuBar";
import { useArtStudioStore } from "@/stores/artStudioStore";
import React from "react";

// Mock store
vi.mock("@/stores/artStudioStore", () => ({
	useArtStudioStore: vi.fn(),
}));

// Mock modules that might interfere
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: any) => children,
	TooltipTrigger: ({ children }: any) => children,
	TooltipContent: ({ children }: any) => children,
	TooltipProvider: ({ children }: any) => children,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => children,
	DropdownMenuTrigger: ({ children }: any) => children,
	DropdownMenuContent: ({ children }: any) => children,
	DropdownMenuItem: ({ children, onClick, disabled }: any) => (
		<div onClick={!disabled ? onClick : undefined} data-testid="menu-item">
			{children}
		</div>
	),
	DropdownMenuSeparator: () => null,
	DropdownMenuSub: ({ children }: any) => children,
	DropdownMenuSubTrigger: ({ children }: any) => children,
	DropdownMenuSubContent: ({ children }: any) => children,
	DropdownMenuPortal: ({ children }: any) => children,
	DropdownMenuShortcut: ({ children }: any) => children,
}));

describe("TopMenuBar component", () => {
	const mockSetEngine = vi.fn();
	const mockUndo = vi.fn();
	const mockRedo = vi.fn();
	const mockRemoveLayer = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useArtStudioStore as any).mockReturnValue({
			renderingEngine: "fabric",
			setRenderingEngine: mockSetEngine,
			undo: mockUndo,
			redo: mockRedo,
			canUndo: vi.fn(() => true),
			canRedo: vi.fn(() => true),
			removeLayer: mockRemoveLayer,
			activeLayerId: "1",
			layers: [{ id: "1", name: "Layer 1", visible: true, locked: false }],
		});

		// Mock window objects
		(window as any).fabricCanvas = {
			toJSON: vi.fn(),
			toDataURL: vi.fn(),
			clear: vi.fn(),
			getActiveObject: vi.fn(),
			remove: vi.fn(),
			discardActiveObject: vi.fn(),
			renderAll: vi.fn(),
		};
		(window as any).konvaStage = {
			toJSON: vi.fn(),
			toDataURL: vi.fn(),
		};
	});

	it("should render main menu items", () => {
		render(<TopMenuBar />);
		expect(screen.getByRole("button", { name: /File/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /View/i })).toBeInTheDocument();
	});

	it("should handle undo/redo actions", () => {
		render(<TopMenuBar />);

		// The mock renders children immediately, so we can find the menu items
		const undoItem = screen.getByText(/Undo/i);
		const redoItem = screen.getByText(/Redo/i);

		fireEvent.click(undoItem);
		expect(mockUndo).toHaveBeenCalled();

		fireEvent.click(redoItem);
		expect(mockRedo).toHaveBeenCalled();
	});

	it("should handle engine switching", () => {
		render(<TopMenuBar />);

		const konvaItem = screen.getByText(/Konva\.js \(Canvas\/Pixel\)/i);
		fireEvent.click(konvaItem);
		expect(mockSetEngine).toHaveBeenCalledWith("konva");
	});
});
