"use client";

import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { tools } from "./tools"; // Importuj svoje nástroje
import { Redo2, Trash2, Undo2 } from "lucide-react";
import { Kbd } from "../ui/kbd";

export interface ToolConfig {
	id: Tool;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	shortcut: string;
	description: string;
	category: "selection" | "drawing" | "shape" | "utility" | "navigation";
}

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
		clearCanvas,
		clearCanvasWithConfirmation,
	} = useArtStudioStore();

	const [showClearAlert, setShowClearAlert] = useState(false);
	const [canvasAvailable, setCanvasAvailable] = useState(true);

	useEffect(() => {
		const checkCanvas = () => {
			const canvasElement = document.querySelector("canvas");
			setCanvasAvailable(!!canvasElement);
		};

		checkCanvas();
		const observer = new MutationObserver(checkCanvas);
		observer.observe(document.body, { childList: true, subtree: true });
		window.addEventListener("resize", checkCanvas);
		const interval = setInterval(checkCanvas, 3000);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", checkCanvas);
			clearInterval(interval);
		};
	}, []);

	const handleUndo = async () => {
		if (!canUndo()) return;
		try {
			const entry = await undo();
			if (entry?.canvasData) {
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

	const handleRedo = async () => {
		if (!canRedo()) return;
		try {
			const entry = await redo();
			if (entry?.canvasData) {
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

	const handleClearCanvas = async (preserveBackground: boolean = false) => {
		if (!canvasAvailable) {
			toast.error("Canvas not available");
			return;
		}

		try {
			await clearCanvas({ preserveBackground });
			setShowClearAlert(false);
		} catch (error) {
			console.error("Error clearing canvas:", error);
			toast.error("Failed to clear canvas");
		}
	};

	const handleClearWithConfirmation = async () => {
		const confirmed = await clearCanvasWithConfirmation();
		if (confirmed) {
			toast.success("Canvas cleared");
		}
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement).isContentEditable
			)
				return;

			const key = e.key.toUpperCase();

			if (e.ctrlKey || e.metaKey) {
				switch (key) {
					case "Z":
						e.preventDefault();
						if (e.shiftKey) handleRedo();
						else handleUndo();
						return;
					case "Y":
						e.preventDefault();
						handleRedo();
						return;
					case "D":
						e.preventDefault();
						if (e.shiftKey) {
							handleClearWithConfirmation();
						}
						return;
				}
				return;
			}

			if (e.altKey) return;

			if (key === "O") {
				e.preventDefault();
				setActiveTool(e.shiftKey ? "burn" : "dodge");
				return;
			}

			const tool = tools.find((t) => {
				if (t.shortcut.toUpperCase() === "U" && key === "U") {
					const shapeTools = ["rectangle", "ellipse", "polygon", "line"];
					if (shapeTools.includes(activeTool)) {
						const currentIndex = shapeTools.indexOf(activeTool);
						const nextIndex = (currentIndex + 1) % shapeTools.length;
						return t.id === shapeTools[nextIndex];
					}
					return t.id === "rectangle";
				}

				if (t.shortcut.toUpperCase() === "SHIFT+O") return false;

				return t.shortcut.toUpperCase() === key;
			});

			if (tool) {
				e.preventDefault();
				setActiveTool(tool.id);
				console.log(`Switched to: ${tool.label}`);
			}

			if (key === "X") {
				e.preventDefault();
				swapColors();
			}

			if (key === "D") {
				e.preventDefault();
				useArtStudioStore.getState().setPrimaryColor("#ffffff");
				useArtStudioStore.getState().setSecondaryColor("#000000");
			}

			if (key === " " && !e.shiftKey) {
				e.preventDefault();
				const store = useArtStudioStore.getState();
				if (store.activeTool !== "hand") {
					window.dispatchEvent(
						new CustomEvent("artstudio:temp-tool-change", {
							detail: { tool: "hand", originalTool: store.activeTool },
						}),
					);
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
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
	}, [setActiveTool, activeTool, swapColors, handleClearWithConfirmation]);

	const renderToolGroup = (category: ToolConfig["category"]) => {
		const categoryTools = tools.filter((t) => t.category === category);

		return (
			<>
				{categoryTools.map((tool) => (
					<Tooltip key={tool.id} delayDuration={400}>
						<TooltipTrigger asChild>
							<button
								onClick={() => setActiveTool(tool.id)}
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
									<Kbd className="px-1.5 py-0.5 text-xs bg-slate-100 text-black rounded font-mono">
										{tool.shortcut}
									</Kbd>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed">
									{tool.description}
								</p>
							</div>
						</TooltipContent>
					</Tooltip>
				))}
			</>
		);
	};

	return (
		<div className="flex h-full">
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
								<Kbd className="px-1.5 py-0.5 text-xs bg-slate-100 text-black rounded font-mono">
									Ctrl+Z
								</Kbd>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Revert the last action.
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
								<Kbd className="px-1.5 py-0.5 text-xs bg-slate-100 text-black rounded font-mono">
									Ctrl+Y
								</Kbd>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Re-apply previously reverted action.
							</p>
						</div>
					</TooltipContent>
				</Tooltip>

				{/* Clear Canvas */}
				<Separator className="my-1.5 w-8" />
				<AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
					<Tooltip delayDuration={400}>
						<TooltipTrigger asChild>
							<AlertDialogTrigger asChild>
								<button
									className="tool-button text-red-500 hover:text-red-600 hover:bg-red-50"
									onClick={handleClearWithConfirmation}
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
									<span className="font-semibold">Clear Canvas</span>
									<Kbd className="px-1.5 py-0.5 text-xs bg-slate-100 text-black rounded font-mono">
										Ctrl+Shift+D
									</Kbd>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Remove all drawings, shapes and images from the canvas.
								</p>
								<div className="flex flex-col gap-2 mt-2">
									<button
										onClick={() => handleClearCanvas(false)}
										className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
									>
										Clear Everything
									</button>
									<button
										onClick={() => handleClearCanvas(true)}
										className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
									>
										Clear Drawings Only (Preserve Background)
									</button>
								</div>
							</div>
						</TooltipContent>
					</Tooltip>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle className="text-red-600">
								Clear Canvas
							</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to clear the entire canvas? This action
								will remove all drawings, shapes and images.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handleClearCanvas(false)}
								className="bg-red-600 hover:bg-red-700 text-white"
							>
								Clear Everything
							</AlertDialogAction>
							<AlertDialogAction
								onClick={() => handleClearCanvas(true)}
								className="bg-blue-600 hover:bg-blue-700 text-white"
							>
								Preserve Background
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Colors */}
				<div className="mt-auto pt-2">
					<Tooltip delayDuration={400}>
						<TooltipTrigger asChild>
							<div className="relative w-10 h-10">
								<button
									onClick={() => {
										const input = document.createElement("input");
										input.type = "color";
										input.value = primaryColor;
										input.onchange = (e) => {
											const color = (e.target as HTMLInputElement).value;
											setPrimaryColor(color);
											useArtStudioStore.getState().addRecentColor(color);
										};
										input.click();
									}}
									className="absolute top-0 left-0 w-6 h-6 rounded border-2 border-card bg-foreground z-10 cursor-pointer hover:scale-110 transition-transform"
									style={{ backgroundColor: primaryColor }}
									title="Primary Color"
								/>
								<button
									onClick={() => {
										const input = document.createElement("input");
										input.type = "color";
										input.value = secondaryColor;
										input.onchange = (e) => {
											const color = (e.target as HTMLInputElement).value;
											setSecondaryColor(color);
											useArtStudioStore.getState().addRecentColor(color);
										};
										input.click();
									}}
									className="absolute bottom-0 right-0 w-6 h-6 rounded border-2 border-card cursor-pointer hover:scale-110 transition-transform"
									style={{ backgroundColor: secondaryColor }}
									title="Secondary Color"
								/>
								<button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										swapColors();
										// Pridaj obe farby do recent colors
										const store = useArtStudioStore.getState();
										store.addRecentColor(primaryColor);
										store.addRecentColor(secondaryColor);
									}}
									className="absolute inset-0 z-20 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-black/10 rounded"
									title="Swap Colors"
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
									<span className="font-semibold">Colors</span>
									<Kbd className="px-1.5 py-0.5 text-xs bg-slate-100 text-black rounded font-mono">
										X
									</Kbd>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Click on colors to change, X to swap, D to reset.
								</p>
								<button
									onClick={() => setShowColorsPanel(true)}
									className="text-xs text-primary hover:underline mt-2"
								>
									Open Colors Panel →
								</button>
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
};
