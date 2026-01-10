import { create } from "zustand";

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
	| "zoom";

export interface Layer {
	id: string;
	name: string;
	visible: boolean;
	opacity: number;
	locked: boolean;
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
	
	// Nové speciální nastavení pro Paint Bucket
	fillTolerance: number;
	fillContiguous: boolean;
	fillOpacity: number;
	fillBlendMode: "normal" | "multiply" | "screen" | "overlay";
	fillAntiAlias: boolean;
	
	// Přidáno pro text
	fontFamily: string;
	fontSize: number;
	fontWeight: string;
	textAlign: "left" | "center" | "right" | "justify";
	textDecoration: "none" | "underline" | "line-through";
	fontStyle: "normal" | "italic";
	lineHeight: number;
	letterSpacing: number;
	
	// Gradient settings
	gradientType: "linear" | "radial";
	gradientStops: { color: string; position: number }[];
	
	// Clone settings
	cloneSourceX: number;
	cloneSourceY: number;
	cloneAligned: boolean;
	cloneOpacity: number;
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
	// Rendering Engine
	renderingEngine: RenderingEngine;
	setRenderingEngine: (engine: RenderingEngine) => void;

	// Tools
	activeTool: Tool;
	setActiveTool: (tool: Tool) => void;

	// Colors
	primaryColor: string;
	secondaryColor: string;
	setPrimaryColor: (color: string) => void;
	setSecondaryColor: (color: string) => void;
	swapColors: () => void;
	recentColors: string[];
	addRecentColor: (color: string) => void;

	// Brush settings
	brushSettings: BrushSettings;
	setBrushSettings: (settings: Partial<BrushSettings>) => void;
	resetBrushSettings: () => void;
	setToolDefaults: (tool: Tool) => void;

	// Layers
	layers: Layer[];
	activeLayerId: string | null;
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

	// Images
	loadedImages: { id: string; src: string; name: string }[];
	addLoadedImage: (image: { id: string; src: string; name: string }) => void;
	removeLoadedImage: (id: string) => void;
	clearLoadedImages: () => void;

	// Canvas
	zoom: number;
	setZoom: (zoom: number) => void;
	panOffset: { x: number; y: number };
	setPanOffset: (offset: { x: number; y: number }) => void;
	canvasSize: CanvasSize | null;
	setCanvasSize: (size: CanvasSize) => void;
	resetCanvasView: () => void;

	// History
	history: HistoryEntry[];
	historyIndex: number;
	addToHistory: (
		canvasData: string,
		thumbnail?: string,
		action?: string,
	) => void;
	undo: () => HistoryEntry | null;
	redo: () => HistoryEntry | null;
	canUndo: () => boolean;
	canRedo: () => boolean;
	restoreToHistoryIndex: (index: number) => void;
	clearHistory: () => void;

	// Selection
	selectionBounds: { x: number; y: number; width: number; height: number } | null;
	setSelectionBounds: (bounds: { x: number; y: number; width: number; height: number } | null) => void;
	clearSelection: () => void;

	// UI State
	showColorPicker: boolean;
	setShowColorPicker: (show: boolean) => void;

	// Panel visibility
	showLeftPanel: boolean;
	setShowLeftPanel: (show: boolean) => void;
	showRightPanel: boolean;
	setShowRightPanel: (show: boolean) => void;
	showBrushesPanel: boolean;
	setShowBrushesPanel: (show: boolean) => void;
	showColorsPanel: boolean;
	setShowColorsPanel: (show: boolean) => void;
	showLayersPanel: boolean;
	setShowLayersPanel: (show: boolean) => void;
	showHistoryPanel: boolean;
	setShowHistoryPanel: (show: boolean) => void;
	showNavigator: boolean;
	setShowNavigator: (show: boolean) => void;
	showInfoPanel: boolean;
	setShowInfoPanel: (show: boolean) => void;
	showFillPanel: boolean;
	setShowFillPanel: (show: boolean) => void;

	// Canvas overlays
	showGrid: boolean;
	setShowGrid: (show: boolean) => void;
	showRulers: boolean;
	setShowRulers: (show: boolean) => void;
	showGuides: boolean;
	setShowGuides: (show: boolean) => void;

	// Reset workspace
	resetWorkspace: () => void;

	// Fill tool preview
	fillPreview: { x: number; y: number; color: string } | null;
	setFillPreview: (preview: { x: number; y: number; color: string } | null) => void;
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
	
	// Paint Bucket specific
	fillTolerance: 32,
	fillContiguous: true,
	fillOpacity: 100,
	fillBlendMode: "normal",
	fillAntiAlias: true,
	
	// Text
	fontFamily: "Arial",
	fontSize: 16,
	fontWeight: "normal",
	textAlign: "left",
	textDecoration: "none",
	fontStyle: "normal",
	lineHeight: 1.2,
	letterSpacing: 0,
	
	// Gradient
	gradientType: "linear",
	gradientStops: [
		{ color: "#ffffff", position: 0 },
		{ color: "#000000", position: 1 },
	],
	
	// Clone
	cloneSourceX: 0,
	cloneSourceY: 0,
	cloneAligned: true,
	cloneOpacity: 100,
};

export const useArtStudioStore = create<ArtStudioState>((set, get) => ({
	// Rendering Engine
	renderingEngine: "fabric",
	setRenderingEngine: (engine) => set({ renderingEngine: engine }),

	// Tools
	activeTool: "brush",
	setActiveTool: (tool) => {
		set({ activeTool: tool });
		// Automaticky nastav výchozí hodnoty pro tool
		get().setToolDefaults(tool);
	},

	// Colors
	primaryColor: "#ffffff",
	secondaryColor: "#000000",
	setPrimaryColor: (color) => {
		set({ primaryColor: color });
		get().addRecentColor(color);
	},
	setSecondaryColor: (color) => set({ secondaryColor: color }),
	swapColors: () => {
		const { primaryColor, secondaryColor } = get();
		set({ primaryColor: secondaryColor, secondaryColor: primaryColor });
	},
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
	addRecentColor: (color) => {
		const { recentColors } = get();
		if (recentColors.includes(color)) return;
		const newColors = [color, ...recentColors.slice(0, 11)];
		set({ recentColors: newColors });
	},

	// Brush settings
	brushSettings: defaultBrushSettings,
	setBrushSettings: (settings) =>
		set((state) => ({
			brushSettings: { ...state.brushSettings, ...settings },
		})),
	resetBrushSettings: () =>
		set({ brushSettings: defaultBrushSettings }),
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
			case "text":
				newSettings = {
					fontSize: 24,
					fontFamily: "Arial",
					fontWeight: "normal",
				};
				break;
			case "rectangle":
			case "ellipse":
			case "polygon":
			case "line":
				newSettings = {
					strokeWidth: 2,
					cornerRadius: 0,
					fillType: "solid",
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
			case "magicwand":
				newSettings = {
					tolerance: 32,
				};
				break;
		}
		
		if (Object.keys(newSettings).length > 0) {
			set((state) => ({
				brushSettings: { ...state.brushSettings, ...newSettings },
			}));
		}
	},

	// Layers
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
		const newLayers = layers.filter((l) => l.id !== id);
		set({
			layers: newLayers,
			activeLayerId:
				activeLayerId === id ? newLayers[0]?.id || null : activeLayerId,
		});
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
			layers: state.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
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
	mergeLayers: (layerIds) => {
		const { layers } = get();
		// Implementace mergování vrstev
		// Prozatím jen placeholder
		console.log("Merging layers:", layerIds);
	},

	// Images
	loadedImages: [],
	addLoadedImage: (image) =>
		set((state) => ({
			loadedImages: [...state.loadedImages, image],
		})),
	removeLoadedImage: (id) =>
		set((state) => ({
			loadedImages: state.loadedImages.filter((img) => img.id !== id),
		})),
	clearLoadedImages: () =>
		set({ loadedImages: [] }),

	// Canvas
	zoom: 100,
	setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
	panOffset: { x: 0, y: 0 },
	setPanOffset: (offset) => set({ panOffset: offset }),
	canvasSize: null,
	setCanvasSize: (size) =>
		set({ canvasSize: size, history: [], historyIndex: -1 }),
	resetCanvasView: () =>
		set({ zoom: 100, panOffset: { x: 0, y: 0 } }),

	// History
	history: [],
	historyIndex: -1,
	addToHistory: (canvasData, thumbnail = "", action) => {
		const { history, historyIndex } = get();
		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push({ canvasData, thumbnail, timestamp: Date.now(), action });
		if (newHistory.length > 50) newHistory.shift();
		set({ history: newHistory, historyIndex: newHistory.length - 1 });
	},
	undo: () => {
		const { history, historyIndex } = get();
		if (historyIndex > 0) {
			const newIndex = historyIndex - 1;
			set({ historyIndex: newIndex });
			return history[newIndex];
		}
		return null;
	},
	redo: () => {
		const { history, historyIndex } = get();
		if (historyIndex < history.length - 1) {
			const newIndex = historyIndex + 1;
			set({ historyIndex: newIndex });
			return history[newIndex];
		}
		return null;
	},
	canUndo: () => get().historyIndex > 0,
	canRedo: () => get().historyIndex < get().history.length - 1,
	restoreToHistoryIndex: (index) => {
		const { history } = get();
		if (index >= 0 && index < history.length) {
			set({ historyIndex: index });
		}
	},
	clearHistory: () => {
		set({
			history: [],
			historyIndex: -1,
		});
	},

	// Selection
	selectionBounds: null,
	setSelectionBounds: (bounds) => set({ selectionBounds: bounds }),
	clearSelection: () => set({ selectionBounds: null }),

	// UI State
	showColorPicker: false,
	setShowColorPicker: (show) => set({ showColorPicker: show }),

	// Panel visibility
	showLeftPanel: true,
	setShowLeftPanel: (show) => set({ showLeftPanel: show }),
	showRightPanel: true,
	setShowRightPanel: (show) => set({ showRightPanel: show }),
	showBrushesPanel: true,
	setShowBrushesPanel: (show) => set({ showBrushesPanel: show }),
	showColorsPanel: true,
	setShowColorsPanel: (show) => set({ showColorsPanel: show }),
	showLayersPanel: true,
	setShowLayersPanel: (show) => set({ showLayersPanel: show }),
	showHistoryPanel: true,
	setShowHistoryPanel: (show) => set({ showHistoryPanel: show }),
	showNavigator: false,
	setShowNavigator: (show) => set({ showNavigator: show }),
	showInfoPanel: false,
	setShowInfoPanel: (show) => set({ showInfoPanel: show }),
	showFillPanel: false,
	setShowFillPanel: (show) => set({ showFillPanel: show }),

	// Canvas overlays
	showGrid: false,
	setShowGrid: (show) => set({ showGrid: show }),
	showRulers: false,
	setShowRulers: (show) => set({ showRulers: show }),
	showGuides: false,
	setShowGuides: (show) => set({ showGuides: show }),

	// Reset workspace
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
			showGrid: false,
			showRulers: false,
			showGuides: false,
		}),

	// Fill tool preview
	fillPreview: null,
	setFillPreview: (preview) => set({ fillPreview: preview }),
}));