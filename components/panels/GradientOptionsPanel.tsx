"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Droplet, ArrowUpDown } from "lucide-react";

export const GradientOptionsPanel: React.FC = () => {
	const {
		brushSettings,
		setBrushSettings,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
		swapColors,
	} = useArtStudioStore();

	const handleGradientTypeChange = (type: "linear" | "radial") => {
		setBrushSettings({ gradientType: type });
	};

	const handleAddColorStop = () => {
		const newStops = [
			...brushSettings.gradientStops,
			{ color: primaryColor, position: 0.5 },
		].sort((a, b) => a.position - b.position);

		setBrushSettings({ gradientStops: newStops });
	};

	const handleRemoveColorStop = (index: number) => {
		if (brushSettings.gradientStops.length <= 2) return;

		const newStops = [...brushSettings.gradientStops];
		newStops.splice(index, 1);
		setBrushSettings({ gradientStops: newStops });
	};

	const handleColorStopChange = (
		index: number,
		updates: Partial<{ color: string; position: number }>,
	) => {
		const newStops = [...brushSettings.gradientStops];
		newStops[index] = { ...newStops[index], ...updates };
		newStops.sort((a, b) => a.position - b.position);
		setBrushSettings({ gradientStops: newStops });
	};

	const handleReverseGradient = () => {
		const reversedStops = brushSettings.gradientStops
			.map((stop) => ({
				...stop,
				position: 1 - stop.position,
			}))
			.sort((a, b) => a.position - b.position);
		setBrushSettings({ gradientStops: reversedStops });
	};

	const handleResetGradient = () => {
		setBrushSettings({
			gradientStops: [
				{ color: primaryColor, position: 0 },
				{ color: secondaryColor, position: 1 },
			],
		});
	};

	const handleSwapColors = () => {
		swapColors();
		setBrushSettings({
			gradientStops: [
				{ color: primaryColor, position: 0 },
				{ color: secondaryColor, position: 1 },
			],
		});
	};

	return (
		<div className="w-64 h-full bg-background border-l border-border/50 overflow-y-auto">
			<div className="p-4 space-y-6">
				{/* Gradient Preview */}
				<div className="space-y-3">
					<h3 className="font-semibold text-sm">Gradient Preview</h3>
					<div
						className="w-full h-24 rounded-md border"
						style={{
							background:
								brushSettings.gradientType === "linear"
									? `linear-gradient(90deg, ${brushSettings.gradientStops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`
									: `radial-gradient(circle, ${brushSettings.gradientStops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`,
						}}
					/>
				</div>

				{/* Gradient Type */}
				<div className="space-y-3">
					<h3 className="font-semibold text-sm">Gradient Type</h3>
					<Tabs
						value={brushSettings.gradientType}
						onValueChange={(value) =>
							handleGradientTypeChange(value as "linear" | "radial")
						}
					>
						<TabsList className="grid grid-cols-2">
							<TabsTrigger value="linear">Linear</TabsTrigger>
							<TabsTrigger value="radial">Radial</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Color Stops */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-sm">Color Stops</h3>
						<div className="flex gap-1">
							<Button size="sm" variant="ghost" onClick={handleAddColorStop}>
								<Plus className="w-4 h-4" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={handleReverseGradient}
								title="Reverse Gradient"
							>
								<ArrowUpDown className="w-4 h-4" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={handleSwapColors}
								title="Swap Colors"
							>
								<Droplet className="w-4 h-4 rotate-90" />
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						{brushSettings.gradientStops.map((stop, index) => (
							<div key={index} className="space-y-2 p-3 border rounded-md">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className="w-6 h-6 rounded border"
											style={{ backgroundColor: stop.color }}
										/>
										<span className="text-xs font-medium">
											Stop {index + 1} ({Math.round(stop.position * 100)}%)
										</span>
									</div>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => handleRemoveColorStop(index)}
										disabled={brushSettings.gradientStops.length <= 2}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>

								<div className="space-y-2">
									<div>
										<Label htmlFor={`color-${index}`} className="text-xs">
											Color
										</Label>
										<div className="flex gap-2 mt-1">
											<input
												type="color"
												id={`color-${index}`}
												value={stop.color}
												onChange={(e) =>
													handleColorStopChange(index, {
														color: e.target.value,
													})
												}
												className="w-full h-8 cursor-pointer"
											/>
										</div>
									</div>

									<div>
										<Label htmlFor={`position-${index}`} className="text-xs">
											Position: {Math.round(stop.position * 100)}%
										</Label>
										<Slider
											id={`position-${index}`}
											min={0}
											max={1}
											step={0.01}
											value={[stop.position]}
											onValueChange={([value]) =>
												handleColorStopChange(index, { position: value })
											}
											className="mt-2"
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Quick Presets */}
				<div className="space-y-3">
					<h3 className="font-semibold text-sm">Quick Presets</h3>
					<div className="grid grid-cols-3 gap-2">
						{[
							{
								name: "Sunset",
								stops: [
									{ color: "#FF6B6B", position: 0 },
									{ color: "#FFE66D", position: 1 },
								],
							},
							{
								name: "Ocean",
								stops: [
									{ color: "#4ECDC4", position: 0 },
									{ color: "#556270", position: 1 },
								],
							},
							{
								name: "Forest",
								stops: [
									{ color: "#2AF598", position: 0 },
									{ color: "#0093E9", position: 1 },
								],
							},
							{
								name: "Purple",
								stops: [
									{ color: "#8A2387", position: 0 },
									{ color: "#F27121", position: 1 },
								],
							},
							{
								name: "Steel",
								stops: [
									{ color: "#757F9A", position: 0 },
									{ color: "#D7DDE8", position: 1 },
								],
							},
							{
								name: "Rainbow",
								stops: [
									{ color: "#FF0000", position: 0 },
									{ color: "#FFFF00", position: 0.25 },
									{ color: "#00FF00", position: 0.5 },
									{ color: "#00FFFF", position: 0.75 },
									{ color: "#0000FF", position: 1 },
								],
							},
						].map((preset) => (
							<Button
								key={preset.name}
								size="sm"
								variant="outline"
								className="text-xs h-16 flex-col"
								onClick={() =>
									setBrushSettings({ gradientStops: preset.stops })
								}
							>
								<div
									className="w-full h-8 rounded mb-1"
									style={{
										background:
											brushSettings.gradientType === "linear"
												? `linear-gradient(90deg, ${preset.stops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`
												: `radial-gradient(circle, ${preset.stops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`,
									}}
								/>
								<span className="text-[10px]">{preset.name}</span>
							</Button>
						))}
					</div>
				</div>

				{/* Instructions */}
				<div className="pt-4 border-t">
					<h4 className="font-semibold text-sm mb-2">How to Use</h4>
					<ul className="text-xs space-y-1 text-muted-foreground">
						<li>• Click and drag on canvas to create gradient</li>
						<li>• Adjust color stops above</li>
						<li>• Click gradient to select and move</li>
						<li>• Use presets for quick gradients</li>
						<li>• Add more stops for complex gradients</li>
					</ul>
				</div>
			</div>
		</div>
	);
};
