"use client";

import { sessionDB } from "@/db/indexedDB";
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
	setGradients: (gradients: GradientObject[]) => void;
	setZoom: (zoom: number) => void;
	setPanOffset: (offset: { x: number; y: number }) => void;
	setCanvasSize: (size: CanvasSize) => void;
	resetCanvasView: () => void;

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
	loadSession: () => Promise<void>;
	clearCurrentSession: () => Promise<void>;
	exportSessionData: () => Promise<any>;
	importSessionData: (data: any) => Promise<boolean>;

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

			// ========== SESSION MANAGEMENT ==========

			initializeSession: async () => {
				try {
					console.log("Initializing session from IndexedDB...");

					// Ensure DB is initialized
					await sessionDB.init();

					// Auto-cleanup old sessions on startup
					await sessionDB.cleanupOldSessions();

					// Get current session (creates new if none exists)
					const sessionId = await sessionDB.getCurrentSession();
					console.log("Current session ID:", sessionId);

					set({ sessionId });

					// Check if we have saved session data
					const hasData = await sessionDB.hasSavedData();

					if (hasData) {
						// Load session data
						const savedData = await sessionDB.loadSessionData();
						if (savedData) {
							console.log("Loading saved session data:", savedData);
							const restoredState = deserializeCanvasState(savedData, get());
							set(restoredState);

							// Trigger canvas restore event
							window.dispatchEvent(
								new CustomEvent("artstudio:load-session", {
									detail: { sessionData: savedData },
								}),
							);
						}
					}

					// Load session history
					const historyEntries = await sessionDB.getHistory(20);
					console.log("Loaded history entries:", historyEntries.length);

					const formattedHistory = historyEntries.map((entry) => ({
						canvasData: entry.canvasData,
						thumbnail: entry.thumbnail,
						timestamp: entry.timestamp,
						action: entry.action,
					}));

					set({
						history: formattedHistory,
						historyIndex: formattedHistory.length - 1,
					});

					// Auto-save every 30 seconds if we're active
					if (typeof window !== "undefined") {
						const autoSaveInterval = setInterval(async () => {
							const state = get();
							if (state.sessionId) {
								try {
									await state.saveSession();
									console.log("Auto-saved session");
								} catch (error) {
									console.error("Auto-save failed:", error);
								}
							}
						}, 30000);

						// Cleanup interval on unmount
						if (typeof window !== "undefined") {
							window.addEventListener("beforeunload", () => {
								clearInterval(autoSaveInterval);
								get().saveSession().catch(console.error);
							});
						}
					}
				} catch (error) {
					console.error("Error initializing session:", error);
					// Fallback: create a temporary session ID
					set({ sessionId: `temp-${Date.now()}` });
				}
			},

			saveSession: async () => {
				try {
					const state = get();
					if (!state.sessionId) {
						console.warn("No session ID to save to");
						return;
					}

					const canvasState = serializeCanvasState(state);
					await sessionDB.saveSessionData(canvasState);

					// Also save session info for debugging
					const sessionInfo = await sessionDB.getSessionInfo();
					console.log("Session saved:", {
						sessionId: state.sessionId,
						info: sessionInfo,
						dataSize: JSON.stringify(canvasState).length,
					});
				} catch (error) {
					console.error("Error saving session:", error);
					throw error;
				}
			},

			loadSession: async () => {
				try {
					const savedData = await sessionDB.loadSessionData();
					if (savedData) {
						const restoredState = deserializeCanvasState(savedData, get());
						set(restoredState);

						// Notify canvas component to restore
						window.dispatchEvent(
							new CustomEvent("artstudio:restore-state", {
								detail: { sessionData: savedData },
							}),
						);

						console.log("Session data loaded from IndexedDB");
						return savedData;
					}
					return null;
				} catch (error) {
					console.error("Error loading session:", error);
					return null;
				}
			},

			clearCurrentSession: async () => {
				try {
					const { sessionId } = get();
					if (sessionId) {
						await sessionDB.clearSession(sessionId);
					}

					// Reset to initial state
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
						history: [],
						historyIndex: -1,
						selectionBounds: null,
						selectionPath: null,
						fillPreview: null,
						healingSource: null,
						selectedId: null,
					});

					// Start fresh session
					await get().initializeSession();
					console.log("Session cleared, new session started");
				} catch (error) {
					console.error("Error clearing session:", error);
				}
			},

			exportSessionData: async () => {
				try {
					const state = get();
					const canvasState = serializeCanvasState(state);
					const historyEntries = await sessionDB.getHistory(100);

					const exportData = {
						version: "1.0",
						timestamp: Date.now(),
						sessionId: state.sessionId,
						canvasState,
						history: historyEntries.map((entry) => ({
							canvasData: entry.canvasData,
							action: entry.action,
							timestamp: entry.timestamp,
						})),
						metadata: {
							layersCount: state.layers.length,
							imagesCount: state.loadedImages.length,
							gradientsCount: state.gradients.length,
						},
					};

					return exportData;
				} catch (error) {
					console.error("Error exporting session:", error);
					throw error;
				}
			},

			importSessionData: async (data: any) => {
				try {
					// Validate import data
					if (!data.canvasState || !data.version) {
						throw new Error("Invalid session data format");
					}

					// Clear current session
					await get().clearCurrentSession();

					// Restore canvas state
					const restoredState = deserializeCanvasState(data.canvasState, get());
					set(restoredState);

					// Notify canvas to restore
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

				try {
					// Save to session DB
					await sessionDB.addHistoryEntry({
						canvasData,
						thumbnail,
						action,
					});

					console.log("History entry saved to IndexedDB:", action);
				} catch (error) {
					console.error("Error saving history to IndexedDB:", error);
				}

				// Update in-memory state
				const { history, historyIndex } = state;
				const newEntry = {
					canvasData,
					thumbnail,
					timestamp: Date.now(),
					action,
				};

				const newHistory = history.slice(0, historyIndex + 1);
				newHistory.push(newEntry);

				// Keep only last 10 entries in memory for quick undo/redo
				const trimmedHistory = newHistory.slice(-10);

				set({
					history: trimmedHistory,
					historyIndex: trimmedHistory.length - 1,
				});

				// Auto-save session state after significant actions
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
							.catch(() => {});
					}, 1000);
				}
			},

			undo: async () => {
				const { history, historyIndex } = get();

				if (historyIndex > 0) {
					const newIndex = historyIndex - 1;
					set({ historyIndex: newIndex });

					const entry = history[newIndex];

					if (!entry) {
						// Try to load from IndexedDB if not in memory
						try {
							const dbHistory = await sessionDB.getHistory(50);
							const dbEntry = dbHistory.sort(
								(a, b) => b.timestamp - a.timestamp,
							)[newIndex];

							if (dbEntry) {
								window.dispatchEvent(
									new CustomEvent("artstudio:restore-history", {
										detail: {
											canvasData: dbEntry.canvasData,
											action: "undo",
											timestamp: dbEntry.timestamp,
										},
									}),
								);
								return dbEntry;
							}
						} catch (error) {
							console.error("Error loading from history DB:", error);
						}
					} else if (entry?.canvasData) {
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
				return null;
			},

			redo: async () => {
				const { history, historyIndex } = get();

				if (historyIndex < history.length - 1) {
					const newIndex = historyIndex + 1;
					set({ historyIndex: newIndex });

					const entry = history[newIndex];
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
				// Len čistí lokálny state, ale nie IndexedDB
				set({
					history: [],
					historyIndex: -1,
				});
			},

			clearSessionHistory: async () => {
				try {
					const { sessionId } = get();

					if (sessionId) {
						// Vymaž históriu z IndexedDB pre aktuálnu session
						await sessionDB.deleteAllHistoryForSession(sessionId);
					}

					// Vymaž lokálny state
					set({
						history: [],
						historyIndex: -1,
					});

					// Upozorni canvas, že história bola vymazaná
					window.dispatchEvent(
						new CustomEvent("artstudio:history-cleared", {
							detail: { sessionId },
						}),
					);

					console.log("Session history cleared from IndexedDB");
				} catch (error) {
					console.error("Error clearing session history:", error);
					throw error;
				}
			},

			// ========== TOOL AND CANVAS ACTIONS ==========

			setRenderingEngine: (engine) => set({ renderingEngine: engine }),

			setActiveTool: (tool) => {
				set({ activeTool: tool });
				get().setToolDefaults(tool);
				// Auto-save tool change
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
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
							.catch(() => {}),
					2000,
				);
			},

			setSecondaryColor: (color) => {
				set({ secondaryColor: color });
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					2000,
				);
			},

			swapColors: () => {
				const { primaryColor, secondaryColor } = get();
				set({ primaryColor: secondaryColor, secondaryColor: primaryColor });
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					2000,
				);
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
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					1000,
				);
			},

			removeLayer: (id) => {
				const { layers, activeLayerId } = get();
				if (layers.length === 0) return;
				
				// Prevent deleting the last layer
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
				
				// Dispatch event to remove objects from canvas
				window.dispatchEvent(
					new CustomEvent("artstudio:remove-layer", {
						detail: { layerId: id },
					}),
				);
				
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					1000,
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
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					1000,
				);
			},

			reorderLayers: (fromIndex, toIndex) => {
				const { layers } = get();
				const newLayers = [...layers];
				const [removed] = newLayers.splice(fromIndex, 1);
				newLayers.splice(toIndex, 0, removed);
				set({ layers: newLayers });
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					1000,
				);
			},

			clearLayers: () => {
				set({
					layers: [],
					activeLayerId: null,
				});
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					1000,
				);
			},

			setSelectedId: (id) => set({ selectedId: id }),

			mergeLayers: (layerIds) => {
				const { layers } = get();
				// Implementation would go here
				setTimeout(
					() =>
						get()
							.saveSession()
							.catch(() => {}),
					1000,
				);
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
							.catch(() => {}),
					500,
				);
			},

			resetCanvasView: () => set({ zoom: 100, panOffset: { x: 0, y: 0 } }),

			setSelectionBounds: (bounds) => set({ selectionBounds: bounds }),

			setSelectionPath: (path) => set({ selectionPath: path }),

			clearSelection: () => set({ selectionBounds: null, selectionPath: null }),

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
			version: 1,
			// Persist only UI settings, not canvas data
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
