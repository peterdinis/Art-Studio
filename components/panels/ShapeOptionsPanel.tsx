"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

export const ShapeOptionsPanel = () => {
	const {
		brushSettings,
		setBrushSettings,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
	} = useArtStudioStore();

	return (
		<div className="space-y-4 p-4 bg-card rounded-lg border">
			<h3 className="font-semibold text-sm">Shape Options</h3>

			{/* Stroke Width */}
			<div className="space-y-2">
				<Label className="text-xs">
					Stroke Width: {brushSettings.strokeWidth || 2}px
				</Label>
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
				<Label className="text-xs">Fill Type</Label>
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
			<div className="space-y-2">
				<Label className="text-xs">
					Corner Radius: {brushSettings.cornerRadius || 0}px
				</Label>
				<Slider
					value={[brushSettings.cornerRadius || 0]}
					onValueChange={([value]) => setBrushSettings({ cornerRadius: value })}
					min={0}
					max={50}
					step={1}
				/>
			</div>

			{/* Sides (for polygon/star) */}
			<div className="space-y-2">
				<Label className="text-xs">
					Sides/Points: {brushSettings.sides || 5}
				</Label>
				<Slider
					value={[brushSettings.sides || 5]}
					onValueChange={([value]) => setBrushSettings({ sides: value })}
					min={3}
					max={12}
					step={1}
				/>
			</div>

			{/* Colors */}
			<div className="space-y-2">
				<Label className="text-xs">Stroke Color</Label>
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

			<div className="space-y-2">
				<Label className="text-xs">Fill Color</Label>
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
		</div>
	);
};
