import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrushPanel } from "@/components/panels/BrushPanel";
import { useArtStudioStore } from "@/stores/artStudioStore";
import React from "react";

// Mock resize observer
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

vi.mock("@/stores/artStudioStore", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		useArtStudioStore: actual.useArtStudioStore,
	};
});

interface MockTooltipProps {
	children: React.ReactNode;
}

interface MockSliderProps {
	value?: number[];
	defaultValue?: number[];
	onValueChange?: (value: number[]) => void;
	min: number;
	max: number;
}

// Mock UI components
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: MockTooltipProps) => (
		<div data-testid="tooltip">{children}</div>
	),
	TooltipTrigger: ({ children }: MockTooltipProps) => (
		<div data-testid="tooltip-trigger">{children}</div>
	),
	TooltipContent: ({ children }: MockTooltipProps) => (
		<div data-testid="tooltip-content">{children}</div>
	),
}));

vi.mock("@/components/ui/slider", () => ({
	Slider: ({
		value,
		defaultValue,
		onValueChange,
		min,
		max,
	}: MockSliderProps) => {
		// Handle both controlled (value) and uncontrolled (defaultValue) cases
		const val = value ? value[0] : defaultValue ? defaultValue[0] : 0;
		return (
			<input
				type="range"
				data-testid={`slider - ${min} -${max} `}
				value={val}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onValueChange && onValueChange([parseInt(e.target.value, 10)])
				}
			/>
		);
	},
}));

describe("BrushPanel component", () => {
	beforeEach(() => {
		useArtStudioStore.setState({
			activeTool: "brush",
			brushSettings: {
				size: 10,
				opacity: 100,
				hardness: 100,
				smoothing: 20,
				strokeWidth: 2,
				feather: 0,
				tolerance: 32,
				cornerRadius: 0,
				fillType: "solid",
				sides: 5,
			},
		});
	});

	it("should render drawing options for drawing tools", () => {
		render(<BrushPanel />);
		expect(screen.getByText("Brush Options")).toBeInTheDocument();
		expect(screen.getByText("Size")).toBeInTheDocument();
		expect(screen.getByText("Opacity")).toBeInTheDocument();
	});

	it("should update brush size via slider", () => {
		render(<BrushPanel />);
		// Size slider is the first one, min 1 max 500
		const sizeSlider = screen.getByTestId("slider-1-500");
		fireEvent.change(sizeSlider, { target: { value: "50" } });

		expect(useArtStudioStore.getState().brushSettings.size).toBe(50);
	});

	it("should show selection options when a selection tool is active", () => {
		useArtStudioStore.setState({ activeTool: "marquee" });
		render(<BrushPanel />);
		expect(screen.getByText("Marquee Selection Options")).toBeInTheDocument();
		expect(screen.getByText("Feather")).toBeInTheDocument();
	});

	it("should show generic message when a non-configurable tool is active", () => {
		useArtStudioStore.setState({ activeTool: "hand" });
		render(<BrushPanel />);
		expect(
			screen.getByText("Select a tool to see its options"),
		).toBeInTheDocument();
	});
});
