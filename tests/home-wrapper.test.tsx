import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomeWrapper from "@/components/home/HomeWrapper";
import { useArtStudioStore } from "@/stores/artStudioStore";

vi.mock("@/stores/artStudioStore", () => ({
	useArtStudioStore: vi.fn(),
}));

vi.mock("@/components/layout/TopMenuBar", () => ({
	TopMenuBar: () => <div data-testid="top-menu-bar" />,
}));
vi.mock("@/components/toolbar/ToolSidebar", () => ({
	ToolSidebar: () => <div data-testid="tool-sidebar" />,
}));
vi.mock("@/components/canvas/KonvaCanvas", () => ({
	default: () => <div data-testid="drawing-canvas" />,
}));
vi.mock("@/components/panels/BrushPanel", () => ({
	BrushPanel: () => <div data-testid="brush-panel" />,
}));
vi.mock("@/components/panels/ColorPanel", () => ({
	ColorPanel: () => <div data-testid="color-panel" />,
}));
vi.mock("@/components/panels/HistoryPanel", () => ({
	HistoryPanel: () => <div data-testid="history-panel" />,
}));
vi.mock("@/components/panels/LayersPanel", () => ({
	LayersPanel: () => <div data-testid="layers-panel" />,
}));
vi.mock("@/components/layout/StatusBar", () => ({
	StatusBar: () => <div data-testid="status-bar" />,
}));
vi.mock("@/hooks/useKeyboardShortcuts", () => ({
	useKeyboardShortcuts: vi.fn(),
}));

describe("HomeWrapper component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(window, "localStorage", {
			value: {
				getItem: vi.fn(() => null),
				setItem: vi.fn(),
			},
			configurable: true,
		});

		(useArtStudioStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
			showGrid: false,
			showRulers: false,
			showGuides: false,
			showLeftPanel: true,
			showRightPanel: true,
			showBrushesPanel: true,
			showColorsPanel: true,
			showLayersPanel: true,
			showStarPanel: false,
			showLinePanel: true,
			showGradientPanel: false,
			activeTool: "brush",
			initializeSession: vi.fn().mockResolvedValue(undefined),
			sessionId: "session-1",
		});
	});

	it("should render all main layout sections", async () => {
		render(<HomeWrapper />);

		await waitFor(() =>
			expect(screen.getByTestId("top-menu-bar")).toBeInTheDocument(),
		);
		expect(screen.getByTestId("tool-sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("drawing-canvas")).toBeInTheDocument();
		expect(screen.getByTestId("brush-panel")).toBeInTheDocument();
		expect(screen.getByTestId("color-panel")).toBeInTheDocument();
		expect(screen.getByTestId("layers-panel")).toBeInTheDocument();
		expect(screen.getByTestId("status-bar")).toBeInTheDocument();
	});

	it("should show cookie options and save preference", async () => {
		render(<HomeWrapper />);
		await waitFor(() =>
			expect(screen.getByText("Cookie Preferences")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

		expect(window.localStorage.setItem).toHaveBeenCalledWith(
			"artstudio:cookie-preference:v1",
			"all",
		);
		expect(screen.getByRole("button", { name: "Cookies: All" })).toBeInTheDocument();
	});
});
