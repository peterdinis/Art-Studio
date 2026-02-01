"use client";

import React from "react";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Blend, Circle, Square, Sparkles } from "lucide-react";
import { TextOptionsPanel } from "@/components/panels/TextOptionsPanel";
import { CropPanel } from "@/components/panels/CropPanel";
import { LineOptionsPanel } from "@/components/panels/LineOptionsPanel";
import { TransformPanel } from "@/components/panels/TransformPanel";
import { GradientOptionsPanel } from "@/components/panels/GradientOptionsPanel";
import { PenOptionsPanel } from "@/components/panels/PenOptionsPanel";
import { PolygonOptionsPanel } from "@/components/panels/PolygonOptionsPanel";
import { ShapeOptionsPanel } from "@/components/panels/ShapeOptionsPanel";
import { SelectionOptionsPanel } from "@/components/panels/SelectionOptionsPanel";

interface ToolOption {
	name: string;
	description: string;
	min: number;
	max: number;
	value: number;
	onChange: (value: number) => void;
	unit?: string;
}

const drawingTools: Tool[] = [
	"brush",
	"pencil",
	"eraser",
	"clone",
	"healing",
	"blur",
	"dodge",
	"burn",
];
const selectionTools: Tool[] = ["select", "marquee", "lasso", "magicwand"];
const shapeTools: Tool[] = [
	"rectangle",
	"ellipse",
	"polygon",
	"line",
	"pen",
	"star",
];

const ZoomOptions: React.FC = () => {
	const { zoom, setZoom, resetCanvasView } = useArtStudioStore();

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex justify-between items-center mb-1">
					<Label className="text-xs text-muted-foreground">Zoom Level</Label>
					<span className="text-xs font-mono">{Math.round(zoom)}%</span>
				</div>
				<Slider
					value={[zoom]}
					onValueChange={([val]) => setZoom(val)}
					min={10}
					max={500}
					step={10}
				/>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<button
					onClick={() => setZoom(Math.min(zoom + 25, 500))}
					className="px-3 py-2 bg-muted/50 hover:bg-muted rounded text-xs transition-colors"
				>
					Zoom In
				</button>
				<button
					onClick={() => setZoom(Math.max(zoom - 25, 10))}
					className="px-3 py-2 bg-muted/50 hover:bg-muted rounded text-xs transition-colors"
				>
					Zoom Out
				</button>
				<button
					onClick={() => setZoom(100)}
					className="px-3 py-2 bg-muted/50 hover:bg-muted rounded text-xs transition-colors"
				>
					Actual Size
				</button>
				<button
					onClick={resetCanvasView}
					className="px-3 py-2 bg-muted/50 hover:bg-muted rounded text-xs transition-colors"
				>
					Fit Screen
				</button>
			</div>
		</div>
	);
};

export const BrushPanel: React.FC = () => {
	const { brushSettings, setBrushSettings, activeTool } = useArtStudioStore();

	const isDrawingTool = drawingTools.includes(activeTool);
	const isSelectionTool = selectionTools.includes(activeTool);
	const isShapeTool = shapeTools.includes(activeTool);
	const isTextTool = activeTool === "text";

	const getToolTitle = () => {
		const titles: Record<string, string> = {
			brush: "Brush",
			pencil: "Pencil",
			eraser: "Eraser",
			clone: "Clone Stamp",
			healing: "Healing Brush",
			blur: "Blur",
			marquee: "Marquee Selection",
			lasso: "Lasso Selection",
			magicwand: "Magic Wand",
			select: "Move Tool",
			rectangle: "Rectangle",
			ellipse: "Ellipse",
			polygon: "Polygon",
			line: "Line",
			pen: "Pen",
			text: "Text",
			fill: "Paint Bucket",
			gradient: "Gradient",
			eyedropper: "Eyedropper",
			hand: "Hand",
			zoom: "Zoom",
		};
		return titles[activeTool] || "Tool";
	};

	// Pokud je aktivní text tool, zobrazte TextOptionsPanel
	if (isTextTool) {
		return <TextOptionsPanel />;
	}

	if (activeTool === "crop") {
		return <CropPanel />;
	}

	if (activeTool === "line") {
		return <LineOptionsPanel />;
	}

	if (activeTool === "move" || activeTool === "select") {
		return <TransformPanel />;
	}

	if (activeTool === "gradient") {
		return <GradientOptionsPanel />;
	}

	if (activeTool === "pen") {
		return <PenOptionsPanel />;
	}

	if (activeTool === "polygon") {
		return <PolygonOptionsPanel />;
	}

	if (activeTool === "rectangle" || activeTool === "ellipse") {
		return <ShapeOptionsPanel />;
	}

	if (
		activeTool === "marquee" ||
		activeTool === "lasso" ||
		activeTool === "magicwand"
	) {
		return <SelectionOptionsPanel />;
	}

	const renderSliderWithTooltip = (option: ToolOption) => (
		<div className="space-y-2" key={option.name}>
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-1.5">
					<Label className="text-xs text-muted-foreground">{option.name}</Label>
					<Tooltip delayDuration={300}>
						<TooltipTrigger asChild>
							<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-50">
							<p className="text-xs">{option.description}</p>
						</TooltipContent>
					</Tooltip>
				</div>
				<span className="text-xs font-mono text-foreground">
					{option.value}
					{option.unit || ""}
				</span>
			</div>
			<Slider
				value={[option.value]}
				onValueChange={([value]) => option.onChange(value)}
				min={option.min}
				max={option.max}
				step={1}
				className="w-full"
			/>
		</div>
	);

	const renderDrawingOptions = () => {
		const options: ToolOption[] = [
			{
				name: "Size",
				description:
					"Controls the diameter of the brush tip. Use [ and ] keys to quickly adjust.",
				min: 1,
				max: 500,
				value:
					activeTool === "healing"
						? brushSettings.healingSize
						: activeTool === "blur"
							? brushSettings.blurSize
							: brushSettings.size,
				onChange: (value) =>
					activeTool === "healing"
						? setBrushSettings({ healingSize: value })
						: activeTool === "blur"
							? setBrushSettings({ blurSize: value })
							: setBrushSettings({ size: value }),
				unit: "px",
			},
		];

		// Opacity - hide for dodge/burn as they use intensity
		if (activeTool !== "dodge" && activeTool !== "burn") {
			options.push({
				name: "Opacity",
				description: "Controls the transparency of each stroke.",
				min: 1,
				max: 100,
				value:
					activeTool === "healing"
						? brushSettings.healingOpacity
						: activeTool === "clone"
							? brushSettings.cloneOpacity
							: brushSettings.opacity,
				onChange: (value) =>
					activeTool === "healing"
						? setBrushSettings({ healingOpacity: value })
						: activeTool === "clone"
							? setBrushSettings({ cloneOpacity: value })
							: setBrushSettings({ opacity: value }),
				unit: "%",
			});
		}

		// Hardness - hide for dodge/burn if not applicable (or keep if needed)
		// Assuming dodge/burn might use soft brushes, but let's keep it simple or enable if requested.
		// Standard dodge/burn usually has hardness. Let's keep it enabled for now but after Opacity.
		options.push({
			name: "Hardness",
			description: "Controls the edge softness of the brush. 100% = hard edge.",
			min: 0,
			max: 100,
			value:
				activeTool === "healing"
					? brushSettings.healingHardness
					: brushSettings.hardness,
			onChange: (value) =>
				activeTool === "healing"
					? setBrushSettings({ healingHardness: value })
					: setBrushSettings({ hardness: value }),
			unit: "%",
		});

		if (activeTool === "dodge") {
			options.push({
				name: "Exposure",
				description: "Controls the intensity of the lightening effect.",
				min: 1,
				max: 100,
				value: brushSettings.dodgeIntensity || 50,
				onChange: (value) => setBrushSettings({ dodgeIntensity: value }),
				unit: "%",
			});
		}

		if (activeTool === "burn") {
			options.push({
				name: "Exposure",
				description: "Controls the intensity of the darkening effect.",
				min: 1,
				max: 100,
				value: brushSettings.burnIntensity || 50,
				onChange: (value) => setBrushSettings({ burnIntensity: value }),
				unit: "%",
			});
		}

		if (activeTool === "blur") {
			options.push({
				name: "Intensity",
				description: "Controls how strong the blur effect is.",
				min: 1,
				max: 100,
				value: brushSettings.blurIntensity,
				onChange: (value) => setBrushSettings({ blurIntensity: value }),
				unit: "%",
			});
		}

		return (
			<div className="space-y-4">
				{options.map(renderSliderWithTooltip)}

				{activeTool === "healing" && (
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">
							Healing Mode
						</Label>
						<div className="grid grid-cols-2 gap-1">
							{["clone", "texture", "lighten", "darken"].map((mode) => (
								<button
									key={mode}
									onClick={() => setBrushSettings({ healingMode: mode as any })}
									className={`px-2 py-1 text-[10px] rounded transition-colors capitalize ${
										brushSettings.healingMode === mode
											? "bg-primary/20 border border-primary/30"
											: "bg-muted/50 hover:bg-muted"
									}`}
								>
									{mode}
								</button>
							))}
						</div>
					</div>
				)}

				{activeTool === "clone" && (
					<div className="flex items-center justify-between pt-2">
						<Label className="text-xs text-muted-foreground">Aligned</Label>
						<button
							onClick={() =>
								setBrushSettings({ cloneAligned: !brushSettings.cloneAligned })
							}
							className={`w-10 h-5 rounded-full transition-colors relative ${
								brushSettings.cloneAligned ? "bg-primary" : "bg-muted"
							}`}
						>
							<div
								className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
									brushSettings.cloneAligned ? "left-6" : "left-1"
								}`}
							/>
						</button>
					</div>
				)}
			</div>
		);
	};

	const renderSelectionOptions = () => (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex justify-between items-center mb-1">
					<div className="flex items-center gap-1.5">
						<Label className="text-xs text-muted-foreground">Feather</Label>
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-50">
								<p className="text-xs">
									Softens the edges of the selection for smoother blending.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<span className="text-xs font-mono">{brushSettings.feather}px</span>
				</div>
				<Slider
					value={[brushSettings.feather]}
					onValueChange={([val]) => setBrushSettings({ feather: val })}
					min={0}
					max={100}
					step={1}
				/>
			</div>

			{activeTool === "magicwand" && (
				<div className="space-y-2">
					<div className="flex justify-between items-center mb-1">
						<div className="flex items-center gap-1.5">
							<Label className="text-xs text-muted-foreground">Tolerance</Label>
							<Tooltip delayDuration={300}>
								<TooltipTrigger asChild>
									<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
								</TooltipTrigger>
								<TooltipContent side="right" className="max-w-50">
									<p className="text-xs">
										Determines the range of similar colors selected.
									</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<span className="text-xs font-mono">{brushSettings.tolerance}</span>
					</div>
					<Slider
						value={[brushSettings.tolerance]}
						onValueChange={([val]) => setBrushSettings({ tolerance: val })}
						min={0}
						max={255}
						step={1}
					/>
				</div>
			)}
		</div>
	);

	const renderShapeOptions = () => (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center gap-1.5">
					<Label className="text-xs text-muted-foreground">Stroke Width</Label>
					<Tooltip delayDuration={300}>
						<TooltipTrigger asChild>
							<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-50">
							<p className="text-xs">The thickness of the shape's outline.</p>
						</TooltipContent>
					</Tooltip>
				</div>
				<Slider
					value={[brushSettings.strokeWidth]}
					onValueChange={([val]) => setBrushSettings({ strokeWidth: val })}
					min={0}
					max={50}
					step={1}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Fill Type</Label>
				<div className="flex gap-1">
					<button
						onClick={() => setBrushSettings({ fillType: "solid" })}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
							brushSettings.fillType === "solid"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						<Square className="w-3 h-3" /> Solid
					</button>
					<button
						onClick={() => setBrushSettings({ fillType: "gradient" })}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
							brushSettings.fillType === "gradient"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						<Blend className="w-3 h-3" /> Gradient
					</button>
					<button
						onClick={() => setBrushSettings({ fillType: "none" })}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
							brushSettings.fillType === "none"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						<Circle className="w-3 h-3" /> None
					</button>
				</div>
			</div>

			{activeTool === "polygon" && (
				<div className="space-y-2">
					<div className="flex items-center gap-1.5">
						<Label className="text-xs text-muted-foreground">Sides</Label>
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-50">
								<p className="text-xs">Number of sides for the polygon.</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<Slider
						value={[brushSettings.sides]}
						onValueChange={([val]) => setBrushSettings({ sides: val })}
						min={3}
						max={12}
						step={1}
					/>
				</div>
			)}

			<div className="space-y-2">
				<div className="flex items-center gap-1.5">
					<Label className="text-xs text-muted-foreground">Corner Radius</Label>
				</div>
				<Slider
					value={[brushSettings.cornerRadius]}
					onValueChange={([val]) => setBrushSettings({ cornerRadius: val })}
					min={0}
					max={50}
					step={1}
				/>
			</div>
		</div>
	);

	const renderUtilityOptions = () => {
		if (activeTool === "fill") {
			return (
				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex justify-between items-center mb-1">
							<Label className="text-xs text-muted-foreground">Tolerance</Label>
							<span className="text-xs font-mono">
								{brushSettings.fillTolerance}
							</span>
						</div>
						<Slider
							value={[brushSettings.fillTolerance]}
							onValueChange={([val]) =>
								setBrushSettings({ fillTolerance: val })
							}
							min={0}
							max={255}
							step={1}
						/>
					</div>

					<div className="flex items-center justify-between">
						<Label className="text-xs text-muted-foreground">Contiguous</Label>
						<button
							onClick={() =>
								setBrushSettings({
									fillContiguous: !brushSettings.fillContiguous,
								})
							}
							className={`w-10 h-5 rounded-full transition-colors relative ${
								brushSettings.fillContiguous ? "bg-primary" : "bg-muted"
							}`}
						>
							<div
								className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
									brushSettings.fillContiguous ? "left-6" : "left-1"
								}`}
							/>
						</button>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-center mb-1">
							<Label className="text-xs text-muted-foreground">Opacity</Label>
							<span className="text-xs font-mono">
								{brushSettings.fillOpacity}%
							</span>
						</div>
						<Slider
							value={[brushSettings.fillOpacity]}
							onValueChange={([val]) => setBrushSettings({ fillOpacity: val })}
							min={1}
							max={100}
							step={1}
						/>
					</div>
				</div>
			);
		}

		if (activeTool === "eyedropper") {
			return (
				<div className="space-y-4">
					<div className="bg-muted/30 p-3 rounded-md border border-border/50 text-xs space-y-2">
						<p className="font-medium text-foreground">Usage:</p>
						<ul className="list-disc list-inside space-y-1 text-muted-foreground">
							<li>
								<span className="text-foreground">Click</span> to pick Primary
								Color
							</li>
							<li>
								<span className="text-foreground">Alt + Click</span> to pick
								Secondary Color
							</li>
						</ul>
					</div>
				</div>
			);
		}

		return renderGenericOptions();
	};

	const renderNavigationOptions = () => {
		if (activeTool === "zoom") {
			// Need to access zoom functions from store, might need to update store usage in component if not spread
			// Assuming setZoom and zoom are available from useArtStudioStore hook call at top of component
			// We need to check if they are destructured.
			// Checking file content: const { brushSettings, setBrushSettings, activeTool } = useArtStudioStore();
			// Only those were destructured. We need to grab zoom-related ones.

			return <ZoomOptions />;
		}

		if (activeTool === "hand") {
			return (
				<div className="space-y-4">
					<div className="bg-muted/30 p-3 rounded-md border border-border/50 text-xs space-y-2">
						<p className="font-medium text-foreground">Usage:</p>
						<ul className="list-disc list-inside space-y-1 text-muted-foreground">
							<li>
								<span className="text-foreground">Click & Drag</span> to pan the
								canvas
							</li>
							<li>
								Hold <span className="text-foreground">Spacebar</span> with any
								tool to temporarily switch to Hand tool
							</li>
						</ul>
					</div>
				</div>
			);
		}

		return renderGenericOptions();
	};

	const renderGenericOptions = () => (
		<div className="text-center py-4">
			<Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
			<p className="text-xs text-muted-foreground">
				Select a tool to see its options
			</p>
		</div>
	);

	return (
		<div className="panel-glass p-4 w-full space-y-5 animate-fade-in">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-foreground">
					{getToolTitle()} Options
				</h3>
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<HelpCircle className="w-4 h-4 text-muted-foreground/50 cursor-help" />
					</TooltipTrigger>
					<TooltipContent side="left" className="max-w-50">
						<p className="text-xs">Customize how the current tool behaves.</p>
					</TooltipContent>
				</Tooltip>
			</div>

			{isDrawingTool && renderDrawingOptions()}
			{isSelectionTool && renderSelectionOptions()}
			{isShapeTool && renderShapeOptions()}
			{activeTool === "fill" || activeTool === "eyedropper"
				? renderUtilityOptions()
				: null}
			{(activeTool === "zoom" || activeTool === "hand") &&
				renderNavigationOptions()}

			{!isDrawingTool &&
				!isSelectionTool &&
				!isShapeTool &&
				!isTextTool &&
				activeTool !== "fill" &&
				activeTool !== "eyedropper" &&
				activeTool !== "zoom" &&
				activeTool !== "hand" &&
				renderGenericOptions()}

			{isDrawingTool && (
				<div className="pt-2">
					<div className="flex items-center gap-1.5 mb-2">
						<Label className="text-xs text-muted-foreground">Preview</Label>
					</div>
					<div className="h-16 bg-muted/30 rounded-md flex items-center justify-center border border-border/50">
						<div
							className="rounded-full bg-foreground transition-all duration-150"
							style={{
								width: Math.min(brushSettings.size, 56),
								height: Math.min(brushSettings.size, 56),
								opacity: brushSettings.opacity / 100,
								filter: `blur(${(100 - brushSettings.hardness) / 25}px)`,
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
