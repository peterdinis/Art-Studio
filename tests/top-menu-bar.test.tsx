import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopMenuBar } from "@/components/layout/TopMenuBar";
import { useArtStudioStore } from "@/stores/artStudioStore";

interface MockTooltipProps {
	children: React.ReactNode;
}

interface MockDropdownMenuItemProps {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}

interface MockDropdownMenuProps {
	children: React.ReactNode;
}

interface MockDropdownMenuSubProps {
	children: React.ReactNode;
}

interface MockDropdownMenuTriggerProps {
	children: React.ReactNode;
}

interface MockDropdownMenuContentProps {
	children: React.ReactNode;
}

interface MockDropdownMenuPortalProps {
	children: React.ReactNode;
}

interface MockDropdownMenuShortcutProps {
	children: React.ReactNode;
}

// Mock store
vi.mock("@/stores/artStudioStore", () => ({
	useArtStudioStore: vi.fn(),
}));

// Mock modules that might interfere
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: MockTooltipProps) => children,
	TooltipTrigger: ({ children }: MockTooltipProps) => children,
	TooltipContent: ({ children }: MockTooltipProps) => children,
	TooltipProvider: ({ children }: MockTooltipProps) => children,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: MockDropdownMenuProps) => children,
	DropdownMenuTrigger: ({ children }: MockDropdownMenuTriggerProps) => children,
	DropdownMenuContent: ({ children }: MockDropdownMenuContentProps) => children,
	DropdownMenuItem: ({ children, onClick, disabled }: MockDropdownMenuItemProps) => (
		<div onClick={!disabled ? onClick : undefined} data-testid="menu-item">
			{children}
		</div>
	),
	DropdownMenuSeparator: () => null,
	DropdownMenuSub: ({ children }: MockDropdownMenuSubProps) => children,
	DropdownMenuSubTrigger: ({ children }: MockTooltipProps) => children,
	DropdownMenuSubContent: ({ children }: MockTooltipProps) => children,
	DropdownMenuPortal: ({ children }: MockDropdownMenuPortalProps) => children,
	DropdownMenuShortcut: ({ children }: MockDropdownMenuShortcutProps) => children,
}));

describe("TopMenuBar component", () => {
	const mockSetEngine = vi.fn();
	const mockUndo = vi.fn();
	const mockRedo = vi.fn();
	const mockRemoveLayer = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useArtStudioStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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
		(window as Window & typeof globalThis & { fabricCanvas?: unknown; konvaStage?: unknown }).fabricCanvas = {
			toJSON: vi.fn(),
			toDataURL: vi.fn(),
			clear: vi.fn(),
			getActiveObject: vi.fn(),
			remove: vi.fn(),
			discardActiveObject: vi.fn(),
			renderAll: vi.fn(),
		};
		(window as Window & typeof globalThis & { konvaStage?: unknown }).konvaStage = {
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