import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopMenuBar } from "@/components/layout/TopMenuBar";
import { useArtStudioStore } from "@/stores/artStudioStore";

const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockZoomToFit = vi.fn();
const mockZoomToActualSize = vi.fn();

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
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

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
	DropdownMenuItem: ({
		children,
		onClick,
		disabled,
	}: MockDropdownMenuItemProps) => (
		<div onClick={!disabled ? onClick : undefined} data-testid="menu-item">
			{children}
		</div>
	),
	DropdownMenuSeparator: () => null,
	DropdownMenuSub: ({ children }: MockDropdownMenuSubProps) => children,
	DropdownMenuSubTrigger: ({ children }: MockTooltipProps) => children,
	DropdownMenuSubContent: ({ children }: MockTooltipProps) => children,
	DropdownMenuPortal: ({ children }: MockDropdownMenuPortalProps) => children,
	DropdownMenuShortcut: ({ children }: MockDropdownMenuShortcutProps) =>
		children,
}));

vi.mock("@/hooks/useZoom", () => ({
	useZoom: () => ({
		zoom: 1,
		zoomPercentage: 100,
		zoomIn: mockZoomIn,
		zoomOut: mockZoomOut,
		zoomToFit: mockZoomToFit,
		zoomToActualSize: mockZoomToActualSize,
	}),
}));

describe("TopMenuBar component", () => {
	const mockSetEngine = vi.fn();
	const mockUndo = vi.fn();
	const mockRedo = vi.fn();
	const mockRemoveLayer = vi.fn();
	const mockSetShowGrid = vi.fn();
	const mockSetShowRulers = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("prompt", vi.fn(() => "Test value"));

		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn(), write: vi.fn() },
			configurable: true,
		});

		const storage = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			value: {
				getItem: vi.fn((key: string) => storage.get(key) ?? null),
				setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
				removeItem: vi.fn((key: string) => storage.delete(key)),
				clear: vi.fn(() => storage.clear()),
			},
			configurable: true,
		});

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
			addLayer: vi.fn(),
			toggleLayerVisibility: vi.fn(),
			setCanvasSize: vi.fn(),
			setActiveTool: vi.fn(),
			primaryColor: "#ffffff",
			secondaryColor: "#000000",
			clearHistory: vi.fn(),
			duplicateLayer: vi.fn(),
			showLeftPanel: true,
			setShowLeftPanel: vi.fn(),
			showRightPanel: true,
			setShowRightPanel: vi.fn(),
			showBrushesPanel: true,
			setShowBrushesPanel: vi.fn(),
			showColorsPanel: true,
			setShowColorsPanel: vi.fn(),
			showLayersPanel: true,
			setShowLayersPanel: vi.fn(),
			showNavigator: false,
			setShowNavigator: vi.fn(),
			showInfoPanel: false,
			setShowInfoPanel: vi.fn(),
			showGrid: false,
			setShowGrid: mockSetShowGrid,
			showRulers: false,
			setShowRulers: mockSetShowRulers,
			showGuides: false,
			setShowGuides: vi.fn(),
			resetWorkspace: vi.fn(),
		});

		// Mock window objects
		(
			window as Window &
				typeof globalThis & { fabricCanvas?: unknown; konvaStage?: unknown }
		).fabricCanvas = {
			toJSON: vi.fn(() => ({ objects: [] })),
			toDataURL: vi.fn(),
			loadFromJSON: vi.fn().mockResolvedValue(undefined),
			clear: vi.fn(),
			getActiveObject: vi.fn(),
			remove: vi.fn(),
			discardActiveObject: vi.fn(),
			renderAll: vi.fn(),
		};
		(
			window as Window & typeof globalThis & { konvaStage?: unknown }
		).konvaStage = {
			toJSON: vi.fn(() => ({ objects: [] })),
			toDataURL: vi.fn(),
		};
	});

	it("should render main menu items", () => {
		render(<TopMenuBar />);
		expect(screen.getByRole("button", { name: /File/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /View/i })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Collaborate/i }),
		).toBeInTheDocument();
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

	it("should save a browser project to localStorage", () => {
		const promptMock = vi.mocked(prompt);
		promptMock.mockReturnValue("My Browser Project");
		render(<TopMenuBar />);

		fireEvent.click(screen.getByText("Save Project to Browser"));

		expect(window.localStorage.setItem).toHaveBeenCalled();
		expect(window.localStorage.setItem).toHaveBeenCalledWith(
			"artstudio:browser-projects:v1",
			expect.stringContaining("My Browser Project"),
		);
	});

	it("should open a recent browser project", () => {
		const projectPayload = JSON.stringify([
			{
				id: "p-1",
				name: "Recent Project",
				updatedAt: Date.now(),
				canvasData: JSON.stringify({ objects: [] }),
			},
		]);
		vi.mocked(window.localStorage.getItem).mockReturnValue(projectPayload);

		render(<TopMenuBar />);
		fireEvent.click(screen.getByText("Recent Project"));

		const canvas = (
			window as Window & typeof globalThis & { fabricCanvas: { loadFromJSON: ReturnType<typeof vi.fn> } }
		).fabricCanvas;
		expect(canvas.loadFromJSON).toHaveBeenCalled();
	});

	it("should add collaboration comments", () => {
		const promptMock = vi.mocked(prompt);
		promptMock.mockReturnValue("Needs more contrast");
		render(<TopMenuBar />);

		fireEvent.click(screen.getByText("Add Reviewer Comment"));

		expect(screen.getByText("Needs more contrast")).toBeInTheDocument();
	});

	it("should trigger quick command on Cmd+K", () => {
		const promptMock = vi.mocked(prompt);
		promptMock.mockReturnValue("grid");
		render(<TopMenuBar />);

		fireEvent.keyDown(window, { key: "k", metaKey: true });
		expect(mockSetShowGrid).toHaveBeenCalledWith(true);
	});
});
