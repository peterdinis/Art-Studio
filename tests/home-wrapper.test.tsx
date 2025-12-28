import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HomeWrapper from "@/components/home/HomeWrapper";
import React from "react";

// Mock all sub-components using their absolute paths as they are imported in HomeWrapper
vi.mock("@/components/layout/TopMenuBar", () => ({
	TopMenuBar: () => <div data-testid="top-menu-bar" />,
}));
vi.mock("@/components/toolbar/ToolSidebar", () => ({
	ToolSidebar: () => <div data-testid="tool-sidebar" />,
}));
vi.mock("@/components/canvas/DrawingCanvas", () => ({
	DrawingCanvas: () => <div data-testid="drawing-canvas" />,
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
vi.mock("@/components/ui/resizable", () => ({
	ResizablePanelGroup: ({ children }: any) => <div data-testid="resizable-group">{children}</div>,
	ResizablePanel: ({ children }: any) => <div data-testid="resizable-panel">{children}</div>,
	ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

describe("HomeWrapper component", () => {
	it("should render all main layout sections", () => {
		render(<HomeWrapper />);

		expect(screen.getByTestId("top-menu-bar")).toBeInTheDocument();
		expect(screen.getByTestId("tool-sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("drawing-canvas")).toBeInTheDocument();
		expect(screen.getByTestId("brush-panel")).toBeInTheDocument();
		expect(screen.getByTestId("color-panel")).toBeInTheDocument();
		expect(screen.getByTestId("history-panel")).toBeInTheDocument();
		expect(screen.getByTestId("layers-panel")).toBeInTheDocument();
		expect(screen.getByTestId("status-bar")).toBeInTheDocument();
	});
});
