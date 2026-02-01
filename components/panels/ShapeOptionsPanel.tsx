"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export const ShapeOptionsPanel: React.FC = () => {
	const {
		brushSettings,
		setBrushSettings,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
		activeTool,
	} = useArtStudioStore();

	const getToolTitle = () => {
		const titles: Record<string, string> = {
			rectangle: "Rectangle",
			ellipse: "Ellipse",
		};
		return titles[activeTool] || "Shape";
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
							{activeTool === "rectangle"
								? "Draw rectangles and squares. Hold Shift for perfect squares."
								: "Draw ellipses and circles. Hold Shift for perfect circles."}
						</p>
					</TooltipContent>
				</Tooltip>
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
					onValueChange={([value]) => setBrushSettings({ strokeWidth: value })}
					min={1}
					max={20}
					step={1}
				/>
			</div>

			{/* Fill Type */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Fill Type</Label>
				<RadioGroup
					value={brushSettings.fillType || "solid"}
					onValueChange={(value) =>
						setBrushSettings({
							fillType: value as "none" | "solid" | "gradient",
						})
					}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="none" id="fill-none" />
						<Label htmlFor="fill-none" className="text-xs cursor-pointer">
							None
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="solid" id="fill-solid" />
						<Label htmlFor="fill-solid" className="text-xs cursor-pointer">
							Solid
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="gradient" id="fill-gradient" />
						<Label htmlFor="fill-gradient" className="text-xs cursor-pointer">
							Gradient
						</Label>
					</div>
				</RadioGroup>
			</div>

			{/* Corner Radius (for rectangles) */}
			{activeTool === "rectangle" && (
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label className="text-xs text-muted-foreground">Corner Radius</Label>
						<span className="text-xs font-mono">
							{brushSettings.cornerRadius || 0}px
						</span>
					</div>
					<Slider
						value={[brushSettings.cornerRadius || 0]}
						onValueChange={([value]) =>
							setBrushSettings({ cornerRadius: value })
						}
						min={0}
						max={50}
						step={1}
					/>
				</div>
			)}

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
						<span className="text-foreground">Click & Drag</span> to draw
					</li>
					<li>
						Hold <span className="text-foreground">Shift</span> for perfect{" "}
						{activeTool === "rectangle" ? "square" : "circle"}
					</li>
					<li>
						Hold <span className="text-foreground">Alt</span> to draw from center
					</li>
				</ul>
			</div>
		</div>
	);
};
