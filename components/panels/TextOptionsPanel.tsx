"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Type as TypeIcon,
	Minus,
	Plus,
	Upload,
	RotateCcw,
	Trash2,
	Copy,
	Palette,
	Check,
	X,
	Edit2,
	Eye,
	EyeOff,
	MousePointer,
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
	{ value: "Garamond", label: "Garamond" },
	{ value: "Bookman", label: "Bookman" },
];

const FONT_SIZES = [
	8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72,
	96, 120,
];

interface TextObject {
	id: string;
	text: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
	fontFamily: string;
	fontSize: number;
	fontWeight: string;
	fontStyle: string;
	textDecoration: string;
	textAlign: string;
	lineHeight: number;
	letterSpacing: number;
	color: string;
	backgroundColor?: string;
	backgroundOpacity?: number;
	shadowColor?: string;
	shadowBlur?: number;
	shadowOffsetX?: number;
	shadowOffsetY?: number;
	outlineColor?: string;
	outlineWidth?: number;
	rotation?: number;
	opacity?: number;
	wrap: "word" | "char" | "none";
	padding?: number;
	isEditing?: boolean;
	layerId: string;
}

export const TextOptionsPanel: React.FC = () => {
	const {
		brushSettings,
		setBrushSettings,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
		activeLayerId,
		selectedId,
		setSelectedId,
		activeTool,
		setActiveTool,
	} = useArtStudioStore();

	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState("");
	const [activeTextId, setActiveTextId] = useState<string | null>(null);
	const [textObjects, setTextObjects] = useState<TextObject[]>([]);
	const [showPreview, setShowPreview] = useState(true);
	const [customFonts, setCustomFonts] = useState<string[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Bezpečné získanie hodnôt
	const safeBrushSettings = {
		...brushSettings,
		lineHeight: brushSettings.lineHeight ?? 1.2,
		letterSpacing: brushSettings.letterSpacing ?? 0,
		fontFamily: brushSettings.fontFamily ?? "Arial",
		fontSize: brushSettings.fontSize ?? 16,
		fontWeight: brushSettings.fontWeight ?? "normal",
		fontStyle: brushSettings.fontStyle ?? "normal",
		textDecoration: brushSettings.textDecoration ?? "none",
		textAlign: brushSettings.textAlign ?? "left",
		textWrap: brushSettings.textWrap ?? "word",
		textPadding: brushSettings.textPadding ?? 4,
		textOpacity: brushSettings.textOpacity ?? 100,
		textShadow: brushSettings.textShadow ?? false,
		textShadowColor: brushSettings.textShadowColor ?? "#00000080",
		textShadowBlur: brushSettings.textShadowBlur ?? 5,
		textShadowOffsetX: brushSettings.textShadowOffsetX ?? 2,
		textShadowOffsetY: brushSettings.textShadowOffsetY ?? 2,
		textOutline: brushSettings.textOutline ?? false,
		textOutlineColor: brushSettings.textOutlineColor ?? "#ffffff",
		textOutlineWidth: brushSettings.textOutlineWidth ?? 1,
		textTransform: brushSettings.textTransform ?? "none",
		textBackground: brushSettings.textBackground ?? false,
		textBackgroundColor: brushSettings.textBackgroundColor ?? "#ffffff",
		textBackgroundOpacity: brushSettings.textBackgroundOpacity ?? 20,
		textEditingMode: brushSettings.textEditingMode ?? "inline",
	};

	// Načítanie textových objektov z canvasu
	useEffect(() => {
		const handleGetTextObjects = () => {
			window.dispatchEvent(new CustomEvent("artstudio:request-text-objects"));
		};

		const handleTextObjectsReceived = (e: CustomEvent) => {
			if (e.detail?.textObjects) {
				setTextObjects(e.detail.textObjects);

				// Ak je vybraný text, nastavíme ho ako aktívny
				if (selectedId) {
					const text = e.detail.textObjects.find(
						(t: TextObject) => t.id === selectedId,
					);
					if (text) {
						setActiveTextId(text.id);
						setEditText(text.text);
						if (text.isEditing) {
							setIsEditing(true);
							setTimeout(() => textareaRef.current?.focus(), 100);
						}
					}
				}
			}
		};

		window.addEventListener(
			"artstudio:text-objects",
			handleTextObjectsReceived as EventListener,
		);

		// Požiadame o textové objekty
		handleGetTextObjects();

		// Interval na obnovenie dát každých 2 sekundy
		const interval = setInterval(handleGetTextObjects, 2000);

		return () => {
			window.removeEventListener(
				"artstudio:text-objects",
				handleTextObjectsReceived as EventListener,
			);
			clearInterval(interval);
		};
	}, [selectedId]);

	// Focus textarea keď začíname editovať
	useEffect(() => {
		if (isEditing && textareaRef.current) {
			setTimeout(() => {
				textareaRef.current?.focus();
				textareaRef.current?.select();
			}, 100);
		}
	}, [isEditing]);

	// Vytvorenie nového textu
	const createNewText = () => {
		const newText: TextObject = {
			id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			text: "Kliknite pre editáciu textu",
			x: 100,
			y: 100,
			fontFamily: safeBrushSettings.fontFamily,
			fontSize: safeBrushSettings.fontSize,
			fontWeight: safeBrushSettings.fontWeight,
			fontStyle: safeBrushSettings.fontStyle,
			textDecoration: safeBrushSettings.textDecoration,
			textAlign: safeBrushSettings.textAlign,
			lineHeight: safeBrushSettings.lineHeight,
			letterSpacing: safeBrushSettings.letterSpacing,
			color: primaryColor,
			wrap: safeBrushSettings.textWrap,
			padding: safeBrushSettings.textPadding,
			opacity: safeBrushSettings.textOpacity,
			isEditing: safeBrushSettings.textEditingMode === "inline",
			layerId: activeLayerId || "layer-1",
		};

		// Pridať efekty podľa nastavení
		if (safeBrushSettings.textShadow) {
			newText.shadowColor = safeBrushSettings.textShadowColor;
			newText.shadowBlur = safeBrushSettings.textShadowBlur;
			newText.shadowOffsetX = safeBrushSettings.textShadowOffsetX;
			newText.shadowOffsetY = safeBrushSettings.textShadowOffsetY;
		}

		if (safeBrushSettings.textOutline) {
			newText.outlineColor = safeBrushSettings.textOutlineColor;
			newText.outlineWidth = safeBrushSettings.textOutlineWidth;
		}

		if (safeBrushSettings.textBackground) {
			newText.backgroundColor = safeBrushSettings.textBackgroundColor;
			newText.backgroundOpacity = safeBrushSettings.textBackgroundOpacity;
		}

		// Odoslať do canvasu
		window.dispatchEvent(
			new CustomEvent("artstudio:add-text", {
				detail: { textObject: newText },
			}),
		);

		setActiveTextId(newText.id);
		setEditText(newText.text);
		setIsEditing(safeBrushSettings.textEditingMode === "inline");
		setSelectedId(newText.id);

		toast.success("Nový text vytvorený");
	};

	// Začatie editácie existujúceho textu
	const startEditing = (textId: string) => {
		const text = textObjects.find((t) => t.id === textId);
		if (!text) return;

		setActiveTextId(textId);
		setEditText(text.text);
		setIsEditing(true);
		setSelectedId(textId);

		// Informovať canvas o začatí editácie
		window.dispatchEvent(
			new CustomEvent("artstudio:start-text-edit", {
				detail: { textId },
			}),
		);
	};

	// Uloženie editovaného textu
	const saveTextEdit = () => {
		if (!activeTextId) return;

		// Aplikovať transformáciu textu
		let transformedText = editText;
		switch (safeBrushSettings.textTransform) {
			case "uppercase":
				transformedText = editText.toUpperCase();
				break;
			case "lowercase":
				transformedText = editText.toLowerCase();
				break;
			case "capitalize":
				transformedText = editText.replace(/\b\w/g, (char) =>
					char.toUpperCase(),
				);
				break;
		}

		// Odoslať aktualizáciu do canvasu
		window.dispatchEvent(
			new CustomEvent("artstudio:update-text", {
				detail: {
					textId: activeTextId,
					updates: {
						text: transformedText,
						isEditing: false,
						fontFamily: safeBrushSettings.fontFamily,
						fontSize: safeBrushSettings.fontSize,
						fontWeight: safeBrushSettings.fontWeight,
						fontStyle: safeBrushSettings.fontStyle,
						textDecoration: safeBrushSettings.textDecoration,
						textAlign: safeBrushSettings.textAlign,
						lineHeight: safeBrushSettings.lineHeight,
						letterSpacing: safeBrushSettings.letterSpacing,
						color: primaryColor,
						wrap: safeBrushSettings.textWrap,
						padding: safeBrushSettings.textPadding,
						opacity: safeBrushSettings.textOpacity,
						shadowColor: safeBrushSettings.textShadow
							? safeBrushSettings.textShadowColor
							: undefined,
						shadowBlur: safeBrushSettings.textShadow
							? safeBrushSettings.textShadowBlur
							: undefined,
						shadowOffsetX: safeBrushSettings.textShadow
							? safeBrushSettings.textShadowOffsetX
							: undefined,
						shadowOffsetY: safeBrushSettings.textShadow
							? safeBrushSettings.textShadowOffsetY
							: undefined,
						outlineColor: safeBrushSettings.textOutline
							? safeBrushSettings.textOutlineColor
							: undefined,
						outlineWidth: safeBrushSettings.textOutline
							? safeBrushSettings.textOutlineWidth
							: undefined,
						backgroundColor: safeBrushSettings.textBackground
							? safeBrushSettings.textBackgroundColor
							: undefined,
						backgroundOpacity: safeBrushSettings.textBackground
							? safeBrushSettings.textBackgroundOpacity
							: undefined,
					},
				},
			}),
		);

		setIsEditing(false);
		toast.success("Text uložený");
	};

	// Zrušenie editácie
	const cancelTextEdit = () => {
		setIsEditing(false);
		if (activeTextId) {
			window.dispatchEvent(
				new CustomEvent("artstudio:cancel-text-edit", {
					detail: { textId: activeTextId },
				}),
			);
		}
	};

	// Odstránenie textu
	const deleteText = () => {
		if (!activeTextId) return;

		if (confirm("Naozaj chcete odstrániť tento text?")) {
			window.dispatchEvent(
				new CustomEvent("artstudio:delete-text", {
					detail: { textId: activeTextId },
				}),
			);

			setActiveTextId(null);
			setEditText("");
			setIsEditing(false);
			setSelectedId(null);

			toast.success("Text odstránený");
		}
	};

	// Duplikovanie textu
	const duplicateText = () => {
		if (!activeTextId) return;

		const originalText = textObjects.find((t) => t.id === activeTextId);
		if (!originalText) return;

		const duplicatedText: TextObject = {
			...originalText,
			id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			x: originalText.x + 20,
			y: originalText.y + 20,
			isEditing: false,
		};

		window.dispatchEvent(
			new CustomEvent("artstudio:add-text", {
				detail: { textObject: duplicatedText },
			}),
		);

		setActiveTextId(duplicatedText.id);
		setEditText(duplicatedText.text);
		setSelectedId(duplicatedText.id);

		toast.success("Text duplikovaný");
	};

	// Aplikovanie aktuálnych nastavení na vybraný text
	const applySettingsToText = () => {
		if (!activeTextId) return;

		const updates = {
			fontFamily: safeBrushSettings.fontFamily,
			fontSize: safeBrushSettings.fontSize,
			fontWeight: safeBrushSettings.fontWeight,
			fontStyle: safeBrushSettings.fontStyle,
			textDecoration: safeBrushSettings.textDecoration,
			textAlign: safeBrushSettings.textAlign,
			lineHeight: safeBrushSettings.lineHeight,
			letterSpacing: safeBrushSettings.letterSpacing,
			color: primaryColor,
			wrap: safeBrushSettings.textWrap,
			padding: safeBrushSettings.textPadding,
			opacity: safeBrushSettings.textOpacity,
			shadowColor: safeBrushSettings.textShadow
				? safeBrushSettings.textShadowColor
				: undefined,
			shadowBlur: safeBrushSettings.textShadow
				? safeBrushSettings.textShadowBlur
				: undefined,
			shadowOffsetX: safeBrushSettings.textShadow
				? safeBrushSettings.textShadowOffsetX
				: undefined,
			shadowOffsetY: safeBrushSettings.textShadow
				? safeBrushSettings.textShadowOffsetY
				: undefined,
			outlineColor: safeBrushSettings.textOutline
				? safeBrushSettings.textOutlineColor
				: undefined,
			outlineWidth: safeBrushSettings.textOutline
				? safeBrushSettings.textOutlineWidth
				: undefined,
			backgroundColor: safeBrushSettings.textBackground
				? safeBrushSettings.textBackgroundColor
				: undefined,
			backgroundOpacity: safeBrushSettings.textBackground
				? safeBrushSettings.textBackgroundOpacity
				: undefined,
		};

		window.dispatchEvent(
			new CustomEvent("artstudio:update-text", {
				detail: { textId: activeTextId, updates },
			}),
		);

		toast.success("Nastavenia aplikované na text");
	};

	// Aplikovanie nastavení na všetky texty
	const applySettingsToAllTexts = () => {
		if (textObjects.length === 0) return;

		if (confirm("Aplikovať nastavenia na všetky texty?")) {
			textObjects.forEach((text) => {
				const updates = {
					fontFamily: safeBrushSettings.fontFamily,
					fontSize: safeBrushSettings.fontSize,
					fontWeight: safeBrushSettings.fontWeight,
					fontStyle: safeBrushSettings.fontStyle,
					textDecoration: safeBrushSettings.textDecoration,
					textAlign: safeBrushSettings.textAlign,
					lineHeight: safeBrushSettings.lineHeight,
					letterSpacing: safeBrushSettings.letterSpacing,
					color: primaryColor,
					wrap: safeBrushSettings.textWrap,
					padding: safeBrushSettings.textPadding,
					opacity: safeBrushSettings.textOpacity,
				};

				window.dispatchEvent(
					new CustomEvent("artstudio:update-text", {
						detail: { textId: text.id, updates },
					}),
				);
			});

			toast.success(`Nastavenia aplikované na ${textObjects.length} textov`);
		}
	};

	// Load custom font
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

	// Aktívny text objekt
	const activeText = textObjects.find((t) => t.id === activeTextId);

	// Transform text preview
	const getTransformedText = (text: string) => {
		switch (safeBrushSettings.textTransform) {
			case "uppercase":
				return text.toUpperCase();
			case "lowercase":
				return text.toLowerCase();
			case "capitalize":
				return text.replace(/\b\w/g, (char) => char.toUpperCase());
			default:
				return text;
		}
	};

	return (
		<div className="panel-glass p-4 w-full space-y-4 animate-fade-in max-h-[calc(100vh-200px)] overflow-y-auto">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-foreground flex items-center gap-2">
					<TypeIcon className="w-4 h-4" />
					Textový editor
				</h3>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowPreview(!showPreview)}
						className="h-7 w-7 p-0"
						title={showPreview ? "Skryť náhľad" : "Zobraziť náhľad"}
					>
						{showPreview ? (
							<EyeOff className="w-3 h-3" />
						) : (
							<Eye className="w-3 h-3" />
						)}
					</Button>
				</div>
			</div>

			{/* Rýchle akcie */}
			<div className="grid grid-cols-2 gap-2">
				<Button
					onClick={createNewText}
					size="sm"
					className="h-8 text-xs"
					variant="default"
				>
					<TypeIcon className="w-3 h-3 mr-1" />
					Nový text
				</Button>
				{activeText && (
					<Button
						onClick={() => startEditing(activeTextId!)}
						size="sm"
						className="h-8 text-xs"
						variant={isEditing ? "default" : "outline"}
						disabled={isEditing}
					>
						<Edit2 className="w-3 h-3 mr-1" />
						{isEditing ? "Edituje sa..." : "Editovať"}
					</Button>
				)}
			</div>

			{/* Zoznam textových objektov */}
			{textObjects.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-xs text-muted-foreground">
							Textové objekty ({textObjects.length})
						</Label>
						<Button
							variant="ghost"
							size="sm"
							onClick={applySettingsToAllTexts}
							className="h-6 text-xs"
						>
							Aplikovať na všetky
						</Button>
					</div>
					<div className="space-y-1 max-h-32 overflow-y-auto">
						{textObjects.map((text) => (
							<div
								key={text.id}
								className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-accent transition-colors ${activeTextId === text.id ? "bg-accent border border-primary/20" : ""}`}
								onClick={() => {
									setActiveTextId(text.id);
									setEditText(text.text);
									setSelectedId(text.id);

									// Označiť text v canvase
									window.dispatchEvent(
										new CustomEvent("artstudio:select-text", {
											detail: { textId: text.id },
										}),
									);
								}}
								onDoubleClick={() => startEditing(text.id)}
							>
								<div className="truncate flex-1">
									<div className="flex items-center gap-2">
										{text.isEditing && (
											<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
										)}
										<span className="font-medium" style={{ color: text.color }}>
											{text.text.length > 20
												? text.text.substring(0, 20) + "..."
												: text.text}
										</span>
									</div>
									<div className="text-muted-foreground text-[10px]">
										{text.fontSize}px {text.fontFamily}
									</div>
								</div>
								<div className="flex gap-1">
									{text.isEditing && (
										<span className="text-[10px] text-green-600">EDIT</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Editácia textu */}
			{isEditing && activeText && (
				<div className="space-y-3 p-3 bg-accent/30 rounded-md border">
					<div className="flex items-center justify-between">
						<Label className="text-xs font-medium">Editácia textu</Label>
						<div className="flex gap-1">
							<Button
								size="sm"
								variant="default"
								className="h-6 w-6 p-0"
								onClick={saveTextEdit}
								title="Uložiť (Enter)"
							>
								<Check className="w-3 h-3" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 w-6 p-0"
								onClick={cancelTextEdit}
								title="Zrušiť (Esc)"
							>
								<X className="w-3 h-3" />
							</Button>
						</div>
					</div>

					<Textarea
						ref={textareaRef}
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						className="min-h-20 text-sm font-mono"
						placeholder="Zadajte text..."
						onKeyDown={(e) => {
							if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
								saveTextEdit();
							}
							if (e.key === "Escape") {
								cancelTextEdit();
							}
						}}
					/>

					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{editText.length} znakov</span>
						<Button
							size="sm"
							variant="ghost"
							className="h-6 text-xs"
							onClick={() => navigator.clipboard.writeText(editText)}
						>
							Kopírovať
						</Button>
					</div>
				</div>
			)}

			{/* Základné nastavenia */}
			<div className="space-y-3">
				<Label className="text-xs font-medium">Základné nastavenia</Label>

				<div className="grid grid-cols-2 gap-3">
					{/* Font Family */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Font</Label>
						<Select
							value={safeBrushSettings.fontFamily}
							onValueChange={(value) => setBrushSettings({ fontFamily: value })}
						>
							<SelectTrigger className="w-full h-8 text-xs">
								<SelectValue placeholder="Vyberte font" />
							</SelectTrigger>
							<SelectContent className="max-h-60">
								{FONT_FAMILIES.map((font) => (
									<SelectItem
										key={font.value}
										value={font.value}
										className="text-xs"
										style={{ fontFamily: font.value }}
									>
										{font.label}
									</SelectItem>
								))}
								{customFonts.map((font) => (
									<SelectItem key={font} value={font} className="text-xs">
										<span style={{ fontFamily: font }}>{font} (Vlastný)</span>
									</SelectItem>
								))}
								<SelectItem
									value="load-custom"
									onSelect={loadCustomFont}
									className="text-xs text-primary"
								>
									+ Načítať vlastný font
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Font Size */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Veľkosť</Label>
						<div className="flex items-center gap-2">
							<Button
								onClick={() =>
									setBrushSettings({
										fontSize: Math.max(6, safeBrushSettings.fontSize - 1),
									})
								}
								variant="outline"
								size="sm"
								className="h-7 w-7 p-0"
							>
								<Minus className="w-3 h-3" />
							</Button>
							<Input
								type="number"
								value={safeBrushSettings.fontSize}
								onChange={(e) =>
									setBrushSettings({
										fontSize: Math.max(
											6,
											Math.min(200, parseInt(e.target.value) || 16),
										),
									})
								}
								className="h-7 text-xs text-center"
								min="6"
								max="200"
							/>
							<Button
								onClick={() =>
									setBrushSettings({
										fontSize: Math.min(200, safeBrushSettings.fontSize + 1),
									})
								}
								variant="outline"
								size="sm"
								className="h-7 w-7 p-0"
							>
								<Plus className="w-3 h-3" />
							</Button>
						</div>
					</div>
				</div>

				{/* Farba textu */}
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">Farba textu</Label>
					<div className="flex items-center gap-2">
						<div
							className="w-8 h-8 rounded border cursor-pointer"
							style={{ backgroundColor: primaryColor }}
							onClick={() => {
								const input = document.createElement("input");
								input.type = "color";
								input.value = primaryColor;
								input.onchange = (e) => {
									const color = (e.target as HTMLInputElement).value;
									setPrimaryColor(color);
								};
								input.click();
							}}
						/>
						<Input
							value={primaryColor}
							onChange={(e) => setPrimaryColor(e.target.value)}
							className="h-8 text-xs flex-1"
							placeholder="#000000"
						/>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setPrimaryColor("#000000")}
							title="Čierna"
						>
							<div className="w-4 h-4 rounded bg-black"></div>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setPrimaryColor("#ffffff")}
							title="Biela"
						>
							<div className="w-4 h-4 rounded bg-white border"></div>
						</Button>
					</div>
				</div>

				{/* Štýl písma */}
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">Štýl písma</Label>
					<div className="flex gap-1">
						<Toggle
							pressed={safeBrushSettings.fontWeight === "bold"}
							onPressedChange={(pressed) =>
								setBrushSettings({ fontWeight: pressed ? "bold" : "normal" })
							}
							className="h-8 w-8 p-0"
							aria-label="Tučné"
							title="Tučné (Ctrl+B)"
						>
							<Bold className="w-4 h-4" />
						</Toggle>
						<Toggle
							pressed={safeBrushSettings.fontStyle === "italic"}
							onPressedChange={(pressed) =>
								setBrushSettings({ fontStyle: pressed ? "italic" : "normal" })
							}
							className="h-8 w-8 p-0"
							aria-label="Kurzíva"
							title="Kurzíva (Ctrl+I)"
						>
							<Italic className="w-4 h-4" />
						</Toggle>
						<Toggle
							pressed={safeBrushSettings.textDecoration === "underline"}
							onPressedChange={(pressed) =>
								setBrushSettings({
									textDecoration: pressed ? "underline" : "none",
								})
							}
							className="h-8 w-8 p-0"
							aria-label="Podčiarknuté"
							title="Podčiarknuté (Ctrl+U)"
						>
							<Underline className="w-4 h-4" />
						</Toggle>
						<Toggle
							pressed={safeBrushSettings.textDecoration === "line-through"}
							onPressedChange={(pressed) =>
								setBrushSettings({
									textDecoration: pressed ? "line-through" : "none",
								})
							}
							className="h-8 w-8 p-0"
							aria-label="Prečiarknuté"
							title="Prečiarknuté"
						>
							<Strikethrough className="w-4 h-4" />
						</Toggle>
					</div>
				</div>

				{/* Zarovnanie */}
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">Zarovnanie</Label>
					<div className="flex gap-1">
						<Toggle
							pressed={safeBrushSettings.textAlign === "left"}
							onPressedChange={(pressed) =>
								pressed && setBrushSettings({ textAlign: "left" })
							}
							className="h-8 w-8 p-0"
							aria-label="Vľavo"
							title="Vľavo"
						>
							<AlignLeft className="w-4 h-4" />
						</Toggle>
						<Toggle
							pressed={safeBrushSettings.textAlign === "center"}
							onPressedChange={(pressed) =>
								pressed && setBrushSettings({ textAlign: "center" })
							}
							className="h-8 w-8 p-0"
							aria-label="Na stred"
							title="Na stred"
						>
							<AlignCenter className="w-4 h-4" />
						</Toggle>
						<Toggle
							pressed={safeBrushSettings.textAlign === "right"}
							onPressedChange={(pressed) =>
								pressed && setBrushSettings({ textAlign: "right" })
							}
							className="h-8 w-8 p-0"
							aria-label="Vpravo"
							title="Vpravo"
						>
							<AlignRight className="w-4 h-4" />
						</Toggle>
						<Toggle
							pressed={safeBrushSettings.textAlign === "justify"}
							onPressedChange={(pressed) =>
								pressed && setBrushSettings({ textAlign: "justify" })
							}
							className="h-8 w-8 p-0"
							aria-label="Do bloku"
							title="Do bloku"
						>
							<AlignJustify className="w-4 h-4" />
						</Toggle>
					</div>
				</div>
			</div>

			{/* Pokročilé nastavenia */}
			<div className="space-y-3">
				<Label className="text-xs font-medium">Pokročilé nastavenia</Label>

				{/* Line Height */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label className="text-xs text-muted-foreground">Riadkovanie</Label>
						<span className="text-xs font-mono">
							{safeBrushSettings.lineHeight.toFixed(1)}
						</span>
					</div>
					<Slider
						value={[safeBrushSettings.lineHeight]}
						onValueChange={([value]) => setBrushSettings({ lineHeight: value })}
						min={0.5}
						max={3}
						step={0.1}
						className="w-full"
					/>
				</div>

				{/* Letter Spacing */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label className="text-xs text-muted-foreground">
							Medzery medzi písmenami
						</Label>
						<span className="text-xs font-mono">
							{safeBrushSettings.letterSpacing}px
						</span>
					</div>
					<Slider
						value={[safeBrushSettings.letterSpacing]}
						onValueChange={([value]) =>
							setBrushSettings({ letterSpacing: value })
						}
						min={-5}
						max={20}
						step={0.5}
						className="w-full"
					/>
				</div>

				{/* Text Transform */}
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">
						Transformácia textu
					</Label>
					<Select
						value={safeBrushSettings.textTransform}
						onValueChange={(
							value: "none" | "uppercase" | "lowercase" | "capitalize",
						) => setBrushSettings({ textTransform: value })}
					>
						<SelectTrigger className="w-full h-8 text-xs">
							<SelectValue placeholder="Transformácia" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none" className="text-xs">
								Žiadna (normálny text)
							</SelectItem>
							<SelectItem value="uppercase" className="text-xs">
								VŠETKO VEĽKÉ
							</SelectItem>
							<SelectItem value="lowercase" className="text-xs">
								všetko malé
							</SelectItem>
							<SelectItem value="capitalize" className="text-xs">
								Prvé Veľké
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Opacity */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label className="text-xs text-muted-foreground">
							Priehľadnosť
						</Label>
						<span className="text-xs font-mono">
							{safeBrushSettings.textOpacity}%
						</span>
					</div>
					<Slider
						value={[safeBrushSettings.textOpacity]}
						onValueChange={([value]) =>
							setBrushSettings({ textOpacity: value })
						}
						min={10}
						max={100}
						step={5}
						className="w-full"
					/>
				</div>
			</div>

			{/* Efekty */}
			<div className="space-y-3">
				<Label className="text-xs font-medium">Efekty</Label>

				{/* Text Shadow */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Switch
								checked={safeBrushSettings.textShadow}
								onCheckedChange={(checked) =>
									setBrushSettings({ textShadow: checked })
								}
							/>
							<Label className="text-xs">Tieň</Label>
						</div>
						{safeBrushSettings.textShadow && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-xs"
								onClick={() => {
									const input = document.createElement("input");
									input.type = "color";
									input.value = safeBrushSettings.textShadowColor;
									input.onchange = (e) => {
										const color = (e.target as HTMLInputElement).value;
										setBrushSettings({ textShadowColor: color });
									};
									input.click();
								}}
							>
								<Palette className="w-3 h-3 mr-1" />
								Farba
							</Button>
						)}
					</div>
					{safeBrushSettings.textShadow && (
						<div className="pl-6 space-y-2">
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										Rozmazanie
									</Label>
									<Input
										type="number"
										value={safeBrushSettings.textShadowBlur}
										onChange={(e) =>
											setBrushSettings({
												textShadowBlur: parseInt(e.target.value),
											})
										}
										className="h-7 text-xs"
										min="0"
										max="50"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">Posun</Label>
									<Input
										type="number"
										value={safeBrushSettings.textShadowOffsetX}
										onChange={(e) =>
											setBrushSettings({
												textShadowOffsetX: parseInt(e.target.value),
											})
										}
										className="h-7 text-xs"
										min="-20"
										max="20"
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Text Outline */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Switch
								checked={safeBrushSettings.textOutline}
								onCheckedChange={(checked) =>
									setBrushSettings({ textOutline: checked })
								}
							/>
							<Label className="text-xs">Obrys</Label>
						</div>
						{safeBrushSettings.textOutline && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-xs"
								onClick={() => {
									const input = document.createElement("input");
									input.type = "color";
									input.value = safeBrushSettings.textOutlineColor;
									input.onchange = (e) => {
										const color = (e.target as HTMLInputElement).value;
										setBrushSettings({ textOutlineColor: color });
									};
									input.click();
								}}
							>
								<Palette className="w-3 h-3 mr-1" />
								Farba
							</Button>
						)}
					</div>
					{safeBrushSettings.textOutline && (
						<div className="pl-6 space-y-2">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">
									Šírka obrysu
								</Label>
								<Slider
									value={[safeBrushSettings.textOutlineWidth]}
									onValueChange={([value]) =>
										setBrushSettings({ textOutlineWidth: value })
									}
									min={1}
									max={10}
									step={0.5}
									className="w-full"
								/>
							</div>
						</div>
					)}
				</div>

				{/* Text Background */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Switch
								checked={safeBrushSettings.textBackground}
								onCheckedChange={(checked) =>
									setBrushSettings({ textBackground: checked })
								}
							/>
							<Label className="text-xs">Pozadie</Label>
						</div>
						{safeBrushSettings.textBackground && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-xs"
								onClick={() => {
									const input = document.createElement("input");
									input.type = "color";
									input.value = safeBrushSettings.textBackgroundColor;
									input.onchange = (e) => {
										const color = (e.target as HTMLInputElement).value;
										setBrushSettings({ textBackgroundColor: color });
									};
									input.click();
								}}
							>
								<Palette className="w-3 h-3 mr-1" />
								Farba
							</Button>
						)}
					</div>
					{safeBrushSettings.textBackground && (
						<div className="pl-6 space-y-2">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">
									Priehľadnosť pozadia
								</Label>
								<Slider
									value={[safeBrushSettings.textBackgroundOpacity]}
									onValueChange={([value]) =>
										setBrushSettings({ textBackgroundOpacity: value })
									}
									min={5}
									max={100}
									step={5}
									className="w-full"
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Náhľad */}
			{showPreview && (
				<div className="pt-3 border-t">
					<div className="flex justify-between items-center mb-2">
						<Label className="text-xs font-medium">Náhľad textu</Label>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 text-xs"
							onClick={() =>
								setBrushSettings({
									fontFamily: "Arial",
									fontSize: 16,
									fontWeight: "normal",
									fontStyle: "normal",
									textDecoration: "none",
									textAlign: "left",
									lineHeight: 1.2,
									letterSpacing: 0,
									textTransform: "none",
									textOpacity: 100,
									textShadow: false,
									textOutline: false,
									textBackground: false,
								})
							}
						>
							<RotateCcw className="w-3 h-3 mr-1" />
							Reset
						</Button>
					</div>
					<div
						className="min-h-32 p-4 bg-muted/30 rounded-md border border-border/50 flex items-center justify-center relative"
						style={{
							backgroundColor: safeBrushSettings.textBackground
								? `${safeBrushSettings.textBackgroundColor}${Math.round(
										safeBrushSettings.textBackgroundOpacity * 2.55,
									)
										.toString(16)
										.padStart(2, "0")}`
								: "transparent",
						}}
					>
						<div
							className="text-center transition-all duration-200"
							style={{
								fontFamily: safeBrushSettings.fontFamily,
								fontSize: `${safeBrushSettings.fontSize}px`,
								fontWeight: safeBrushSettings.fontWeight,
								fontStyle: safeBrushSettings.fontStyle,
								textDecoration: safeBrushSettings.textDecoration,
								textAlign: safeBrushSettings.textAlign as any,
								lineHeight: safeBrushSettings.lineHeight,
								letterSpacing: `${safeBrushSettings.letterSpacing}px`,
								color: primaryColor,
								padding: `${safeBrushSettings.textPadding}px`,
								opacity: `${safeBrushSettings.textOpacity}%`,
								maxWidth: "100%",
								wordWrap:
									safeBrushSettings.textWrap === "none"
										? "normal"
										: "break-word",
								textShadow: safeBrushSettings.textShadow
									? `${safeBrushSettings.textShadowOffsetX}px ${safeBrushSettings.textShadowOffsetY}px ${safeBrushSettings.textShadowBlur}px ${safeBrushSettings.textShadowColor}`
									: "none",
								WebkitTextStroke: safeBrushSettings.textOutline
									? `${safeBrushSettings.textOutlineWidth}px ${safeBrushSettings.textOutlineColor}`
									: "none",
								paintOrder: safeBrushSettings.textOutline
									? "stroke fill"
									: "normal",
							}}
						>
							{getTransformedText(
								editText || "The quick brown fox jumps over the lazy dog",
							)}
						</div>
						{isEditing && (
							<div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse">
								EDITUJE SA
							</div>
						)}
					</div>
					<div className="text-xs text-muted-foreground mt-2 text-center">
						{safeBrushSettings.fontFamily} | {safeBrushSettings.fontSize}px |{" "}
						{editText.length} znakov
					</div>
				</div>
			)}

			{/* Akcie pre vybraný text */}
			{activeText && (
				<div className="pt-3 border-t">
					<Label className="text-xs font-medium mb-2 block">
						Akcie pre vybraný text
					</Label>
					<div className="grid grid-cols-2 gap-2">
						<Button
							onClick={applySettingsToText}
							size="sm"
							className="h-8 text-xs"
							variant="default"
						>
							<Check className="w-3 h-3 mr-1" />
							Aplikovať
						</Button>
						<Button
							onClick={duplicateText}
							size="sm"
							className="h-8 text-xs"
							variant="outline"
						>
							<Copy className="w-3 h-3 mr-1" />
							Duplikovať
						</Button>
						<Button
							onClick={deleteText}
							size="sm"
							className="h-8 text-xs"
							variant="destructive"
						>
							<Trash2 className="w-3 h-3 mr-1" />
							Odstrániť
						</Button>
						<Button
							onClick={() => {
								// Prepnúť na nástroj na výber
								setActiveTool("select");
								window.dispatchEvent(
									new CustomEvent("artstudio:select-text", {
										detail: { textId: activeTextId },
									}),
								);
							}}
							size="sm"
							className="h-8 text-xs"
							variant="outline"
						>
							<MousePointer className="w-3 h-3 mr-1" />
							Vybrať
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
