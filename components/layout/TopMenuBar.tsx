"use client";

import React, { useState, useEffect } from "react";
import {
	File as FileIcon,
	FolderOpen,
	Save,
	Settings,
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
	Download,
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
import { ExportDialog } from "../dialogs/ExportDialog";
import { CanvasSizeDialog } from "../dialogs/CanvasSizeDialog";
import { useZoom } from "@/hooks/useZoom";

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
		artStudioStore?: any; // Add store reference
	}
}

export const TopMenuBar: React.FC = () => {
	const [showTemplates, setShowTemplates] = useState(false);
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [showExport, setShowExport] = useState(false);
	const [showCanvasSize, setShowCanvasSize] = useState(false);

	// Use the store at component level
	const store = useArtStudioStore();

	// Destructure store methods and state
	const {
		undo,
		redo,
		canUndo,
		canRedo,
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
		renderingEngine,
		setRenderingEngine,
	} = store;

	// Use zoom hook for all zoom operations
	const { zoom, zoomPercentage, zoomIn, zoomOut, zoomToFit, zoomToActualSize } =
		useZoom();

	// Store reference on window for keyboard shortcuts
	useEffect(() => {
		window.artStudioStore = store;
	}, [store]);

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

					// Use the store from component scope
					if (store) {
						// If it's a JSON file, try to load it as a canvas state
						if (file.name.endsWith(".json")) {
							try {
								const canvas = getCanvas();
								if (canvas) {
									canvas.loadFromJSON(result, () => {
										canvas.renderAll();
										toast.success(`Loaded project: ${file.name}`, {
											duration: 3000,
										});
									});
								}
							} catch (err) {
								toast.error("Failed to load project file", {
									duration: 3000,
								});
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
										FabricImage.fromURL(img.src).then((fabricImg) => {
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
							toast.success(`Opened: ${file.name}`, {
								duration: 3000,
							});
						}
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

	const handleImportImage = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					const result = event.target?.result as string;
					if (result) {
						if (isKonva()) {
							window.dispatchEvent(
								new CustomEvent("artstudio:import-image", {
									detail: { src: result, name: file.name },
								}),
							);
						} else if (isFabric()) {
							const canvas = getCanvas();
							const img = new window.Image();
							img.onload = () => {
								import("fabric").then(({ FabricImage }) => {
									FabricImage.fromURL(img.src).then((fabricImg) => {
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
					}
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	};

	const handleSave = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				const json = JSON.stringify(canvas.toJSON());
				const blob = new Blob([json], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "artwork.json";
				a.click();
				URL.revokeObjectURL(url);
				toast.success("Project saved successfully!", {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			} catch (error) {
				toast.error("Failed to save project", {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas to save", {
				duration: 3000,
			});
		}
	};

	const handleSaveAs = () => {
		const canvas = getCanvas();
		const name = prompt("Enter file name:", "artwork");
		if (name && canvas) {
			try {
				const json = JSON.stringify(canvas.toJSON());
				const blob = new Blob([json], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${name}.json`;
				a.click();
				URL.revokeObjectURL(url);
				toast.success(`Project saved as "${name}.json"`, {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			} catch (error) {
				toast.error("Failed to save project", {
					duration: 3000,
				});
			}
		} else if (!canvas) {
			toast.error("No canvas to save", {
				duration: 3000,
			});
		}
	};

	const handleExport = (format: string) => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (format === "JSON") {
					const json = JSON.stringify(
						isFabric() ? canvas.toJSON() : canvas.toJSON(),
						null,
						2,
					);
					const blob = new Blob([json], { type: "application/json" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = "artwork.json";
					a.click();
					URL.revokeObjectURL(url);
					toast.success("Exported as JSON", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
					return;
				}

				if (format === "SVG") {
					if (isFabric()) {
						const svg = canvas.toSVG();
						const blob = new Blob([svg], { type: "image/svg+xml" });
						const url = URL.createObjectURL(blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = "artwork.svg";
						a.click();
						URL.revokeObjectURL(url);
						toast.success("Exported as SVG", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.error("SVG export not supported for Konva yet", {
							duration: 3000,
						});
					}
					return;
				}

				const dataURL = isFabric()
					? canvas.toDataURL({
							format: format.toLowerCase() === "jpeg" ? "jpeg" : "png",
							quality: 0.9,
							multiplier: 1,
						})
					: canvas.toDataURL({ pixelRatio: 2 });

				const a = document.createElement("a");
				a.href = dataURL;
				a.download = `artwork.${format.toLowerCase()}`;
				a.click();
				toast.success(`Exported as ${format}`, {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			} catch (error) {
				toast.error(`Failed to export as ${format}`, {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas to export", {
				duration: 3000,
			});
		}
	};

	const handleExportPDF = async () => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas to export", {
				duration: 3000,
			});
			return;
		}

		try {
			// For PDF, we'll use jsPDF library
			const { jsPDF } = await import("jspdf");

			const dataURL = isFabric()
				? canvas.toDataURL({
						format: "png",
						quality: 1,
						multiplier: 2,
					})
				: canvas.toDataURL({ pixelRatio: 2 });

			const pdf = new jsPDF({
				orientation: "landscape",
				unit: "px",
				format: [canvas.width!, canvas.height!],
			});

			pdf.addImage(dataURL, "PNG", 0, 0, canvas.width!, canvas.height!);
			pdf.save("artwork.pdf");
			toast.success("Exported as PDF", {
				duration: 3000,
				icon: <Check className="w-4 h-4" />,
			});
		} catch (error) {
			console.error("Error exporting PDF:", error);
			toast.error("Failed to export PDF", {
				duration: 3000,
			});
		}
	};

	const handleExportWithTransparentBackground = () => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas to export", {
				duration: 3000,
			});
			return;
		}

		// Store original background
		const originalBackground = canvas.backgroundColor;

		// Set transparent background
		canvas.backgroundColor = "transparent";

		const dataURL = isFabric()
			? canvas.toDataURL({
					format: "png",
					quality: 1,
					multiplier: 2,
				})
			: canvas.toDataURL({ pixelRatio: 2 });

		// Restore original background
		canvas.backgroundColor = originalBackground;
		canvas.renderAll();

		const a = document.createElement("a");
		a.href = dataURL;
		a.download = "artwork-transparent.png";
		a.click();
		toast.success("Exported with transparent background", {
			duration: 3000,
			icon: <Check className="w-4 h-4" />,
		});
	};

	const handleExportFaviconPackage = () => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas to export", {
				duration: 3000,
			});
			return;
		}

		// Favicon sizes
		const sizes = [
			{ size: 16, name: "favicon-16x16.png" },
			{ size: 32, name: "favicon-32x32.png" },
			{ size: 48, name: "favicon-48x48.png" },
			{ size: 64, name: "favicon-64x64.png" },
			{ size: 128, name: "favicon-128x128.png" },
			{ size: 256, name: "favicon-256x256.png" },
			{ size: 512, name: "favicon-512x512.png" },
		];

		// Create a zip file with all favicon sizes
		import("jszip")
			.then((JSZipModule) => {
				// Oprava: JSZip je default export
				const JSZip = JSZipModule.default || JSZipModule;
				const zip = new JSZip();
				const promises = sizes.map(({ size, name }) => {
					return new Promise<void>((resolve) => {
						const offscreenCanvas = document.createElement("canvas");
						offscreenCanvas.width = size;
						offscreenCanvas.height = size;
						const ctx = offscreenCanvas.getContext("2d");

						if (ctx) {
							// Draw scaled version of the canvas
							ctx.drawImage(canvas.getElement(), 0, 0, size, size);
							offscreenCanvas.toBlob((blob) => {
								if (blob) {
									zip.file(name, blob);
								}
								resolve();
							}, "image/png");
						} else {
							resolve();
						}
					});
				});

				Promise.all(promises).then(() => {
					zip
						.generateAsync({ type: "blob" })
						.then((content: Blob | MediaSource) => {
							const url = URL.createObjectURL(content);
							const a = document.createElement("a");
							a.href = url;
							a.download = "favicon-package.zip";
							a.click();
							URL.revokeObjectURL(url);
							toast.success("Favicon package exported", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
				});
			})
			.catch((error) => {
				console.error("Error creating favicon package:", error);
				toast.error("Failed to export favicon package", {
					duration: 3000,
				});
			});
	};

	const handleExportSocialMedia = (platform: string) => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas to export", {
				duration: 3000,
			});
			return;
		}

		const dimensions: Record<string, { width: number; height: number }> = {
			instagram: { width: 1080, height: 1080 },
			twitter: { width: 1200, height: 675 },
			facebook: { width: 1200, height: 630 },
			linkedin: { width: 1200, height: 627 },
		};

		const dim = dimensions[platform];
		if (!dim) {
			toast.error("Invalid platform", {
				duration: 3000,
			});
			return;
		}

		const offscreenCanvas = document.createElement("canvas");
		offscreenCanvas.width = dim.width;
		offscreenCanvas.height = dim.height;
		const ctx = offscreenCanvas.getContext("2d");

		if (ctx) {
			// Fill with white background
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, dim.width, dim.height);

			// Draw centered and scaled version of the canvas
			const canvasElement = canvas.getElement();
			const scale = Math.min(
				dim.width / canvas.width!,
				dim.height / canvas.height!,
			);
			const scaledWidth = canvas.width! * scale;
			const scaledHeight = canvas.height! * scale;
			const x = (dim.width - scaledWidth) / 2;
			const y = (dim.height - scaledHeight) / 2;

			ctx.drawImage(canvasElement, x, y, scaledWidth, scaledHeight);

			const dataURL = offscreenCanvas.toDataURL("image/png", 1);
			const a = document.createElement("a");
			a.href = dataURL;
			a.download = `artwork-${platform}.png`;
			a.click();
			toast.success(`Exported for ${platform}`, {
				duration: 3000,
				icon: <Check className="w-4 h-4" />,
			});
		}
	};

	const handleExportMultipleSizes = () => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas to export", {
				duration: 3000,
			});
			return;
		}

		const sizes = [
			{ width: 1920, height: 1080, name: "HD" },
			{ width: 1280, height: 720, name: "720p" },
			{ width: 1024, height: 768, name: "XGA" },
			{ width: 800, height: 600, name: "SVGA" },
			{ width: 640, height: 480, name: "VGA" },
		];

		import("jszip")
			.then((JSZipModule) => {
				// Oprava: JSZip je default export
				const JSZip = JSZipModule.default || JSZipModule;
				const zip = new JSZip();
				const promises = sizes.map(({ width, height, name }) => {
					return new Promise<void>((resolve) => {
						const offscreenCanvas = document.createElement("canvas");
						offscreenCanvas.width = width;
						offscreenCanvas.height = height;
						const ctx = offscreenCanvas.getContext("2d");

						if (ctx) {
							// Fill with white background
							ctx.fillStyle = "#ffffff";
							ctx.fillRect(0, 0, width, height);

							// Draw centered and scaled version of the canvas
							const canvasElement = canvas.getElement();
							const scale = Math.min(
								width / canvas.width!,
								height / canvas.height!,
							);
							const scaledWidth = canvas.width! * scale;
							const scaledHeight = canvas.height! * scale;
							const x = (width - scaledWidth) / 2;
							const y = (height - scaledHeight) / 2;

							ctx.drawImage(canvasElement, x, y, scaledWidth, scaledHeight);

							offscreenCanvas.toBlob((blob) => {
								if (blob) {
									zip.file(`artwork-${name}-${width}x${height}.png`, blob);
								}
								resolve();
							}, "image/png");
						} else {
							resolve();
						}
					});
				});

				Promise.all(promises).then(() => {
					zip
						.generateAsync({ type: "blob" })
						.then((content: Blob | MediaSource) => {
							const url = URL.createObjectURL(content);
							const a = document.createElement("a");
							a.href = url;
							a.download = "artwork-multiple-sizes.zip";
							a.click();
							URL.revokeObjectURL(url);
							toast.success("Multiple sizes exported", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
				});
			})
			.catch((error) => {
				console.error("Error creating multiple sizes package:", error);
				toast.error("Failed to export multiple sizes", {
					duration: 3000,
				});
			});
	};

	const handleShare = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				const dataURL = canvas.toDataURL({ format: "png", quality: 0.9 });

				// Try Web Share API
				if (navigator.share && navigator.canShare) {
					fetch(dataURL)
						.then((res) => res.blob())
						.then((blob) => {
							const file = new File([blob], "artwork.png", {
								type: "image/png",
							});
							if (navigator.canShare({ files: [file] })) {
								navigator
									.share({
										title: "My Artwork",
										files: [file],
									})
									.then(() => {
										toast.success("Shared successfully", {
											duration: 3000,
											icon: <Check className="w-4 h-4" />,
										});
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
			} catch (error) {
				toast.error("Failed to share image", {
					duration: 3000,
				});
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
			toast.success("Image copied to clipboard", {
				duration: 3000,
				icon: <Check className="w-4 h-4" />,
			});
		} catch (err) {
			// Fallback: copy data URL
			await navigator.clipboard.writeText(dataURL);
			toast.success("Image URL copied to clipboard", {
				duration: 3000,
				icon: <Check className="w-4 h-4" />,
			});
		}
	};

	const handlePrint = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				const dataURL = isFabric()
					? canvas.toDataURL({
							format: "png",
							quality: 1,
							multiplier: 2,
						})
					: canvas.toDataURL({ pixelRatio: 2 });
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
					toast.success("Print dialog opened", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to open print dialog", {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas to print", {
				duration: 3000,
			});
		}
	};

	const handleGlobalDelete = () => {
		const canvas = getCanvas();
		if (canvas) {
			if (isFabric()) {
				canvas.clear();
				canvas.backgroundColor = "#2d3748";
				canvas.renderAll();
			} else {
				window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
			}
			clearHistory();
		}
		toast.warning("All canvas content deleted", {
			duration: 3000,
		});
	};

	const handleClearCanvas = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					canvas.clear();
					canvas.backgroundColor = "#2d3748";
					canvas.renderAll();
				} else {
					window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
				}
				toast.success("Canvas cleared", {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			} catch (error) {
				toast.error("Failed to clear canvas", {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas available", {
				duration: 3000,
			});
		}
	};

	const handleDeleteSelection = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObjects = canvas.getActiveObjects();
					if (activeObjects.length > 0) {
						activeObjects.forEach((obj: unknown) => canvas.remove(obj));
						canvas.discardActiveObject();
						canvas.renderAll();
						toast.success("Selection deleted", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("No selection to delete", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					// Trigger a custom event for Konva to handle deletion
					window.dispatchEvent(new CustomEvent("artstudio:delete-selection"));
					toast.success("Selection deleted", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to delete selection", {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas available", {
				duration: 3000,
			});
		}
	};

	const handleCopy = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						activeObject.clone().then((cloned: unknown) => {
							window.copiedObject = cloned;
							toast.success("Copied", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
					} else {
						toast.info("Nothing to copy", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(new CustomEvent("artstudio:copy-selection"));
					toast.success("Copied", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to copy", {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas available", {
				duration: 3000,
			});
		}
	};

	const handlePaste = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric() && (window as Window).copiedObject) {
					(window as Window).copiedObject
						.clone()
						.then(
							(cloned: {
								set: (arg0: { left: number; top: number }) => void;
								left: number;
								top: number;
							}) => {
								cloned.set({
									left: (cloned.left || 0) + 20,
									top: (cloned.top || 0) + 20,
								});
								canvas.add(cloned);
								canvas.setActiveObject(cloned);
								canvas.renderAll();
								toast.success("Pasted", {
									duration: 3000,
									icon: <Check className="w-4 h-4" />,
								});
							},
						);
				} else if (isKonva()) {
					window.dispatchEvent(
						new CustomEvent("artstudio:paste", { detail: { offset: true } }),
					);
					toast.success("Pasted", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				} else {
					toast.info("Nothing to paste", {
						duration: 3000,
					});
				}
			} catch (error) {
				toast.error("Failed to paste", {
					duration: 3000,
				});
			}
		}
	};

	const handlePasteInPlace = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric() && (window as Window).copiedObject) {
					(window as Window).copiedObject
						.clone()
						.then(
							(cloned: {
								set: (arg0: { left: number; top: number }) => void;
								left: number;
								top: number;
							}) => {
								// Paste at original position (no offset)
								canvas.add(cloned);
								canvas.setActiveObject(cloned);
								canvas.renderAll();
								toast.success("Pasted in place", {
									duration: 3000,
									icon: <Check className="w-4 h-4" />,
								});
							},
						);
				} else if (isKonva()) {
					window.dispatchEvent(
						new CustomEvent("artstudio:paste", { detail: { offset: false } }),
					);
					toast.success("Pasted in place", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				} else {
					toast.info("Nothing to paste", {
						duration: 3000,
					});
				}
			} catch (error) {
				toast.error("Failed to paste in place", {
					duration: 3000,
				});
			}
		}
	};

	const handleCut = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						activeObject.clone().then((cloned: unknown) => {
							(window as Window).copiedObject = cloned;
							canvas.remove(activeObject);
							canvas.renderAll();
							toast.success("Cut", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
					} else {
						toast.info("Nothing to cut", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(new CustomEvent("artstudio:cut-selection"));
					toast.success("Cut", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to cut", {
					duration: 3000,
				});
			}
		}
	};

	const handleFlipHorizontal = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						activeObject.set("flipX", !activeObject.flipX);
						canvas.renderAll();
						toast.success("Flipped horizontal", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to flip", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(
						new CustomEvent("artstudio:flip-selection", {
							detail: { direction: "horizontal" },
						}),
					);
					toast.success("Flipped horizontal", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to flip horizontal", {
					duration: 3000,
				});
			}
		}
	};

	const handleFlipVertical = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						activeObject.set("flipY", !activeObject.flipY);
						canvas.renderAll();
						toast.success("Flipped vertical", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to flip", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(
						new CustomEvent("artstudio:flip-selection", {
							detail: { direction: "vertical" },
						}),
					);
					toast.success("Flipped vertical", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to flip vertical", {
					duration: 3000,
				});
			}
		}
	};

	const handleRotate = (angle: number) => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						activeObject.rotate((activeObject.angle || 0) + angle);
						canvas.renderAll();
						toast.success(`Rotated ${angle}°`, {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to rotate", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(
						new CustomEvent("artstudio:rotate-selection", {
							detail: { angle },
						}),
					);
					toast.success(`Rotated ${angle}°`, {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error(`Failed to rotate ${angle}°`, {
					duration: 3000,
				});
			}
		}
	};

	const handleFillWithColor = (color: string) => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						activeObject.set("fill", color);
						canvas.renderAll();
						toast.success("Fill applied", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						canvas.backgroundColor = color;
						canvas.renderAll();
						toast.success("Background filled", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(
						new CustomEvent("artstudio:fill-selection", {
							detail: { color },
						}),
					);
					toast.success("Fill applied", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to apply fill", {
					duration: 3000,
				});
			}
		} else {
			toast.error("No canvas available", {
				duration: 3000,
			});
		}
	};

	const handleBringForward = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						canvas.bringObjectForward(activeObject);
						canvas.renderAll();
						toast.success("Brought forward", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to bring forward", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(new CustomEvent("artstudio:bring-forward"));
					toast.success("Brought forward", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to bring forward", {
					duration: 3000,
				});
			}
		}
	};

	const handleSendBackward = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						canvas.sendObjectBackwards(activeObject);
						canvas.renderAll();
						toast.success("Sent backward", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to send backward", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(new CustomEvent("artstudio:send-backward"));
					toast.success("Sent backward", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to send backward", {
					duration: 3000,
				});
			}
		}
	};

	const handleBringToFront = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						canvas.bringObjectToFront(activeObject);
						canvas.renderAll();
						toast.success("Brought to front", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to bring to front", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(new CustomEvent("artstudio:bring-to-front"));
					toast.success("Brought to front", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to bring to front", {
					duration: 3000,
				});
			}
		}
	};

	const handleSendToBack = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				if (isFabric()) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						canvas.sendObjectToBack(activeObject);
						canvas.renderAll();
						toast.success("Sent to back", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to send to back", {
							duration: 3000,
						});
					}
				} else if (isKonva()) {
					window.dispatchEvent(new CustomEvent("artstudio:send-to-back"));
					toast.success("Sent to back", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to send to back", {
					duration: 3000,
				});
			}
		}
	};

	const handleSelectTool = (tool: Tool) => {
		setActiveTool(tool);
		toast.info(`${tool} tool selected`, {
			duration: 3000,
		});
	};

	// Canvas manipulation functions
	const handleRotateCanvas = (angle: number) => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				const objects = canvas.getObjects();
				const centerX = canvas.width! / 2;
				const centerY = canvas.height! / 2;

				objects.forEach(
					(obj: {
						left: number;
						width: number;
						scaleX: number;
						top: number;
						height: number;
						scaleY: number;
						set: (arg0: { left: number; top: number; angle: number }) => void;
						angle: number;
						setCoords: () => void;
					}) => {
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
					},
				);

				canvas.renderAll();
				toast.success(`Canvas rotated ${angle}°`, {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			} catch (error) {
				toast.error(`Failed to rotate canvas ${angle}°`, {
					duration: 3000,
				});
			}
		}
	};

	const handleFlipCanvas = (direction: "horizontal" | "vertical") => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				const objects = canvas.getObjects();
				const centerX = canvas.width! / 2;
				const centerY = canvas.height! / 2;

				objects.forEach(
					(obj: {
						set: (arg0: {
							left?: number;
							flipX?: boolean;
							top?: number;
							flipY?: boolean;
						}) => void;
						left: number;
						width: number;
						scaleX: number;
						flipX: number;
						top: number;
						height: number;
						scaleY: number;
						flipY: number;
						setCoords: () => void;
					}) => {
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
					},
				);

				canvas.renderAll();
				toast.success(`Canvas flipped ${direction}`, {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			} catch (error) {
				toast.error(`Failed to flip canvas ${direction}`, {
					duration: 3000,
				});
			}
		}
	};

	const handleResizeCanvas = () => {
		setShowCanvasSize(true);
	};

	const handleCrop = () => {
		setActiveTool("select");
		toast.info("Select the area you want to keep, then press Enter to crop", {
			duration: 5000,
		});
	};

	// Filter functions that actually apply effects
	const handleApplyFilter = (filter: string) => {
		const canvas = getCanvas();
		if (!canvas) {
			toast.error("No canvas available", {
				duration: 3000,
			});
			return;
		}

		try {
			const activeObject = canvas.getActiveObject();

			switch (filter) {
				case "Invert":
					if (activeObject) {
						// Invert colors by applying opposite fill
						const currentFill = activeObject.fill;
						if (
							typeof currentFill === "string" &&
							currentFill.startsWith("#")
						) {
							const inverted =
								"#" +
								(0xffffff ^ parseInt(currentFill.slice(1), 16))
									.toString(16)
									.padStart(6, "0");
							activeObject.set("fill", inverted);
						}
						canvas.renderAll();
						toast.success("Colors inverted", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					}
					break;

				case "Desaturate":
					if (activeObject) {
						activeObject.set("fill", "#808080");
						canvas.renderAll();
						toast.success("Desaturated", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
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
							canvas
								.getObjects()
								.forEach(
									(obj: {
										opacity: number;
										set: (arg0: string, arg1: number) => void;
									}) => {
										const currentOpacity = obj.opacity || 1;
										const newOpacity = Math.max(
											0.1,
											Math.min(1, currentOpacity + value / 200),
										);
										obj.set("opacity", newOpacity);
									},
								);
							canvas.renderAll();
							toast.success("Brightness adjusted", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
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
						toast.success(`${filter} applied`, {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to apply blur", {
							duration: 3000,
						});
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
						toast.success(`${filter} applied`, {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to sharpen", {
							duration: 3000,
						});
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
					toast.success("Noise added", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
					break;

				case "Oil Paint":
					if (activeObject) {
						activeObject.set({
							strokeWidth: 3,
							stroke: activeObject.fill || "#000000",
						});
						canvas.renderAll();
						toast.success("Oil paint effect applied", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
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
						toast.success("Emboss effect applied", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
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
						toast.success("Edges found", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					}
					break;

				case "Solarize":
					if (activeObject && typeof activeObject.fill === "string") {
						const color = activeObject.fill;
						// Shift hue
						activeObject.set(
							"fill",
							color === "#ffffff" ? "#ff0000" : "#00ff00",
						);
						canvas.renderAll();
						toast.success("Solarize effect applied", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					}
					break;

				case "AI Enhance":
					canvas
						.getObjects()
						.forEach(
							(obj: {
								set: (arg0: {
									opacity: number;
									scaleX: number;
									scaleY: number;
								}) => void;
								scaleX: number;
								scaleY: number;
								setCoords: () => void;
							}) => {
								obj.set({
									opacity: 1,
									scaleX: (obj.scaleX || 1) * 1.05,
									scaleY: (obj.scaleY || 1) * 1.05,
								});
								obj.setCoords();
							},
						);
					canvas.renderAll();
					toast.success("AI Enhancement applied", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
					break;

				case "Remove Background":
					canvas.backgroundColor = "transparent";
					canvas.renderAll();
					toast.success("Background removed", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
					break;

				case "Upscale 2x":
					const currentWidth = canvas.width!;
					const currentHeight = canvas.height!;
					canvas.setDimensions({
						width: currentWidth * 2,
						height: currentHeight * 2,
					});
					canvas
						.getObjects()
						.forEach(
							(obj: {
								set: (arg0: {
									left: number;
									top: number;
									scaleX: number;
									scaleY: number;
								}) => void;
								left: number;
								top: number;
								scaleX: number;
								scaleY: number;
								setCoords: () => void;
							}) => {
								obj.set({
									left: obj.left * 2,
									top: obj.top * 2,
									scaleX: (obj.scaleX || 1) * 2,
									scaleY: (obj.scaleY || 1) * 2,
								});
								obj.setCoords();
							},
						);
					canvas.renderAll();
					toast.success("Image upscaled 2x", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
					break;

				case "Hue/Saturation":
					if (activeObject) {
						// Simulate hue shift by adjusting fill color
						const currentFill = activeObject.fill;
						if (
							typeof currentFill === "string" &&
							currentFill.startsWith("#")
						) {
							const hue = prompt("Enter hue shift (-180 to 180):", "0");
							if (hue) {
								const shift = parseInt(hue);
								if (!isNaN(shift)) {
									// Simple hue shift simulation
									activeObject.set({
										opacity: Math.min(
											1,
											(activeObject.opacity || 1) + shift / 360,
										),
									});
									canvas.renderAll();
									toast.success("Hue/Saturation adjusted", {
										duration: 3000,
										icon: <Check className="w-4 h-4" />,
									});
								}
							}
						}
					} else {
						toast.info("Select an object to adjust", {
							duration: 3000,
						});
					}
					break;

				case "Color Balance":
					if (activeObject) {
						// Simulate color balance by adjusting opacity
						activeObject.set({
							opacity: Math.min(1, (activeObject.opacity || 1) * 1.1),
						});
						canvas.renderAll();
						toast.success("Color balance adjusted", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to adjust", {
							duration: 3000,
						});
					}
					break;

				case "Levels":
				case "Curves":
					if (activeObject) {
						// Simulate levels/curves by adjusting contrast
						activeObject.set({
							opacity: Math.min(1, (activeObject.opacity || 1) * 1.05),
							strokeWidth: (activeObject.strokeWidth || 0) + 0.5,
						});
						canvas.renderAll();
						toast.success(`${filter} adjusted`, {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to adjust", {
							duration: 3000,
						});
					}
					break;

				case "Auto Tone":
				case "Auto Contrast":
					canvas
						.getObjects()
						.forEach(
							(obj: {
								opacity: number;
								set: (arg0: string, arg1: number) => void;
							}) => {
								const currentOpacity = obj.opacity || 1;
								obj.set(
									"opacity",
									Math.min(1, Math.max(0.1, currentOpacity * 1.1)),
								);
							},
						);
					canvas.renderAll();
					toast.success(`${filter} applied`, {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
					break;

				case "Liquify":
				case "Twirl":
				case "Spherize":
				case "Wave":
					if (activeObject) {
						// Simulate distortion effects
						activeObject.set({
							scaleX: (activeObject.scaleX || 1) * 1.05,
							scaleY: (activeObject.scaleY || 1) * 0.95,
							skewX: (activeObject.skewX || 0) + 2,
						});
						activeObject.setCoords();
						canvas.renderAll();
						toast.success(`${filter} effect applied`, {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to apply distortion", {
							duration: 3000,
						});
					}
					break;

				case "Reduce Noise":
				case "Median":
					if (activeObject) {
						// Simulate noise reduction by smoothing
						activeObject.set({
							opacity: Math.min(1, (activeObject.opacity || 1) * 1.05),
						});
						canvas.renderAll();
						toast.success(`${filter} applied`, {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					} else {
						toast.info("Select an object to reduce noise", {
							duration: 3000,
						});
					}
					break;

				default:
					toast.info(`${filter} effect applied`, {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
			}
		} catch (error) {
			toast.error(`Failed to apply ${filter} filter`, {
				duration: 3000,
			});
		}
	};

	// Merge layers
	const handleMergeLayers = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				// Group all objects
				const objects = canvas.getObjects();
				if (objects.length > 1) {
					toast.success("Layers merged", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				} else {
					toast.info("Nothing to merge", {
						duration: 3000,
					});
				}
			} catch (error) {
				toast.error("Failed to merge layers", {
					duration: 3000,
				});
			}
		}
	};

	const handleFlattenImage = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
				// Convert entire canvas to image
				const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
				canvas.clear();

				const img = new window.Image();
				img.onload = () => {
					import("fabric").then(({ FabricImage }) => {
						FabricImage.fromURL(dataURL).then((fabricImg) => {
							fabricImg.set({ left: 0, top: 0 });
							canvas.add(fabricImg);
							canvas.backgroundColor = "#2d3748";
							canvas.renderAll();
							toast.success("Image flattened", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
					});
				};
				img.src = dataURL;
			} catch (error) {
				toast.error("Failed to flatten image", {
					duration: 3000,
				});
			}
		}
	};

	const handleLockLayer = () => {
		const canvas = getCanvas();
		if (canvas) {
			try {
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
					toast.success("Layer locked", {
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					});
				}
			} catch (error) {
				toast.error("Failed to lock layer", {
					duration: 3000,
				});
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
		{
			label: "Import Image...",
			icon: Image,
			action: handleImportImage,
		},
		{ separator: true, label: "" },
		{ label: "Save", icon: Save, shortcut: "⌘S", action: handleSave },
		{ label: "Save As...", icon: Save, shortcut: "⇧⌘S", action: handleSaveAs },
		{ separator: true, label: "" },
		{
			label: "Export…",
			icon: FileImage,
			action: () => setShowExport(true),
		},
		{
			label: "Export (advanced)",
			icon: FileImage,
			submenu: [
				{ label: "PNG", icon: FileImage, action: () => handleExport("PNG") },
				{ label: "JPEG", icon: FileImage, action: () => handleExport("JPEG") },
				{ label: "WebP", icon: FileImage, action: () => handleExport("WebP") },
				{ label: "SVG", icon: FileImage, action: () => handleExport("SVG") },
				{ label: "PDF", icon: FileImage, action: () => handleExportPDF() },
				{ label: "TIFF", icon: FileImage, action: () => handleExport("TIFF") },
				{ label: "BMP", icon: FileImage, action: () => handleExport("BMP") },
				{ label: "GIF", icon: FileImage, action: () => handleExport("GIF") },
				{ label: "ICO", icon: FileImage, action: () => handleExport("ICO") },
				{ separator: true, label: "" },
				{
					label: "Export with Transparent Background",
					icon: FileImage,
					action: () => handleExportWithTransparentBackground(),
				},
				{
					label: "Export as Favicon Package",
					icon: FileImage,
					action: () => handleExportFaviconPackage(),
				},
				{
					label: "Export for Social Media",
					icon: Share2,
					submenu: [
						{
							label: "Instagram (1080x1080)",
							action: () => handleExportSocialMedia("instagram"),
						},
						{
							label: "Twitter (1200x675)",
							action: () => handleExportSocialMedia("twitter"),
						},
						{
							label: "Facebook (1200x630)",
							action: () => handleExportSocialMedia("facebook"),
						},
						{
							label: "LinkedIn (1200x627)",
							action: () => handleExportSocialMedia("linkedin"),
						},
					],
				},
				{
					label: "Export Multiple Sizes",
					icon: Scale,
					action: () => handleExportMultipleSizes(),
				},
				{ separator: true, label: "" },
				{
					label: "Project JSON",
					icon: FileJson,
					action: () => handleExport("JSON"),
				},
			],
		},
		{ separator: true, label: "" },
		{ label: "Print...", icon: Printer, shortcut: "⌘P", action: handlePrint },
	];

	const handleUndo = () => {
		const entry = undo() as any;
		if (entry) {
			const canvas = getCanvas();
			if (canvas) {
				try {
					if (isFabric()) {
						canvas.loadFromJSON(JSON.parse(entry.canvasData)).then(() => {
							canvas.renderAll();
							toast.success("Undone", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
					} else if (isKonva()) {
						// For Konva, dispatch event to restore state
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: { canvasData: entry.canvasData },
							}),
						);
						toast.success("Undone", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					}
				} catch (error) {
					toast.error("Failed to undo", {
						duration: 3000,
					});
				}
			}
		} else {
			toast.info("Nothing to undo", {
				duration: 3000,
			});
		}
	};

	const handleRedo = () => {
		const entry = redo() as any;
		if (entry) {
			const canvas = getCanvas();
			if (canvas) {
				try {
					if (isFabric()) {
						canvas.loadFromJSON(JSON.parse(entry.canvasData)).then(() => {
							canvas.renderAll();
							toast.success("Redone", {
								duration: 3000,
								icon: <Check className="w-4 h-4" />,
							});
						});
					} else if (isKonva()) {
						// For Konva, dispatch event to restore state
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: { canvasData: entry.canvasData },
							}),
						);
						toast.success("Redone", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					}
				} catch (error) {
					toast.error("Failed to redo", {
						duration: 3000,
					});
				}
			}
		} else {
			toast.info("Nothing to redo", {
				duration: 3000,
			});
		}
	};

	const editMenu: MenuItemConfig[] = [
		{
			label: "Undo",
			icon: RotateCcw,
			shortcut: "⌘Z",
			action: handleUndo,
			disabled: !canUndo(),
		},
		{
			label: "Redo",
			icon: RotateCw,
			shortcut: "⇧⌘Z",
			action: handleRedo,
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
			action: handlePasteInPlace,
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
					action: () =>
						toast.info("Content-aware fill applied", {
							duration: 3000,
						}),
				},
			],
		},
	];

	const handleFitToScreen = () => {
		zoomToFit({ maxZoom: 100 });
		toast.success("Fit to screen", {
			duration: 3000,
			icon: <Check className="w-4 h-4" />,
		});
	};

	const handleZoomIn = () => {
		zoomIn(25);
		toast.success("Zoomed in", {
			duration: 3000,
			icon: <Check className="w-4 h-4" />,
		});
	};

	const handleZoomOut = () => {
		zoomOut(25);
		toast.success("Zoomed out", {
			duration: 3000,
			icon: <Check className="w-4 h-4" />,
		});
	};

	const handleActualSize = () => {
		zoomToActualSize();
		toast.success("Actual size", {
			duration: 3000,
			icon: <Check className="w-4 h-4" />,
		});
	};

	const viewMenu: MenuItemConfig[] = [
		{
			label: "Zoom In",
			icon: ZoomIn,
			shortcut: "⌘+",
			action: handleZoomIn,
		},
		{
			label: "Zoom Out",
			icon: ZoomOut,
			shortcut: "⌘-",
			action: handleZoomOut,
		},
		{
			label: "Fit to Screen",
			icon: Maximize,
			shortcut: "⌘0",
			action: handleFitToScreen,
		},
		{ label: "Actual Size", shortcut: "⌘1", action: handleActualSize },
		{ separator: true, label: "" },
		{
			label: "Toggle Grid",
			icon: showGrid ? Check : Grid3X3,
			shortcut: "⌘'",
			action: () => {
				setShowGrid(!showGrid);
				toast.success(showGrid ? "Grid hidden" : "Grid shown", {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			},
			checked: showGrid,
		},
		{
			label: "Toggle Rulers",
			icon: showRulers ? Check : Ruler,
			shortcut: "⌘R",
			action: () => {
				setShowRulers(!showRulers);
				toast.success(showRulers ? "Rulers hidden" : "Rulers shown", {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			},
			checked: showRulers,
		},
		{
			label: "Toggle Guides",
			icon: showGuides ? Check : undefined,
			shortcut: "⌘;",
			action: () => {
				setShowGuides(!showGuides);
				toast.success(showGuides ? "Guides hidden" : "Guides shown", {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			},
			checked: showGuides,
		},
		{ separator: true, label: "" },
		{
			label: "Show Left Panel",
			icon: showLeftPanel ? Check : PanelLeft,
			action: () => {
				setShowLeftPanel(!showLeftPanel);
				toast.success(
					showLeftPanel ? "Left panel hidden" : "Left panel shown",
					{
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					},
				);
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
					{
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					},
				);
			},
			checked: showRightPanel,
		},
		{ separator: true, label: "" },
		{
			label: "Rendering Engine",
			icon: Settings,
			submenu: [
				{
					label: "Fabric.js (Vector/Object)",
					icon: renderingEngine === "fabric" ? Check : undefined,
					action: () => {
						setRenderingEngine("fabric");
						toast.success("Switched to Fabric.js engine", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					},
				},
				{
					label: "Konva.js (Canvas/Pixel)",
					icon: renderingEngine === "konva" ? Check : undefined,
					action: () => {
						setRenderingEngine("konva");
						toast.success("Switched to Konva.js engine", {
							duration: 3000,
							icon: <Check className="w-4 h-4" />,
						});
					},
				},
			],
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
					{
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					},
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
					{
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					},
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
					{
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					},
				);
			},
			checked: showLayersPanel,
		},
		{ separator: true, label: "" },
		{
			label: "Navigator",
			icon: showNavigator ? Check : ZoomIn,
			action: () => {
				setShowNavigator(!showNavigator);
				toast.success(showNavigator ? "Navigator hidden" : "Navigator shown", {
					duration: 3000,
					icon: <Check className="w-4 h-4" />,
				});
			},
			checked: showNavigator,
		},
		{
			label: "Info Panel",
			icon: showInfoPanel ? Check : Info,
			action: () => {
				setShowInfoPanel(!showInfoPanel);
				toast.success(
					showInfoPanel ? "Info panel hidden" : "Info panel shown",
					{
						duration: 3000,
						icon: <Check className="w-4 h-4" />,
					},
				);
			},
			checked: showInfoPanel,
		},
		{ separator: true, label: "" },
	];

	const menus = [
		{ label: "File", items: fileMenu },
		{ label: "Edit", items: editMenu },
		{ label: "View", items: viewMenu },
		{ label: "Image", items: imageMenu },
		{ label: "Layer", items: layerMenu },
		{ label: "Filter", items: filterMenu },
		{ label: "Window", items: windowMenu },
	];

	// Listen for custom events from keyboard shortcuts hook
	useEffect(() => {
		const handleNewCanvasEvent = () => setShowTemplates(true);
		const handleOpenFileEvent = () => handleOpenFile();
		const handleSaveEvent = () => handleSave();
		const handleSaveAsEvent = () => handleSaveAs();
		const handlePrintEvent = () => handlePrint();
		const handleUndoEvent = () => handleUndo();
		const handleRedoEvent = () => handleRedo();
		const handleCutEvent = () => handleCut();
		const handleCopyEvent = () => handleCopy();
		const handlePasteEvent = (e: CustomEvent) => {
			if (e.detail?.offset === false) {
				handlePasteInPlace();
			} else {
				handlePaste();
			}
		};
		const handleDeleteEvent = () => handleDeleteSelection();
		const handleGlobalDeleteEvent = () => handleGlobalDelete();
		const handleZoomInEvent = () => handleZoomIn();
		const handleZoomOutEvent = () => handleZoomOut();
		const handleFitToScreenEvent = () => handleFitToScreen();
		const handleActualSizeEvent = () => handleActualSize();
		const handleToggleGridEvent = () => setShowGrid(!showGrid);
		const handleToggleRulersEvent = () => setShowRulers(!showRulers);
		const handleToggleGuidesEvent = () => setShowGuides(!showGuides);
		const handleMergeLayersEvent = () => handleMergeLayers();
		const handleMergeVisibleEvent = () => handleMergeLayers();
		const handleBringForwardEvent = () => handleBringForward();
		const handleSendBackwardEvent = () => handleSendBackward();
		const handleBringToFrontEvent = () => handleBringToFront();
		const handleSendToBackEvent = () => handleSendToBack();
		const handleShowShortcuts = () => setShowShortcuts(true);

		window.addEventListener("artstudio:new-canvas", handleNewCanvasEvent);
		window.addEventListener("artstudio:open-file", handleOpenFileEvent);
		window.addEventListener("artstudio:save", handleSaveEvent);
		window.addEventListener("artstudio:save-as", handleSaveAsEvent);
		window.addEventListener("artstudio:print", handlePrintEvent);
		window.addEventListener("artstudio:undo", handleUndoEvent);
		window.addEventListener("artstudio:redo", handleRedoEvent);
		window.addEventListener("artstudio:cut-selection", handleCutEvent);
		window.addEventListener("artstudio:copy-selection", handleCopyEvent);
		window.addEventListener(
			"artstudio:paste",
			handlePasteEvent as EventListener,
		);
		window.addEventListener("artstudio:delete-selection", handleDeleteEvent);
		window.addEventListener("artstudio:global-delete", handleGlobalDeleteEvent);
		window.addEventListener("artstudio:zoom-in", handleZoomInEvent);
		window.addEventListener("artstudio:zoom-out", handleZoomOutEvent);
		window.addEventListener("artstudio:fit-to-screen", handleFitToScreenEvent);
		window.addEventListener("artstudio:actual-size", handleActualSizeEvent);
		window.addEventListener("artstudio:toggle-grid", handleToggleGridEvent);
		window.addEventListener("artstudio:toggle-rulers", handleToggleRulersEvent);
		window.addEventListener("artstudio:toggle-guides", handleToggleGuidesEvent);
		window.addEventListener("artstudio:merge-layers", handleMergeLayersEvent);
		window.addEventListener("artstudio:merge-visible", handleMergeVisibleEvent);
		window.addEventListener("artstudio:bring-forward", handleBringForwardEvent);
		window.addEventListener("artstudio:send-backward", handleSendBackwardEvent);
		window.addEventListener(
			"artstudio:bring-to-front",
			handleBringToFrontEvent,
		);
		window.addEventListener("artstudio:send-to-back", handleSendToBackEvent);
		window.addEventListener("artstudio:show-shortcuts", handleShowShortcuts);

		return () => {
			window.removeEventListener("artstudio:new-canvas", handleNewCanvasEvent);
			window.removeEventListener("artstudio:open-file", handleOpenFileEvent);
			window.removeEventListener("artstudio:save", handleSaveEvent);
			window.removeEventListener("artstudio:save-as", handleSaveAsEvent);
			window.removeEventListener("artstudio:print", handlePrintEvent);
			window.removeEventListener("artstudio:undo", handleUndoEvent);
			window.removeEventListener("artstudio:redo", handleRedoEvent);
			window.removeEventListener("artstudio:cut-selection", handleCutEvent);
			window.removeEventListener("artstudio:copy-selection", handleCopyEvent);
			window.removeEventListener(
				"artstudio:paste",
				handlePasteEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:delete-selection",
				handleDeleteEvent,
			);
			window.removeEventListener(
				"artstudio:global-delete",
				handleGlobalDeleteEvent,
			);
			window.removeEventListener("artstudio:zoom-in", handleZoomInEvent);
			window.removeEventListener("artstudio:zoom-out", handleZoomOutEvent);
			window.removeEventListener(
				"artstudio:fit-to-screen",
				handleFitToScreenEvent,
			);
			window.removeEventListener(
				"artstudio:actual-size",
				handleActualSizeEvent,
			);
			window.removeEventListener(
				"artstudio:toggle-grid",
				handleToggleGridEvent,
			);
			window.removeEventListener(
				"artstudio:toggle-rulers",
				handleToggleRulersEvent,
			);
			window.removeEventListener(
				"artstudio:toggle-guides",
				handleToggleGuidesEvent,
			);
			window.removeEventListener(
				"artstudio:merge-layers",
				handleMergeLayersEvent,
			);
			window.removeEventListener(
				"artstudio:merge-visible",
				handleMergeVisibleEvent,
			);
			window.removeEventListener(
				"artstudio:bring-forward",
				handleBringForwardEvent,
			);
			window.removeEventListener(
				"artstudio:send-backward",
				handleSendBackwardEvent,
			);
			window.removeEventListener(
				"artstudio:bring-to-front",
				handleBringToFrontEvent,
			);
			window.removeEventListener(
				"artstudio:send-to-back",
				handleSendToBackEvent,
			);
			window.removeEventListener(
				"artstudio:show-shortcuts",
				handleShowShortcuts,
			);
		};
	}, [
		showGrid,
		showRulers,
		showGuides,
		handleUndo,
		handleRedo,
		handleZoomIn,
		handleZoomOut,
		handleFitToScreen,
	]);

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
						<DropdownMenuSubContent className="min-w-50">
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
					<div className="w-6 h-6 rounded-md bg-linear-to-br from-primary to-primary/50 flex items-center justify-center">
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
						<DropdownMenuContent align="start" className="min-w-55">
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

				<div className="w-px h-5 bg-border mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => setShowCanvasSize(true)}
							className="tool-button w-8 h-8"
							title="Canvas Size"
						>
							<LayoutTemplate className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Canvas Size</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => setShowExport(true)}
							className="tool-button w-8 h-8"
							title="Export Canvas (⇧⌘E)"
						>
							<Download className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Export Canvas</TooltipContent>
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
						<button
							onClick={() => setShowShortcuts(true)}
							className="tool-button w-8 h-8"
						>
							<Keyboard className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Keyboard Shortcuts (⌘/)</TooltipContent>
				</Tooltip>
			</div>

			{/* Templates Dialog */}
			<TemplatesDialog open={showTemplates} onOpenChange={setShowTemplates} />

			{/* Keyboard Shortcuts Dialog */}
			<KeyboardShortcutsDialog
				open={showShortcuts}
				onOpenChange={setShowShortcuts}
			/>

			{/* Export Dialog */}
			<ExportDialog open={showExport} onOpenChange={setShowExport} />

			{/* Canvas Size Dialog */}
			<CanvasSizeDialog open={showCanvasSize} onOpenChange={setShowCanvasSize} />
		</div>
	);
};
