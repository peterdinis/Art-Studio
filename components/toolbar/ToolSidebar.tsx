"use client";

import React from "react";
import {
	Paintbrush,
	Eraser,
	PaintBucket,
	Pipette,
	Square,
	Circle,
	Minus,
	MousePointer,
	Move,
	Undo2,
	Redo2,
	Lasso,
	Wand2,
	Pen,
	Type,
	Hand,
	ZoomIn,
	Stamp,
	Droplet,
	Blend,
	Sparkles,
	RectangleHorizontal,
	Hexagon,
	Spline,
} from "lucide-react";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface ToolConfig {
	id: Tool;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	shortcut: string;
	description: string;
	category: "selection" | "drawing" | "shape" | "utility" | "navigation";
}

const tools: ToolConfig[] = [
	{
		id: "select",
		icon: MousePointer,
		label: "Move Tool",
		shortcut: "V",
		description:
			"Select and move layers, selections, and other elements on the canvas.",
		category: "selection",
	},
	{
		id: "marquee",
		icon: RectangleHorizontal,
		label: "Rectangular Marquee",
		shortcut: "M",
		description:
			"Create rectangular selections. Hold Shift for square, Alt for center origin.",
		category: "selection",
	},
	{
		id: "lasso",
		icon: Lasso,
		label: "Lasso Tool",
		shortcut: "L",
		description:
			"Draw freehand selections around objects. Double-click or press Enter to close.",
		category: "selection",
	},
	{
		id: "magicwand",
		icon: Wand2,
		label: "Magic Wand",
		shortcut: "W",
		description:
			"Select areas of similar color. Adjust tolerance in options to control sensitivity.",
		category: "selection",
	},

	// Drawing Tools
	{
		id: "brush",
		icon: Paintbrush,
		label: "Brush Tool",
		shortcut: "B",
		description:
			"Paint strokes with customizable brush tips. Use [ ] to adjust size, Shift+click for straight lines.",
		category: "drawing",
	},
	{
		id: "pencil",
		icon: Pen,
		label: "Pencil Tool",
		shortcut: "N",
		description:
			"Draw hard-edged freehand lines. Ideal for pixel art and precise work.",
		category: "drawing",
	},
	{
		id: "eraser",
		icon: Eraser,
		label: "Eraser Tool",
		shortcut: "E",
		description:
			"Erase pixels to transparency or background color. Hold Alt to sample background.",
		category: "drawing",
	},
	{
		id: "fill",
		icon: PaintBucket,
		label: "Paint Bucket",
		shortcut: "G",
		description:
			"Fill areas with the foreground color. Adjust tolerance for color matching range.",
		category: "drawing",
	},
	{
		id: "gradient",
		icon: Blend,
		label: "Gradient Tool",
		shortcut: "G",
		description:
			"Create smooth color transitions. Click and drag to define gradient direction.",
		category: "drawing",
	},
	{
		id: "eyedropper",
		icon: Pipette,
		label: "Eyedropper",
		shortcut: "I",
		description:
			"Sample colors from the canvas. Alt+click with any tool for quick sampling.",
		category: "drawing",
	},
	{
		id: "clone",
		icon: Stamp,
		label: "Clone Stamp",
		shortcut: "S",
		description:
			"Paint with pixels from another area. Alt+click to set source point.",
		category: "drawing",
	},
	{
		id: "healing",
		icon: Droplet,
		label: "Healing Brush",
		shortcut: "J",
		description:
			"Remove imperfections by blending with surrounding pixels. Great for photo retouching.",
		category: "drawing",
	},
	{
		id: "blur",
		icon: Sparkles,
		label: "Blur Tool",
		shortcut: "R",
		description:
			"Soften edges and reduce detail. Useful for depth of field effects.",
		category: "drawing",
	},

	// Shape Tools
	{
		id: "rectangle",
		icon: Square,
		label: "Rectangle Tool",
		shortcut: "U",
		description: "Draw rectangles and squares. Hold Shift for perfect squares.",
		category: "shape",
	},
	{
		id: "ellipse",
		icon: Circle,
		label: "Ellipse Tool",
		shortcut: "U",
		description: "Draw ellipses and circles. Hold Shift for perfect circles.",
		category: "shape",
	},
	{
		id: "polygon",
		icon: Hexagon,
		label: "Polygon Tool",
		shortcut: "U",
		description:
			"Create multi-sided shapes. Set number of sides in tool options.",
		category: "shape",
	},
	{
		id: "line",
		icon: Minus,
		label: "Line Tool",
		shortcut: "U",
		description: "Draw straight lines. Hold Shift to constrain to 45° angles.",
		category: "shape",
	},
	{
		id: "pen",
		icon: Spline,
		label: "Pen Tool",
		shortcut: "P",
		description:
			"Create precise paths with anchor points. Essential for complex selections and shapes.",
		category: "shape",
	},
	{
		id: "text",
		icon: Type,
		label: "Text Tool",
		shortcut: "T",
		description:
			"Add and edit text layers. Click for point text, drag for area text.",
		category: "shape",
	},

	// Navigation Tools
	{
		id: "hand",
		icon: Hand,
		label: "Hand Tool",
		shortcut: "H",
		description:
			"Pan around the canvas. Hold Space with any tool for quick access.",
		category: "navigation",
	},
	{
		id: "zoom",
		icon: ZoomIn,
		label: "Zoom Tool",
		shortcut: "Z",
		description: "Zoom in and out. Click to zoom in, Alt+click to zoom out.",
		category: "navigation",
	},
];

export const ToolSidebar: React.FC = () => {
	const {
		activeTool,
		setActiveTool,
		canUndo,
		canRedo,
		undo,
		redo,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
		swapColors,
		setShowColorsPanel,
	} = useArtStudioStore();

	// Keyboard shortcuts - using capture phase for priority
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if user is typing in an input field
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			// Skip if modifier keys are pressed (except for specific combos)
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			const key = e.key.toUpperCase();
			const tool = tools.find((t) => t.shortcut.toUpperCase() === key);

			if (tool) {
				e.preventDefault();
				e.stopPropagation();
				setActiveTool(tool.id);
			}

			// Additional shortcuts
			if (key === "X") {
				e.preventDefault();
				const store = useArtStudioStore.getState();
				store.swapColors();
			}

			if (key === "D") {
				e.preventDefault();
				const store = useArtStudioStore.getState();
				store.setPrimaryColor("#ffffff");
				store.setSecondaryColor("#000000");
			}
		};

		// Use capture phase for higher priority
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [setActiveTool]);

	const renderToolGroup = (category: ToolConfig["category"], title: string) => {
		const categoryTools = tools.filter((t) => t.category === category);

		return (
			<>
				{categoryTools.map((tool) => (
					<Tooltip key={tool.id} delayDuration={400}>
						<TooltipTrigger asChild>
							<button
								onClick={() => setActiveTool(tool.id)}
								className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
							>
								<tool.icon className="w-5 h-5" />
							</button>
						</TooltipTrigger>
						<TooltipContent
							side="right"
							className="max-w-70 p-3"
							sideOffset={8}
						>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between gap-4">
									<span className="font-semibold text-black">
										{tool.label}
									</span>
									<kbd className="px-1.5 py-0.5 text-xs text-blue-100 bg-muted rounded font-mono">
										{tool.shortcut}
									</kbd>
								</div>
								<p className="text-xs text-black leading-relaxed">
									{tool.description}
								</p>
							</div>
						</TooltipContent>
					</Tooltip>
				))}
			</>
		);
	};

	return (
		<div className="w-14 h-full panel-glass flex flex-col items-center py-3 gap-1 animate-fade-in overflow-y-auto scrollbar-thin">
			{/* Selection Tools */}
			<div className="flex flex-col items-center gap-1">
				{renderToolGroup("selection", "Selection")}
			</div>

			<Separator className="my-1.5 w-8" />

			{/* Drawing Tools */}
			<div className="flex flex-col items-center gap-1">
				{renderToolGroup("drawing", "Drawing")}
			</div>

			<Separator className="my-1.5 w-8" />

			{/* Shape Tools */}
			<div className="flex flex-col items-center gap-1">
				{renderToolGroup("shape", "Shapes")}
			</div>

			<Separator className="my-1.5 w-8" />

			{/* Navigation Tools */}
			<div className="flex flex-col items-center gap-1">
				{renderToolGroup("navigation", "Navigation")}
			</div>

			<Separator className="my-1.5 w-8" />

			{/* Undo/Redo */}
			<Tooltip delayDuration={400}>
				<TooltipTrigger asChild>
					<button
						onClick={() => {
							const entry = undo();
							if (entry) {
								const canvas = window.fabricCanvas || window.konvaStage;
								if (canvas) {
									if (window.fabricCanvas) {
										canvas.loadFromJSON(JSON.parse(entry.canvasData)).then(() => {
											canvas.renderAll();
										});
									} else if (window.konvaStage) {
										window.dispatchEvent(
											new CustomEvent("artstudio:restore-history", {
												detail: { canvasData: entry.canvasData },
											}),
										);
									}
								}
							}
						}}
						disabled={!canUndo()}
						className="tool-button disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<Undo2 className="w-5 h-5" />
					</button>
				</TooltipTrigger>
				<TooltipContent
					side="right"
					className="max-w-[280px] p-3"
					sideOffset={8}
				>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between gap-4">
							<span className="font-semibold text-foreground">Undo</span>
							<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
								⌘Z
							</kbd>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Reverse the last action. Use History panel for multiple steps.
						</p>
					</div>
				</TooltipContent>
			</Tooltip>

			<Tooltip delayDuration={400}>
				<TooltipTrigger asChild>
					<button
						onClick={() => {
							const entry = redo();
							if (entry) {
								const canvas = window.fabricCanvas || window.konvaStage;
								if (canvas) {
									if (window.fabricCanvas) {
										canvas.loadFromJSON(JSON.parse(entry.canvasData)).then(() => {
											canvas.renderAll();
										});
									} else if (window.konvaStage) {
										window.dispatchEvent(
											new CustomEvent("artstudio:restore-history", {
												detail: { canvasData: entry.canvasData },
											}),
										);
									}
								}
							}
						}}
						disabled={!canRedo()}
						className="tool-button disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<Redo2 className="w-5 h-5" />
					</button>
				</TooltipTrigger>
				<TooltipContent
					side="right"
					className="max-w-[280px] p-3"
					sideOffset={8}
				>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between gap-4">
							<span className="font-semibold text-foreground">Redo</span>
							<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
								⇧⌘Z
							</kbd>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Reapply an action that was previously undone.
						</p>
					</div>
				</TooltipContent>
			</Tooltip>

			{/* Foreground/Background Color */}
			<div className="mt-auto pt-2">
				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<div className="relative w-10 h-10">
							{/* Primary Color - Clickable */}
							<button
								onClick={() => {
									const input = document.createElement("input");
									input.type = "color";
									input.value = primaryColor;
									input.onchange = (e) => {
										const color = (e.target as HTMLInputElement).value;
										setPrimaryColor(color);
									};
									input.click();
								}}
								className="absolute top-0 left-0 w-6 h-6 rounded border-2 border-card bg-foreground z-10 cursor-pointer hover:scale-110 transition-transform"
								style={{ backgroundColor: primaryColor }}
								title="Primary Color - Click to change"
							/>
							{/* Secondary Color - Clickable */}
							<button
								onClick={() => {
									const input = document.createElement("input");
									input.type = "color";
									input.value = secondaryColor;
									input.onchange = (e) => {
										const color = (e.target as HTMLInputElement).value;
										setSecondaryColor(color);
									};
									input.click();
								}}
								className="absolute bottom-0 right-0 w-6 h-6 rounded border-2 border-card cursor-pointer hover:scale-110 transition-transform"
								style={{ backgroundColor: secondaryColor }}
								title="Secondary Color - Click to change"
							/>
							{/* Swap button overlay - double click to swap */}
							<button
								onDoubleClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									swapColors();
								}}
								className="absolute inset-0 z-20 cursor-pointer"
								title="Double-click to swap colors"
							/>
						</div>
					</TooltipTrigger>
					<TooltipContent
						side="right"
						className="max-w-[280px] p-3"
						sideOffset={8}
					>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between gap-4">
								<span className="font-semibold text-foreground">Colors</span>
								<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
									X
								</kbd>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Click swatches to change colors. Double-click to swap, or press X
								to swap, D to reset to defaults.
							</p>
							<button
								onClick={() => setShowColorsPanel(true)}
								className="text-xs text-primary hover:underline mt-2"
							>
								Open Color Panel →
							</button>
						</div>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};
