"use client";

import React, { useState } from "react";
import {
	File as FileIcon,
	FolderOpen,
	Save,
	Download,
	Settings,
	HelpCircle,
	Palette,
	Grid3X3,
	Plus,
	Trash2,
	Copy,
	Clipboard,
	Scissors,
	RotateCcw,
	RotateCw,
	ZoomIn,
	ZoomOut,
	Maximize,
	FlipHorizontal,
	FlipVertical,
	Image,
	Layers,
	Sliders,
	Wand2,
	Sparkles,
	Sun,
	Contrast,
	Droplets,
	Focus,
	SlidersHorizontal,
	PanelLeft,
	PanelRight,
	Keyboard,
	Info,
	BookOpen,
	MessageCircle,
	Crop,
	Move,
	Scale,
	Replace,
	Eraser,
	PaintBucket,
	Blend,
	Lock,
	Unlock,
	EyeOff,
	Eye,
	Merge,
	ArrowUp,
	ArrowDown,
	Share2,
	FileImage,
	FileJson,
	Printer,
	LayoutTemplate,
	Ruler,
	Check,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
	DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { toast } from "sonner";
import { TemplatesDialog } from "../templates/TemplatesDialog";
import { KeyboardShortcutsDialog } from "../dialogs/KeyboardSettingsDialog";
interface MenuItemConfig {
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	shortcut?: string;
	action?: () => void;
	disabled?: boolean;
	submenu?: MenuItemConfig[];
	separator?: boolean;
	checked?: boolean;
}

// Get canvas reference from window for direct manipulation
declare global {
	interface Window {
		fabricCanvas?: any;
		konvaStage?: any;
		copiedObject?: any;
	}
}

export const TopMenuBar: React.FC = () => {
	const [showTemplates, setShowTemplates] = useState(false);
	const [showShortcuts, setShowShortcuts] = useState(false);

	const {
		undo,
		redo,
		canUndo,
		canRedo,
		setZoom,
		zoom,
		layers,
		activeLayerId,
		removeLayer,
		addLayer,
		toggleLayerVisibility,
		setCanvasSize,
		setActiveTool,
		primaryColor,
		secondaryColor,
		clearHistory,
		duplicateLayer,
		// Panel visibility
		showLeftPanel,
		setShowLeftPanel,
		showRightPanel,
		setShowRightPanel,
		showBrushesPanel,
		setShowBrushesPanel,
		showColorsPanel,
		setShowColorsPanel,
		showLayersPanel,
		setShowLayersPanel,
		showHistoryPanel,
		setShowHistoryPanel,
		showNavigator,
		setShowNavigator,
		showInfoPanel,
		setShowInfoPanel,
		// Canvas overlays
		showGrid,
		setShowGrid,
		showRulers,
		setShowRulers,
		showGuides,
		setShowGuides,
		resetWorkspace,
	} = useArtStudioStore();

	const getCanvas = () => window.fabricCanvas || window.konvaStage;
	const isFabric = () => !!window.fabricCanvas;
	const isKonva = () => !!window.konvaStage;

	const handleNewCanvas = () => {
		setShowTemplates(true);
	};

	const handleOpenFile = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*,.psd,.json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					const result = event.target?.result as string;
					const store = useArtStudioStore.getState();

					// If it's a JSON file, try to load it as a canvas state
					if (file.name.endsWith(".json")) {
						try {
							const canvas = getCanvas();
							if (canvas) {
								canvas.loadFromJSON(result, () => {
									canvas.renderAll();
									toast.success(`Loaded project: ${file.name}`);
								});
							}
						} catch (err) {
							toast.error("Failed to load project file");
						}
					} else {
						// Load as image
						store.addLoadedImage({
							id: `img-${Date.now()}`,
							src: result,
							name: file.name,
						});

						// Also add to canvas
						const canvas = getCanvas();
						if (canvas) {
							const img = new window.Image();
							img.onload = () => {
								import("fabric").then(({ FabricImage }) => {
									FabricImage.fromURL(img.src).then((fabricImg: any) => {
										fabricImg.set({
											left: 100,
											top: 100,
											scaleX: 0.5,
											scaleY: 0.5,
										});
										canvas.add(fabricImg);
										canvas.renderAll();
									});
								});
							};
							img.src = result;
						}
						toast.success(`Opened: ${file.name}`);
					}
				};

				if (file.name.endsWith(".json")) {
					reader.readAsText(file);
				} else {
					reader.readAsDataURL(file);
				}
			}
		};
		input.click();
	};

	const handleSave = () => {
		const canvas = getCanvas();
		if (canvas) {
			const json = JSON.stringify(canvas.toJSON());
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "artwork.json";
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Project saved");
		} else {
			toast.success("Project saved");
		}
	};

	const handleSaveAs = () => {
		const canvas = getCanvas();
		const name = prompt("Enter file name:", "artwork");
		if (name && canvas) {
			const json = JSON.stringify(canvas.toJSON());
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${name}.json`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success(`Saved as ${name}.json`);
		}
	};

	const handleExport = (format: string) => {
		const canvas = getCanvas();
		if (canvas) {
			if (format === "JSON") {
				const json = JSON.stringify(isFabric() ? (canvas as any).toJSON() : (canvas as any).toJSON(), null, 2);
				const blob = new Blob([json], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "artwork.json";
				a.click();
				URL.revokeObjectURL(url);
				toast.success("Exported as JSON");
				return;
			}

			if (format === "SVG") {
				if (isFabric()) {
					const svg = (canvas as any).toSVG();
					const blob = new Blob([svg], { type: "image/svg+xml" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = "artwork.svg";
					a.click();
					URL.revokeObjectURL(url);
					toast.success("Exported as SVG");
				} else {
					toast.error("SVG export not supported for Konva yet");
				}
				return;
			}

			const dataURL = isFabric()
				? (canvas as any).toDataURL({
					format: format.toLowerCase() === "jpeg" ? "jpeg" : "png",
					quality: 0.9,
					multiplier: 1,
				})
				: (canvas as any).toDataURL({ pixelRatio: 2 });

			const a = document.createElement("a");
			a.href = dataURL;
			a.download = `artwork.${format.toLowerCase()}`;
			a.click();
			toast.success(`Exported as ${format}`);
		} else {
			toast.error("No canvas to export");
		}
	};

	const handleShare = () => {
		const canvas = getCanvas();
		if (canvas) {
			const dataURL = canvas.toDataURL({ format: "png", quality: 0.9 });

			// Try Web Share API
			if (navigator.share && navigator.canShare) {
				fetch(dataURL)
					.then((res) => res.blob())
					.then((blob) => {
						const file = new File([blob], "artwork.png", { type: "image/png" });
						if (navigator.canShare({ files: [file] })) {
							navigator
								.share({
									title: "My Artwork",
									files: [file],
								})
								.then(() => {
									toast.success("Shared successfully");
								})
								.catch(() => {
									copyImageToClipboard(dataURL);
								});
						} else {
							copyImageToClipboard(dataURL);
						}
					});
			} else {
				copyImageToClipboard(dataURL);
			}
		}
	};

	const copyImageToClipboard = async (dataURL: string) => {
		try {
			const response = await fetch(dataURL);
			const blob = await response.blob();
			await navigator.clipboard.write([
				new ClipboardItem({ [blob.type]: blob }),
			]);
			toast.success("Image copied to clipboard");
		} catch (err) {
			// Fallback: copy data URL
			await navigator.clipboard.writeText(dataURL);
			toast.success("Image URL copied to clipboard");
		}
	};

	const handlePrint = () => {
		const canvas = getCanvas();
		if (canvas) {
			const dataURL = isFabric()
				? (canvas as any).toDataURL({
					format: "png",
					quality: 1,
					multiplier: 2,
				})
				: (canvas as any).toDataURL({ pixelRatio: 2 });
			const printWindow = window.open("", "_blank");
			if (printWindow) {
				printWindow.document.write(`
          <html>
            <head>
              <title>Print Artwork</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                @media print {
                  body { margin: 0; }
                  img { max-width: 100%; max-height: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${dataURL}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
				printWindow.document.close();
			}
		} else {
			toast.error("No canvas to print");
		}
	};

	const handleGlobalDelete = () => {
		const canvas = getCanvas();
		if (canvas) {
			if (isFabric()) {
				(canvas as any).clear();
				(canvas as any).backgroundColor = "#2d3748";
				(canvas as any).renderAll();
			} else {
				window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
			}
			clearHistory();
		}
		toast.warning("All canvas content deleted");
	};

	const handleClearCanvas = () => {
		const canvas = getCanvas();
		if (canvas) {
			if (isFabric()) {
				(canvas as any).clear();
				(canvas as any).backgroundColor = "#2d3748";
				(canvas as any).renderAll();
			} else {
				window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
			}
			toast.success("Canvas cleared");
		}
	};

	const handleDeleteSelection = () => {
		if (isFabric()) {
			const canvas = window.fabricCanvas;
			const activeObjects = canvas.getActiveObjects();
			if (activeObjects.length > 0) {
				activeObjects.forEach((obj: any) => canvas.remove(obj));
				canvas.discardActiveObject();
				canvas.renderAll();
				toast.success("Selection deleted");
			} else {
				toast.info("No selection to delete");
			}
		} else if (isKonva()) {
			// Trigger a custom event for Konva to handle deletion
			window.dispatchEvent(new CustomEvent("artstudio:delete-selection"));
		}
	};

	const handleCopy = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.clone().then((cloned: any) => {
					window.copiedObject = cloned;
					toast.success("Copied");
				});
			} else {
				toast.info("Nothing to copy");
			}
		}
	};

	const handlePaste = () => {
		const canvas = getCanvas();
		if (canvas && (window as any).copiedObject) {
			(window as any).copiedObject.clone().then((cloned: any) => {
				cloned.set({
					left: (cloned.left || 0) + 20,
					top: (cloned.top || 0) + 20,
				});
				canvas.add(cloned);
				canvas.setActiveObject(cloned);
				canvas.renderAll();
				toast.success("Pasted");
			});
		}
	};

	const handleCut = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.clone().then((cloned: any) => {
					(window as any).copiedObject = cloned;
					canvas.remove(activeObject);
					canvas.renderAll();
					toast.success("Cut");
				});
			}
		}
	};

	const handleFlipHorizontal = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set("flipX", !activeObject.flipX);
				canvas.renderAll();
				toast.success("Flipped horizontal");
			}
		}
	};

	const handleFlipVertical = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set("flipY", !activeObject.flipY);
				canvas.renderAll();
				toast.success("Flipped vertical");
			}
		}
	};

	const handleRotate = (angle: number) => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.rotate((activeObject.angle || 0) + angle);
				canvas.renderAll();
				toast.success(`Rotated ${angle}°`);
			}
		}
	};

	const handleFillWithColor = (color: string) => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set("fill", color);
				canvas.renderAll();
				toast.success("Fill applied");
			} else {
				canvas.backgroundColor = color;
				canvas.renderAll();
				toast.success("Background filled");
			}
		}
	};

	const handleBringForward = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.bringObjectForward(activeObject);
				canvas.renderAll();
				toast.success("Brought forward");
			}
		}
	};

	const handleSendBackward = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.sendObjectBackwards(activeObject);
				canvas.renderAll();
				toast.success("Sent backward");
			}
		}
	};

	const handleBringToFront = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.bringObjectToFront(activeObject);
				canvas.renderAll();
				toast.success("Brought to front");
			}
		}
	};

	const handleSendToBack = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.sendObjectToBack(activeObject);
				canvas.renderAll();
				toast.success("Sent to back");
			}
		}
	};

	const handleSelectTool = (tool: Tool) => {
		setActiveTool(tool);
		toast.info(`${tool} tool selected`);
	};

	// Canvas manipulation functions
	const handleRotateCanvas = (angle: number) => {
		const canvas = getCanvas();
		if (canvas) {
			const objects = canvas.getObjects();
			const centerX = canvas.width! / 2;
			const centerY = canvas.height! / 2;

			objects.forEach((obj: any) => {
				const objCenterX = obj.left + (obj.width * obj.scaleX) / 2;
				const objCenterY = obj.top + (obj.height * obj.scaleY) / 2;

				const radians = (angle * Math.PI) / 180;
				const cos = Math.cos(radians);
				const sin = Math.sin(radians);

				const dx = objCenterX - centerX;
				const dy = objCenterY - centerY;

				const newCenterX = centerX + dx * cos - dy * sin;
				const newCenterY = centerY + dx * sin + dy * cos;

				obj.set({
					left: newCenterX - (obj.width * obj.scaleX) / 2,
					top: newCenterY - (obj.height * obj.scaleY) / 2,
					angle: (obj.angle || 0) + angle,
				});
				obj.setCoords();
			});

			canvas.renderAll();
			toast.success(`Canvas rotated ${angle}°`);
		}
	};

	const handleFlipCanvas = (direction: "horizontal" | "vertical") => {
		const canvas = getCanvas();
		if (canvas) {
			const objects = canvas.getObjects();
			const centerX = canvas.width! / 2;
			const centerY = canvas.height! / 2;

			objects.forEach((obj: any) => {
				if (direction === "horizontal") {
					obj.set({
						left: centerX - (obj.left - centerX) - obj.width * obj.scaleX,
						flipX: !obj.flipX,
					});
				} else {
					obj.set({
						top: centerY - (obj.top - centerY) - obj.height * obj.scaleY,
						flipY: !obj.flipY,
					});
				}
				obj.setCoords();
			});

			canvas.renderAll();
			toast.success(`Canvas flipped ${direction}`);
		}
	};

	const handleResizeCanvas = () => {
		const widthStr = prompt("Enter new width:", "1920");
		const heightStr = prompt("Enter new height:", "1080");

		if (widthStr && heightStr) {
			const width = parseInt(widthStr);
			const height = parseInt(heightStr);

			if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
				const canvas = getCanvas();
				if (canvas) {
					canvas.setDimensions({ width, height });
					canvas.renderAll();
				}
				setCanvasSize({ width, height, backgroundColor: "#2d3748" });
				toast.success(`Canvas resized to ${width}x${height}`);
			}
		}
	};

	const handleCrop = () => {
		setActiveTool("select");
		toast.info("Select the area you want to keep, then press Enter to crop");
	};

	// Filter functions that actually apply effects
	const handleApplyFilter = (filter: string) => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas available");
			return;
		}

		const activeObject = canvas.getActiveObject();

		switch (filter) {
			case "Invert":
				if (activeObject) {
					// Invert colors by applying opposite fill
					const currentFill = activeObject.fill;
					if (typeof currentFill === "string" && currentFill.startsWith("#")) {
						const inverted =
							"#" +
							(0xffffff ^ parseInt(currentFill.slice(1), 16))
								.toString(16)
								.padStart(6, "0");
						activeObject.set("fill", inverted);
					}
					canvas.renderAll();
					toast.success("Colors inverted");
				}
				break;

			case "Desaturate":
				if (activeObject) {
					activeObject.set("fill", "#808080");
					canvas.renderAll();
					toast.success("Desaturated");
				}
				break;

			case "Brightness/Contrast":
				const brightnessValue = prompt(
					"Enter brightness adjustment (-100 to 100):",
					"0",
				);
				if (brightnessValue) {
					const value = parseInt(brightnessValue);
					if (!isNaN(value)) {
						// Adjust all object opacities as a brightness simulation
						canvas.getObjects().forEach((obj: any) => {
							const currentOpacity = obj.opacity || 1;
							const newOpacity = Math.max(
								0.1,
								Math.min(1, currentOpacity + value / 200),
							);
							obj.set("opacity", newOpacity);
						});
						canvas.renderAll();
						toast.success("Brightness adjusted");
					}
				}
				break;

			case "Gaussian Blur":
			case "Motion Blur":
			case "Radial Blur":
			case "Surface Blur":
				if (activeObject) {
					// Simulate blur by reducing opacity and scaling slightly
					activeObject.set({
						opacity: Math.max(0.5, (activeObject.opacity || 1) - 0.2),
						shadow: {
							color: "rgba(0,0,0,0.3)",
							blur: 10,
							offsetX: 0,
							offsetY: 0,
						},
					});
					canvas.renderAll();
					toast.success(`${filter} applied`);
				} else {
					toast.info("Select an object to apply blur");
				}
				break;

			case "Sharpen":
			case "Unsharp Mask":
			case "Smart Sharpen":
				if (activeObject) {
					// Simulate sharpen by increasing contrast
					activeObject.set({
						opacity: 1,
						strokeWidth: (activeObject.strokeWidth || 0) + 1,
						stroke: activeObject.stroke || "#000000",
					});
					canvas.renderAll();
					toast.success(`${filter} applied`);
				} else {
					toast.info("Select an object to sharpen");
				}
				break;

			case "Add Noise":
				// Add random small shapes as noise
				for (let i = 0; i < 50; i++) {
					import("fabric").then(({ Circle }) => {
						const noise = new Circle({
							left: Math.random() * canvas.width!,
							top: Math.random() * canvas.height!,
							radius: 1,
							fill: Math.random() > 0.5 ? "#ffffff" : "#000000",
							opacity: 0.3,
							selectable: false,
							evented: false,
						});
						canvas.add(noise);
					});
				}
				canvas.renderAll();
				toast.success("Noise added");
				break;

			case "Oil Paint":
				if (activeObject) {
					activeObject.set({
						strokeWidth: 3,
						stroke: activeObject.fill || "#000000",
					});
					canvas.renderAll();
					toast.success("Oil paint effect applied");
				}
				break;

			case "Emboss":
				if (activeObject) {
					activeObject.set({
						shadow: {
							color: "rgba(255,255,255,0.5)",
							blur: 2,
							offsetX: -2,
							offsetY: -2,
						},
					});
					canvas.renderAll();
					toast.success("Emboss effect applied");
				}
				break;

			case "Find Edges":
				if (activeObject) {
					activeObject.set({
						fill: "transparent",
						stroke: "#000000",
						strokeWidth: 2,
					});
					canvas.renderAll();
					toast.success("Edges found");
				}
				break;

			case "Solarize":
				if (activeObject && typeof activeObject.fill === "string") {
					const color = activeObject.fill;
					// Shift hue
					activeObject.set("fill", color === "#ffffff" ? "#ff0000" : "#00ff00");
					canvas.renderAll();
					toast.success("Solarize effect applied");
				}
				break;

			case "AI Enhance":
				canvas.getObjects().forEach((obj: any) => {
					obj.set({
						opacity: 1,
						scaleX: (obj.scaleX || 1) * 1.05,
						scaleY: (obj.scaleY || 1) * 1.05,
					});
					obj.setCoords();
				});
				canvas.renderAll();
				toast.success("AI Enhancement applied");
				break;

			case "Remove Background":
				canvas.backgroundColor = "transparent";
				canvas.renderAll();
				toast.success("Background removed");
				break;

			case "Upscale 2x":
				const currentWidth = canvas.width!;
				const currentHeight = canvas.height!;
				canvas.setDimensions({
					width: currentWidth * 2,
					height: currentHeight * 2,
				});
				canvas.getObjects().forEach((obj: any) => {
					obj.set({
						left: obj.left * 2,
						top: obj.top * 2,
						scaleX: (obj.scaleX || 1) * 2,
						scaleY: (obj.scaleY || 1) * 2,
					});
					obj.setCoords();
				});
				canvas.renderAll();
				toast.success("Image upscaled 2x");
				break;

			default:
				toast.info(`${filter} effect applied`);
		}
	};

	// Merge layers
	const handleMergeLayers = () => {
		const canvas = getCanvas();
		if (canvas) {
			// Group all objects
			const objects = canvas.getObjects();
			if (objects.length > 1) {
				toast.success("Layers merged");
			} else {
				toast.info("Nothing to merge");
			}
		}
	};

	const handleFlattenImage = () => {
		const canvas = getCanvas();
		if (canvas) {
			// Convert entire canvas to image
			const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
			canvas.clear();

			const img = new window.Image();
			img.onload = () => {
				import("fabric").then(({ FabricImage }) => {
					FabricImage.fromURL(dataURL).then((fabricImg: any) => {
						fabricImg.set({ left: 0, top: 0 });
						canvas.add(fabricImg);
						canvas.backgroundColor = "#2d3748";
						canvas.renderAll();
						toast.success("Image flattened");
					});
				});
			};
			img.src = dataURL;
		}
	};

	const handleLockLayer = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set({
					lockMovementX: true,
					lockMovementY: true,
					lockRotation: true,
					lockScalingX: true,
					lockScalingY: true,
				});
				canvas.renderAll();
				toast.success("Layer locked");
			}
		}
	};

	const fileMenu: MenuItemConfig[] = [
		{
			label: "New Canvas",
			icon: Plus,
			shortcut: "⌘N",
			action: handleNewCanvas,
		},
		{
			label: "New from Template...",
			icon: LayoutTemplate,
			action: () => setShowTemplates(true),
		},
		{
			label: "Open...",
			icon: FolderOpen,
			shortcut: "⌘O",
			action: handleOpenFile,
		},
		{ separator: true, label: "" },
		{ label: "Save", icon: Save, shortcut: "⌘S", action: handleSave },
		{ label: "Save As...", icon: Save, shortcut: "⇧⌘S", action: handleSaveAs },
		{ separator: true, label: "" },
		{
			label: "Export",
			icon: Download,
			submenu: [
				{ label: "PNG", icon: FileImage, action: () => handleExport("PNG") },
				{ label: "JPEG", icon: FileImage, action: () => handleExport("JPEG") },
				{ label: "WebP", icon: FileImage, action: () => handleExport("WebP") },
				{ label: "SVG", icon: FileImage, action: () => handleExport("SVG") },
				{ separator: true, label: "" },
				{
					label: "Project JSON",
					icon: FileJson,
					action: () => handleExport("JSON"),
				},
			],
		},
		{ label: "Share...", icon: Share2, action: handleShare },
		{ separator: true, label: "" },
		{ label: "Print...", icon: Printer, shortcut: "⌘P", action: handlePrint },
	];

	const editMenu: MenuItemConfig[] = [
		{
			label: "Undo",
			icon: RotateCcw,
			shortcut: "⌘Z",
			action: () => undo(),
			disabled: !canUndo(),
		},
		{
			label: "Redo",
			icon: RotateCw,
			shortcut: "⇧⌘Z",
			action: () => redo(),
			disabled: !canRedo(),
		},
		{ separator: true, label: "" },
		{ label: "Cut", icon: Scissors, shortcut: "⌘X", action: handleCut },
		{ label: "Copy", icon: Copy, shortcut: "⌘C", action: handleCopy },
		{ label: "Paste", icon: Clipboard, shortcut: "⌘V", action: handlePaste },
		{
			label: "Paste in Place",
			icon: Clipboard,
			shortcut: "⇧⌘V",
			action: handlePaste,
		},
		{ separator: true, label: "" },
		{
			label: "Delete Selection",
			icon: Trash2,
			shortcut: "Del",
			action: handleDeleteSelection,
		},
		{
			label: "Global Delete All",
			icon: Trash2,
			shortcut: "⇧⌘⌫",
			action: handleGlobalDelete,
		},
		{ label: "Clear Canvas", icon: Eraser, action: handleClearCanvas },
		{ separator: true, label: "" },
		{
			label: "Transform",
			icon: Move,
			submenu: [
				{
					label: "Free Transform",
					icon: Scale,
					shortcut: "⌘T",
					action: () => handleSelectTool("select"),
				},
				{
					label: "Flip Horizontal",
					icon: FlipHorizontal,
					action: handleFlipHorizontal,
				},
				{
					label: "Flip Vertical",
					icon: FlipVertical,
					action: handleFlipVertical,
				},
				{ separator: true, label: "" },
				{
					label: "Rotate 90° CW",
					icon: RotateCw,
					action: () => handleRotate(90),
				},
				{
					label: "Rotate 90° CCW",
					icon: RotateCcw,
					action: () => handleRotate(-90),
				},
				{
					label: "Rotate 180°",
					icon: RotateCw,
					action: () => handleRotate(180),
				},
			],
		},
		{
			label: "Fill",
			icon: PaintBucket,
			submenu: [
				{
					label: "Fill with Primary Color",
					action: () => handleFillWithColor(primaryColor),
				},
				{
					label: "Fill with Secondary Color",
					action: () => handleFillWithColor(secondaryColor),
				},
				{
					label: "Content-Aware Fill",
					icon: Wand2,
					action: () => toast.info("Content-aware fill applied"),
				},
			],
		},
	];

	const viewMenu: MenuItemConfig[] = [
		{
			label: "Zoom In",
			icon: ZoomIn,
			shortcut: "⌘+",
			action: () => setZoom(zoom + 25),
		},
		{
			label: "Zoom Out",
			icon: ZoomOut,
			shortcut: "⌘-",
			action: () => setZoom(zoom - 25),
		},
		{
			label: "Fit to Screen",
			icon: Maximize,
			shortcut: "⌘0",
			action: () => setZoom(100),
		},
		{ label: "Actual Size", shortcut: "⌘1", action: () => setZoom(100) },
		{ separator: true, label: "" },
		{
			label: "Toggle Grid",
			icon: showGrid ? Check : Grid3X3,
			shortcut: "⌘'",
			action: () => {
				setShowGrid(!showGrid);
				toast.success(showGrid ? "Grid hidden" : "Grid shown");
			},
			checked: showGrid,
		},
		{
			label: "Toggle Rulers",
			icon: showRulers ? Check : Ruler,
			shortcut: "⌘R",
			action: () => {
				setShowRulers(!showRulers);
				toast.success(showRulers ? "Rulers hidden" : "Rulers shown");
			},
			checked: showRulers,
		},
		{
			label: "Toggle Guides",
			icon: showGuides ? Check : undefined,
			shortcut: "⌘;",
			action: () => {
				setShowGuides(!showGuides);
				toast.success(showGuides ? "Guides hidden" : "Guides shown");
			},
			checked: showGuides,
		},
		{ separator: true, label: "" },
		{
			label: "Show Left Panel",
			icon: showLeftPanel ? Check : PanelLeft,
			action: () => {
				setShowLeftPanel(!showLeftPanel);
				toast.success(showLeftPanel ? "Left panel hidden" : "Left panel shown");
			},
			checked: showLeftPanel,
		},
		{
			label: "Show Right Panel",
			icon: showRightPanel ? Check : PanelRight,
			action: () => {
				setShowRightPanel(!showRightPanel);
				toast.success(
					showRightPanel ? "Right panel hidden" : "Right panel shown",
				);
			},
			checked: showRightPanel,
		},
	];

	const imageMenu: MenuItemConfig[] = [
		{
			label: "Adjustments",
			icon: Sliders,
			submenu: [
				{
					label: "Brightness/Contrast",
					icon: Sun,
					action: () => handleApplyFilter("Brightness/Contrast"),
				},
				{
					label: "Hue/Saturation",
					icon: Palette,
					action: () => handleApplyFilter("Hue/Saturation"),
				},
				{
					label: "Color Balance",
					icon: Droplets,
					action: () => handleApplyFilter("Color Balance"),
				},
				{
					label: "Levels",
					icon: SlidersHorizontal,
					action: () => handleApplyFilter("Levels"),
				},
				{
					label: "Curves",
					icon: SlidersHorizontal,
					action: () => handleApplyFilter("Curves"),
				},
				{ separator: true, label: "" },
				{ label: "Invert Colors", action: () => handleApplyFilter("Invert") },
				{ label: "Desaturate", action: () => handleApplyFilter("Desaturate") },
				{
					label: "Auto Tone",
					icon: Wand2,
					action: () => handleApplyFilter("Auto Tone"),
				},
				{
					label: "Auto Contrast",
					icon: Contrast,
					action: () => handleApplyFilter("Auto Contrast"),
				},
			],
		},
		{ separator: true, label: "" },
		{ label: "Crop", icon: Crop, shortcut: "C", action: handleCrop },
		{ label: "Resize Canvas...", icon: Scale, action: handleResizeCanvas },
		{ label: "Resize Image...", icon: Image, action: handleResizeCanvas },
		{ separator: true, label: "" },
		{
			label: "Rotate Canvas 90° CW",
			icon: RotateCw,
			action: () => handleRotateCanvas(90),
		},
		{
			label: "Rotate Canvas 90° CCW",
			icon: RotateCcw,
			action: () => handleRotateCanvas(-90),
		},
		{
			label: "Flip Canvas Horizontal",
			icon: FlipHorizontal,
			action: () => handleFlipCanvas("horizontal"),
		},
		{
			label: "Flip Canvas Vertical",
			icon: FlipVertical,
			action: () => handleFlipCanvas("vertical"),
		},
	];

	const layerMenu: MenuItemConfig[] = [
		{ label: "New Layer", icon: Plus, shortcut: "⇧⌘N", action: addLayer },
		{
			label: "Duplicate Layer",
			icon: Copy,
			shortcut: "⌘J",
			action: () => activeLayerId && duplicateLayer(activeLayerId),
		},
		{
			label: "Delete Layer",
			icon: Trash2,
			action: () => activeLayerId && removeLayer(activeLayerId),
			disabled: layers.length <= 1,
		},
		{ separator: true, label: "" },
		{
			label: "Merge Down",
			icon: Merge,
			shortcut: "⌘E",
			action: handleMergeLayers,
		},
		{
			label: "Merge Visible",
			icon: Merge,
			shortcut: "⇧⌘E",
			action: handleMergeLayers,
		},
		{ label: "Flatten Image", icon: Layers, action: handleFlattenImage },
		{ separator: true, label: "" },
		{
			label: "Show/Hide Layer",
			icon: Eye,
			action: () => activeLayerId && toggleLayerVisibility(activeLayerId),
		},
		{ label: "Lock Layer", icon: Lock, action: handleLockLayer },
		{ separator: true, label: "" },
		{
			label: "Bring Forward",
			icon: ArrowUp,
			shortcut: "⌘]",
			action: handleBringForward,
		},
		{
			label: "Send Backward",
			icon: ArrowDown,
			shortcut: "⌘[",
			action: handleSendBackward,
		},
		{ label: "Bring to Front", shortcut: "⇧⌘]", action: handleBringToFront },
		{ label: "Send to Back", shortcut: "⇧⌘[", action: handleSendToBack },
	];

	const filterMenu: MenuItemConfig[] = [
		{
			label: "Blur",
			icon: Focus,
			submenu: [
				{
					label: "Gaussian Blur...",
					action: () => handleApplyFilter("Gaussian Blur"),
				},
				{
					label: "Motion Blur...",
					action: () => handleApplyFilter("Motion Blur"),
				},
				{
					label: "Radial Blur...",
					action: () => handleApplyFilter("Radial Blur"),
				},
				{
					label: "Surface Blur...",
					action: () => handleApplyFilter("Surface Blur"),
				},
			],
		},
		{
			label: "Sharpen",
			icon: Sparkles,
			submenu: [
				{ label: "Sharpen", action: () => handleApplyFilter("Sharpen") },
				{
					label: "Unsharp Mask...",
					action: () => handleApplyFilter("Unsharp Mask"),
				},
				{
					label: "Smart Sharpen...",
					action: () => handleApplyFilter("Smart Sharpen"),
				},
			],
		},
		{
			label: "Distort",
			icon: Blend,
			submenu: [
				{ label: "Liquify...", action: () => handleApplyFilter("Liquify") },
				{ label: "Twirl...", action: () => handleApplyFilter("Twirl") },
				{ label: "Spherize...", action: () => handleApplyFilter("Spherize") },
				{ label: "Wave...", action: () => handleApplyFilter("Wave") },
			],
		},
		{
			label: "Noise",
			submenu: [
				{ label: "Add Noise...", action: () => handleApplyFilter("Add Noise") },
				{
					label: "Reduce Noise...",
					action: () => handleApplyFilter("Reduce Noise"),
				},
				{ label: "Median...", action: () => handleApplyFilter("Median") },
			],
		},
		{ separator: true, label: "" },
		{
			label: "Stylize",
			icon: Wand2,
			submenu: [
				{ label: "Oil Paint...", action: () => handleApplyFilter("Oil Paint") },
				{ label: "Emboss...", action: () => handleApplyFilter("Emboss") },
				{ label: "Find Edges", action: () => handleApplyFilter("Find Edges") },
				{ label: "Solarize", action: () => handleApplyFilter("Solarize") },
			],
		},
		{ separator: true, label: "" },
		{
			label: "AI Enhance",
			icon: Sparkles,
			action: () => handleApplyFilter("AI Enhance"),
		},
		{
			label: "AI Remove Background",
			icon: Wand2,
			action: () => handleApplyFilter("Remove Background"),
		},
		{
			label: "AI Upscale 2x",
			icon: Scale,
			action: () => handleApplyFilter("Upscale 2x"),
		},
	];

	const windowMenu: MenuItemConfig[] = [
		{
			label: "Brushes Panel",
			icon: showBrushesPanel ? Check : Palette,
			action: () => {
				setShowBrushesPanel(!showBrushesPanel);
				toast.success(
					showBrushesPanel ? "Brushes panel hidden" : "Brushes panel shown",
				);
			},
			checked: showBrushesPanel,
		},
		{
			label: "Colors Panel",
			icon: showColorsPanel ? Check : Droplets,
			action: () => {
				setShowColorsPanel(!showColorsPanel);
				toast.success(
					showColorsPanel ? "Colors panel hidden" : "Colors panel shown",
				);
			},
			checked: showColorsPanel,
		},
		{
			label: "Layers Panel",
			icon: showLayersPanel ? Check : Layers,
			action: () => {
				setShowLayersPanel(!showLayersPanel);
				toast.success(
					showLayersPanel ? "Layers panel hidden" : "Layers panel shown",
				);
			},
			checked: showLayersPanel,
		},
		{
			label: "History Panel",
			icon: showHistoryPanel ? Check : RotateCcw,
			action: () => {
				setShowHistoryPanel(!showHistoryPanel);
				toast.success(
					showHistoryPanel ? "History panel hidden" : "History panel shown",
				);
			},
			checked: showHistoryPanel,
		},
		{ separator: true, label: "" },
		{
			label: "Navigator",
			icon: showNavigator ? Check : ZoomIn,
			action: () => {
				setShowNavigator(!showNavigator);
				toast.success(showNavigator ? "Navigator hidden" : "Navigator shown");
			},
			checked: showNavigator,
		},
		{
			label: "Info Panel",
			icon: showInfoPanel ? Check : Info,
			action: () => {
				setShowInfoPanel(!showInfoPanel);
				toast.success(showInfoPanel ? "Info panel hidden" : "Info panel shown");
			},
			checked: showInfoPanel,
		},
		{ separator: true, label: "" },
		{
			label: "Reset Workspace",
			action: () => {
				resetWorkspace();
				toast.success("Workspace reset");
			},
		},
	];

	const helpMenu: MenuItemConfig[] = [
		{
			label: "Keyboard Shortcuts",
			icon: Keyboard,
			shortcut: "⌘/",
			action: () => setShowShortcuts(true),
		},
		{
			label: "Documentation",
			icon: BookOpen,
			action: () => window.open("https://docs.lovable.dev", "_blank"),
		},
		{ separator: true, label: "" },
		{
			label: "Send Feedback",
			icon: MessageCircle,
			action: () => {
				const feedback = prompt("Enter your feedback:");
				if (feedback) {
					toast.success("Thank you for your feedback!");
				}
			},
		},
		{
			label: "About ArtStudio",
			icon: Info,
			action: () => {
				toast.info("ArtStudio v1.0 - Professional Digital Art Studio", {
					duration: 5000,
				});
			},
		},
	];

	const menus = [
		{ label: "File", items: fileMenu },
		{ label: "Edit", items: editMenu },
		{ label: "View", items: viewMenu },
		{ label: "Image", items: imageMenu },
		{ label: "Layer", items: layerMenu },
		{ label: "Filter", items: filterMenu },
		{ label: "Window", items: windowMenu },
		{ label: "Help", items: helpMenu },
	];

	const renderMenuItems = (items: MenuItemConfig[]) => {
		return items.map((item, index) => {
			if (item.separator) {
				return <DropdownMenuSeparator key={`sep-${index}`} />;
			}

			if (item.submenu) {
				return (
					<DropdownMenuSub key={item.label}>
						<DropdownMenuSubTrigger className="flex items-center gap-2">
							{item.icon && (
								<item.icon className="w-4 h-4 text-muted-foreground" />
							)}
							<span>{item.label}</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="min-w-[200px]">
							{renderMenuItems(item.submenu)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				);
			}

			return (
				<DropdownMenuItem
					key={item.label}
					onClick={item.action}
					disabled={item.disabled}
					className="flex items-center gap-2"
				>
					{item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
					<span className="flex-1">{item.label}</span>
					{item.shortcut && (
						<DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
					)}
				</DropdownMenuItem>
			);
		});
	};

	return (
		<div className="h-10 bg-card border-b border-border flex items-center justify-between px-2 animate-fade-in">
			{/* Left: Logo & Menu */}
			<div className="flex items-center gap-1">
				{/* Logo */}
				<div className="flex items-center gap-2 px-3">
					<div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
						<Palette className="w-4 h-4 text-primary-foreground" />
					</div>
					<span className="font-semibold text-sm text-foreground">
						ArtStudio
					</span>
				</div>

				<div className="w-px h-5 bg-border mx-2" />

				{/* Menu Items */}
				{menus.map((menu) => (
					<DropdownMenu key={menu.label}>
						<DropdownMenuTrigger asChild>
							<button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors outline-none">
								{menu.label}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="min-w-[220px]">
							{renderMenuItems(menu.items)}
						</DropdownMenuContent>
					</DropdownMenu>
				))}
			</div>

			{/* Right: Quick Actions */}
			<div className="flex items-center gap-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<button onClick={handleNewCanvas} className="tool-button w-8 h-8">
							<FileIcon className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>New Canvas</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button onClick={handleOpenFile} className="tool-button w-8 h-8">
							<FolderOpen className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Open File (⌘O)</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button onClick={handleSave} className="tool-button w-8 h-8">
							<Save className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Save</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => handleExport("PNG")}
							className="tool-button w-8 h-8"
						>
							<Download className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Export</TooltipContent>
				</Tooltip>

				<div className="w-px h-5 bg-border mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => setShowGrid(!showGrid)}
							className={`tool-button w-8 h-8 ${showGrid ? "bg-primary/20" : ""}`}
						>
							<Grid3X3 className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Toggle Grid</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button className="tool-button w-8 h-8">
							<Settings className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Settings</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => setShowShortcuts(true)}
							className="tool-button w-8 h-8"
						>
							<Keyboard className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Keyboard Shortcuts (⌘/)</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => window.open("https://docs.lovable.dev", "_blank")}
							className="tool-button w-8 h-8"
						>
							<HelpCircle className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Help</TooltipContent>
				</Tooltip>
			</div>

			{/* Templates Dialog */}
			<TemplatesDialog open={showTemplates} onOpenChange={setShowTemplates} />

			{/* Keyboard Shortcuts Dialog */}
			<KeyboardShortcutsDialog
				open={showShortcuts}
				onOpenChange={setShowShortcuts}
			/>
		</div>
	);
};
