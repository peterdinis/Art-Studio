"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export const PolygonOptionsPanel: React.FC = () => {
	const {
		brushSettings,
		setBrushSettings,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
	} = useArtStudioStore();

	return (
		<div className="panel-glass p-4 w-full space-y-5 animate-fade-in">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-foreground">Polygon Options</h3>
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<HelpCircle className="w-4 h-4 text-muted-foreground/50 cursor-help" />
					</TooltipTrigger>
					<TooltipContent side="left" className="max-w-50">
						<p className="text-xs">
							Create multi-sided shapes. Click to add points, Enter to finish.
						</p>
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Number of Sides */}
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-1.5">
						<Label className="text-xs text-muted-foreground">Sides</Label>
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-50">
								<p className="text-xs">
									Number of sides for the polygon (3-12).
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<span className="text-xs font-mono">{brushSettings.sides || 5}</span>
				</div>
				<Slider
					value={[brushSettings.sides || 5]}
					onValueChange={([val]) => setBrushSettings({ sides: val })}
					min={3}
					max={12}
					step={1}
				/>
			</div>

			{/* Stroke Width */}
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<Label className="text-xs text-muted-foreground">Stroke Width</Label>
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

			{/* Corner Radius */}
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<Label className="text-xs text-muted-foreground">Corner Radius</Label>
					<span className="text-xs font-mono">
						{brushSettings.cornerRadius || 0}px
					</span>
				</div>
				<Slider
					value={[brushSettings.cornerRadius || 0]}
					onValueChange={([val]) => setBrushSettings({ cornerRadius: val })}
					min={0}
					max={50}
					step={1}
				/>
			</div>

			{/* Fill Type */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Fill Type</Label>
				<div className="flex gap-2">
					<button
						onClick={() => setBrushSettings({ fillType: "solid" })}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							brushSettings.fillType === "solid"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						Solid
					</button>
					<button
						onClick={() => setBrushSettings({ fillType: "gradient" })}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							brushSettings.fillType === "gradient"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						Gradient
					</button>
					<button
						onClick={() => setBrushSettings({ fillType: "none" })}
						className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
							brushSettings.fillType === "none"
								? "bg-primary/20 border border-primary/30"
								: "bg-muted/50 hover:bg-muted"
						}`}
					>
						None
					</button>
				</div>
			</div>

			{/* Colors */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Fill Color</Label>
				<div className="flex gap-2">
					<Input
						type="color"
						value={primaryColor}
						onChange={(e) => setPrimaryColor(e.target.value)}
						className="h-10 w-full"
					/>
					<Input
						type="text"
						value={primaryColor}
						onChange={(e) => setPrimaryColor(e.target.value)}
						className="h-10 flex-1 font-mono text-xs"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Stroke Color</Label>
				<div className="flex gap-2">
					<Input
						type="color"
						value={secondaryColor}
						onChange={(e) => setSecondaryColor(e.target.value)}
						className="h-10 w-full"
					/>
					<Input
						type="text"
						value={secondaryColor}
						onChange={(e) => setSecondaryColor(e.target.value)}
						className="h-10 flex-1 font-mono text-xs"
					/>
				</div>
			</div>

			{/* Usage Info */}
			<div className="bg-muted/30 p-3 rounded-md border border-border/50 text-xs space-y-2">
				<p className="font-medium text-foreground">Usage:</p>
				<ul className="list-disc list-inside space-y-1 text-muted-foreground">
					<li>
						<span className="text-foreground">Click</span> to add points
					</li>
					<li>
						<span className="text-foreground">Enter</span> to finish polygon
					</li>
					<li>
						<span className="text-foreground">Escape</span> to cancel
					</li>
				</ul>
			</div>
		</div>
	);
};
