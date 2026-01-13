"use client";

import React, { useState } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	Bold,
	Italic,
	Underline,
	Type as TypeIcon,
	Minus,
	Plus,
	Upload,
} from "lucide-react";
import { toast } from "sonner";

const FONT_FAMILIES = [
	{ value: "Arial", label: "Arial" },
	{ value: "Helvetica", label: "Helvetica" },
	{ value: "Times New Roman", label: "Times New Roman" },
	{ value: "Georgia", label: "Georgia" },
	{ value: "Verdana", label: "Verdana" },
	{ value: "Courier New", label: "Courier New" },
	{ value: "Trebuchet MS", label: "Trebuchet MS" },
	{ value: "Impact", label: "Impact" },
	{ value: "Comic Sans MS", label: "Comic Sans MS" },
	{ value: "Tahoma", label: "Tahoma" },
	{ value: "Lucida Console", label: "Lucida Console" },
	{ value: "Palatino", label: "Palatino" },
];

const FONT_SIZES = [
	8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
];

export const TextOptionsPanel: React.FC = () => {
	const { brushSettings, setBrushSettings } = useArtStudioStore();
	const [customFonts, setCustomFonts] = useState<string[]>([]);

	const loadCustomFont = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".ttf,.otf,.woff,.woff2";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const fontName = file.name.replace(/\.[^/.]+$/, "");
				const fontUrl = URL.createObjectURL(file);

				const fontFace = new FontFace(fontName, `url(${fontUrl})`);
				try {
					await fontFace.load();
					document.fonts.add(fontFace);
					setCustomFonts([...customFonts, fontName]);
					setBrushSettings({ fontFamily: fontName });
					toast.success(`Font "${fontName}" loaded successfully`);
				} catch (error) {
					toast.error("Failed to load font");
				}
			}
		};
		input.click();
	};

	return (
		<div className="panel-glass p-4 w-full space-y-4 animate-fade-in">
			<h3 className="text-sm font-medium text-foreground flex items-center gap-2">
				<TypeIcon className="w-4 h-4" />
				Text Options
			</h3>

			{/* Font Family */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Font</Label>
				<Select
					value={brushSettings.fontFamily}
					onValueChange={(value) => setBrushSettings({ fontFamily: value })}
				>
					<SelectTrigger className="w-full h-8 text-xs">
						<SelectValue placeholder="Select font" />
					</SelectTrigger>
					<SelectContent>
						{FONT_FAMILIES.map((font) => (
							<SelectItem
								key={font.value}
								value={font.value}
								className="text-xs"
							>
								<span style={{ fontFamily: font.value }}>{font.label}</span>
							</SelectItem>
						))}
						{customFonts.map((font) => (
							<SelectItem key={font} value={font} className="text-xs">
								<span style={{ fontFamily: font }}>{font} (Custom)</span>
							</SelectItem>
						))}
						<SelectItem
							value="load-custom"
							onSelect={loadCustomFont}
							className="text-xs text-primary flex items-center gap-1"
						>
							<Upload className="w-3 h-3" />
							Load Custom Font
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Font Size */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Font Size</Label>
				<div className="flex items-center gap-2">
					<Select
						value={brushSettings.fontSize.toString()}
						onValueChange={(value) =>
							setBrushSettings({ fontSize: parseInt(value) })
						}
					>
						<SelectTrigger className="flex-1 h-8 text-xs">
							<SelectValue placeholder="Select size" />
						</SelectTrigger>
						<SelectContent>
							{FONT_SIZES.map((size) => (
								<SelectItem
									key={size}
									value={size.toString()}
									className="text-xs"
								>
									{size} px
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex gap-1">
						<button
							onClick={() =>
								setBrushSettings({
									fontSize: Math.max(1, brushSettings.fontSize - 1),
								})
							}
							className="w-7 h-7 flex items-center justify-center rounded border border-input hover:bg-accent transition-colors"
							title="Decrease font size"
						>
							<Minus className="w-3 h-3" />
						</button>
						<button
							onClick={() =>
								setBrushSettings({
									fontSize: Math.min(200, brushSettings.fontSize + 1),
								})
							}
							className="w-7 h-7 flex items-center justify-center rounded border border-input hover:bg-accent transition-colors"
							title="Increase font size"
						>
							<Plus className="w-3 h-3" />
						</button>
					</div>
				</div>
			</div>

			{/* Font Style */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Style</Label>
				<div className="flex gap-1">
					<Toggle
						pressed={brushSettings.fontWeight === "bold"}
						onPressedChange={(pressed) =>
							setBrushSettings({ fontWeight: pressed ? "bold" : "normal" })
						}
						className="h-8 px-3"
						aria-label="Bold"
						title="Bold"
					>
						<Bold className="w-4 h-4" />
					</Toggle>
					<Toggle
						pressed={brushSettings.fontStyle === "italic"}
						onPressedChange={(pressed) =>
							setBrushSettings({ fontStyle: pressed ? "italic" : "normal" })
						}
						className="h-8 px-3"
						aria-label="Italic"
						title="Italic"
					>
						<Italic className="w-4 h-4" />
					</Toggle>
					<Toggle
						pressed={brushSettings.textDecoration === "underline"}
						onPressedChange={(pressed) =>
							setBrushSettings({
								textDecoration: pressed ? "underline" : "none",
							})
						}
						className="h-8 px-3"
						aria-label="Underline"
						title="Underline"
					>
						<Underline className="w-4 h-4" />
					</Toggle>
				</div>
			</div>

			{/* Text Alignment */}
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">Alignment</Label>
				<div className="flex gap-1">
					<Toggle
						pressed={brushSettings.textAlign === "left"}
						onPressedChange={(pressed) =>
							pressed && setBrushSettings({ textAlign: "left" })
						}
						className="h-8 px-3"
						aria-label="Align Left"
						title="Align Left"
					>
						<AlignLeft className="w-4 h-4" />
					</Toggle>
					<Toggle
						pressed={brushSettings.textAlign === "center"}
						onPressedChange={(pressed) =>
							pressed && setBrushSettings({ textAlign: "center" })
						}
						className="h-8 px-3"
						aria-label="Align Center"
						title="Align Center"
					>
						<AlignCenter className="w-4 h-4" />
					</Toggle>
					<Toggle
						pressed={brushSettings.textAlign === "right"}
						onPressedChange={(pressed) =>
							pressed && setBrushSettings({ textAlign: "right" })
						}
						className="h-8 px-3"
						aria-label="Align Right"
						title="Align Right"
					>
						<AlignRight className="w-4 h-4" />
					</Toggle>
					<Toggle
						pressed={brushSettings.textAlign === "justify"}
						onPressedChange={(pressed) =>
							pressed && setBrushSettings({ textAlign: "justify" })
						}
						className="h-8 px-3"
						aria-label="Justify"
						title="Justify"
					>
						<AlignJustify className="w-4 h-4" />
					</Toggle>
				</div>
			</div>

			{/* Advanced Text Settings */}
			<div className="space-y-3 pt-2 border-t">
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label className="text-xs text-muted-foreground">Line Height</Label>
						<span className="text-xs font-mono">
							{brushSettings.lineHeight.toFixed(1)}
						</span>
					</div>
					<Slider
						value={[brushSettings.lineHeight]}
						onValueChange={([value]) => setBrushSettings({ lineHeight: value })}
						min={0.5}
						max={3}
						step={0.1}
						className="w-full"
					/>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label className="text-xs text-muted-foreground">
							Letter Spacing
						</Label>
						<span className="text-xs font-mono">
							{brushSettings.letterSpacing}px
						</span>
					</div>
					<Slider
						value={[brushSettings.letterSpacing]}
						onValueChange={([value]) =>
							setBrushSettings({ letterSpacing: value })
						}
						min={-5}
						max={20}
						step={0.5}
						className="w-full"
					/>
				</div>
			</div>

			{/* Text Preview */}
			<div className="pt-3 border-t">
				<Label className="text-xs text-muted-foreground mb-2 block">
					Preview
				</Label>
				<div className="min-h-20 p-3 bg-muted/30 rounded-md border border-border/50">
					<div
						className="text-foreground"
						style={{
							fontFamily: brushSettings.fontFamily,
							fontSize: `${brushSettings.fontSize}px`,
							fontWeight: brushSettings.fontWeight,
							fontStyle: brushSettings.fontStyle,
							textDecoration: brushSettings.textDecoration,
							textAlign: brushSettings.textAlign,
							lineHeight: brushSettings.lineHeight,
							letterSpacing: `${brushSettings.letterSpacing}px`,
						}}
					>
						The quick brown fox jumps over the lazy dog
						<br />
						<span className="opacity-70 text-xs">
							Font: {brushSettings.fontFamily} | Size: {brushSettings.fontSize}
							px
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
