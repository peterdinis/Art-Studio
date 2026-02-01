"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export const SelectionOptionsPanel: React.FC = () => {
	const { brushSettings, setBrushSettings, activeTool } = useArtStudioStore();

	const getToolTitle = () => {
		const titles: Record<string, string> = {
			marquee: "Marquee Selection",
			lasso: "Lasso Selection",
			magicwand: "Magic Wand",
		};
		return titles[activeTool] || "Selection Tool";
	};

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
						<p className="text-xs">
							{activeTool === "marquee"
								? "Create rectangular selections. Hold Shift for square, Alt for center origin."
								: activeTool === "lasso"
									? "Draw freehand selections. Double-click or press Enter to close."
									: "Select areas of similar color. Adjust tolerance to control sensitivity."}
						</p>
					</TooltipContent>
				</Tooltip>
			</div>

			{activeTool === "magicwand" && (
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-1.5">
							<Label className="text-xs text-muted-foreground">Tolerance</Label>
							<Tooltip delayDuration={300}>
								<TooltipTrigger asChild>
									<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
								</TooltipTrigger>
								<TooltipContent side="right" className="max-w-50">
									<p className="text-xs">
										Color similarity threshold. Higher values select more
										similar colors.
									</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<span className="text-xs font-mono">
							{brushSettings.tolerance || 32}
						</span>
					</div>
					<Slider
						value={[brushSettings.tolerance || 32]}
						onValueChange={([val]) => setBrushSettings({ tolerance: val })}
						min={0}
						max={255}
						step={1}
					/>
				</div>
			)}

			{/* Selection Mode */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Selection Mode</Label>
				<div className="flex gap-2">
					<button
						onClick={() => setBrushSettings({ selectionMode: "new" } as any)}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							(brushSettings as any).selectionMode === "new"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						New
					</button>
					<button
						onClick={() => setBrushSettings({ selectionMode: "add" } as any)}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							(brushSettings as any).selectionMode === "add"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						Add
					</button>
					<button
						onClick={() =>
							setBrushSettings({ selectionMode: "subtract" } as any)
						}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							(brushSettings as any).selectionMode === "subtract"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						Subtract
					</button>
					<button
						onClick={() =>
							setBrushSettings({ selectionMode: "intersect" } as any)
						}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							(brushSettings as any).selectionMode === "intersect"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						Intersect
					</button>
				</div>
			</div>

			{/* Anti-aliasing */}
			<div className="flex items-center justify-between">
				<Label className="text-xs text-muted-foreground">Anti-aliasing</Label>
				<button
					onClick={() =>
						setBrushSettings({
							selectionAntiAlias: !(
								(brushSettings as any).selectionAntiAlias || true
							),
						} as any)
					}
					className={`w-10 h-5 rounded-full transition-colors relative ${
						(brushSettings as any).selectionAntiAlias !== false
							? "bg-primary"
							: "bg-muted"
					}`}
				>
					<div
						className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
							(brushSettings as any).selectionAntiAlias !== false
								? "left-6"
								: "left-1"
						}`}
					/>
				</button>
			</div>

			{/* Usage Info */}
			<div className="bg-muted/30 p-3 rounded-md border border-border/50 text-xs space-y-2">
				<p className="font-medium text-foreground">Usage:</p>
				<ul className="list-disc list-inside space-y-1 text-muted-foreground">
					{activeTool === "marquee" && (
						<>
							<li>
								<span className="text-foreground">Click & Drag</span> to create
								selection
							</li>
							<li>
								Hold <span className="text-foreground">Shift</span> for square
							</li>
							<li>
								Hold <span className="text-foreground">Alt</span> to draw from
								center
							</li>
						</>
					)}
					{activeTool === "lasso" && (
						<>
							<li>
								<span className="text-foreground">Click & Drag</span> to draw
								selection
							</li>
							<li>
								<span className="text-foreground">Double-click</span> or{" "}
								<span className="text-foreground">Enter</span> to close
							</li>
							<li>
								<span className="text-foreground">Escape</span> to cancel
							</li>
						</>
					)}
					{activeTool === "magicwand" && (
						<>
							<li>
								<span className="text-foreground">Click</span> to select similar
								colors
							</li>
							<li>
								Hold <span className="text-foreground">Shift</span> to add to
								selection
							</li>
							<li>
								Hold <span className="text-foreground">Alt</span> to subtract
								from selection
							</li>
						</>
					)}
				</ul>
			</div>
		</div>
	);
};
