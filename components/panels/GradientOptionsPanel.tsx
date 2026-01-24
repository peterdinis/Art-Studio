"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Plus,
	Trash2,
	Droplet,
	ArrowUpDown,
	RotateCcw,
	Download,
	Upload,
	Copy,
	Sparkles,
	FlipHorizontal,
	FlipVertical,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const GradientOptionsPanel: React.FC = () => {
	const {
		brushSettings,
		setBrushSettings,
		primaryColor,
		secondaryColor,
		swapColors,
		gradients,
		addGradient,
		removeGradient,
	} = useArtStudioStore();

	const gradientAngle = brushSettings.gradientAngle || 90;
	const gradientScale = brushSettings.gradientScale || 100;
	const [repeatMode, setRepeatMode] = React.useState("none");
	const [blendMode, setBlendMode] = React.useState("normal");
	const [gradientName, setGradientName] = React.useState("Custom Gradient");

	// Ensure gradientStops has a default value
	const gradientStops = brushSettings.gradientStops || [
		{ color: primaryColor, position: 0 },
		{ color: secondaryColor, position: 1 },
	];

	const handleGradientTypeChange = (type: "linear" | "radial") => {
		setBrushSettings({ gradientType: type });
	};

	const handleGradientAngleChange = (angle: number) => {
		setBrushSettings({ gradientAngle: angle });
	};

	const handleAddColorStop = () => {
		const newStops = [
			...gradientStops,
			{ color: primaryColor, position: 0.5 },
		].sort((a, b) => a.position - b.position);

		setBrushSettings({ gradientStops: newStops });
	};

	const handleRemoveColorStop = (index: number) => {
		if (gradientStops.length <= 2) return;

		const newStops = [...gradientStops];
		newStops.splice(index, 1);
		setBrushSettings({ gradientStops: newStops });
	};

	const handleColorStopChange = (
		index: number,
		updates: Partial<{ color: string; position: number }>,
	) => {
		const newStops = [...gradientStops];
		newStops[index] = { ...newStops[index], ...updates };
		newStops.sort((a, b) => a.position - b.position);
		setBrushSettings({ gradientStops: newStops });
	};

	const handleReverseGradient = () => {
		const reversedStops = gradientStops
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
			gradientAngle: 90,
			gradientScale: 100,
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

	const handleSaveGradient = () => {
		const newGradient = {
			id: `gradient-${Date.now()}`,
			name: gradientName || "Custom Gradient",
			type: brushSettings.gradientType,
			stops: gradientStops,
			angle: gradientAngle,
			scale: gradientScale,
			repeat: repeatMode,
			blendMode: blendMode,
			timestamp: Date.now(),
		};
		addGradient(newGradient as any);
		setGradientName("Custom Gradient");
	};

	const handleLoadGradient = (gradient: any) => {
		setBrushSettings({
			gradientType: gradient.type,
			gradientStops: gradient.stops,
			gradientAngle: gradient.angle || 90,
			gradientScale: gradient.scale || 100,
		});
		setRepeatMode(gradient.repeat || "none");
		setBlendMode(gradient.blendMode || "normal");
	};

	const handleGenerateRandomGradient = () => {
		const randomColors = [
			"#" + Math.floor(Math.random() * 16777215).toString(16),
			"#" + Math.floor(Math.random() * 16777215).toString(16),
		];
		setBrushSettings({
			gradientStops: [
				{ color: randomColors[0], position: 0 },
				{ color: randomColors[1], position: 1 },
			],
		});
	};

	const handleExportGradient = () => {
		const gradientData = {
			name: gradientName,
			type: brushSettings.gradientType,
			stops: gradientStops,
			angle: gradientAngle,
			scale: gradientScale,
			repeat: repeatMode,
			blendMode: blendMode,
		};
		const dataStr = JSON.stringify(gradientData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${gradientName.replace(/\s+/g, "_")}.gradient.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleImportGradient = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const gradientData = JSON.parse(e.target?.result as string);
				handleLoadGradient(gradientData);
			} catch (error) {
				console.error("Failed to import gradient:", error);
			}
		};
		reader.readAsText(file);
	};

	const handleCopyGradientCSS = () => {
		const css =
			brushSettings.gradientType === "linear"
				? `linear-gradient(${gradientAngle}deg, ${gradientStops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`
				: `radial-gradient(circle, ${gradientStops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`;

		navigator.clipboard.writeText(css).then(() => {
			// You could add a toast notification here
		});
	};

	const handleFlipGradient = (direction: "horizontal" | "vertical") => {
		const newStops = gradientStops.map((stop) => ({
			...stop,
			position: direction === "horizontal" ? 1 - stop.position : stop.position,
		}));
		setBrushSettings({ gradientStops: newStops });
	};

	return (
		<div className="w-72 h-full bg-background border-l border-border/50 overflow-y-auto">
			<div className="p-4 space-y-6">
				{/* Gradient Preview */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-sm">Gradient Preview</h3>
						<Button size="sm" variant="ghost" onClick={handleCopyGradientCSS}>
							<Copy className="w-4 h-4" />
						</Button>
					</div>
					<div className="relative">
						<div
							className="w-full h-32 rounded-md border"
							style={{
								background:
									brushSettings.gradientType === "linear"
										? `linear-gradient(${gradientAngle}deg, ${gradientStops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`
										: `radial-gradient(circle at ${gradientScale}%, ${gradientStops.map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`,
								backgroundBlendMode: blendMode,
							}}
						/>
						<div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
							{brushSettings.gradientType === "linear"
								? `${gradientAngle}°`
								: `${gradientScale}%`}
						</div>
					</div>
				</div>

				{/* Gradient Type & Options */}
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label className="text-xs">Type</Label>
							<Tabs
								value={brushSettings.gradientType}
								onValueChange={(value) =>
									handleGradientTypeChange(value as "linear" | "radial")
								}
							>
								<TabsList className="w-full">
									<TabsTrigger value="linear" className="flex-1">
										Linear
									</TabsTrigger>
									<TabsTrigger value="radial" className="flex-1">
										Radial
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						<div className="space-y-2">
							<Label className="text-xs">Repeat</Label>
							<Select value={repeatMode} onValueChange={setRepeatMode}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Repeat" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									<SelectItem value="repeat">Repeat</SelectItem>
									<SelectItem value="repeat-x">Repeat X</SelectItem>
									<SelectItem value="repeat-y">Repeat Y</SelectItem>
									<SelectItem value="round">Round</SelectItem>
									<SelectItem value="space">Space</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label className="text-xs">Blend Mode</Label>
							<Select value={blendMode} onValueChange={setBlendMode}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Blend Mode" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="normal">Normal</SelectItem>
									<SelectItem value="multiply">Multiply</SelectItem>
									<SelectItem value="screen">Screen</SelectItem>
									<SelectItem value="overlay">Overlay</SelectItem>
									<SelectItem value="darken">Darken</SelectItem>
									<SelectItem value="lighten">Lighten</SelectItem>
									<SelectItem value="color-dodge">Color Dodge</SelectItem>
									<SelectItem value="color-burn">Color Burn</SelectItem>
									<SelectItem value="hard-light">Hard Light</SelectItem>
									<SelectItem value="soft-light">Soft Light</SelectItem>
									<SelectItem value="difference">Difference</SelectItem>
									<SelectItem value="exclusion">Exclusion</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-xs">Opacity</Label>
							<Slider
								min={0}
								max={100}
								step={1}
								value={[brushSettings.gradientOpacity || 100]}
								onValueChange={([value]) =>
									setBrushSettings({ gradientOpacity: value })
								}
							/>
						</div>
					</div>
				</div>

				{/* Gradient Controls */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-sm">Controls</h3>
						<div className="flex gap-1">
							<Button
								size="sm"
								variant="ghost"
								onClick={handleGenerateRandomGradient}
							>
								<Sparkles className="w-4 h-4" />
							</Button>
							<Button size="sm" variant="ghost" onClick={handleResetGradient}>
								<RotateCcw className="w-4 h-4" />
							</Button>
						</div>
					</div>

					{brushSettings.gradientType === "linear" ? (
						<div className="space-y-3">
							<div>
								<Label className="text-xs">Angle: {gradientAngle}°</Label>
								<Slider
									min={0}
									max={360}
									step={1}
									value={[gradientAngle]}
									onValueChange={([value]) => handleGradientAngleChange(value)}
								/>
								<div className="flex justify-between mt-1">
									<span className="text-xs text-muted-foreground">0°</span>
									<span className="text-xs text-muted-foreground">180°</span>
									<span className="text-xs text-muted-foreground">360°</span>
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => handleFlipGradient("horizontal")}
								>
									<FlipHorizontal className="w-4 h-4 mr-2" />
									Flip H
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => handleFlipGradient("vertical")}
								>
									<FlipVertical className="w-4 h-4 mr-2" />
									Flip V
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							<div>
								<Label className="text-xs">Scale: {gradientScale}%</Label>
								<Slider
									min={0}
									max={200}
									step={1}
									value={[gradientScale]}
									onValueChange={([value]) =>
										setBrushSettings({ gradientScale: value })
									}
								/>
							</div>
							<div>
								<Label className="text-xs">Center Position</Label>
								<div className="grid grid-cols-2 gap-2">
									<Input
										type="number"
										placeholder="X"
										min={0}
										max={100}
										value={brushSettings.gradientCenterX || 50}
										onChange={(e) =>
											setBrushSettings({
												gradientCenterX: parseInt(e.target.value),
											})
										}
									/>
									<Input
										type="number"
										placeholder="Y"
										min={0}
										max={100}
										value={brushSettings.gradientCenterY || 50}
										onChange={(e) =>
											setBrushSettings({
												gradientCenterY: parseInt(e.target.value),
											})
										}
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Color Stops */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-sm">Color Stops</h3>
						<div className="flex gap-1">
							<Button size="sm" variant="ghost" onClick={handleAddColorStop}>
								<Plus className="w-4 h-4" />
							</Button>
							<Button size="sm" variant="ghost" onClick={handleReverseGradient}>
								<ArrowUpDown className="w-4 h-4" />
							</Button>
							<Button size="sm" variant="ghost" onClick={handleSwapColors}>
								<Droplet className="w-4 h-4 rotate-90" />
							</Button>
						</div>
					</div>

					<div className="space-y-2 max-h-40 overflow-y-auto">
						{gradientStops.map((stop, index) => (
							<div key={index} className="space-y-2 p-2 border rounded-md">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className="w-5 h-5 rounded border"
											style={{ backgroundColor: stop.color }}
										/>
										<span className="text-xs font-medium">
											{Math.round(stop.position * 100)}%
										</span>
									</div>
									<div className="flex gap-1">
										<Button
											size="sm"
											variant="ghost"
											className="h-6 w-6 p-0"
											onClick={() => handleRemoveColorStop(index)}
											disabled={gradientStops.length <= 2}
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<div>
										<Input
											type="color"
											value={stop.color}
											onChange={(e) =>
												handleColorStopChange(index, {
													color: e.target.value,
												})
											}
											className="h-8 cursor-pointer"
										/>
									</div>
									<div>
										<Slider
											min={0}
											max={1}
											step={0.01}
											value={[stop.position]}
											onValueChange={([value]) =>
												handleColorStopChange(index, { position: value })
											}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Save/Load Gradients */}
				<div className="space-y-3">
					<h3 className="font-semibold text-sm">Presets</h3>
					<div className="space-y-2">
						<div className="flex gap-2">
							<Input
								placeholder="Gradient Name"
								value={gradientName}
								onChange={(e) => setGradientName(e.target.value)}
								className="flex-1"
							/>
							<Button size="sm" onClick={handleSaveGradient}>
								Save
							</Button>
						</div>

						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								className="flex-1"
								onClick={handleExportGradient}
							>
								<Download className="w-4 h-4 mr-2" />
								Export
							</Button>
							<Button size="sm" variant="outline" className="flex-1" asChild>
								<label>
									<Upload className="w-4 h-4 mr-2" />
									Import
									<input
										type="file"
										accept=".json,.gradient"
										onChange={handleImportGradient}
										className="hidden"
									/>
								</label>
							</Button>
						</div>
					</div>

					{/* Saved Gradients */}
					<div className="space-y-2">
						<Label className="text-xs">Saved Gradients</Label>
						<div className="grid grid-cols-2 gap-2">
							{gradients.slice(0, 6).map((gradient) => (
								<Button
									key={gradient.id}
									size="sm"
									variant="outline"
									className="h-16 flex-col relative group"
									onClick={() => handleLoadGradient(gradient)}
								>
									<div
										className="w-full h-8 rounded mb-1"
										style={{
											background:
												gradient.type === "linear"
													? `linear-gradient(90deg, ${(gradient.colorStops || []).map((s: any) => `${s.color} ${s.offset * 100}%`).join(", ")})`
													: `radial-gradient(circle, ${(gradient.colorStops || []).map((s: any) => `${s.color} ${s.offset * 100}%`).join(", ")})`,
										}}
									/>
									<span className="text-[10px] truncate w-full">
										{gradient.name}
									</span>
									<Button
										size="sm"
										variant="destructive"
										className="h-5 w-5 p-0 absolute top-1 right-1 opacity-0 group-hover:opacity-100"
										onClick={(e) => {
											e.stopPropagation();
											removeGradient(gradient.id);
										}}
									>
										<Trash2 className="w-3 h-3" />
									</Button>
								</Button>
							))}
						</div>
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
									{ color: "#FFE66D", position: 0.5 },
									{ color: "#4ECDC4", position: 1 },
								],
							},
							{
								name: "Ocean",
								stops: [
									{ color: "#4ECDC4", position: 0 },
									{ color: "#2E3192", position: 1 },
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
								name: "Sunrise",
								stops: [
									{ color: "#FF5F6D", position: 0 },
									{ color: "#FFC371", position: 1 },
								],
							},
							{
								name: "Twilight",
								stops: [
									{ color: "#8A2387", position: 0 },
									{ color: "#F27121", position: 0.5 },
									{ color: "#E94057", position: 1 },
								],
							},
							{
								name: "Aurora",
								stops: [
									{ color: "#00B4DB", position: 0 },
									{ color: "#0083B0", position: 1 },
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
												? `linear-gradient(90deg, ${(preset.stops || []).map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`
												: `radial-gradient(circle, ${(preset.stops || []).map((s) => `${s.color} ${s.position * 100}%`).join(", ")})`,
									}}
								/>
								<span className="text-[10px]">{preset.name}</span>
							</Button>
						))}
					</div>
				</div>

				{/* Advanced Options */}
				<div className="space-y-3 border-t pt-4">
					<h3 className="font-semibold text-sm">Advanced Options</h3>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-xs">Dithering</Label>
							<Switch
								checked={brushSettings.gradientDithering || false}
								onCheckedChange={(checked: boolean) =>
									setBrushSettings({ gradientDithering: checked })
								}
							/>
						</div>
						<div className="flex items-center justify-between">
							<Label className="text-xs">Anti-aliasing</Label>
							<Switch
								checked={brushSettings.gradientAntiAlias || true}
								onCheckedChange={(checked: boolean) =>
									setBrushSettings({ gradientAntiAlias: checked })
								}
							/>
						</div>
						<div>
							<Label className="text-xs">
								Noise: {brushSettings.gradientNoise || 0}%
							</Label>
							<Slider
								min={0}
								max={50}
								step={1}
								value={[brushSettings.gradientNoise || 0]}
								onValueChange={([value]) =>
									setBrushSettings({ gradientNoise: value })
								}
							/>
						</div>
					</div>
				</div>

				{/* Instructions */}
				<div className="pt-4 border-t">
					<h4 className="font-semibold text-sm mb-2">How to Use</h4>
					<ul className="text-xs space-y-1 text-muted-foreground">
						<li>• Drag on canvas to draw gradient</li>
						<li>• Adjust stops for custom gradients</li>
						<li>• Use Angle/Scale controls</li>
						<li>• Save presets for reuse</li>
						<li>• Adjust blend mode for effects</li>
					</ul>
				</div>
			</div>
		</div>
	);
};
