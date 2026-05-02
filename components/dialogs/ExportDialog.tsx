"use client";

import React, { useState, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Download, ImageIcon, FileImage, Film } from "lucide-react";
import { toast } from "sonner";

interface ExportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type ExportFormat = "png" | "jpeg" | "webp";

const FORMAT_CONFIG: Record<
	ExportFormat,
	{ label: string; mimeType: string; icon: React.ReactNode; supportsAlpha: boolean }
> = {
	png: {
		label: "PNG",
		mimeType: "image/png",
		icon: <ImageIcon className="w-4 h-4" />,
		supportsAlpha: true,
	},
	jpeg: {
		label: "JPEG",
		mimeType: "image/jpeg",
		icon: <FileImage className="w-4 h-4" />,
		supportsAlpha: false,
	},
	webp: {
		label: "WebP",
		mimeType: "image/webp",
		icon: <Film className="w-4 h-4" />,
		supportsAlpha: true,
	},
};

const SCALE_PRESETS = [
	{ label: "0.5× (Half)", value: 0.5 },
	{ label: "1× (Original)", value: 1 },
	{ label: "2× (Retina)", value: 2 },
	{ label: "3× (High-DPI)", value: 3 },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
	open,
	onOpenChange,
}) => {
	const [format, setFormat] = useState<ExportFormat>("png");
	const [quality, setQuality] = useState(92);
	const [scale, setScale] = useState(1);
	const [transparentBg, setTransparentBg] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [fileName, setFileName] = useState("artwork");

	const handleExport = async () => {
		const stage = (window as any).konvaStage;
		if (!stage) {
			toast.error("Canvas not found – please wait for it to load.");
			return;
		}

		setIsExporting(true);

		try {
			const config = FORMAT_CONFIG[format];

			// For JPEG, fill background white (no alpha)
			let dataURL: string;

			if (format === "jpeg" || (!transparentBg && format !== "png")) {
				// Offscreen canvas with white fill
				const offscreen = document.createElement("canvas");
				offscreen.width = stage.width() * scale;
				offscreen.height = stage.height() * scale;
				const ctx = offscreen.getContext("2d")!;
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, offscreen.width, offscreen.height);

				const stageDataUrl = stage.toDataURL({ pixelRatio: scale });
				await new Promise<void>((resolve) => {
					const img = new Image();
					img.onload = () => {
						ctx.drawImage(img, 0, 0);
						resolve();
					};
					img.src = stageDataUrl;
				});

				dataURL = offscreen.toDataURL(config.mimeType, quality / 100);
			} else {
				dataURL = stage.toDataURL({
					mimeType: config.mimeType,
					quality: quality / 100,
					pixelRatio: scale,
				});
			}

			const a = document.createElement("a");
			a.href = dataURL;
			a.download = `${fileName || "artwork"}.${format}`;
			a.click();

			toast.success(
				`Exported as ${config.label} (${Math.round(stage.width() * scale)}×${Math.round(stage.height() * scale)}px)`,
			);
			onOpenChange(false);
		} catch (err) {
			console.error("Export failed:", err);
			toast.error("Export failed. Please try again.");
		} finally {
			setIsExporting(false);
		}
	};

	const config = FORMAT_CONFIG[format];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Download className="w-5 h-5" />
						Export Canvas
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 py-2">
					{/* File name */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">File Name</Label>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={fileName}
								onChange={(e) => setFileName(e.target.value)}
								className="flex-1 h-9 px-3 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
								placeholder="artwork"
							/>
							<span className="text-sm text-muted-foreground font-mono">
								.{format}
							</span>
						</div>
					</div>

					{/* Format */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Format</Label>
						<div className="grid grid-cols-3 gap-2">
							{(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map((fmt) => (
								<button
									key={fmt}
									onClick={() => {
										setFormat(fmt);
										if (fmt === "jpeg") setTransparentBg(false);
									}}
									className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs transition-all ${
										format === fmt
											? "border-primary bg-primary/10 text-primary"
											: "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/60"
									}`}
								>
									{FORMAT_CONFIG[fmt].icon}
									<span className="font-medium">{FORMAT_CONFIG[fmt].label}</span>
									<span className="text-[10px] opacity-70">
										{FORMAT_CONFIG[fmt].supportsAlpha ? "Alpha" : "No alpha"}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Scale / Resolution */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">
							Export Scale
						</Label>
						<div className="grid grid-cols-4 gap-1.5">
							{SCALE_PRESETS.map((preset) => (
								<button
									key={preset.value}
									onClick={() => setScale(preset.value)}
									className={`px-2 py-1.5 rounded text-xs border transition-all ${
										scale === preset.value
											? "border-primary bg-primary/10 text-primary"
											: "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
									}`}
								>
									{preset.label.split(" ")[0]}
								</button>
							))}
						</div>
					</div>

					{/* Quality (JPEG / WebP only) */}
					{format !== "png" && (
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label className="text-xs text-muted-foreground">Quality</Label>
								<span className="text-xs font-mono">{quality}%</span>
							</div>
							<Slider
								value={[quality]}
								onValueChange={([v]) => setQuality(v)}
								min={10}
								max={100}
								step={1}
							/>
						</div>
					)}

					{/* Transparent background (PNG / WebP) */}
					{config.supportsAlpha && (
						<div className="flex items-center gap-3">
							<button
								onClick={() => setTransparentBg(!transparentBg)}
								className={`relative w-10 h-5 rounded-full transition-colors ${
									transparentBg ? "bg-primary" : "bg-muted"
								}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
										transparentBg ? "translate-x-5" : "translate-x-0"
									}`}
								/>
							</button>
							<Label className="text-sm cursor-pointer" onClick={() => setTransparentBg(!transparentBg)}>
								Transparent background
							</Label>
						</div>
					)}

					{/* Info */}
					<div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 border border-border/50">
						{format === "jpeg" && (
							<span>JPEG does not support transparency — background will be filled white.</span>
						)}
						{format === "png" && (
							<span>PNG supports lossless compression and full transparency.</span>
						)}
						{format === "webp" && (
							<span>WebP provides excellent quality at smaller file sizes.</span>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleExport} disabled={isExporting} className="gap-2">
						<Download className="w-4 h-4" />
						{isExporting ? "Exporting…" : "Export"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
