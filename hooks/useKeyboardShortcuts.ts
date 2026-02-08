"use client";

import { useEffect } from "react";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { useZoom } from "@/hooks/useZoom";
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
	const { zoomIn, zoomOut, zoomToFit, zoomToActualSize } = useZoom();
	const {
		// Tools
		activeTool,
		setActiveTool,
		zoom,
		setZoom,
		// Edit actions
		undo,
		redo,
		canUndo,
		canRedo,

		// File actions
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
		showNavigator,
		setShowNavigator,
		showInfoPanel,
		setShowInfoPanel,

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
		setRenderingEngine,
	} = useArtStudioStore();

	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			// Skip if typing in input/textarea
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement)?.isContentEditable
			) {
				return;
			}

			// Special handling for Escape key
			if (e.key === "Escape") {
				e.preventDefault();
				// Clear selection or exit current mode
				window.dispatchEvent(new CustomEvent("artstudio:escape"));
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
					A: "ellipse", // Added for ellipse
					Y: "polygon", // Added for polygon
					O: "line", // Added for line
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

			// ===== FILE MENU SHORTCUTS =====
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

			// ===== EDIT MENU SHORTCUTS =====
			if (matchesShortcut(e, "⌘Z")) {
				if (!e.shiftKey) {
					e.preventDefault();
					try {
						const entry = await undo();
						if (entry && entry.canvasData) {
							window.dispatchEvent(
								new CustomEvent("artstudio:restore-history", {
									detail: { canvasData: entry.canvasData },
								}),
							);
							toast.success("Undone");
						} else {
							toast.info("Nothing to undo");
						}
					} catch (error) {
						console.error("Error during undo:", error);
						toast.error("Failed to undo");
					}
					return;
				}
			}

			if (matchesShortcut(e, "⇧⌘Z")) {
				e.preventDefault();
				try {
					const entry = await redo();
					if (entry && entry.canvasData) {
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: { canvasData: entry.canvasData },
							}),
						);
						toast.success("Redone");
					} else {
						toast.info("Nothing to redo");
					}
				} catch (error) {
					console.error("Error during redo:", error);
					toast.error("Failed to redo");
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

			if (matchesShortcut(e, "⇧⌘V")) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:paste", { detail: { offset: false } }),
				);
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

			// Clear canvas
			if (e.key === "C" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
				return;
			}

			// Transform shortcuts
			if (matchesShortcut(e, "⌘T")) {
				e.preventDefault();
				setActiveTool("select");
				toast.info("Free Transform - select tool activated");
				return;
			}

			// Flip horizontal/vertical
			if (e.key === "H" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:flip-selection", {
						detail: { direction: "horizontal" },
					}),
				);
				return;
			}

			if (e.key === "V" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:flip-selection", {
						detail: { direction: "vertical" },
					}),
				);
				return;
			}

			// Rotate shortcuts
			if (e.key === "]" && e.ctrlKey && !e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:rotate-selection", {
						detail: { angle: 90 },
					}),
				);
				return;
			}

			if (e.key === "[" && e.ctrlKey && !e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:rotate-selection", {
						detail: { angle: -90 },
					}),
				);
				return;
			}

			// ===== VIEW MENU SHORTCUTS =====
			if (
				matchesShortcut(e, "⌘+") ||
				(e.key === "=" && (e.ctrlKey || e.metaKey))
			) {
				e.preventDefault();
				zoomIn(25);
				return;
			}

			if (
				matchesShortcut(e, "⌘-") ||
				(e.key === "-" && (e.ctrlKey || e.metaKey))
			) {
				e.preventDefault();
				zoomOut(25);
				return;
			}

			if (matchesShortcut(e, "⌘0")) {
				e.preventDefault();
				zoomToFit({ maxZoom: 100 });
				return;
			}

			if (matchesShortcut(e, "⌘1")) {
				e.preventDefault();
				zoomToActualSize();
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

			// Panel visibility shortcuts
			if (e.key === "F5") {
				e.preventDefault();
				setShowLeftPanel(!showLeftPanel);
				toast.success(showLeftPanel ? "Left panel hidden" : "Left panel shown");
				return;
			}

			if (e.key === "F6") {
				e.preventDefault();
				setShowRightPanel(!showRightPanel);
				toast.success(
					showRightPanel ? "Right panel hidden" : "Right panel shown",
				);
				return;
			}

			if (e.key === "F7") {
				e.preventDefault();
				setShowBrushesPanel(!showBrushesPanel);
				toast.success(
					showBrushesPanel ? "Brushes panel hidden" : "Brushes panel shown",
				);
				return;
			}

			if (e.key === "F8") {
				e.preventDefault();
				setShowColorsPanel(!showColorsPanel);
				toast.success(
					showColorsPanel ? "Colors panel hidden" : "Colors panel shown",
				);
				return;
			}

			if (e.key === "F9") {
				e.preventDefault();
				setShowLayersPanel(!showLayersPanel);
				toast.success(
					showLayersPanel ? "Layers panel hidden" : "Layers panel shown",
				);
				return;
			}

			if (e.key === "F10") {
				e.preventDefault();
				setShowHistoryPanel(!showHistoryPanel);
				toast.success(
					showHistoryPanel ? "History panel hidden" : "History panel shown",
				);
				return;
			}

			if (e.key === "F11") {
				e.preventDefault();
				setShowNavigator(!showNavigator);
				toast.success(showNavigator ? "Navigator hidden" : "Navigator shown");
				return;
			}

			if (e.key === "F12") {
				e.preventDefault();
				setShowInfoPanel(!showInfoPanel);
				toast.success(showInfoPanel ? "Info panel hidden" : "Info panel shown");
				return;
			}

			// Toggle all panels
			if (e.key === "`" && e.ctrlKey) {
				e.preventDefault();
				const allPanelsHidden = !showLeftPanel && !showRightPanel;
				setShowLeftPanel(!allPanelsHidden);
				setShowRightPanel(!allPanelsHidden);
				toast.success(
					allPanelsHidden ? "All panels shown" : "All panels hidden",
				);
				return;
			}

			// ===== IMAGE MENU SHORTCUTS =====
			if (e.key === "C" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:crop"));
				return;
			}

			// Resize canvas
			if (e.key === "R" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:resize-canvas"));
				return;
			}

			// Rotate canvas
			if (e.key === "]" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:rotate-canvas", { detail: { angle: 90 } }),
				);
				return;
			}

			if (e.key === "[" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:rotate-canvas", {
						detail: { angle: -90 },
					}),
				);
				return;
			}

			// Flip canvas
			if (e.key === "H" && e.ctrlKey && e.altKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:flip-canvas", {
						detail: { direction: "horizontal" },
					}),
				);
				return;
			}

			if (e.key === "V" && e.ctrlKey && e.altKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:flip-canvas", {
						detail: { direction: "vertical" },
					}),
				);
				return;
			}

			// ===== LAYER MENU SHORTCUTS =====
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

			// Layer visibility toggle
			if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				if (activeLayerId) {
					toggleLayerVisibility(activeLayerId);
					toast.success("Layer visibility toggled");
				}
				return;
			}

			// Lock/unlock layer
			if (e.key === "L" && e.ctrlKey && !e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:lock-layer"));
				return;
			}

			// ===== FILTER MENU SHORTCUTS =====
			// Invert colors
			if (e.key === "I" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:apply-filter", {
						detail: { filter: "Invert" },
					}),
				);
				return;
			}

			// Desaturate
			if (e.key === "U" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:apply-filter", {
						detail: { filter: "Desaturate" },
					}),
				);
				return;
			}

			// Auto tone
			if (e.key === "T" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:apply-filter", {
						detail: { filter: "Auto Tone" },
					}),
				);
				return;
			}

			// Auto contrast
			if (e.key === "C" && e.ctrlKey && e.altKey) {
				e.preventDefault();
				window.dispatchEvent(
					new CustomEvent("artstudio:apply-filter", {
						detail: { filter: "Auto Contrast" },
					}),
				);
				return;
			}

			// ===== WINDOW MENU SHORTCUTS =====
			// Reset workspace
			if (e.key === "R" && e.ctrlKey && e.altKey) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:reset-workspace"));
				return;
			}

			// Switch rendering engine
			if (e.key === "E" && e.ctrlKey && e.shiftKey) {
				e.preventDefault();
				setRenderingEngine("konva");
				toast.success("Rendering engine switched");
				return;
			}

			// ===== MISC SHORTCUTS =====
			// Keyboard shortcuts dialog
			if ((e.ctrlKey || e.metaKey) && e.key === "/") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:show-shortcuts"));
				return;
			}

			// Help dialog
			if (e.key === "F1") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:show-help"));
				return;
			}

			// Fullscreen toggle
			if (e.key === "F11") {
				e.preventDefault();
				if (!document.fullscreenElement) {
					document.documentElement.requestFullscreen();
				} else {
					document.exitFullscreen();
				}
				return;
			}

			// Refresh/clear all
			if (e.key === "F5" && e.ctrlKey) {
				e.preventDefault();
				clearHistory();
				window.dispatchEvent(new CustomEvent("artstudio:clear-canvas"));
				toast.success("Canvas and history cleared");
				return;
			}

			// Select all
			if (matchesShortcut(e, "⌘A")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:select-all"));
				return;
			}

			// Deselect all
			if (matchesShortcut(e, "⇧⌘A")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:deselect-all"));
				return;
			}

			// Group selection
			if (matchesShortcut(e, "⌘G")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:group-selection"));
				return;
			}

			// Ungroup selection
			if (matchesShortcut(e, "⇧⌘G")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:ungroup-selection"));
				return;
			}

			// Duplicate selection
			if (matchesShortcut(e, "⌘D")) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("artstudio:duplicate-selection"));
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
		showBrushesPanel,
		showColorsPanel,
		showLayersPanel,
		showHistoryPanel,
		showNavigator,
		showInfoPanel,
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
		toggleLayerVisibility,
		clearHistory,
		setRenderingEngine,
	]);
};
