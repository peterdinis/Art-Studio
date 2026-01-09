"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import {
	ZoomIn,
	ZoomOut,
	MousePointer2,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export const StatusBar: React.FC = () => {
	const {
		zoom,
		setZoom,
		setPanOffset,
		activeTool,
		brushSettings,
		renderingEngine,
		setRenderingEngine,
	} = useArtStudioStore();

	const zoomLevels = [25, 50, 75, 100, 150, 200, 300, 400];

	const handleZoomIn = () => {
		const nextLevel = zoomLevels.find((z) => z > zoom) || zoom + 25;
		setZoom(Math.min(nextLevel, 500));
	};

	const handleZoomOut = () => {
		const prevLevel =
			[...zoomLevels].reverse().find((z) => z < zoom) || zoom - 25;
		setZoom(Math.max(prevLevel, 10));
	};

	const getToolDisplayName = () => {
		const names: Record<string, string> = {
			brush: "Brush Tool",
			pencil: "Pencil Tool",
			eraser: "Eraser Tool",
			fill: "Paint Bucket",
			gradient: "Gradient Tool",
			eyedropper: "Eyedropper",
			clone: "Clone Stamp",
			healing: "Healing Brush",
			blur: "Blur Tool",
			rectangle: "Rectangle Tool",
			ellipse: "Ellipse Tool",
			polygon: "Polygon Tool",
			line: "Line Tool",
			pen: "Pen Tool",
			text: "Text Tool",
			select: "Move Tool",
			marquee: "Marquee Selection",
			lasso: "Lasso Tool",
			magicwand: "Magic Wand",
			hand: "Hand Tool",
			zoom: "Zoom Tool",
		};
		return names[activeTool] || activeTool;
	};

	const isDrawingTool = [
		"brush",
		"pencil",
		"eraser",
		"clone",
		"healing",
		"blur",
	].includes(activeTool);

	return (
		<div className="h-8 bg-card border-t border-border flex items-center justify-between px-4 text-xs animate-fade-in">
			{/* Left: Tool Info */}
			<div className="flex items-center gap-4 text-muted-foreground">
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<div className="flex items-center gap-1.5 cursor-help">
							<MousePointer2 className="w-3.5 h-3.5" />
							<span>{getToolDisplayName()}</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p className="text-xs">
							Current active tool. Use keyboard shortcuts for quick switching.
						</p>
					</TooltipContent>
				</Tooltip>

				{isDrawingTool && (
					<>
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<span className="cursor-help">
									Size: {brushSettings.size}px
								</span>
							</TooltipTrigger>
							<TooltipContent side="top">
								<p className="text-xs">
									Brush diameter. Use [ and ] keys to adjust quickly.
								</p>
							</TooltipContent>
						</Tooltip>

						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<span className="cursor-help">
									Opacity: {brushSettings.opacity}%
								</span>
							</TooltipTrigger>
							<TooltipContent side="top">
								<p className="text-xs">
									Stroke transparency. Number keys 1-0 for quick preset.
								</p>
							</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>

			{/* Center: Canvas Info */}
			<div className="flex items-center gap-4 text-muted-foreground">
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<span className="cursor-help">1920 × 1080 px</span>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p className="text-xs">
							Canvas dimensions in pixels. Go to Image → Resize Canvas to
							change.
						</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<span className="cursor-help">72 DPI</span>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p className="text-xs">
							Dots per inch. 72 DPI is standard for screens, 300 DPI for print.
						</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<span className="cursor-help">RGB/8</span>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p className="text-xs">
							Color mode (RGB) and bit depth (8-bit = 256 levels per channel).
						</p>
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Right: Zoom Controls */}
			<div className="flex items-center gap-2">
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<button onClick={handleZoomOut} className="tool-button w-6 h-6">
							<ZoomOut className="w-3.5 h-3.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">
						<div className="space-y-0.5">
							<p className="font-medium">Zoom Out</p>
							<p className="text-xs text-muted-foreground">
								Decrease magnification level (⌘-)
							</p>
						</div>
					</TooltipContent>
				</Tooltip>

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<button
							onClick={() => setZoom(100)}
							className="min-w-15 text-center font-mono hover:text-foreground transition-colors"
						>
							{zoom.toFixed(0)}%
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">
						<div className="space-y-0.5">
							<p className="font-medium">Zoom Level</p>
							<p className="text-xs text-muted-foreground">
								Click to reset to 100%. Scroll to adjust.
							</p>
						</div>
					</TooltipContent>
				</Tooltip>

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<button onClick={handleZoomIn} className="tool-button w-6 h-6">
							<ZoomIn className="w-3.5 h-3.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">
						<div className="space-y-0.5">
							<p className="font-medium">Zoom In</p>
							<p className="text-xs text-muted-foreground">
								Increase magnification level (⌘+)
							</p>
						</div>
					</TooltipContent>
				</Tooltip>

				<div className="w-px h-4 bg-border mx-1" />
			</div>
		</div>
	);
};
