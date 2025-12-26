import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { useArtStudioStore } from "@/stores/artStudioStore";
import React from "react";

// Mock UI components
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tooltip">{children}</div>
	),
	TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tooltip-trigger">{children}</div>
	),
	TooltipContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tooltip-content">{children}</div>
	),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dropdown-menu">{children}</div>
	),
	DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dropdown-content">{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<div data-testid="dropdown-item" onClick={onClick}>
			{children}
		</div>
	),
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dropdown-trigger">{children}</div>
	),
}));

vi.mock("@/components/ui/slider", () => ({
	Slider: ({
		value,
		onValueChange,
	}: {
		value: number[];
		onValueChange: (v: number[]) => void;
	}) => (
		<input
			type="range"
			data-testid="opacity-slider"
			value={value[0]}
			onChange={(e) => onValueChange([parseInt(e.target.value)])}
		/>
	),
}));

// Mock Sonner
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("LayersPanel component", () => {
	beforeEach(() => {
		// Reset layers to initial state
		const store = useArtStudioStore.getState();
		// Manual reset since we don't have a reset function
		useArtStudioStore.setState({
			layers: [
				{
					id: "layer-1",
					name: "Background",
					visible: true,
					opacity: 100,
					locked: false,
				},
			],
			activeLayerId: "layer-1",
		});
	});

	it("should render the background layer by default", () => {
		render(<LayersPanel />);
		expect(screen.getByText("Background")).toBeInTheDocument();
	});

	it("should add a new layer when clicking the plus button", () => {
		render(<LayersPanel />);
		// The Plus button is in the header, first button
		const buttons = screen.getAllByRole("button");
		const plusButton = buttons[0];

		fireEvent.click(plusButton);
		expect(screen.getByText("Layer 2")).toBeInTheDocument();
	});

	it("should toggle layer visibility", () => {
		render(<LayersPanel />);
		// Visibility toggle is the first button in the layer item (after header buttons)
		const buttons = screen.getAllByRole("button");
		const visibilityButton = buttons[2];

		fireEvent.click(visibilityButton);
		const layers = useArtStudioStore.getState().layers;
		expect(layers[0].visible).toBe(false);
	});

	it("should update opacity via slider", () => {
		render(<LayersPanel />);
		const slider = screen.getByTestId("opacity-slider");

		fireEvent.change(slider, { target: { value: "50" } });
		const layers = useArtStudioStore.getState().layers;
		expect(layers[0].opacity).toBe(50);
	});
});
