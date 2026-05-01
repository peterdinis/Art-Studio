"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export type Tool =
	| "brush"
	| "pencil"
	| "eraser"
	| "fill"
	| "gradient"
	| "eyedropper"
	| "clone"
	| "healing"
	| "blur"
	| "rectangle"
	| "ellipse"
	| "polygon"
	| "line"
	| "pen"
	| "text"
	| "select"
	| "marquee"
	| "lasso"
	| "magicwand"
	| "move"
	| "hand"
	| "zoom"
	| "undoZoom"
	| "crop"
	| "dodge"
	| "burn"
	| "star";

export interface Layer {
	id: string;
	name: string;
	visible: boolean;
	opacity: number;
	locked: boolean;
}

export interface StarSettings {
	points: number;
	innerRadius: number;
	outerRadius: number;
	rotation: number;
	fillType: "solid" | "gradient" | "none";
	strokeWidth: number;
	strokeColor: string;
	fillColor: string;
	cornerRadius: number;
}

export interface LineSettings {
	type: "solid" | "dashed" | "dotted" | "dash-dot";
	arrowType: "none" | "start" | "end" | "both";
	dashPattern: string;
	capType: "butt" | "round" | "square";
	joinType: "miter" | "round" | "bevel";
	isPerfect: boolean;
	startCap: string;
	endCap: string;
	lineStyle: "straight" | "curved" | "freehand";
	tension: number;
	precision: number;
	arrowSize: number;
}

export interface TextObject {
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
	textAlign: "left" | "center" | "right" | "justify";
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

export interface BrushSettings {
	size: number;
	opacity: number;
	hardness: number;
	smoothing: number;
	strokeWidth: number;
	feather: number;
	tolerance: number;
	cornerRadius: number;
	fillType: "solid" | "gradient" | "none";
	sides: number;
	fillTolerance: number;
	fillContiguous: boolean;
	fillOpacity: number;
	fillBlendMode: "normal" | "multiply" | "screen" | "overlay";
	fillAntiAlias: boolean;
	fontFamily: string;
	fontSize: number;
	fontWeight: string;
	textAlign: "left" | "center" | "right" | "justify";
	textDecoration: "none" | "underline" | "line-through";
	fontStyle: "normal" | "italic";
	lineHeight: number;
	letterSpacing: number;
	gradientType: "linear" | "radial";
	gradientStops: { color: string; position: number }[];
	cloneSourceX: number;
	cloneSourceY: number;
	cloneAligned: boolean;
	cloneOpacity: number;
	healingSize: number;
	healingOpacity: number;
	healingHardness: number;
	healingMode: "clone" | "texture" | "lighten" | "darken";
	blurIntensity: number;
	blurSize: number;
	blurMode: "gaussian" | "box" | "motion";
	blurQuality: "low" | "medium" | "high";
	gradientOpacity?: number;
	gradientDithering?: boolean;
	gradientAntiAlias?: boolean;
	gradientNoise?: number;
	gradientCenterX?: number;
	gradientCenterY?: number;
	gradientAngle: number;
	gradientScale: number;
	dodgeIntensity: number;
	burnIntensity: number;
	cropRect: { x: number; y: number; width: number; height: number } | null;

	// Star-specific settings
	starPoints: number;
	starInnerRadius: number;
	starOuterRadius: number;
	starRotation: number;
	starFillType: "solid" | "gradient" | "none";
	starStrokeColor: string;
	starFillColor: string;
	starCornerRadius: number;

	// Text-specific settings
	textWrap: "word" | "char" | "none";
	textPadding: number;
	textOpacity: number;
	textShadow: boolean;
	textShadowColor: string;
	textShadowBlur: number;
	textShadowOffsetX: number;
	textShadowOffsetY: number;
	textOutline: boolean;
	textOutlineColor: string;
	textOutlineWidth: number;
	textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
	textBackground: boolean;
	textBackgroundColor: string;
	textBackgroundOpacity: number;
	textEditingMode: "inline" | "modal";

	// Line-specific settings
	lineSettings?: LineSettings;
}

export interface GradientObject {
	id: string;
	type: "linear" | "radial";
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	colorStops: { offset: number; color: string }[];
	layerId: string;
	name?: string;
}

export interface HistoryEntry {
	canvasData: string;
	thumbnail: string | null;
	timestamp: number;
	action?: string;
}

export interface CanvasSize {
	width: number;
	height: number;
	backgroundColor: string;
}

export type RenderingEngine = "fabric" | "konva";

interface ArtStudioState {
	// Session info
	sessionId: string | null;

	// Canvas state
	renderingEngine: RenderingEngine;
	activeTool: Tool;
	primaryColor: string;
	secondaryColor: string;
	recentColors: string[];
	brushSettings: BrushSettings;
	layers: Layer[];
	activeLayerId: string | null;
	loadedImages: { id: string; src: string; name: string }[];
	gradients: GradientObject[];
	zoom: number;
	panOffset: { x: number; y: number };
	canvasSize: CanvasSize | null;

	// Text objects state
	textObjects: TextObject[];
	editingTextId: string | null;

	// History (stored in session DB)
	history: HistoryEntry[];
	historyIndex: number;

	// Selection
	selectionBounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null;
	selectionPath: number[] | null;

	// UI state (persistent in localStorage)
	showColorPicker: boolean;
	showLeftPanel: boolean;
	showRightPanel: boolean;
	showBrushesPanel: boolean;
	showColorsPanel: boolean;
	showLayersPanel: boolean;
	showHistoryPanel: boolean;
	showNavigator: boolean;
	showInfoPanel: boolean;
	showFillPanel: boolean;
	showGradientPanel: boolean;
	showStarPanel: boolean;
	showLinePanel: boolean;
	showGrid: boolean;
	showRulers: boolean;
	showGuides: boolean;

	// Preview
	fillPreview: { x: number; y: number; color: string } | null;
	healingSource: { x: number; y: number } | null;

	// Selection
	selectedId: string | null;
	setSelectedId: (id: string | null) => void;

	// Actions
	setRenderingEngine: (engine: RenderingEngine) => void;
	setActiveTool: (tool: Tool) => void;
	setPrimaryColor: (color: string) => void;
	setSecondaryColor: (color: string) => void;
	swapColors: () => void;
	addRecentColor: (color: string) => void;
	setBrushSettings: (settings: Partial<BrushSettings>) => void;
	resetBrushSettings: () => void;
	setToolDefaults: (tool: Tool) => void;
	addLayer: () => void;
	removeLayer: (id: string) => void;
	setActiveLayer: (id: string) => void;
	toggleLayerVisibility: (id: string) => void;
	toggleLayerLock: (id: string) => void;
	setLayerOpacity: (id: string, opacity: number) => void;
	renameLayer: (id: string, name: string) => void;
	duplicateLayer: (id: string) => void;
	reorderLayers: (fromIndex: number, toIndex: number) => void;
	clearLayers: () => void;
	mergeLayers: (layerIds: string[]) => void;
	addLoadedImage: (image: { id: string; src: string; name: string }) => void;
	removeLoadedImage: (id: string) => void;
	clearLoadedImages: () => void;
	addGradient: (gradient: GradientObject) => void;
	updateGradient: (id: string, updates: Partial<GradientObject>) => void;
	removeGradient: (id: string) => void;
	clearGradients: () => void;
	setGradients: (gradients: any[]) => void;
	setZoom: (zoom: number) => void;
	setPanOffset: (offset: { x: number; y: number }) => void;
	setCanvasSize: (size: CanvasSize) => void;
	resetCanvasView: () => void;

	// Text operations
	addTextObject: (textObject: TextObject) => void;
	updateTextObject: (id: string, updates: Partial<TextObject>) => void;
	deleteTextObject: (id: string) => void;
	startTextEdit: (id: string) => void;
	cancelTextEdit: (id: string) => void;
	setEditingTextId: (id: string | null) => void;
	setTextObjects: (textObjects: TextObject[]) => void;

	// Enhanced history methods with session DB
	addToHistory: (
		canvasData: string,
		thumbnail?: string,
		action?: string,
	) => Promise<void>;
	undo: () => Promise<HistoryEntry | null>;
	redo: () => Promise<HistoryEntry | null>;
	canUndo: () => boolean;
	canRedo: () => boolean;
	restoreToHistoryIndex: (index: number) => Promise<void>;
	clearHistory: () => void;
	clearSessionHistory: () => Promise<void>;

	// Session management
	initializeSession: () => Promise<void>;
	saveSession: () => Promise<void>;
	clearCurrentSession: () => Promise<void>;
	exportSessionData: () => Promise<any>;
	importSessionData: (data: any) => Promise<boolean>;

	clearRecentColors: () => any;
	// NEW: Clear canvas method
	clearCanvas: (options?: { preserveBackground?: boolean }) => Promise<void>;
	clearCanvasWithConfirmation: () => Promise<boolean>;

	setSelectionBounds: (
		bounds: { x: number; y: number; width: number; height: number } | null,
	) => void;
	setSelectionPath: (path: number[] | null) => void;
	clearSelection: () => void;
	setShowColorPicker: (show: boolean) => void;
	setShowLeftPanel: (show: boolean) => void;
	setShowRightPanel: (show: boolean) => void;
	setShowBrushesPanel: (show: boolean) => void;
	setShowColorsPanel: (show: boolean) => void;
	setShowLayersPanel: (show: boolean) => void;
	setShowHistoryPanel: (show: boolean) => void;
	setShowNavigator: (show: boolean) => void;
	setShowInfoPanel: (show: boolean) => void;
	setShowFillPanel: (show: boolean) => void;
	setShowGradientPanel: (show: boolean) => void;
	setShowStarPanel: (show: boolean) => void;
	setShowLinePanel: (show: boolean) => void;
	setShowGrid: (show: boolean) => void;
	setShowRulers: (show: boolean) => void;
	setShowGuides: (show: boolean) => void;
	resetWorkspace: () => void;
	setFillPreview: (
		preview: { x: number; y: number; color: string } | null,
	) => void;
	setHealingSource: (source: { x: number; y: number } | null) => void;
}

const generateLayerId = () =>
	`layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultBrushSettings: BrushSettings = {
	size: 10,
	opacity: 100,
	hardness: 100,
	smoothing: 20,
	strokeWidth: 2,
	feather: 0,
	tolerance: 32,
	cornerRadius: 0,
	fillType: "solid",
	sides: 5,
	fillTolerance: 32,
	fillContiguous: true,
	fillOpacity: 100,
	fillBlendMode: "normal",
	fillAntiAlias: true,
	fontFamily: "Arial",
	fontSize: 16,
	fontWeight: "normal",
	textAlign: "left",
	textDecoration: "none",
	fontStyle: "normal",
	lineHeight: 1.2,
	letterSpacing: 0,
	gradientType: "linear",
	gradientStops: [
		{ color: "#ffffff", position: 0 },
		{ color: "#000000", position: 1 },
	],
	cloneSourceX: 0,
	cloneSourceY: 0,
	cloneAligned: true,
	cloneOpacity: 100,
	healingSize: 20,
	healingOpacity: 100,
	healingHardness: 50,
	healingMode: "clone",
	blurIntensity: 10,
	blurSize: 20,
	blurMode: "gaussian",
	blurQuality: "medium",
	gradientAngle: 90,
	gradientScale: 100,
	dodgeIntensity: 50,
	burnIntensity: 50,
	cropRect: null,

	// Star-specific default settings
	starPoints: 5,
	starInnerRadius: 30,
	starOuterRadius: 60,
	starRotation: 0,
	starFillType: "solid",
	starStrokeColor: "#000000",
	starFillColor: "#ffffff",
	starCornerRadius: 0,

	// Text-specific default settings
	textWrap: "word",
	textPadding: 4,
	textOpacity: 100,
	textShadow: false,
	textShadowColor: "#00000080",
	textShadowBlur: 5,
	textShadowOffsetX: 2,
	textShadowOffsetY: 2,
	textOutline: false,
	textOutlineColor: "#ffffff",
	textOutlineWidth: 1,
	textTransform: "none",
	textBackground: false,
	textBackgroundColor: "#ffffff",
	textBackgroundOpacity: 20,
	textEditingMode: "inline",

	// Line-specific default settings
	lineSettings: {
		type: "solid",
		arrowType: "none",
		dashPattern: "5,5",
		capType: "round",
		joinType: "round",
		isPerfect: false,
		startCap: "none",
		endCap: "none",
		lineStyle: "straight",
		tension: 0.5,
		precision: 10,
		arrowSize: 10,
	},
};

// Helper to serialize canvas state (excluding UI)
const serializeCanvasState = (state: any) => {
	const {
		showColorPicker,
		showLeftPanel,
		showRightPanel,
		showBrushesPanel,
		showColorsPanel,
		showLayersPanel,
		showHistoryPanel,
		showNavigator,
		showInfoPanel,
		showFillPanel,
		showGradientPanel,
		showStarPanel,
		showLinePanel,
		showGrid,
		showRulers,
		showGuides,
		fillPreview,
		healingSource,
		selectionBounds,
		selectionPath,
		history,
		historyIndex,
		sessionId,
		editingTextId,
		...canvasState
	} = state;

	return {
		layers: canvasState.layers,
		activeLayerId: canvasState.activeLayerId,
		loadedImages: canvasState.loadedImages,
		gradients: canvasState.gradients,
		zoom: canvasState.zoom,
		panOffset: canvasState.panOffset,
		canvasSize: canvasState.canvasSize,
		renderingEngine: canvasState.renderingEngine,
		activeTool: canvasState.activeTool,
		primaryColor: canvasState.primaryColor,
		secondaryColor: canvasState.secondaryColor,
		recentColors: canvasState.recentColors,
		brushSettings: canvasState.brushSettings,
		selectionBounds: canvasState.selectionBounds,
		selectionPath: canvasState.selectionPath,
		textObjects: canvasState.textObjects,
	};
};

// Helper to deserialize canvas state
const deserializeCanvasState = (data: any, currentState: any) => {
	return {
		...currentState,
		layers: data.layers || currentState.layers,
		activeLayerId: data.activeLayerId || currentState.activeLayerId,
		loadedImages: data.loadedImages || currentState.loadedImages,
		gradients: data.gradients || currentState.gradients,
		zoom: data.zoom || currentState.zoom,
		panOffset: data.panOffset || currentState.panOffset,
		canvasSize: data.canvasSize || currentState.canvasSize,
		renderingEngine: data.renderingEngine || currentState.renderingEngine,
		activeTool: data.activeTool || currentState.activeTool,
		primaryColor: data.primaryColor || currentState.primaryColor,
		secondaryColor: data.secondaryColor || currentState.secondaryColor,
		recentColors: data.recentColors || currentState.recentColors,
		brushSettings: data.brushSettings || currentState.brushSettings,
		selectionBounds: data.selectionBounds || currentState.selectionBounds,
		selectionPath: data.selectionPath || currentState.selectionPath,
		textObjects: data.textObjects || currentState.textObjects,
	};
};

export const useArtStudioStore = create<ArtStudioState>()(
	persist(
		(set, get) => ({
			// Initial state
			sessionId: null,
			renderingEngine: "konva",
			activeTool: "brush",
			primaryColor: "#ffffff",
			secondaryColor: "#000000",
			recentColors: [
				"#ffffff",
				"#000000",
				"#ff0000",
				"#00ff00",
				"#0000ff",
				"#ffff00",
				"#ff00ff",
				"#00ffff",
			],
			brushSettings: defaultBrushSettings,
			layers: [
				{
					id: "layer-1",
					name: "Background",
					visible: true,
					opacity: 100,
					locked: false,
				},
			],
			activeLayerId: "layer-1",
			loadedImages: [],
			gradients: [],
			zoom: 100,
			panOffset: { x: 0, y: 0 },
			canvasSize: null,
			textObjects: [],
			editingTextId: null,
			history: [],
			historyIndex: -1,
			selectionBounds: null,
			selectionPath: null,
			showColorPicker: false,
			showLeftPanel: true,
			showRightPanel: true,
			showBrushesPanel: true,
			showColorsPanel: true,
			showLayersPanel: true,
			showHistoryPanel: true,
			showNavigator: false,
			showInfoPanel: false,
			showFillPanel: false,
			showGradientPanel: false,
			showStarPanel: false,
			showLinePanel: true,
			showGrid: false,
			showRulers: false,
			showGuides: false,
			fillPreview: null,
			healingSource: null,
			selectedId: null,

			// ========== TEXT OPERATIONS ==========

			addTextObject: (textObject) =>
				set((state) => ({
					textObjects: [...state.textObjects, textObject],
					selectedId: textObject.id,
					editingTextId: textObject.isEditing
						? textObject.id
						: state.editingTextId,
				})),

			updateTextObject: (id, updates) =>
				set((state) => ({
					textObjects: state.textObjects.map((text) =>
						text.id === id ? { ...text, ...updates } : text,
					),
				})),

			deleteTextObject: (id) =>
				set((state) => ({
					textObjects: state.textObjects.filter((text) => text.id !== id),
					selectedId: state.selectedId === id ? null : state.selectedId,
					editingTextId:
						state.editingTextId === id ? null : state.editingTextId,
				})),

			startTextEdit: (id) =>
				set((state) => ({
					textObjects: state.textObjects.map((text) =>
						text.id === id ? { ...text, isEditing: true } : text,
					),
					editingTextId: id,
					selectedId: id,
				})),

			cancelTextEdit: (id) =>
				set((state) => ({
					textObjects: state.textObjects.map((text) =>
						text.id === id ? { ...text, isEditing: false } : text,
					),
					editingTextId: null,
				})),

			setEditingTextId: (id) => set({ editingTextId: id }),

			setTextObjects: (textObjects) => set({ textObjects }),

			// ========== SESSION MANAGEMENT ==========

			initializeSession: async () => {
				const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
				set({ sessionId });
				console.log("Session initialized:", sessionId);
			},

			saveSession: async () => {
				console.log("Session save called (no-op, IndexedDB removed)");
			},

			clearCurrentSession: async () => {
				set({
					sessionId: null,
					layers: [
						{
							id: "layer-1",
							name: "Background",
							visible: true,
							opacity: 100,
							locked: false,
						},
					],
					activeLayerId: "layer-1",
					loadedImages: [],
					gradients: [],
					zoom: 100,
					panOffset: { x: 0, y: 0 },
					canvasSize: null,
					textObjects: [],
					editingTextId: null,
					history: [],
					historyIndex: -1,
					selectionBounds: null,
					selectionPath: null,
					fillPreview: null,
					healingSource: null,
					selectedId: null,
				});

				await get().initializeSession();
				console.log("Session cleared, new session started");
			},

			exportSessionData: async () => {
				const state = get();
				const canvasState = serializeCanvasState(state);

				const exportData = {
					version: "1.0",
					timestamp: Date.now(),
					sessionId: state.sessionId,
					canvasState,
					history: state.history.map((entry) => ({
						canvasData: entry.canvasData,
						action: entry.action,
						timestamp: entry.timestamp,
					})),
					metadata: {
						layersCount: state.layers.length,
						imagesCount: state.loadedImages.length,
						gradientsCount: state.gradients.length,
						textObjectsCount: state.textObjects.length,
					},
				};

				return exportData;
			},

			importSessionData: async (data: any) => {
				try {
					if (!data.canvasState || !data.version) {
						throw new Error("Invalid session data format");
					}

					await get().clearCurrentSession();

					const restoredState = deserializeCanvasState(data.canvasState, get());
					set(restoredState);

					window.dispatchEvent(
						new CustomEvent("artstudio:import-session", {
							detail: { sessionData: data.canvasState },
						}),
					);

					console.log("Session imported successfully");
					return true;
				} catch (error) {
					console.error("Error importing session:", error);
					return false;
				}
			},

			// ========== ENHANCED HISTORY METHODS ==========

			addToHistory: async (canvasData, thumbnail = "", action) => {
				const state = get();

				const { history, historyIndex } = state;
				const newEntry = {
					canvasData,
					thumbnail,
					timestamp: Date.now(),
					action,
				};

				const newHistory = history.slice(0, historyIndex + 1);
				newHistory.push(newEntry);

				// Zväčšiť limit histórie na 50 záznamov pre lepšie undo/redo
				const trimmedHistory = newHistory.slice(-50);

				set({
					history: trimmedHistory,
					historyIndex: trimmedHistory.length - 1,
				});

				console.log(
					`History saved: ${action}, index: ${trimmedHistory.length - 1}, entries: ${trimmedHistory.length}`,
				);

				const shouldAutoSave =
					action &&
					[
						"brush_stroke",
						"layer_add",
						"layer_delete",
						"image_import",
						"text_add",
						"text_edit",
						"selection",
						"star_add",
						"line_add",
					].some((keyword) => action.includes(keyword));

				if (shouldAutoSave) {
					setTimeout(() => {
						get()
							.saveSession()
							.catch(() => { });
					}, 1000);
				}
			},

			undo: async () => {
				const { history, historyIndex } = get();

				if (historyIndex > 0) {
					const newIndex = historyIndex - 1;
					set({ historyIndex: newIndex });

					const entry = history[newIndex];
					console.log(`Undo to index ${newIndex}, entry:`, entry);

					if (entry?.canvasData) {
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: {
									canvasData: entry.canvasData,
									action: "undo",
									timestamp: entry.timestamp,
								},
							}),
						);
					}

					return entry || null;
				}
				console.log("Cannot undo - historyIndex:", historyIndex);
				return null;
			},

			redo: async () => {
				const { history, historyIndex } = get();

				if (historyIndex < history.length - 1) {
					const newIndex = historyIndex + 1;
					set({ historyIndex: newIndex });

					const entry = history[newIndex];
					console.log(`Redo to index ${newIndex}, entry:`, entry);

					if (entry?.canvasData) {
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: {
									canvasData: entry.canvasData,
									action: "redo",
									timestamp: entry.timestamp,
								},
							}),
						);
					}
					return entry;
				}
				console.log(
					"Cannot redo - historyIndex:",
					historyIndex,
					"history length:",
					history.length,
				);
				return null;
			},

			canUndo: () => {
				const { historyIndex } = get();
				return historyIndex > 0;
			},

			canRedo: () => {
				const { history, historyIndex } = get();
				return historyIndex < history.length - 1;
			},

			restoreToHistoryIndex: async (index: number) => {
				const { history, historyIndex } = get();
				if (index >= 0 && index < history.length && index !== historyIndex) {
					set({ historyIndex: index });

					const entry = history[index];
					if (entry?.canvasData) {
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-history", {
								detail: {
									canvasData: entry.canvasData,
									action: "restore",
									index,
									timestamp: entry.timestamp,
								},
							}),
						);
					}
				}
			},

			clearHistory: () => {
				set({
					history: [],
					historyIndex: -1,
				});
			},

			clearSessionHistory: async () => {
				const { sessionId } = get();

				set({
					history: [],
					historyIndex: -1,
				});

				window.dispatchEvent(
					new CustomEvent("artstudio:history-cleared", {
						detail: { sessionId },
					}),
				);

				console.log("Session history cleared");
			},

			// ========== NEW CLEAR CANVAS METHODS ==========

			clearCanvas: async (options?: { preserveBackground?: boolean }) => {
				const preserve = options?.preserveBackground ?? false;

				// Clear all canvas data
				set({
					textObjects: [],
					selectionBounds: null,
					selectionPath: null,
					selectedId: null,
					editingTextId: null,
					fillPreview: null,
					healingSource: null,
				});

				// Dispatch event to clear canvas content
				window.dispatchEvent(
					new CustomEvent("artstudio:clear-canvas", {
						detail: { preserveBackground: preserve },
					}),
				);

				// Add to history
				await get().addToHistory(
					JSON.stringify({ objects: [] }),
					"",
					"clear_canvas",
				);

				toast.success(
					preserve
						? "Canvas cleared (background preserved)"
						: "Canvas completely cleared",
				);

				// Save session
				setTimeout(() => {
					get()
						.saveSession()
						.catch(() => { });
				}, 500);
			},

			clearCanvasWithConfirmation: async () => {
				return new Promise((resolve) => {
					// Create custom confirmation dialog
					const confirmed = window.confirm(
						"Are you sure you want to clear the canvas? This action cannot be undone.",
					);

					if (confirmed) {
						get().clearCanvas({ preserveBackground: false });
						resolve(true);
					} else {
						resolve(false);
					}
				});
			},

			// ========== TOOL AND CANVAS ACTIONS ==========

			setRenderingEngine: (engine) => set({ renderingEngine: engine }),

			setActiveTool: (tool) => {
				const { editingTextId } = get();
				if (editingTextId && tool !== "text") {
					get().cancelTextEdit(editingTextId);
				}

				set({ activeTool: tool });
				get().setToolDefaults(tool);
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => { }),
					2000,
				);
			},

			setPrimaryColor: (color) => {
				set({ primaryColor: color });
				get().addRecentColor(color);
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => { }),
					2000,
				);
			},

			setSecondaryColor: (color) => {
				set({ secondaryColor: color });
			},

			swapColors: () => {
				const { primaryColor, secondaryColor } = get();
				set({ primaryColor: secondaryColor, secondaryColor: primaryColor });
			},

			addRecentColor: (color) => {
				const { recentColors } = get();
				if (recentColors.includes(color)) return;
				const newColors = [color, ...recentColors.slice(0, 11)];
				set({ recentColors: newColors });
			},

			setBrushSettings: (settings) =>
				set((state) => ({
					brushSettings: { ...state.brushSettings, ...settings },
				})),

			resetBrushSettings: () => set({ brushSettings: defaultBrushSettings }),

			setToolDefaults: (tool) => {
				const currentSettings = get().brushSettings;
				let newSettings: Partial<BrushSettings> = {};

				switch (tool) {
					case "brush":
						newSettings = {
							size: 10,
							opacity: 100,
							hardness: 100,
							smoothing: 20,
						};
						break;
					case "pencil":
						newSettings = {
							size: 3,
							opacity: 100,
							hardness: 100,
							smoothing: 0,
						};
						break;
					case "eraser":
						newSettings = {
							size: 20,
							opacity: 100,
							hardness: 100,
						};
						break;
					case "fill":
						newSettings = {
							fillTolerance: 32,
							fillContiguous: true,
							fillOpacity: 100,
						};
						break;
					case "gradient":
						newSettings = {
							gradientType: "linear",
							gradientStops: [
								{ color: get().primaryColor, position: 0 },
								{ color: get().secondaryColor, position: 1 },
							],
						};
						break;
					case "text":
						newSettings = {
							fontSize: 24,
							fontFamily: "Arial",
							fontWeight: "normal",
							fontStyle: "normal",
							textDecoration: "none",
							textAlign: "left",
							lineHeight: 1.2,
							letterSpacing: 0,
							textWrap: "word",
							textPadding: 4,
							textOpacity: 100,
							textShadow: false,
							textOutline: false,
							textTransform: "none",
							textBackground: false,
							textEditingMode: "inline",
						};
						break;
					case "rectangle":
					case "ellipse":
					case "polygon":
						newSettings = {
							strokeWidth: 2,
							cornerRadius: 0,
							fillType: "solid",
						};
						break;
					case "line":
						newSettings = {
							strokeWidth: 2,
							lineSettings: {
								type: "solid",
								arrowType: "none",
								dashPattern: "5,5",
								capType: "round",
								joinType: "round",
								isPerfect: false,
								startCap: "none",
								endCap: "none",
								lineStyle: "straight",
								tension: 0.5,
								precision: 10,
								arrowSize: 10,
							},
						};
						break;
					case "star":
						newSettings = {
							starPoints: 5,
							starInnerRadius: 30,
							starOuterRadius: 60,
							starRotation: 0,
							starFillType: "solid",
							starStrokeColor: get().secondaryColor,
							starFillColor: get().primaryColor,
							starCornerRadius: 0,
							strokeWidth: 2,
						};
						break;
					case "clone":
						newSettings = {
							size: 20,
							opacity: 100,
							cloneAligned: true,
							cloneOpacity: 100,
						};
						break;
					case "healing":
						newSettings = {
							size: 20,
							opacity: 100,
							hardness: 50,
						};
						break;
					case "blur":
						newSettings = {
							size: 20,
							opacity: 100,
							blurIntensity: 10,
							blurSize: 20,
							blurMode: "gaussian",
							blurQuality: "medium",
						};
						break;
					case "magicwand":
						newSettings = {
							tolerance: 32,
						};
						break;
					case "dodge":
						newSettings = {
							size: 20,
							opacity: 100,
							dodgeIntensity: 50,
						};
						break;
					case "burn":
						newSettings = {
							size: 20,
							opacity: 100,
							burnIntensity: 50,
						};
						break;
					case "pen":
						newSettings = {
							strokeWidth: 2,
						};
						break;
					case "hand":
					case "zoom":
					case "undoZoom":
					case "move":
					case "select":
						// No specific brush settings needed for these navigation/selection tools
						break;
					default:
						break;
				}

				if (Object.keys(newSettings).length > 0) {
					set((state) => ({
						brushSettings: { ...state.brushSettings, ...newSettings },
					}));
				}
			},

			addLayer: () => {
				const newLayer: Layer = {
					id: generateLayerId(),
					name: `Layer ${get().layers.length + 1}`,
					visible: true,
					opacity: 100,
					locked: false,
				};
				set((state) => ({
					layers: [newLayer, ...state.layers],
					activeLayerId: newLayer.id,
				}));
			},

			removeLayer: (id) => {
				const { layers, activeLayerId } = get();
				if (layers.length === 0) return;

				if (layers.length === 1) {
					toast.error("Cannot delete the last layer");
					return;
				}

				const newLayers = layers.filter((l) => l.id !== id);
				set({
					layers: newLayers,
					activeLayerId:
						activeLayerId === id ? newLayers[0]?.id || null : activeLayerId,
				});

				window.dispatchEvent(
					new CustomEvent("artstudio:remove-layer", {
						detail: { layerId: id },
					}),
				);
			},

			setActiveLayer: (id) => set({ activeLayerId: id }),

			toggleLayerVisibility: (id) =>
				set((state) => ({
					layers: state.layers.map((l) =>
						l.id === id ? { ...l, visible: !l.visible } : l,
					),
				})),

			toggleLayerLock: (id) =>
				set((state) => ({
					layers: state.layers.map((l) =>
						l.id === id ? { ...l, locked: !l.locked } : l,
					),
				})),

			setLayerOpacity: (id, opacity) =>
				set((state) => ({
					layers: state.layers.map((l) =>
						l.id === id ? { ...l, opacity } : l,
					),
				})),

			renameLayer: (id, name) =>
				set((state) => ({
					layers: state.layers.map((l) => (l.id === id ? { ...l, name } : l)),
				})),

			duplicateLayer: (id) => {
				const { layers } = get();
				const layerToDuplicate = layers.find((l) => l.id === id);
				if (!layerToDuplicate) return;

				const newLayer: Layer = {
					id: generateLayerId(),
					name: `${layerToDuplicate.name} copy`,
					visible: layerToDuplicate.visible,
					opacity: layerToDuplicate.opacity,
					locked: false,
				};

				const index = layers.findIndex((l) => l.id === id);
				const newLayers = [...layers];
				newLayers.splice(index, 0, newLayer);
				set({ layers: newLayers, activeLayerId: newLayer.id });
			},

			reorderLayers: (fromIndex, toIndex) => {
				const { layers } = get();
				const newLayers = [...layers];
				const [removed] = newLayers.splice(fromIndex, 1);
				newLayers.splice(toIndex, 0, removed);
				set({ layers: newLayers });
			},

			clearLayers: () => {
				set({
					layers: [],
					activeLayerId: null,
				});
			},

			setSelectedId: (id) => set({ selectedId: id }),

			mergeLayers: (layerIds) => {
				const { layers } = get();
				const validIds = layerIds.filter((id) =>
					layers.some((l) => l.id === id),
				);
				if (validIds.length < 2) {
					toast.info("Select at least 2 layers to merge");
					return;
				}
				const newLayer: Layer = {
					id: generateLayerId(),
					name: "Merged layer",
					visible: true,
					opacity: 100,
					locked: false,
				};
				const newLayers = layers.filter((l) => !validIds.includes(l.id));
				const insertIndex = Math.min(
					...validIds.map((id) => layers.findIndex((l) => l.id === id)),
				);
				newLayers.splice(insertIndex, 0, newLayer);
				set({
					layers: newLayers,
					activeLayerId: newLayer.id,
				});
				window.dispatchEvent(
					new CustomEvent("artstudio:merge-layers", {
						detail: { layerIds: validIds, newLayerId: newLayer.id },
					}),
				);
				toast.success("Layers merged");
			},

			addLoadedImage: (image) =>
				set((state) => ({
					loadedImages: [...state.loadedImages, image],
				})),

			removeLoadedImage: (id) =>
				set((state) => ({
					loadedImages: state.loadedImages.filter((img) => img.id !== id),
				})),

			clearLoadedImages: () => set({ loadedImages: [] }),

			addGradient: (gradient) =>
				set((state) => ({ gradients: [...state.gradients, gradient] })),

			updateGradient: (id, updates) =>
				set((state) => ({
					gradients: state.gradients.map((g) =>
						g.id === id ? { ...g, ...updates } : g,
					),
				})),

			removeGradient: (id) =>
				set((state) => ({
					gradients: state.gradients.filter((g) => g.id !== id),
				})),

			clearGradients: () => set({ gradients: [] }),

			setGradients: (gradients) => set({ gradients }),

			clearRecentColors: () => {
				set({ recentColors: [] });
			},

			setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),

			setPanOffset: (offset) => set({ panOffset: offset }),

			setCanvasSize: (size) => {
				set({
					canvasSize: size,
					history: [],
					historyIndex: -1,
					zoom: 100,
					panOffset: { x: 0, y: 0 },
				});
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => { }),
					500,
				);
			},

			resetCanvasView: () => set({ zoom: 100, panOffset: { x: 0, y: 0 } }),

			setSelectionBounds: (bounds) => set({ selectionBounds: bounds }),

			setSelectionPath: (path) => set({ selectionPath: path }),

			clearSelection: () =>
				set({
					selectionBounds: null,
					selectionPath: null,
					selectedId: null,
				}),

			// ========== UI ACTIONS ==========

			setShowColorPicker: (show) => set({ showColorPicker: show }),

			setShowLeftPanel: (show) => set({ showLeftPanel: show }),

			setShowRightPanel: (show) => set({ showRightPanel: show }),

			setShowBrushesPanel: (show) => set({ showBrushesPanel: show }),

			setShowColorsPanel: (show) => set({ showColorsPanel: show }),

			setShowLayersPanel: (show) => set({ showLayersPanel: show }),

			setShowHistoryPanel: (show) => set({ showHistoryPanel: show }),

			setShowNavigator: (show) => set({ showNavigator: show }),

			setShowInfoPanel: (show) => set({ showInfoPanel: show }),

			setShowFillPanel: (show) => set({ showFillPanel: show }),

			setShowGradientPanel: (show) => set({ showGradientPanel: show }),

			setShowStarPanel: (show) => set({ showStarPanel: show }),

			setShowLinePanel: (show) => set({ showLinePanel: show }),

			setShowGrid: (show) => set({ showGrid: show }),

			setShowRulers: (show) => set({ showRulers: show }),

			setShowGuides: (show) => set({ showGuides: show }),

			resetWorkspace: () =>
				set({
					showLeftPanel: true,
					showRightPanel: true,
					showBrushesPanel: true,
					showColorsPanel: true,
					showLayersPanel: true,
					showHistoryPanel: true,
					showNavigator: false,
					showInfoPanel: false,
					showFillPanel: false,
					showGradientPanel: false,
					showStarPanel: false,
					showLinePanel: true,
					showGrid: false,
					showRulers: false,
					showGuides: false,
				}),

			setFillPreview: (preview) => set({ fillPreview: preview }),

			setHealingSource: (source) => set({ healingSource: source }),
		}),
		{
			name: "artstudio-ui-store",
			storage: createJSONStorage(() => localStorage),
			version: 3, // Bump: history no longer persisted (was exceeding quota)
			migrate: (persisted: unknown, version: number) => {
				// From v2 to v3: stop persisting history to avoid quota; drop it when loading old state
				if (version < 3 && persisted && typeof persisted === "object") {
					const p = persisted as Record<string, unknown>;
					const { history: _h, historyIndex: _i, ...rest } = p;
					return rest as typeof persisted;
				}
				return persisted;
			},
			// Persist only UI settings; history stays in memory (canvasData + thumbnails too large for localStorage)
			partialize: (state) => ({
				// UI Settings
				showLeftPanel: state.showLeftPanel,
				showRightPanel: state.showRightPanel,
				showBrushesPanel: state.showBrushesPanel,
				showColorsPanel: state.showColorsPanel,
				showLayersPanel: state.showLayersPanel,
				showHistoryPanel: state.showHistoryPanel,
				showNavigator: state.showNavigator,
				showInfoPanel: state.showInfoPanel,
				showFillPanel: state.showFillPanel,
				showGradientPanel: state.showGradientPanel,
				showStarPanel: state.showStarPanel,
				showLinePanel: state.showLinePanel,
				showGrid: state.showGrid,
				showRulers: state.showRulers,
				showGuides: state.showGuides,

				// App preferences
				renderingEngine: state.renderingEngine,
				canvasSize: state.canvasSize,

				// Recent colors for quick access
				recentColors: state.recentColors,

				// Tool preferences
				activeTool: state.activeTool,
				primaryColor: state.primaryColor,
				secondaryColor: state.secondaryColor,

				// Default brush settings per tool
				brushSettings: {
					fontFamily: state.brushSettings.fontFamily,
					fontSize: state.brushSettings.fontSize,
					fontWeight: state.brushSettings.fontWeight,
					fontStyle: state.brushSettings.fontStyle,
					textDecoration: state.brushSettings.textDecoration,
					textAlign: state.brushSettings.textAlign,
					lineHeight: state.brushSettings.lineHeight,
					letterSpacing: state.brushSettings.letterSpacing,
					textWrap: state.brushSettings.textWrap,
					textPadding: state.brushSettings.textPadding,
					textOpacity: state.brushSettings.textOpacity,
					textShadow: state.brushSettings.textShadow,
					textShadowColor: state.brushSettings.textShadowColor,
					textShadowBlur: state.brushSettings.textShadowBlur,
					textShadowOffsetX: state.brushSettings.textShadowOffsetX,
					textShadowOffsetY: state.brushSettings.textShadowOffsetY,
					textOutline: state.brushSettings.textOutline,
					textOutlineColor: state.brushSettings.textOutlineColor,
					textOutlineWidth: state.brushSettings.textOutlineWidth,
					textTransform: state.brushSettings.textTransform,
					textBackground: state.brushSettings.textBackground,
					textBackgroundColor: state.brushSettings.textBackgroundColor,
					textBackgroundOpacity: state.brushSettings.textBackgroundOpacity,
					textEditingMode: state.brushSettings.textEditingMode,
					// Star settings
					starPoints: state.brushSettings.starPoints,
					starInnerRadius: state.brushSettings.starInnerRadius,
					starOuterRadius: state.brushSettings.starOuterRadius,
					starRotation: state.brushSettings.starRotation,
					starFillType: state.brushSettings.starFillType,
					starStrokeColor: state.brushSettings.starStrokeColor,
					starFillColor: state.brushSettings.starFillColor,
					starCornerRadius: state.brushSettings.starCornerRadius,
					// Line settings
					lineSettings: state.brushSettings.lineSettings,
				},
			}),
		},
	),
);
