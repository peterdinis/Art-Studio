"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export const PenOptionsPanel: React.FC = () => {
	const { brushSettings, setBrushSettings } = useArtStudioStore();

	return (
		<div className="panel-glass p-4 w-full space-y-5 animate-fade-in">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-foreground">
					Pen Tool Options
				</h3>
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<HelpCircle className="w-4 h-4 text-muted-foreground/50 cursor-help" />
					</TooltipTrigger>
					<TooltipContent side="left" className="max-w-50">
						<p className="text-xs">
							Create precise paths with anchor points. Click to add points, drag
							to create curves.
						</p>
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Stroke Width */}
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-1.5">
						<Label className="text-xs text-muted-foreground">
							Stroke Width
						</Label>
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-50">
								<p className="text-xs">Width of the pen stroke in pixels.</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<span className="text-xs font-mono">
						{brushSettings.strokeWidth || 2}px
					</span>
				</div>
				<Slider
					value={[brushSettings.strokeWidth || 2]}
					onValueChange={([val]) => setBrushSettings({ strokeWidth: val })}
					min={1}
					max={50}
					step={1}
				/>
			</div>

			{/* Opacity — same store keys as brush/pencil (Konva reads these on each segment) */}
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<Label className="text-xs text-muted-foreground">Opacity</Label>
					<span className="text-xs font-mono">{brushSettings.opacity ?? 100}%</span>
				</div>
				<Slider
					value={[brushSettings.opacity ?? 100]}
					onValueChange={([val]) => setBrushSettings({ opacity: val })}
					min={1}
					max={100}
					step={1}
				/>
			</div>

			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<Label className="text-xs text-muted-foreground">Hardness</Label>
					<span className="text-xs font-mono">{brushSettings.hardness ?? 100}%</span>
				</div>
				<Slider
					value={[brushSettings.hardness ?? 100]}
					onValueChange={([val]) => setBrushSettings({ hardness: val })}
					min={0}
					max={100}
					step={1}
				/>
			</div>

			{/* Smoothing */}
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-1.5">
						<Label className="text-xs text-muted-foreground">Smoothing</Label>
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-50">
								<p className="text-xs">Smoothness of the path curves.</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<span className="text-xs font-mono">
						{brushSettings.smoothing || 0}%
					</span>
				</div>
				<Slider
					value={[brushSettings.smoothing || 0]}
					onValueChange={([val]) => setBrushSettings({ smoothing: val })}
					min={0}
					max={100}
					step={1}
				/>
			</div>

			{/* Path Type */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Path Type</Label>
				<RadioGroup
					value={(brushSettings as any).penPathType || "bezier"}
					onValueChange={(value) =>
						setBrushSettings({
							penPathType: value as "bezier" | "linear",
						} as any)
					}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="bezier" id="bezier" />
						<Label htmlFor="bezier" className="text-xs cursor-pointer">
							Bezier Curves
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="linear" id="linear" />
						<Label htmlFor="linear" className="text-xs cursor-pointer">
							Linear
						</Label>
					</div>
				</RadioGroup>
			</div>

			{/* Fill Path */}
			<div className="flex items-center justify-between">
				<Label className="text-xs text-muted-foreground">Fill Path</Label>
				<button
					onClick={() =>
						setBrushSettings({
							penFillPath: !((brushSettings as any).penFillPath || false),
						} as any)
					}
					className={`w-10 h-5 rounded-full transition-colors relative ${
						(brushSettings as any).penFillPath ? "bg-primary" : "bg-muted"
					}`}
				>
					<div
						className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
							(brushSettings as any).penFillPath ? "left-6" : "left-1"
						}`}
					/>
				</button>
			</div>

			{/* Usage Info */}
			<div className="bg-muted/30 p-3 rounded-md border border-border/50 text-xs space-y-2">
				<p className="font-medium text-foreground">Usage:</p>
				<ul className="list-disc list-inside space-y-1 text-muted-foreground">
					<li>
						<span className="text-foreground">Click</span> to add anchor points
					</li>
					<li>
						<span className="text-foreground">Drag</span> to create curves
					</li>
					<li>
						<span className="text-foreground">Enter</span> to finish path
					</li>
					<li>
						<span className="text-foreground">Escape</span> to cancel
					</li>
				</ul>
			</div>
		</div>
	);
};
