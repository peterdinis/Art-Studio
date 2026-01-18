"use client";

import React, { useEffect, useState } from "react";
import {
	Paintbrush,
	Eraser,
	PaintBucket,
	Pipette,
	Square,
	Circle,
	Minus,
	MousePointer,
	Undo2,
	Redo2,
	Lasso,
	Wand2,
	Pen,
	Type,
	Hand,
	ZoomIn,
	Stamp,
	Droplet,
	Blend,
	Sparkles,
	RectangleHorizontal,
	Hexagon,
	Spline,
	Trash2,
	Move,
} from "lucide-react";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GradientOptionsPanel } from "../panels/GradientOptionsPanel";

interface ToolConfig {
	id: Tool;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	shortcut: string;
	description: string;
	category: "selection" | "drawing" | "shape" | "utility" | "navigation";
}

const tools: ToolConfig[] = [
	{
		id: "move",
		icon: Move,
		label: "Move Tool",
		shortcut: "V",
		description: "Move selected objects on the canvas. Hold Ctrl/Cmd for multi-select.",
		category: "selection",
	},
	{
		id: "select",
		icon: MousePointer,
		label: "Select Tool",
		shortcut: "S",
		description: "Select and manipulate individual objects on the canvas.",
		category: "selection",
	},
	{
		id: "marquee",
		icon: RectangleHorizontal,
		label: "Rectangular Marquee",
		shortcut: "M",
		description: "Create rectangular selections. Hold Shift for square, Alt for center origin.",
		category: "selection",
	},
	{
		id: "lasso",
		icon: Lasso,
		label: "Lasso Tool",
		shortcut: "L",
		description: "Draw freehand selections. Double-click or press Enter to close.",
		category: "selection",
	},
	{
		id: "magicwand",
		icon: Wand2,
		label: "Magic Wand",
		shortcut: "W",
		description: "Select areas of similar color. Adjust tolerance in options.",
		category: "selection",
	},

	// Drawing Tools
	{
		id: "brush",
		icon: Paintbrush,
		label: "Brush Tool",
		shortcut: "B",
		description: "Paint strokes with customizable brushes. Use [ ] to adjust size.",
		category: "drawing",
	},
	{
		id: "pencil",
		icon: Pen,
		label: "Pencil Tool",
		shortcut: "P",
		description: "Draw hard-edged lines. Ideal for pixel art and precise work.",
		category: "drawing",
	},
	{
		id: "eraser",
		icon: Eraser,
		label: "Eraser Tool",
		shortcut: "E",
		description: "Erase pixels to transparency. Hold Alt to sample background.",
		category: "drawing",
	},
	{
		id: "fill",
		icon: PaintBucket,
		label: "Paint Bucket",
		shortcut: "G",
		description: "Fill areas with foreground color. Adjust tolerance for color matching.",
		category: "drawing",
	},
	{
		id: "gradient",
		icon: Blend,
		label: "Gradient Tool",
		shortcut: "H",
		description: "Create smooth color transitions. Click and drag to define direction.",
		category: "drawing",
	},
	{
		id: "eyedropper",
		icon: Pipette,
		label: "Eyedropper",
		shortcut: "I",
		description: "Sample colors from canvas. Click for primary, Ctrl+click for secondary.",
		category: "drawing",
	},
	{
		id: "clone",
		icon: Stamp,
		label: "Clone Stamp",
		shortcut: "C",
		description: "Paint with pixels from another area. Alt+click to set source.",
		category: "drawing",
	},
	{
		id: "healing",
		icon: Droplet,
		label: "Healing Brush",
		shortcut: "J",
		description: "Remove imperfections by blending with surrounding pixels.",
		category: "drawing",
	},
	{
		id: "blur",
		icon: Sparkles,
		label: "Blur Tool",
		shortcut: "R",
		description: "Soften edges and reduce detail for depth of field effects.",
		category: "drawing",
	},

	// Shape Tools
	{
		id: "rectangle",
		icon: Square,
		label: "Rectangle Tool",
		shortcut: "U",
		description: "Draw rectangles and squares. Hold Shift for perfect squares.",
		category: "shape",
	},
	{
		id: "ellipse",
		icon: Circle,
		label: "Ellipse Tool",
		shortcut: "U",
		description: "Draw ellipses and circles. Hold Shift for perfect circles.",
		category: "shape",
	},
	{
		id: "polygon",
		icon: Hexagon,
		label: "Polygon Tool",
		shortcut: "U",
		description: "Create multi-sided shapes. Set sides count in options.",
		category: "shape",
	},
	{
		id: "line",
		icon: Minus,
		label: "Line Tool",
		shortcut: "U",
		description: "Draw straight lines. Hold Shift for 45° angles.",
		category: "shape",
	},
	{
		id: "pen",
		icon: Spline,
		label: "Pen Tool",
		shortcut: "Q",
		description: "Create precise paths with anchor points for complex shapes.",
		category: "shape",
	},
	{
		id: "text",
		icon: Type,
		label: "Text Tool",
		shortcut: "T",
		description: "Add and edit text layers. Click for point text, drag for area text.",
		category: "shape",
	},

	// Navigation Tools
	{
		id: "hand",
		icon: Hand,
		label: "Hand Tool",
		shortcut: "H",
		description: "Pan around canvas. Hold Space with any tool for quick access.",
		category: "navigation",
	},
	{
		id: "zoom",
		icon: ZoomIn,
		label: "Zoom Tool",
		shortcut: "Z",
		description: "Zoom in and out of canvas. Alt+click to zoom out.",
		category: "navigation",
	},
];

export const ToolSidebar: React.FC = () => {
	const {
		activeTool,
		setActiveTool,
		canUndo,
		canRedo,
		undo,
		redo,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
		swapColors,
		setShowColorsPanel,
	} = useArtStudioStore();

	const [showClearAlert, setShowClearAlert] = useState(false);
	const [canvasAvailable, setCanvasAvailable] = useState(true); // Predvolená hodnota true

	// Funkcia na kontrolu dostupnosti canvasu - oveľa jednoduchšia
	useEffect(() => {
		// Jednoduchá funkcia na kontrolu canvasu
		const checkCanvas = () => {
			// Skontrolujeme, či existuje nejaký canvas element v DOM
			const canvasElement = document.querySelector('canvas');
			setCanvasAvailable(!!canvasElement);
		};

		// Okamžite skontrolovať
		checkCanvas();

		// Pridať event listener na zmenu DOM
		const observer = new MutationObserver(checkCanvas);
		observer.observe(document.body, { childList: true, subtree: true });

		// Pridať event listener na zmenu veľkosti okna (môže spôsobiť re-render canvasu)
		window.addEventListener('resize', checkCanvas);

		// Interval pre periodickú kontrolu (pre istotu)
		const interval = setInterval(checkCanvas, 3000);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', checkCanvas);
			clearInterval(interval);
		};
	}, []);

	// Funkcia pre undo s bezpečnou kontrolou
	const handleUndo = async () => {
		if (!canUndo()) return;
		
		try {
			const entry = await undo();
			if (entry && entry.canvasData) {
				// Odoslať event do canvas komponentu
				window.dispatchEvent(
					new CustomEvent("artstudio:undo", {
						detail: {
							canvasData: entry.canvasData,
							timestamp: entry.timestamp,
						},
					}),
				);
			}
		} catch (error) {
			console.error("Error during undo:", error);
		}
	};

	// Funkcia pre redo s bezpečnou kontrolou
	const handleRedo = async () => {
		if (!canRedo()) return;
		
		try {
			const entry = await redo();
			if (entry && entry.canvasData) {
				// Odoslať event do canvas komponentu
				window.dispatchEvent(
					new CustomEvent("artstudio:redo", {
						detail: {
							canvasData: entry.canvasData,
							timestamp: entry.timestamp,
						},
					}),
				);
			}
		} catch (error) {
			console.error("Error during redo:", error);
		}
	};

	// Funkcia pre vymazanie plátna
	const handleClearCanvas = () => {
		if (!canvasAvailable) {
			console.warn("Canvas not available");
			return;
		}

		// Odoslať custom event pre vymazanie plátna
		window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
		
		// Pridať do histórie
		try {
			useArtStudioStore.getState().addToHistory(
				JSON.stringify({ objects: [] }),
				"",
				"clear_canvas"
			);
		} catch (error) {
			console.error("Error adding to history:", error);
		}
		
		setShowClearAlert(false);
	};

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Preskočiť, ak používateľ píše do vstupného poľa
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement).isContentEditable
			)
				return;

			const key = e.key.toUpperCase();

			// Spracovať Ctrl/Cmd skratky
			if (e.ctrlKey || e.metaKey) {
				switch (key) {
					case "Z":
						e.preventDefault();
						e.stopPropagation();
						if (e.shiftKey) {
							handleRedo();
						} else {
							handleUndo();
						}
						return;
					case "Y":
						e.preventDefault();
						e.stopPropagation();
						handleRedo();
						return;
					case "D":
						e.preventDefault();
						e.stopPropagation();
						if (e.shiftKey) {
							setShowClearAlert(true);
						}
						return;
				}
				return;
			}

			// Preskočiť, ak je stlačená klávesa Alt
			if (e.altKey) return;

			// Nájsť nástroj podľa skratky
			const tool = tools.find((t) => {
				// Špeciálne prípady pre nástroje zdieľajúce skratky
				if (t.shortcut.toUpperCase() === "U") {
					// Pre klávesu U cyklujeme cez tvarové nástroje
					const shapeTools = ["rectangle", "ellipse", "polygon", "line"];
					if (shapeTools.includes(activeTool) && key === "U") {
						const currentIndex = shapeTools.indexOf(activeTool);
						const nextIndex = (currentIndex + 1) % shapeTools.length;
						return t.id === shapeTools[nextIndex];
					}
					// Ak nie sme v tvarových nástrojoch, prepni na rectangle
					if (!shapeTools.includes(activeTool) && key === "U") {
						return t.id === "rectangle";
					}
				}
				
				// Kontrola priamej zhody
				return t.shortcut.toUpperCase() === key;
			});

			if (tool) {
				e.preventDefault();
				e.stopPropagation();
				setActiveTool(tool.id);
				console.log(`Prepnuté na nástroj: ${tool.label}`);
			}

			// Ďalšie skratky pre farby
			if (key === "X") {
				e.preventDefault();
				swapColors();
			}

			if (key === "D") {
				e.preventDefault();
				const store = useArtStudioStore.getState();
				store.setPrimaryColor("#ffffff");
				store.setSecondaryColor("#000000");
			}

			// Klávesa Space pre hand tool (dočasná aktivácia)
			if (key === " " && !e.shiftKey) {
				e.preventDefault();
				const store = useArtStudioStore.getState();
				if (store.activeTool !== "hand") {
					// Uložiť aktuálny nástroj a dočasne prepnúť na hand
					window.dispatchEvent(
						new CustomEvent("artstudio:temp-tool-change", {
							detail: { tool: "hand", originalTool: store.activeTool },
						}),
					);
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			// Klávesa Space - vrátiť sa k pôvodnému nástroju
			if (e.key === " ") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:temp-tool-reset"));
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [setActiveTool, activeTool, swapColors]);

	// Funkcia pre vykreslenie skupiny nástrojov
	const renderToolGroup = (category: ToolConfig["category"]) => {
		const categoryTools = tools.filter((t) => t.category === category);

		return (
			<>
				{categoryTools.map((tool) => (
					<Tooltip key={tool.id} delayDuration={400}>
						<TooltipTrigger asChild>
							<button
								onClick={() => {
									console.log(`Tool clicked: ${tool.id}`);
									setActiveTool(tool.id);
								}}
								className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
								title={`${tool.label} (${tool.shortcut})`}
							>
								<tool.icon className="w-5 h-5" />
							</button>
						</TooltipTrigger>
						<TooltipContent
							side="right"
							className="max-w-70 p-3"
							sideOffset={8}
						>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between gap-4">
									<span className="font-semibold">{tool.label}</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
										{tool.shortcut}
									</kbd>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed">
									{tool.description}
								</p>
								{!canvasAvailable && (
									<p className="text-xs text-yellow-600 mt-1">
										Canvas sa načítava...
									</p>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				))}
			</>
		);
	};

	const shouldShowGradientOptions = activeTool === "gradient";

	return (
		<div className="flex h-full">
			{/* Ľavý sidebar s nástrojmi */}
			<div className="w-14 h-full panel-glass flex flex-col items-center py-3 gap-1 animate-fade-in overflow-y-auto scrollbar-thin">
				{/* Selection Tools */}
				<div className="flex flex-col items-center gap-1">
					{renderToolGroup("selection")}
				</div>

				<Separator className="my-1.5 w-8" />

				{/* Drawing Tools */}
				<div className="flex flex-col items-center gap-1">
					{renderToolGroup("drawing")}
				</div>

				<Separator className="my-1.5 w-8" />

				{/* Shape Tools */}
				<div className="flex flex-col items-center gap-1">
					{renderToolGroup("shape")}
				</div>

				<Separator className="my-1.5 w-8" />

				{/* Navigation Tools */}
				<div className="flex flex-col items-center gap-1">
					{renderToolGroup("navigation")}
				</div>

				<Separator className="my-1.5 w-8" />

				{/* Undo/Redo */}
				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<button
							onClick={handleUndo}
							disabled={!canUndo()}
							className="tool-button disabled:opacity-30 disabled:cursor-not-allowed"
							title="Undo (Ctrl+Z)"
						>
							<Undo2 className="w-5 h-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right" className="max-w-70 p-3" sideOffset={8}>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between gap-4">
								<span className="font-semibold">Undo</span>
								<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
									Ctrl+Z
								</kbd>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Vrátiť späť poslednú akciu.
							</p>
						</div>
					</TooltipContent>
				</Tooltip>

				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<button
							onClick={handleRedo}
							disabled={!canRedo()}
							className="tool-button disabled:opacity-30 disabled:cursor-not-allowed"
							title="Redo (Ctrl+Y)"
						>
							<Redo2 className="w-5 h-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right" className="max-w-70 p-3" sideOffset={8}>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between gap-4">
								<span className="font-semibold">Redo</span>
								<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
									Ctrl+Y
								</kbd>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Znovu aplikovať predtým vrátenú akciu.
							</p>
						</div>
					</TooltipContent>
				</Tooltip>

				{/* Clear Canvas Button */}
				<Separator className="my-1.5 w-8" />

				<AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
					<Tooltip delayDuration={400}>
						<TooltipTrigger asChild>
							<AlertDialogTrigger asChild>
								<button 
									className="tool-button text-red-500 hover:text-red-600 hover:bg-red-50"
								>
									<Trash2 className="w-5 h-5" />
								</button>
							</AlertDialogTrigger>
						</TooltipTrigger>
						<TooltipContent
							side="right"
							className="max-w-70 p-3"
							sideOffset={8}
						>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between gap-4">
									<span className="font-semibold">Vymazať plátno</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
										Ctrl+Shift+D
									</kbd>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Odstráni všetky kresby, tvary a obrázky z plátna.
								</p>
							</div>
						</TooltipContent>
					</Tooltip>

					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle className="text-red-600">
								Vymazať plátno
							</AlertDialogTitle>
							<AlertDialogDescription>
								Ste si istí, že chcete vymazať celé plátno? Táto akcia odstráni všetky kresby, tvary a obrázky. Túto akciu nie je možné vrátiť späť.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Zrušiť</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleClearCanvas}
								className="bg-red-600 hover:bg-red-700 text-white"
							>
								Vymazať plátno
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Foreground/Background Color */}
				<div className="mt-auto pt-2">
					<Tooltip delayDuration={400}>
						<TooltipTrigger asChild>
							<div className="relative w-10 h-10">
								{/* Primary Color - Clickable */}
								<button
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
									className="absolute top-0 left-0 w-6 h-6 rounded border-2 border-card bg-foreground z-10 cursor-pointer hover:scale-110 transition-transform"
									style={{ backgroundColor: primaryColor }}
									title="Primárna farba - Kliknite pre zmenu"
								/>
								{/* Secondary Color - Clickable */}
								<button
									onClick={() => {
										const input = document.createElement("input");
										input.type = "color";
										input.value = secondaryColor;
										input.onchange = (e) => {
											const color = (e.target as HTMLInputElement).value;
											setSecondaryColor(color);
										};
										input.click();
									}}
									className="absolute bottom-0 right-0 w-6 h-6 rounded border-2 border-card cursor-pointer hover:scale-110 transition-transform"
									style={{ backgroundColor: secondaryColor }}
									title="Sekundárna farba - Kliknite pre zmenu"
								/>
								{/* Swap button overlay */}
								<button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										swapColors();
									}}
									className="absolute inset-0 z-20 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-black/10 rounded"
									title="Kliknite pre výmenu farieb"
								/>
							</div>
						</TooltipTrigger>
						<TooltipContent
							side="right"
							className="max-w-70 p-3"
							sideOffset={8}
						>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between gap-4">
									<span className="font-semibold">Farby</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
										X
									</kbd>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Kliknite na farby pre zmenu. Kliknite medzi nimi pre výmenu, alebo stlačte X pre výmenu, D pre reset na predvolené.
								</p>
								<button
									onClick={() => setShowColorsPanel(true)}
									className="text-xs text-primary hover:underline mt-2"
								>
									Otvoriť panel farieb →
								</button>
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Gradient options panel when gradient tool is active */}
			{shouldShowGradientOptions && (
				<div className="w-64 border-l border-border/50">
					<GradientOptionsPanel />
				</div>
			)}
		</div>
	);
};