"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { ZoomIn, ZoomOut, MousePointer2 } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export const StatusBar: React.FC = () => {
	const {
		zoom,
		setZoom,
		activeTool,
		brushSettings,
		canvasSize,
		cursorPosition,
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
		if (typeof activeTool !== "string") {
			return "Tool";
		}
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
			zoom: "Zoom Tool",
			undoZoom: "Undo Zoom",
			star: "Star Tool",
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
		<div className="h-8 bg-card border-t border-border flex items-center justify-between px-4 text-[11px] animate-fade-in font-medium select-none">
			{/* Left: Tool Info & Cursor */}
			<div className="flex items-center gap-5 text-muted-foreground h-full">
				<div className="flex items-center gap-1.5 min-w-[120px]">
					<MousePointer2 className="w-3 h-3" />
					<span className="text-foreground/80">{getToolDisplayName()}</span>
				</div>

				{isDrawingTool && (
					<div className="flex items-center gap-4 border-l border-border/50 pl-4">
						<span className="hover:text-foreground transition-colors">
							Size: <span className="text-foreground/70 font-mono">{brushSettings.size}px</span>
						</span>
						<span className="hover:text-foreground transition-colors">
							Opacity: <span className="text-foreground/70 font-mono">{brushSettings.opacity}%</span>
						</span>
					</div>
				)}

				<div className="flex items-center gap-4 border-l border-border/50 pl-4 min-w-[100px]">
					{cursorPosition ? (
						<div className="flex gap-2 font-mono">
							<span>X: <span className="text-foreground/70">{cursorPosition.x}</span></span>
							<span>Y: <span className="text-foreground/70">{cursorPosition.y}</span></span>
						</div>
					) : (
						<span className="opacity-40">Ready</span>
					)}
				</div>
			</div>

			{/* Center: Canvas Info */}
			<div className="flex items-center gap-6 text-muted-foreground absolute left-1/2 -translate-x-1/2">
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<span className="cursor-help hover:text-foreground transition-colors font-mono">
							{canvasSize?.width || 1920} × {canvasSize?.height || 1080} px
						</span>
					</TooltipTrigger>
					<TooltipContent side="top" className="text-[10px]">
						Canvas dimensions. Go to Image → Canvas Size to change.
					</TooltipContent>
				</Tooltip>

				<span className="w-1 h-1 rounded-full bg-border" />

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<span className="cursor-help hover:text-foreground transition-colors uppercase tracking-wider text-[10px]">
							72 DPI • RGB/8
						</span>
					</TooltipTrigger>
					<TooltipContent side="top" className="text-[10px]">
						Standard screen resolution and 8-bit color mode.
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Right: Zoom Controls */}
			<div className="flex items-center gap-1.5 text-muted-foreground">
				<button
					onClick={handleZoomOut}
					className="p-1 hover:text-foreground hover:bg-muted rounded transition-all active:scale-95"
					title="Zoom Out"
				>
					<ZoomOut className="w-3.5 h-3.5" />
				</button>

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<button
							onClick={() => setZoom(100)}
							className="px-2 py-0.5 hover:text-foreground hover:bg-muted rounded transition-all font-mono min-w-[45px] text-center"
						>
							{Math.round(zoom)}%
						</button>
					</TooltipTrigger>
					<TooltipContent side="top" className="text-[10px]">
						Reset zoom to 100%
					</TooltipContent>
				</Tooltip>

				<button
					onClick={handleZoomIn}
					className="p-1 hover:text-foreground hover:bg-muted rounded transition-all active:scale-95"
					title="Zoom In"
				>
					<ZoomIn className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	);
};
