"use client";

import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { toast } from "sonner";
import { LayoutTemplate, Smartphone, Monitor, Printer } from "lucide-react";

interface CanvasSizeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface Preset {
	label: string;
	width: number;
	height: number;
	category: string;
}

const PRESETS: Preset[] = [
	// Web
	{ label: "HD (1280×720)", width: 1280, height: 720, category: "Web" },
	{ label: "Full HD (1920×1080)", width: 1920, height: 1080, category: "Web" },
	{ label: "4K UHD (3840×2160)", width: 3840, height: 2160, category: "Web" },
	{
		label: "Square (1080×1080)",
		width: 1080,
		height: 1080,
		category: "Social",
	},
	// Social
	{
		label: "Instagram Post (1080×1350)",
		width: 1080,
		height: 1350,
		category: "Social",
	},
	{
		label: "Instagram Story (1080×1920)",
		width: 1080,
		height: 1920,
		category: "Social",
	},
	{
		label: "Twitter Header (1500×500)",
		width: 1500,
		height: 500,
		category: "Social",
	},
	{
		label: "Facebook Cover (820×312)",
		width: 820,
		height: 312,
		category: "Social",
	},
	// Print
	{
		label: "A4 Portrait (2480×3508)",
		width: 2480,
		height: 3508,
		category: "Print",
	},
	{
		label: "A4 Landscape (3508×2480)",
		width: 3508,
		height: 2480,
		category: "Print",
	},
	{ label: "Letter (2550×3300)", width: 2550, height: 3300, category: "Print" },
	// Design
	{
		label: "Thumbnail (1280×720)",
		width: 1280,
		height: 720,
		category: "Design",
	},
	{ label: "Banner (728×90)", width: 728, height: 90, category: "Design" },
	{ label: "Icon (512×512)", width: 512, height: 512, category: "Design" },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
	Web: <Monitor className="w-3.5 h-3.5" />,
	Social: <Smartphone className="w-3.5 h-3.5" />,
	Print: <Printer className="w-3.5 h-3.5" />,
	Design: <LayoutTemplate className="w-3.5 h-3.5" />,
};

const categories = [...new Set(PRESETS.map((p) => p.category))];

export const CanvasSizeDialog: React.FC<CanvasSizeDialogProps> = ({
	open,
	onOpenChange,
}) => {
	const { canvasSize, setCanvasSize } = useArtStudioStore();

	const [width, setWidth] = useState(canvasSize?.width ?? 1920);
	const [height, setHeight] = useState(canvasSize?.height ?? 1080);
	const [bgColor, setBgColor] = useState(
		canvasSize?.backgroundColor ?? "#2d3748",
	);
	const [activeCategory, setActiveCategory] = useState<string>("Web");

	const handlePreset = (preset: Preset) => {
		setWidth(preset.width);
		setHeight(preset.height);
	};

	const handleApply = () => {
		if (width < 10 || height < 10 || width > 16000 || height > 16000) {
			toast.error("Canvas size must be between 10 and 16000 pixels.");
			return;
		}

		setCanvasSize({ width, height, backgroundColor: bgColor });
		// Fire resize event for KonvaCanvas to react
		window.dispatchEvent(
			new CustomEvent("artstudio:resize-canvas", {
				detail: { width, height, backgroundColor: bgColor },
			}),
		);
		toast.success(`Canvas resized to ${width}×${height}px`);
		onOpenChange(false);
	};

	const filteredPresets = PRESETS.filter((p) => p.category === activeCategory);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LayoutTemplate className="w-5 h-5" />
						Canvas Size
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 py-2">
					{/* Custom dimensions */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Width (px)
							</Label>
							<Input
								type="number"
								value={width}
								onChange={(e) =>
									setWidth(Math.max(1, parseInt(e.target.value) || 1))
								}
								min={10}
								max={16000}
								className="font-mono"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Height (px)
							</Label>
							<Input
								type="number"
								value={height}
								onChange={(e) =>
									setHeight(Math.max(1, parseInt(e.target.value) || 1))
								}
								min={10}
								max={16000}
								className="font-mono"
							/>
						</div>
					</div>

					{/* Background color */}
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground">
							Background Color
						</Label>
						<div className="flex items-center gap-3">
							<div className="relative">
								<div
									className="w-9 h-9 rounded border-2 border-border cursor-pointer"
									style={{ backgroundColor: bgColor }}
								/>
								<input
									type="color"
									value={bgColor}
									onChange={(e) => setBgColor(e.target.value)}
									className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
								/>
							</div>
							<Input
								value={bgColor}
								onChange={(e) => setBgColor(e.target.value)}
								className="flex-1 font-mono text-sm"
								placeholder="#2d3748"
							/>
							<button
								onClick={() => setBgColor("transparent")}
								className="text-xs px-2 py-1 rounded border border-border hover:bg-muted text-muted-foreground"
							>
								Transparent
							</button>
						</div>
					</div>

					{/* Presets */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Presets</Label>

						{/* Category tabs */}
						<div className="flex gap-1 border-b border-border pb-1 mb-2">
							{categories.map((cat) => (
								<button
									key={cat}
									onClick={() => setActiveCategory(cat)}
									className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-t transition-colors ${
										activeCategory === cat
											? "bg-primary/10 text-primary border-b-2 border-primary -mb-px"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{CATEGORY_ICONS[cat]}
									{cat}
								</button>
							))}
						</div>

						<div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
							{filteredPresets.map((preset) => {
								const isActive =
									preset.width === width && preset.height === height;
								return (
									<button
										key={preset.label}
										onClick={() => handlePreset(preset)}
										className={`text-left px-2.5 py-2 rounded-md border text-xs transition-all ${
											isActive
												? "border-primary bg-primary/10 text-primary"
												: "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/50"
										}`}
									>
										<div className="font-medium truncate">
											{preset.label.split("(")[0].trim()}
										</div>
										<div className="text-[10px] font-mono text-muted-foreground">
											{preset.width} × {preset.height}
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* Preview dimensions */}
					<div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 border border-border/50 flex items-center justify-between">
						<span>
							Canvas:{" "}
							<span className="font-mono text-foreground">
								{width} × {height} px
							</span>
						</span>
						<span>
							Ratio:{" "}
							<span className="font-mono text-foreground">
								{(() => {
									const gcd = (a: number, b: number): number =>
										b === 0 ? a : gcd(b, a % b);
									const g = gcd(width, height);
									return `${width / g}:${height / g}`;
								})()}
							</span>
						</span>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleApply} className="gap-2">
						<LayoutTemplate className="w-4 h-4" />
						Apply
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
