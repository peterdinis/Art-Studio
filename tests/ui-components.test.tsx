import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Slider } from "@/components/ui/slider";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { PhotoshopLoading } from "@/components/shared/PhotoshopLoading";

interface SliderMockProps {
	children: React.ReactNode;
	onValueChange: (value: number[]) => void;
	value: number[];
	defaultValue: number[];
	min: number;
	max: number;
	[key: string]: unknown;
}

interface TooltipRootMockProps {
	children: React.ReactNode;
	open?: boolean;
}

interface TooltipTriggerMockProps {
	children: React.ReactNode;
}

interface TooltipContentMockProps {
	children: React.ReactNode;
}

interface TrackMockProps {
	children: React.ReactNode;
}

interface ProviderMockProps {
	children: React.ReactNode;
}

interface PortalMockProps {
	children: React.ReactNode;
}

// Mock Radix UI Sliders and Tooltips as they are very complex to test in JSDOM
// without full ARIA support or custom setups.
vi.mock("@radix-ui/react-slider", () => ({
	Root: ({
		children,
		onValueChange,
		value,
		defaultValue,
		min,
		max,
		...props
	}: SliderMockProps) => (
		<div data-testid="slider-root" {...props}>
			<input
				type="range"
				min={min}
				max={max}
				role="slider"
				value={value ? value[0] : defaultValue ? defaultValue[0] : 0}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onValueChange && onValueChange([parseInt(e.target.value, 10)])
				}
			/>
			{children}
		</div>
	),
	Track: ({ children }: TrackMockProps) => <div>{children}</div>,
	Range: () => <div />,
	Thumb: () => <div />,
}));

vi.mock("@radix-ui/react-tooltip", () => ({
	Provider: ({ children }: ProviderMockProps) => <div>{children}</div>,
	Root: ({ children, open }: TooltipRootMockProps) => (
		<div data-testid="tooltip-root" data-state={open ? "open" : "closed"}>
			{children}
		</div>
	),
	Trigger: ({ children }: TooltipTriggerMockProps) => (
		<div data-testid="tooltip-trigger">{children}</div>
	),
	Portal: ({ children }: PortalMockProps) => <div>{children}</div>,
	Content: ({ children }: TooltipContentMockProps) => (
		<div data-testid="tooltip-content">{children}</div>
	),
	Arrow: () => <div />,
}));

describe("UI Components", () => {
	describe("Slider component", () => {
		it("should render and handle value change", () => {
			const handleChange = vi.fn();
			render(
				<Slider value={[50]} onValueChange={handleChange} min={0} max={100} />,
			);

			const sliderInput = screen.getByRole("slider");
			fireEvent.change(sliderInput, { target: { value: "75" } });

			expect(handleChange).toHaveBeenCalledWith([75]);
		});
	});

	describe("Tooltip component", () => {
		it("should render trigger and content", () => {
			render(
				<Tooltip open={true}>
					<TooltipTrigger>Hover me</TooltipTrigger>
					<TooltipContent>Tooltip info</TooltipContent>
				</Tooltip>,
			);
			expect(screen.getByText("Hover me")).toBeInTheDocument();
			expect(screen.getByText("Tooltip info")).toBeInTheDocument();
		});
	});

	describe("PhotoshopLoading component", () => {
		it("should render the splash screen", () => {
			render(<PhotoshopLoading />);
			expect(screen.getByText(/ArtStudio Pro/i)).toBeInTheDocument();
			expect(screen.getByText(/Brushes/i)).toBeInTheDocument();
			expect(
				screen.getByText(/Loading creative workspace/i),
			).toBeInTheDocument();
		});
	});
});