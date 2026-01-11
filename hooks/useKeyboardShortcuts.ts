"use client";

import { useEffect } from "react";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { toast } from "sonner";

// Helper to check if key combination matches
const matchesShortcut = (e: KeyboardEvent, shortcut: string): boolean => {
	const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

	const hasCmd = shortcut.includes("⌘");
	const hasShift = shortcut.includes("⇧");
	const hasAlt = shortcut.includes("⌥");

	// Extract the key from shortcut (remove modifiers)
	let key = shortcut.replace(/[⌘⇧⌥]/g, "").trim();

	// Special key mappings
	const keyMap: Record<string, string> = {
		"+": "=",
		"-": "-",
		"0": "0",
		"1": "1",
		"'": "'",
		";": ";",
		"/": "/",
		"⌫": "Backspace",
		DEL: "Delete",
	};

	const mappedKey = keyMap[key] || key;

	return (
		(hasCmd ? cmdOrCtrl : !cmdOrCtrl && !e.metaKey && !e.ctrlKey) &&
		(hasShift ? e.shiftKey : !e.shiftKey) &&
		(hasAlt ? e.altKey : !e.altKey) &&
		e.key.toUpperCase() === mappedKey.toUpperCase()
	);
};

export const useKeyboardShortcuts = () => {
	const {
		// Tools
		activeTool,
		setActiveTool,

		// Edit actions
		undo,
		redo,
		canUndo,
		canRedo,

		// File actions
		setZoom,
		zoom,
		setPanOffset,

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
		showGrid,
		setShowGrid,
		showRulers,
		setShowRulers,
		showGuides,
		setShowGuides,

		// Colors
		swapColors,
		setPrimaryColor,
		setSecondaryColor,

		// Layers
		addLayer,
		activeLayerId,
		duplicateLayer,
		removeLayer,
		toggleLayerVisibility,

		// Canvas
		clearHistory,
	} = useArtStudioStore();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if typing in input/textarea
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement)?.isContentEditable
			) {
				return;
			}

			// Gradient tool shortcut (Shift+G) - check before single key tools
			if (
				e.shiftKey &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.altKey &&
				e.key.toUpperCase() === "G"
			) {
				e.preventDefault();
				setActiveTool("gradient");
				return;
			}

			// Tool shortcuts (single keys, no modifiers)
			if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
				const toolMap: Record<string, Tool> = {
					V: "select",
					M: "marquee",
					L: "lasso",
					W: "magicwand",
					B: "brush",
					N: "pencil",
					E: "eraser",
					G: "fill",
					I: "eyedropper",
					S: "clone",
					J: "healing",
					R: "blur",
					U: "rectangle", // Default to rectangle, can cycle
					P: "pen",
					T: "text",
					H: "hand",
					Z: "zoom",
					C: "select", // Crop tool uses select
				};

				if (toolMap[e.key.toUpperCase()]) {
					e.preventDefault();
					setActiveTool(toolMap[e.key.toUpperCase()]);
					return;
				}

				// Color shortcuts
				if (e.key.toUpperCase() === "X") {
					e.preventDefault();
					swapColors();
					toast.success("Colors swapped");
					return;
				}

				if (e.key.toUpperCase() === "D") {
					e.preventDefault();
					setPrimaryColor("#ffffff");
					setSecondaryColor("#000000");
					toast.success("Colors reset to defaults");
					return;
				}
			}

			// File menu shortcuts
			if (matchesShortcut(e, "⌘N")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:new-canvas"));
				return;
			}

			if (matchesShortcut(e, "⌘O")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:open-file"));
				return;
			}

			if (matchesShortcut(e, "⌘S")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:save"));
				return;
			}

			if (matchesShortcut(e, "⇧⌘S")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:save-as"));
				return;
			}

			if (matchesShortcut(e, "⌘P")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:print"));
				return;
			}

			// Edit menu shortcuts
			if (matchesShortcut(e, "⌘Z")) {
				if (!e.shiftKey) {
					e.preventDefault();
					const entry = undo();
					if (entry) {
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: { canvasData: entry.canvasData },
							}),
						);
						toast.success("Undone");
					} else {
						toast.info("Nothing to undo");
					}
					return;
				}
			}

			if (matchesShortcut(e, "⇧⌘Z")) {
				e.preventDefault();
				const entry = redo();
				if (entry) {
					window.dispatchEvent(
						new CustomEvent("artstudio:restore-history", {
							detail: { canvasData: entry.canvasData },
						}),
					);
					toast.success("Redone");
				} else {
					toast.info("Nothing to redo");
				}
				return;
			}

			if (matchesShortcut(e, "⌘X")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:cut-selection"));
				return;
			}

			if (matchesShortcut(e, "⌘C")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:copy-selection"));
				return;
			}

			if (matchesShortcut(e, "⌘V")) {
				e.preventDefault();
				if (e.shiftKey) {
					window.dispatchEvent(
						new CustomEvent("artstudio:paste", { detail: { offset: false } }),
					);
				} else {
					window.dispatchEvent(
						new CustomEvent("artstudio:paste", { detail: { offset: true } }),
					);
				}
				return;
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				if (
					!(
						e.target instanceof HTMLInputElement ||
						e.target instanceof HTMLTextAreaElement
					)
				) {
					e.preventDefault();
					window.dispatchEvent(new CustomEvent("artstudio:delete-selection"));
					return;
				}
			}

			if (matchesShortcut(e, "⇧⌘⌫")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:global-delete"));
				return;
			}

			// Transform shortcuts
			if (matchesShortcut(e, "⌘T")) {
				e.preventDefault();
				setActiveTool("select");
				toast.info("Free Transform - select tool activated");
				return;
			}

			// View menu shortcuts
			if (
				matchesShortcut(e, "⌘+") ||
				(e.key === "=" && (e.ctrlKey || e.metaKey))
			) {
				e.preventDefault();
				const newZoom = Math.min(500, zoom + 25);
				setZoom(newZoom);
				toast.info(`Zoom: ${newZoom}%`);
				return;
			}

			if (
				matchesShortcut(e, "⌘-") ||
				(e.key === "-" && (e.ctrlKey || e.metaKey))
			) {
				e.preventDefault();
				const newZoom = Math.max(10, zoom - 25);
				setZoom(newZoom);
				toast.info(`Zoom: ${newZoom}%`);
				return;
			}

			if (matchesShortcut(e, "⌘0")) {
				e.preventDefault();
				const canvas = window.fabricCanvas || window.konvaStage;
				if (canvas) {
					const canvasWidth = canvas.width || 1920;
					const canvasHeight = canvas.height || 1080;
					const viewportWidth =
						window.innerWidth -
						(showLeftPanel ? 56 : 0) -
						(showRightPanel ? 320 : 0) -
						100;
					const viewportHeight = window.innerHeight - 80 - 40;
					const zoomX = (viewportWidth / canvasWidth) * 100;
					const zoomY = (viewportHeight / canvasHeight) * 100;
					const fitZoom = Math.min(zoomX, zoomY, 100);
					setZoom(Math.max(10, Math.min(100, fitZoom)));
					setPanOffset({ x: 0, y: 0 });
					toast.success("Canvas fitted to screen");
				}
				return;
			}

			if (matchesShortcut(e, "⌘1")) {
				e.preventDefault();
				setZoom(100);
				setPanOffset({ x: 0, y: 0 });
				toast.success("Zoom reset to 100%");
				return;
			}

			if (matchesShortcut(e, "⌘'")) {
				e.preventDefault();
				setShowGrid(!showGrid);
				toast.success(showGrid ? "Grid hidden" : "Grid shown");
				return;
			}

			if (matchesShortcut(e, "⌘R")) {
				e.preventDefault();
				setShowRulers(!showRulers);
				toast.success(showRulers ? "Rulers hidden" : "Rulers shown");
				return;
			}

			if (matchesShortcut(e, "⌘;")) {
				e.preventDefault();
				setShowGuides(!showGuides);
				toast.success(showGuides ? "Guides hidden" : "Guides shown");
				return;
			}

			// Layer shortcuts
			if (matchesShortcut(e, "⇧⌘N")) {
				e.preventDefault();
				addLayer();
				toast.success("New layer added");
				return;
			}

			if (matchesShortcut(e, "⌘J")) {
				e.preventDefault();
				if (activeLayerId) {
					duplicateLayer(activeLayerId);
					toast.success("Layer duplicated");
				}
				return;
			}

			if (matchesShortcut(e, "⌘E")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:merge-layers"));
				return;
			}

			if (matchesShortcut(e, "⇧⌘E")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:merge-visible"));
				return;
			}

			if (matchesShortcut(e, "⌘]")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:bring-forward"));
				return;
			}

			if (matchesShortcut(e, "⌘[")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:send-backward"));
				return;
			}

			if (matchesShortcut(e, "⇧⌘]")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:bring-to-front"));
				return;
			}

			if (matchesShortcut(e, "⇧⌘[")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:send-to-back"));
				return;
			}

			// Keyboard shortcuts dialog
			if ((e.ctrlKey || e.metaKey) && e.key === "/") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:show-shortcuts"));
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [
		activeTool,
		setActiveTool,
		undo,
		redo,
		canUndo,
		canRedo,
		zoom,
		setZoom,
		setPanOffset,
		showLeftPanel,
		showRightPanel,
		showGrid,
		setShowGrid,
		showRulers,
		setShowRulers,
		showGuides,
		setShowGuides,
		swapColors,
		setPrimaryColor,
		setSecondaryColor,
		addLayer,
		activeLayerId,
		duplicateLayer,
	]);
};
