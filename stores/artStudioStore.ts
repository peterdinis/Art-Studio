import { sessionDB } from "@/db/indexedDB";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
}

export interface GradientObject {
  id: string;
  type: "linear" | "radial";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colorStops: { offset: number; color: string }[];
  layerId?: string;
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
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  
  // Preview
  fillPreview: { x: number; y: number; color: string } | null;
  healingSource: { x: number; y: number } | null;
  
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
  
  // Session management
  initializeSession: () => Promise<void>;
  saveSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearCurrentSession: () => Promise<void>;
  
  // Other actions
  setSelectionBounds: (
    bounds: { x: number; y: number; width: number; height: number } | null,
  ) => void;
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
    showGrid,
    showRulers,
    showGuides,
    fillPreview,
    healingSource,
    selectionBounds,
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
  };
};

export const useArtStudioStore = create<ArtStudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionId: null,
      renderingEngine: "fabric",
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
      showGrid: false,
      showRulers: false,
      showGuides: false,
      fillPreview: null,
      healingSource: null,
      
      // ========== SESSION MANAGEMENT ==========
      
      initializeSession: async () => {
        try {
          const sessionId = await sessionDB.getCurrentSession();
          set({ sessionId });
          
          // Load session data
          const savedData = await sessionDB.loadSessionData();
          if (savedData) {
            set(deserializeCanvasState(savedData, get()));
            console.log('Loaded session data for:', sessionId);
          }
          
          // Load session history
          const historyEntries = await sessionDB.getHistory(20);
          set({ 
            history: historyEntries.map(entry => ({
              canvasData: entry.canvasData,
              thumbnail: entry.thumbnail,
              timestamp: entry.timestamp,
              action: entry.action,
            })),
            historyIndex: historyEntries.length - 1
          });
          
        } catch (error) {
          console.error('Error initializing session:', error);
        }
      },
      
      saveSession: async () => {
        try {
          const state = get();
          const canvasState = serializeCanvasState(state);
          await sessionDB.saveSessionData(canvasState);
          console.log('Session saved');
        } catch (error) {
          console.error('Error saving session:', error);
        }
      },
      
      loadSession: async () => {
        try {
          const savedData = await sessionDB.loadSessionData();
          if (savedData) {
            set(deserializeCanvasState(savedData, get()));
            console.log('Session loaded');
          }
        } catch (error) {
          console.error('Error loading session:', error);
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
            history: [],
            historyIndex: -1,
            selectionBounds: null,
            fillPreview: null,
            healingSource: null,
          });
          console.log('Session cleared');
        } catch (error) {
          console.error('Error clearing session:', error);
        }
      },
      
      // ========== ENHANCED HISTORY METHODS ==========
      
      addToHistory: async (canvasData, thumbnail = "", action) => {
        try {
          // Save to session DB
          await sessionDB.addHistoryEntry({
            canvasData,
            thumbnail,
            action,
          });
          
          // Update in-memory state (limited to recent entries)
          const { history, historyIndex } = get();
          const newEntry = {
            canvasData,
            thumbnail,
            timestamp: Date.now(),
            action,
          };
          
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(newEntry);
          if (newHistory.length > 10) newHistory.shift();
          
          set({ 
            history: newHistory, 
            historyIndex: newHistory.length - 1 
          });
          
          // Auto-save session state every 5 history entries
          if (newHistory.length % 5 === 0) {
            get().saveSession();
          }
          
        } catch (error) {
          console.error('Error saving history:', error);
          // Fallback to in-memory only
          const { history, historyIndex } = get();
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push({
            canvasData,
            thumbnail,
            timestamp: Date.now(),
            action,
          });
          if (newHistory.length > 50) newHistory.shift();
          set({ history: newHistory, historyIndex: newHistory.length - 1 });
        }
      },
      
      undo: async () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({ historyIndex: newIndex });
          
          // Load from session DB if not in memory
          const entry = history[newIndex];
          if (!entry) {
            const dbHistory = await sessionDB.getHistory(50);
            const dbEntry = dbHistory.find(e => e.timestamp === newIndex);
            if (dbEntry) {
              window.dispatchEvent(
                new CustomEvent("artstudio:restore-history", {
                  detail: { canvasData: dbEntry.canvasData },
                }),
              );
              return dbEntry;
            }
          } else if (entry?.canvasData) {
            window.dispatchEvent(
              new CustomEvent("artstudio:restore-history", {
                detail: { canvasData: entry.canvasData },
              }),
            );
          }
          
          return history[newIndex];
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
                detail: { canvasData: entry.canvasData },
              }),
            );
          }
          return entry;
        }
        return null;
      },
      
      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
      
      restoreToHistoryIndex: async (index: number) => {
        const { history, historyIndex } = get();
        if (index >= 0 && index < history.length && index !== historyIndex) {
          set({ historyIndex: index });
          
          const entry = history[index];
          if (entry?.canvasData) {
            window.dispatchEvent(
              new CustomEvent("artstudio:restore-history", {
                detail: { canvasData: entry.canvasData },
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
      
      // ========== ORIGINAL ACTIONS (unchanged but with auto-save) ==========
      
      setRenderingEngine: (engine) => set({ renderingEngine: engine }),
      
      setActiveTool: (tool) => {
        set({ activeTool: tool });
        get().setToolDefaults(tool);
      },
      
      setPrimaryColor: (color) => {
        set({ primaryColor: color });
        get().addRecentColor(color);
      },
      
      setSecondaryColor: (color) => set({ secondaryColor: color }),
      
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
      
      setCanvasSize: (size) =>
        set({ canvasSize: size, history: [], historyIndex: -1 }),
      
      resetCanvasView: () => set({ zoom: 100, panOffset: { x: 0, y: 0 } }),
      
      setSelectionBounds: (bounds) => set({ selectionBounds: bounds }),
      
      clearSelection: () => set({ selectionBounds: null }),
      
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
          showGrid: false,
          showRulers: false,
          showGuides: false,
        }),
      
      setFillPreview: (preview) => set({ fillPreview: preview }),
      
      setHealingSource: (source) => set({ healingSource: source }),
    }),
    {
      name: 'artstudio-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only UI settings, not canvas data
      partialize: (state) => ({
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
        showGrid: state.showGrid,
        showRulers: state.showRulers,
        showGuides: state.showGuides,
        renderingEngine: state.renderingEngine,
        canvasSize: state.canvasSize,
      }),
    }
  )
);