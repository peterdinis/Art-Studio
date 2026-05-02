"use client";

import React, {
	useRef,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import {
	Stage,
	Layer,
	Rect,
	Ellipse,
	Line,
	Text,
	Image as KonvaImage,
	Transformer,
	Star as KonvaStar,
} from "react-konva";
import Konva from "konva";

// Explicitly import and register shapes for Konva to fix Turbopack/modular build issues
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Ellipse as KonvaEllipse } from "konva/lib/shapes/Ellipse";
import { Line as KonvaLine } from "konva/lib/shapes/Line";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import { Star as KonvaStarBase } from "konva/lib/shapes/Star";
import { Image as KonvaImageBase } from "konva/lib/shapes/Image";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";

// Manual registration to ensure nodes are available to react-konva
if (typeof window !== "undefined") {
	(Konva as any).Rect = KonvaRect;
	(Konva as any).Ellipse = KonvaEllipse;
	(Konva as any).Line = KonvaLine;
	(Konva as any).Text = KonvaText;
	(Konva as any).Star = KonvaStarBase;
	(Konva as any).Image = KonvaImageBase;
	(Konva as any).Transformer = KonvaTransformer;
}
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { useZoom } from "@/hooks/useZoom";
import { toast } from "sonner";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { GridOverlay } from "./GridOverlay";
import { RulerOverlay } from "./RulerOverlay";

interface KonvaCanvasProps {
	width?: number;
	height?: number;
	backgroundColor?: string;
}

interface DrawingLine {
	id: string;
	points: number[];
	stroke: string;
	strokeWidth: number;
	tool: "brush" | "pencil" | "eraser" | "healing" | "blur" | "pen";
	layerId: string;
	opacity?: number;
	hardness?: number;
}

interface ShapeObject {
	id: string;
	type: "rect" | "ellipse" | "circle" | "line" | "text" | "polygon" | "star";
	x: number;
	y: number;
	width?: number;
	height?: number;
	radiusX?: number;
	radiusY?: number;
	radius?: number;
	innerRadius?: number;
	outerRadius?: number;
	numPoints?: number;
	points?: number[];
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	text?: string;
	fontSize?: number;
	rotation?: number;
	scaleX?: number;
	scaleY?: number;
	layerId: string;
}

interface ImageObject {
	id: string;
	src: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
	scaleX?: number;
	scaleY?: number;
	layerId: string;
}

interface GradientObject {
	id: string;
	type: "linear" | "radial";
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	colorStops: { offset: number; color: string }[];
	layerId: string;
}

interface HealingData {
	sourceX: number;
	sourceY: number;
	isActive: boolean;
	brushSize: number;
}

interface BlurData {
	isActive: boolean;
	brushSize: number;
	intensity: number;
}

interface TextObject {
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

interface CanvasState {
	lines: DrawingLine[];
	shapes: ShapeObject[];
	images: ImageObject[];
	gradients: GradientObject[];
	healingData: HealingData;
	blurData: BlurData;
	textObjects: TextObject[];
}

const ImageNode = ({
	image,
	onClick,
	onDragEnd,
	draggable,
	opacity = 1,
}: {
	image: ImageObject;
	onClick: (id: string) => void;
	onDragEnd?: (id: string, x: number, y: number) => void;
	draggable?: boolean;
	opacity?: number;
}) => {
	const [img, setImg] = useState<HTMLImageElement | null>(null);

	useEffect(() => {
		const konvaImg = new window.Image();
		konvaImg.src = image.src;
		konvaImg.onload = () => setImg(konvaImg);
	}, [image.src]);

	return (
		<KonvaImage
			id={image.id}
			image={img || undefined}
			x={image.x}
			y={image.y}
			width={image.width}
			height={image.height}
			onDragEnd={(e) => onDragEnd?.(image.id, e.target.x(), e.target.y())}
			onClick={() => onClick(image.id)}
			onTap={() => onClick(image.id)}
			draggable={draggable}
			opacity={opacity}
		/>
	);
};

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
	width = 1920,
	height = 1080,
	backgroundColor = "#2d3748",
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<Konva.Stage>(null);
	const tempImageRef = useRef<Konva.Image>(null);
	const layerRef = useRef<Konva.Layer>(null);
	const transformerRef = useRef<Konva.Transformer>(null);

	const {
		activeTool,
		setActiveTool,
		primaryColor,
		secondaryColor,
		brushSettings,
		setBrushSettings,
		zoom,
		panOffset,
		setPanOffset,
		addToHistory,
		canvasSize,
		setPrimaryColor,
		setSecondaryColor,
		layers,
		activeLayerId,
		gradients,
		addGradient,
		setGradients,
		healingSource,
		selectionBounds,
		selectionPath,
		setSelectionBounds,
		setSelectionPath,
		clearSelection,
		setCanvasSize,
		history,
		historyIndex,
		selectedId,
		setSelectedId,
		showGrid,
		showRulers,
		setCursorPosition,
	} = useArtStudioStore();

	const {
		zoomTo,
		zoomIn,
		zoomOut,
		zoomBack,
		zoomWithWheel,
		zoomToFit,
		zoomToActualSize,
	} = useZoom();

	// Core canvas settings
	const actualWidth = canvasSize?.width || 1920;
	const actualHeight = canvasSize?.height || 1080;
	const actualBackground = canvasSize?.backgroundColor || "#2d3748";

	const [stageSize, setStageSize] = useState({
		width: actualWidth,
		height: actualHeight,
	});

	const [lines, setLines] = useState<DrawingLine[]>([]);
	const [activeLinePoints, setActiveLinePoints] = useState<number[]>([]);
	const [shapes, setShapes] = useState<ShapeObject[]>([]);
	const [images, setImages] = useState<ImageObject[]>([]);
	const [textObjects, setTextObjects] = useState<TextObject[]>([]);
	const [isDrawing, setIsDrawing] = useState(false);
	const [isFilling, setIsFilling] = useState(false);
	const [isDrawingGradient, setIsDrawingGradient] = useState(false);
	const [currentGradient, setCurrentGradient] = useState<GradientObject | null>(
		null,
	);
	const gradientStartPoint = useRef<{ x: number; y: number } | null>(null);

	const [currentShape, setCurrentShape] = useState<ShapeObject | null>(null);
	const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);

	const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
	const [polygonPoints, setPolygonPoints] = useState<number[]>([]);
	const [currentPenLine, setCurrentPenLine] = useState<DrawingLine | null>(
		null,
	);
	const [penPoints, setPenPoints] = useState<number[]>([]);

	const [isSelecting, setIsSelecting] = useState(false);
	const [isPanningState, setIsPanningState] = useState(false);
	const [editingTextId, setEditingTextId] = useState<string | null>(null);
	const [textAreaPosition, setTextAreaPosition] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	// Performance: Throttle mouse move events (ref so first move after mousedown isn't skipped)
	const lastMouseMoveTime = useRef<number>(0);
	const isSelectingRef = useRef(false);
	const throttleDelay = 16; // ~60fps
	const [selectionStartPoint, setSelectionStartPoint] = useState<{
		x: number;
		y: number;
	} | null>(null);

	// Ref for capturing the latest state safely in async saves
	const latestStateRef = useRef<any>(null);
	useEffect(() => {
		latestStateRef.current = {
			lines,
			shapes,
			images,
			textObjects,
			gradients,
			healingSource,
			zoom,
			panOffset,
		};
	}, [
		lines,
		shapes,
		images,
		textObjects,
		gradients,
		healingSource,
		zoom,
		panOffset,
	]);

	const isPanning = useRef(false);
	const isScrubbyZooming = useRef(false);
	const scrubbyZoomStartPos = useRef({ x: 0, y: 0 });
	const scrubbyZoomStartScale = useRef(100);
	const lastPanPos = useRef({ x: 0, y: 0 });

	const cloneSourcePoint = useRef<{ x: number; y: number } | null>(null);

	const [healingData, setHealingData] = useState<HealingData>({
		sourceX: 0,
		sourceY: 0,
		isActive: false,
		brushSize: 20,
	});
	const healingCanvas = useRef<HTMLCanvasElement | null>(null);
	const healingContext = useRef<CanvasRenderingContext2D | null>(null);

	const [blurData, setBlurData] = useState<BlurData>({
		isActive: false,
		brushSize: 20,
		intensity: 10,
	});
	const blurCanvas = useRef<HTMLCanvasElement | null>(null);
	const blurContext = useRef<CanvasRenderingContext2D | null>(null);

	const floodFillCanvas = useRef<HTMLCanvasElement | null>(null);
	const floodFillContext = useRef<CanvasRenderingContext2D | null>(null);

	const eyedropperCanvas = useRef<HTMLCanvasElement | null>(null);
	const eyedropperContext = useRef<CanvasRenderingContext2D | null>(null);
	const [showSessionNotification] = useState(false);

	const [activeDrawingLine, setActiveDrawingLine] =
		useState<DrawingLine | null>(null);
	const [tempContext, setTempContext] =
		useState<CanvasRenderingContext2D | null>(null);
	const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null);
	const [tempImage, setTempImage] = useState<HTMLImageElement | null>(null);

	const magicWandTolerance = brushSettings.tolerance || 20;

	const generateId = useCallback((prefix: string) => {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	// Handle responsive stage resizing
	useEffect(() => {
		if (!containerRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setStageSize({ width, height });
			}
		});

		resizeObserver.observe(containerRef.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	// Update stage size if actual canvas size changes
	useEffect(() => {
		setStageSize({ width: actualWidth, height: actualHeight });
	}, [actualWidth, actualHeight]);

	// Expose stage on window for useZoom (wheel zoom, etc.)
	useEffect(() => {
		const stage = stageRef.current;
		if (stage) {
			(window as Window & { konvaStage?: Konva.Stage }).konvaStage = stage;
		}
		return () => {
			const win = window as Window & { konvaStage?: Konva.Stage };
			if (win.konvaStage === stage) {
				delete win.konvaStage;
			}
		};
	}, []);

	/* --- CORE UTILITIES --- */

	const lastSaveTimeRef = useRef<number>(0);
	const pendingSaveRef = useRef<number | null>(null);

	const saveCanvasState = useCallback(
		(action: string, force: boolean = false) => {
			if (!stageRef.current) return;

			const scheduleSave = () => {
				// Cancel any pending save to avoid stacking
				if (pendingSaveRef.current) {
					if ("cancelIdleCallback" in window) {
						window.cancelIdleCallback(pendingSaveRef.current);
					} else {
						clearTimeout(pendingSaveRef.current);
					}
				}

				const saveData = () => {
					if (!stageRef.current || !latestStateRef.current) return;
					// Save canvas state from ref to avoid stale closure
					const canvasState = latestStateRef.current;

					const canvasJson = JSON.stringify(canvasState);
					const thumbnail = stageRef.current.toDataURL({ pixelRatio: 0.1 });
					addToHistory(canvasJson, thumbnail, action);
					lastSaveTimeRef.current = Date.now();
					pendingSaveRef.current = null;
				};

				if ("requestIdleCallback" in window) {
					pendingSaveRef.current = window.requestIdleCallback(saveData, {
						timeout: 2000,
					});
				} else {
					pendingSaveRef.current = (window as any).setTimeout(
						saveData,
						500,
					) as unknown as number;
				}
			};

			const now = Date.now();
			if (force || now - lastSaveTimeRef.current >= 1000) {
				scheduleSave();
			}
		},
		[
			lines,
			shapes,
			images,
			gradients,
			healingData,
			blurData,
			addToHistory,
			textObjects,
			history.length,
			historyIndex,
		],
	);

	const updateAuxCanvases = useCallback(() => {
		if (!layerRef.current) return;

		try {
			// Use layer instead of stage to ignore zoom/pan and get raw content 1:1
			const tempCanvas = layerRef.current.toCanvas({
				pixelRatio: 1,
				x: 0,
				y: 0,
				width: actualWidth,
				height: actualHeight,
			});

			// Zoznam všetkých pomocných canvasov
			const auxCanvases = [
				{ ref: floodFillCanvas, ctx: floodFillContext },
				{ ref: eyedropperCanvas, ctx: eyedropperContext },
				{ ref: healingCanvas, ctx: healingContext },
				{ ref: blurCanvas, ctx: blurContext },
			];

			// Ensure each aux canvas has correct size (ref may be from JSX with default 300x150)
			auxCanvases.forEach(({ ref, ctx }) => {
				if (!ref.current) {
					ref.current = document.createElement("canvas");
				}
				ref.current.width = actualWidth;
				ref.current.height = actualHeight;
				if (!ctx.current) {
					ctx.current = ref.current.getContext("2d", {
						willReadFrequently: true,
					});
				}
				if (ctx.current) {
					ctx.current.clearRect(0, 0, actualWidth, actualHeight);
					// Only draw if tempCanvas was successfully created
					if (tempCanvas) {
						ctx.current.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
					}
				}
			});
		} catch (e) {
			toast.error(
				"Could not read canvas data. Possible CORS issue with images.",
			);
		}
	}, [actualWidth, actualHeight]);

	/* --- VYLEPŠENÁ FUNKCIA PRE OBNOVU STAVU --- */
	const restoreCanvasState = useCallback(
		(stateString: string) => {
			try {
				const state: CanvasState = JSON.parse(stateString);

				// Obnovte všetky časti stavu
				setLines(state.lines || []);
				setShapes(state.shapes || []);
				setImages(state.images || []);
				setTextObjects(state.textObjects || []);

				// Obnovte gradienty
				if (state.gradients) {
					setGradients(state.gradients);
				}

				// Obnovte ďalšie stavy
				if (state.healingData) setHealingData(state.healingData);
				if (state.blurData) setBlurData(state.blurData);

				// Resetujte aktuálne kreslenie
				setIsDrawing(false);
				setActiveDrawingLine(null);
				setCurrentShape(null);
				setCurrentPenLine(null);
				setPenPoints([]);
				setCurrentGradient(null);
				setIsDrawingGradient(false);
				setPolygonPoints([]);
				setIsSelecting(false);
				setSelectionStartPoint(null);
				setSelectedId(null);

				// Resetujte temp image
				if (tempContext) {
					tempContext.clearRect(0, 0, actualWidth, actualHeight);
					setTempImage(null);
				}

				// Aktualizujte pomocné canvasy
				setTimeout(() => {
					updateAuxCanvases();
				}, 100);
			} catch (error) {
				toast.error("Failed to restore canvas state");
			}
		},
		[setGradients, updateAuxCanvases, tempContext, actualWidth, actualHeight],
	);

	/* --- LAYER OPACITY UTILITIES --- */
	const getLayerOpacity = useCallback(
		(layerId: string) => {
			const layer = layers.find((l) => l.id === layerId);
			return layer ? layer.opacity / 100 : 1; // Convert percentage to decimal (0-1)
		},
		[layers],
	);

	const layerOpacities = useMemo(() => {
		const opacities: Record<string, number> = {};
		layers.forEach((layer) => {
			opacities[layer.id] = layer.opacity / 100;
		});
		return opacities;
	}, [layers]);

	const isLayerVisible = (id: string) =>
		layers.find((l) => l.id === id)?.visible !== false;

	/* --- TEXT TOOL FUNCTIONS --- */
	const handleAddText = useCallback(
		(textObject: TextObject) => {
			setTextObjects((prev) => [...prev, textObject]);
			setSelectedId(textObject.id);
			if (textObject.isEditing) {
				setEditingTextId(textObject.id);
			}
			saveCanvasState("Text added");
		},
		[saveCanvasState],
	);

	const handleUpdateText = useCallback(
		(textId: string, updates: Partial<TextObject>) => {
			setTextObjects((prev) =>
				prev.map((text) =>
					text.id === textId ? { ...text, ...updates } : text,
				),
			);
			saveCanvasState("Text updated");
		},
		[saveCanvasState],
	);

	const handleDeleteText = useCallback(
		(textId: string) => {
			setTextObjects((prev) => prev.filter((text) => text.id !== textId));
			if (selectedId === textId) setSelectedId(null);
			if (editingTextId === textId) setEditingTextId(null);
			saveCanvasState("Text deleted");
		},
		[selectedId, editingTextId, saveCanvasState],
	);

	const handleStartTextEdit = useCallback((textId: string) => {
		setTextObjects((prev) =>
			prev.map((text) =>
				text.id === textId ? { ...text, isEditing: true } : text,
			),
		);
		setEditingTextId(textId);
		setSelectedId(textId);
	}, []);

	const handleCancelTextEdit = useCallback((textId: string) => {
		setTextObjects((prev) =>
			prev.map((text) =>
				text.id === textId ? { ...text, isEditing: false } : text,
			),
		);
		setEditingTextId(null);
	}, []);

	const handleSelectText = useCallback(
		(textId: string) => {
			setSelectedId(textId);
			setActiveTool("select");
		},
		[setActiveTool],
	);

	/* --- SELECTION & DELETION UTILITIES --- */
	const handleDeleteSelected = useCallback(() => {
		if (selectedId) {
			// Delete selected object
			setLines((prev) => prev.filter((l) => l.id !== selectedId));
			setShapes((prev) => prev.filter((s) => s.id !== selectedId));
			setImages((prev) => prev.filter((img) => img.id !== selectedId));
			setTextObjects((prev) => prev.filter((t) => t.id !== selectedId));
			setSelectedId(null);
			saveCanvasState("Object deleted");
			toast.success("Object deleted");
			return;
		}

		if (selectionBounds || selectionPath) {
			// If we have a selection but no object selected, we could clear pixels
			// For now, let's just clear the selection itself or show a message
			// pixel clearing would require a new image layer with transparency "cut out"
			toast.info("Pixel clearing not yet implemented for bitmap layers");
		}
	}, [selectedId, selectionBounds, selectionPath, saveCanvasState]);

	const handleDeselect = useCallback(() => {
		setSelectedId(null);
		clearSelection();
	}, [clearSelection]);

	/* --- CLEAR CANVAS FUNCTION --- */
	const handleClearCanvas = useCallback(
		(options?: { preserveBackground?: boolean }) => {
			const preserve = options?.preserveBackground ?? false;

			// Clear all canvas content
			setLines([]);
			setShapes([]);
			setTextObjects([]);
			setGradients([]);
			setTempImage(null);
			clearSelection();

			// Only clear images if preserveBackground is false
			if (!preserve) {
				setImages([]);
			}
			// Clear all auxiliary canvases
			[
				floodFillContext,
				eyedropperContext,
				healingContext,
				blurContext,
			].forEach((ctx) => {
				if (ctx.current) {
					ctx.current.clearRect(0, 0, actualWidth, actualHeight);
				}
			});

			// Clear temp canvas
			if (tempContext) {
				tempContext.clearRect(0, 0, actualWidth, actualHeight);
			}

			toast.success(
				preserve
					? "Canvas cleared (background preserved)"
					: "Canvas completely cleared",
			);
			saveCanvasState("Canvas cleared", true);
		},
		[clearSelection, saveCanvasState, actualWidth, actualHeight, tempContext],
	);

	/* --- EVENT LISTENERS PRE UNDO/REDO --- */
	useEffect(() => {
		// Event listener pre undo
		const handleUndoEvent = (e: CustomEvent) => {
			if (e.detail?.canvasData) {
				restoreCanvasState(e.detail.canvasData);
			}
		};

		// Event listener pre redo
		const handleRedoEvent = (e: CustomEvent) => {
			if (e.detail?.canvasData) {
				restoreCanvasState(e.detail.canvasData);
			}
		};

		// Event listener pre restore-history (general)
		const handleRestoreHistory = (e: CustomEvent) => {
			if (e.detail?.canvasData) {
				restoreCanvasState(e.detail.canvasData);
			}
		};

		const handleSelectTextEvent = (e: CustomEvent) => {
			const { textId } = e.detail;
			handleSelectText(textId);
		};

		const handleDeleteSelectedEvent = () => {
			handleDeleteSelected();
		};

		window.addEventListener("artstudio:undo", handleUndoEvent as EventListener);
		window.addEventListener("artstudio:redo", handleRedoEvent as EventListener);
		window.addEventListener(
			"artstudio:restore-history",
			handleRestoreHistory as EventListener,
		);
		window.addEventListener(
			"artstudio:delete-selected",
			handleDeleteSelectedEvent as EventListener,
		);

		return () => {
			window.removeEventListener(
				"artstudio:undo",
				handleUndoEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:redo",
				handleRedoEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:restore-history",
				handleRestoreHistory as EventListener,
			);
			window.removeEventListener(
				"artstudio:delete-selected",
				handleDeleteSelectedEvent as EventListener,
			);
		};
	}, [restoreCanvasState, handleDeleteSelected]);

	/* --- EVENT LISTENERS FOR TEXT --- */
	useEffect(() => {
		const handleAddTextEvent = (e: CustomEvent) => {
			const { textObject } = e.detail;
			handleAddText(textObject);
		};

		const handleUpdateTextEvent = (e: CustomEvent) => {
			const { textId, updates } = e.detail;
			handleUpdateText(textId, updates);
		};

		const handleDeleteTextEvent = (e: CustomEvent) => {
			const { textId } = e.detail;
			handleDeleteText(textId);
		};

		const handleStartTextEditEvent = (e: CustomEvent) => {
			const { textId } = e.detail;
			handleStartTextEdit(textId);
		};

		const handleCancelTextEditEvent = (e: CustomEvent) => {
			const { textId } = e.detail;
			handleCancelTextEdit(textId);
		};

		const handleSelectTextEvent = (e: CustomEvent) => {
			const { textId } = e.detail;
			handleSelectText(textId);
		};

		const handleRequestTextObjects = () => {
			window.dispatchEvent(
				new CustomEvent("artstudio:text-objects", {
					detail: { textObjects },
				}),
			);
		};

		window.addEventListener(
			"artstudio:add-text",
			handleAddTextEvent as EventListener,
		);
		window.addEventListener(
			"artstudio:update-text",
			handleUpdateTextEvent as EventListener,
		);
		window.addEventListener(
			"artstudio:delete-text",
			handleDeleteTextEvent as EventListener,
		);
		window.addEventListener(
			"artstudio:start-text-edit",
			handleStartTextEditEvent as EventListener,
		);
		window.addEventListener(
			"artstudio:cancel-text-edit",
			handleCancelTextEditEvent as EventListener,
		);
		window.addEventListener(
			"artstudio:select-text",
			handleSelectTextEvent as EventListener,
		);
		window.addEventListener(
			"artstudio:request-text-objects",
			handleRequestTextObjects,
		);

		return () => {
			window.removeEventListener(
				"artstudio:add-text",
				handleAddTextEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:update-text",
				handleUpdateTextEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:delete-text",
				handleDeleteTextEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:start-text-edit",
				handleStartTextEditEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:cancel-text-edit",
				handleCancelTextEditEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:select-text",
				handleSelectTextEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:request-text-objects",
				handleRequestTextObjects,
			);
		};
	}, [
		handleAddText,
		handleUpdateText,
		handleDeleteText,
		handleStartTextEdit,
		handleCancelTextEdit,
		handleSelectText,
		textObjects,
	]);

	/* --- TEXT AREA POSITION UPDATER --- */
	useEffect(() => {
		if (editingTextId && stageRef.current) {
			const text = textObjects.find((t) => t.id === editingTextId);
			if (text) {
				const stage = stageRef.current;
				const stageBox = stage.container().getBoundingClientRect();

				// Convert canvas coordinates to screen coordinates
				const x = text.x * (zoom / 100) + panOffset.x + stageBox.left;
				const y = text.y * (zoom / 100) + panOffset.y + stageBox.top;
				const width = (text.width || 200) * (zoom / 100);
				const height = (text.height || 100) * (zoom / 100);

				setTextAreaPosition({ x, y, width, height });
			}
		} else {
			setTextAreaPosition(null);
		}
	}, [editingTextId, textObjects, zoom, panOffset]);

	/* --- IMPROVED ERASER TOOL LOGIC --- */
	const applyEraser = useCallback(
		(x: number, y: number, isStart: boolean = false) => {
			if (!tempContext) return;

			const size = brushSettings.size;

			// Vytvoriť dočasný canvas pre gumovanie
			tempContext.save();
			tempContext.globalCompositeOperation = "destination-out";
			tempContext.fillStyle = "rgba(0,0,0,1)";

			// Nakresliť kruh na vymazanie
			tempContext.beginPath();
			tempContext.arc(x, y, size / 2, 0, Math.PI * 2);

			if (isStart) {
				// Pre začiatočný bod vyplniť kruh
				tempContext.fill();
			} else {
				// Pre ťahanie - nakresliť čiaru
				tempContext.stroke();
			}

			tempContext.restore();

			// Optimized: Use the canvas directly instead of toDataURL
			// This avoids expensive base64 encoding and image creation on every move
			setTempImage(tempCanvas as any);
		},
		[brushSettings.size, tempContext, tempCanvas],
	);

	/* --- DODGE TOOL LOGIC --- */
	const applyDodgeBrush = useCallback(
		(x: number, y: number) => {
			if (!tempContext) return;
			const size = Math.round(brushSettings.size);
			const radius = size / 2;
			const intensity = (brushSettings.dodgeIntensity || 50) / 100;

			// Clamp to canvas bounds for getImageData
			const startX = Math.max(0, Math.floor(x - radius));
			const startY = Math.max(0, Math.floor(y - radius));
			const endX = Math.min(actualWidth, startX + size);
			const endY = Math.min(actualHeight, startY + size);
			const w = endX - startX;
			const h = endY - startY;
			if (w <= 0 || h <= 0) return;

			// Read from temp (current state including previous dodge), so effect accumulates
			const imgData = tempContext.getImageData(startX, startY, w, h);
			const d = imgData.data;

			for (let py = 0; py < h; py++) {
				for (let px = 0; px < w; px++) {
					const gx = startX + px - x;
					const gy = startY + py - y;
					if (gx * gx + gy * gy <= radius * radius) {
						const i = (py * w + px) * 4;
						// Dodge: lighten (move toward white)
						d[i] = Math.min(255, d[i] + (255 - d[i]) * intensity);
						d[i + 1] = Math.min(255, d[i + 1] + (255 - d[i + 1]) * intensity);
						d[i + 2] = Math.min(255, d[i + 2] + (255 - d[i + 2]) * intensity);
					}
				}
			}

			tempContext.putImageData(imgData, startX, startY);
			if (tempCanvas) setTempImage(tempCanvas as any);
		},
		[
			brushSettings.size,
			brushSettings.dodgeIntensity,
			tempContext,
			tempCanvas,
			actualWidth,
			actualHeight,
		],
	);

	/* --- BURN TOOL LOGIC --- */
	const applyBurnBrush = useCallback(
		(x: number, y: number) => {
			if (!tempContext) return;
			const size = Math.round(brushSettings.size);
			const radius = size / 2;
			const intensity = (brushSettings.burnIntensity || 50) / 100;

			const startX = Math.max(0, Math.floor(x - radius));
			const startY = Math.max(0, Math.floor(y - radius));
			const endX = Math.min(actualWidth, startX + size);
			const endY = Math.min(actualHeight, startY + size);
			const w = endX - startX;
			const h = endY - startY;
			if (w <= 0 || h <= 0) return;

			const imgData = tempContext.getImageData(startX, startY, w, h);
			const d = imgData.data;

			for (let py = 0; py < h; py++) {
				for (let px = 0; px < w; px++) {
					const gx = startX + px - x;
					const gy = startY + py - y;
					if (gx * gx + gy * gy <= radius * radius) {
						const i = (py * w + px) * 4;
						// Burn: darken (move toward black)
						d[i] = Math.max(0, d[i] - d[i] * intensity);
						d[i + 1] = Math.max(0, d[i + 1] - d[i + 1] * intensity);
						d[i + 2] = Math.max(0, d[i + 2] - d[i + 2] * intensity);
					}
				}
			}

			tempContext.putImageData(imgData, startX, startY);
			if (tempCanvas) setTempImage(tempCanvas as any);
		},
		[
			brushSettings.size,
			brushSettings.burnIntensity,
			tempContext,
			tempCanvas,
			actualWidth,
			actualHeight,
		],
	);

	/* --- EYEDROPPER TOOL LOGIC --- */
	const handleEyedropper = useCallback(
		(x: number, y: number, isAltPressed: boolean = false) => {
			updateAuxCanvases();
			// Defer read to next frame so aux canvas has been drawn
			requestAnimationFrame(() => {
				const ctx = eyedropperContext.current;
				if (!ctx?.canvas) {
					toast.error("Eyedropper not ready");
					return;
				}
				const w = ctx.canvas.width;
				const h = ctx.canvas.height;
				if (w <= 0 || h <= 0) {
					toast.error("Canvas not ready");
					return;
				}
				const px = Math.max(0, Math.min(w - 1, Math.floor(x)));
				const py = Math.max(0, Math.min(h - 1, Math.floor(y)));
				let data: Uint8ClampedArray;
				try {
					data = ctx.getImageData(px, py, 1, 1).data;
				} catch {
					toast.error("Could not sample color");
					return;
				}
				const toHex = (value: number) => {
					const hex = Math.max(0, Math.min(255, value)).toString(16);
					return hex.length === 1 ? "0" + hex : hex;
				};
				const hexColor = `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
				if (isAltPressed) {
					setSecondaryColor(hexColor);
					toast.success(`Secondary color: ${hexColor}`);
				} else {
					setPrimaryColor(hexColor);
					toast.success(`Primary color: ${hexColor}`);
				}
			});
		},
		[setPrimaryColor, setSecondaryColor, updateAuxCanvases],
	);

	/* --- FLOOD FILL (PAINT BUCKET) LOGIC --- */
	const floodFill = useCallback(
		(startX: number, startY: number, fillColor: string) => {
			// Aktualizovať pomocné canvasy
			updateAuxCanvases();

			if (!floodFillContext.current) {
				toast.error("Cannot perform fill - context not ready");
				return;
			}

			const ctx = floodFillContext.current;
			const imageData = ctx.getImageData(0, 0, actualWidth, actualHeight);
			const { data, width, height } = imageData;

			// Clamp coordinates to canvas bounds (zoom/pan can yield out-of-bounds values)
			const x = Math.max(0, Math.min(width - 1, Math.floor(startX)));
			const y = Math.max(0, Math.min(height - 1, Math.floor(startY)));

			const startIdx = (y * width + x) * 4;

			// Získať cieľovú farbu
			const targetColor = {
				r: data[startIdx],
				g: data[startIdx + 1],
				b: data[startIdx + 2],
				a: data[startIdx + 3],
			};

			// Parsovať fillColor do RGB (podpora #rgb, #rrggbb)
			let fillRGB: { r: number; g: number; b: number; a: number };
			if (fillColor.startsWith("#")) {
				const hex = fillColor.slice(1).replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3");
				const r = parseInt(hex.slice(0, 2), 16) || 0;
				const g = parseInt(hex.slice(2, 4), 16) || 0;
				const b = parseInt(hex.slice(4, 6), 16) || 0;
				fillRGB = { r, g, b, a: 255 };
			} else if (fillColor.startsWith("rgb")) {
				const match = fillColor.match(/\d+/g);
				if (match) {
					fillRGB = {
						r: parseInt(match[0]),
						g: parseInt(match[1]),
						b: parseInt(match[2]),
						a: match[3] ? parseInt(match[3]) : 255,
					};
				} else {
					fillRGB = { r: 255, g: 255, b: 255, a: 255 };
				}
			} else {
				fillRGB = { r: 255, g: 255, b: 255, a: 255 };
			}

			// Kontrola, či už nie je rovnaká farba
			if (
				fillRGB.r === targetColor.r &&
				fillRGB.g === targetColor.g &&
				fillRGB.b === targetColor.b &&
				fillRGB.a === targetColor.a
			) {
				toast.info("Area already filled with this color");
				return;
			}

			// Nastaviť toleranciu - 0 to 100 range converted to Manhattan distance (max 1020)
			const toleranceValue = brushSettings.fillTolerance ?? 32;
			const tolerance = (toleranceValue / 100) * 1020;

			// Vytvoriť masku navštívených pixelov
			const visited = new Uint8Array(width * height);
			// Dynamic stack prevents overflow for large fills
			const stack: number[] = [x, y];

			// Performance: Limit max iterations to prevent freezing
			const maxIterations = width * height;
			let iterations = 0;
			let filledCount = 0;

			while (stack.length > 0 && iterations < maxIterations) {
				iterations++;
				const currentY = stack.pop()!;
				const currentX = stack.pop()!;
				const idx = currentY * width + currentX;

				if (visited[idx]) continue;
				visited[idx] = 1;

				const pixelIdx = idx * 4;
				const r = data[pixelIdx];
				const g = data[pixelIdx + 1];
				const b = data[pixelIdx + 2];
				const a = data[pixelIdx + 3];

				// Manhattan distance for speed
				const colorDistance =
					Math.abs(r - targetColor.r) +
					Math.abs(g - targetColor.g) +
					Math.abs(b - targetColor.b) +
					Math.abs(a - targetColor.a);

				if (colorDistance <= tolerance) {
					// Apply color directly to buffer
					data[pixelIdx] = fillRGB.r;
					data[pixelIdx + 1] = fillRGB.g;
					data[pixelIdx + 2] = fillRGB.b;
					data[pixelIdx + 3] = fillRGB.a;
					filledCount++;

					// Push neighbors
					if (currentX > 0 && !visited[idx - 1]) {
						stack.push(currentX - 1, currentY);
					}
					if (currentX < width - 1 && !visited[idx + 1]) {
						stack.push(currentX + 1, currentY);
					}
					if (currentY > 0 && !visited[idx - width]) {
						stack.push(currentX, currentY - 1);
					}
					if (currentY < height - 1 && !visited[idx + width]) {
						stack.push(currentX, currentY + 1);
					}
				}
			}

			if (iterations >= maxIterations) {
				toast.warning("Fill area too large, showing partial result");
			}

			// Ak nebol vyplnený žiadny pixel
			if (filledCount === 0) {
				toast.info("No area to fill within tolerance");
				return;
			}

			// Aktualizovať obrázok na canvase
			ctx.putImageData(imageData, 0, 0);

			// Vytvoriť nový ImageObject s vyplnenou oblasťou
			const fillImage: ImageObject = {
				id: generateId("fill"),
				src: ctx.canvas.toDataURL(),
				x: 0,
				y: 0,
				width: actualWidth,
				height: actualHeight,
				layerId: activeLayerId || "layer-1",
			};

			// Pridať do stavu
			setImages((prev) => [...prev, fillImage]);

			// Okamžite aktualizovať pomocné canvasy pre nasledujúce operácie
			setTimeout(() => {
				updateAuxCanvases();
			}, 100);

			saveCanvasState("Flood Fill applied");
			toast.success(`Filled ${filledCount} pixels`);
		},
		[
			actualWidth,
			actualHeight,
			activeLayerId,
			saveCanvasState,
			setImages,
			updateAuxCanvases,
			brushSettings.fillTolerance,
			primaryColor,
			generateId,
		],
	);

	/* --- TEXT TOOL LOGIC --- */
	const handleTextTool = useCallback(
		(pos: { x: number; y: number }) => {
			const newText: TextObject = {
				id: generateId("text"),
				text: "Kliknite pre editáciu textu",
				x: pos.x,
				y: pos.y,
				fontFamily: brushSettings.fontFamily || "Arial",
				fontSize: brushSettings.fontSize || 24,
				fontWeight: brushSettings.fontWeight || "normal",
				fontStyle: brushSettings.fontStyle || "normal",
				textDecoration: brushSettings.textDecoration || "none",
				textAlign: brushSettings.textAlign || "left",
				lineHeight: brushSettings.lineHeight || 1.2,
				letterSpacing: brushSettings.letterSpacing || 0,
				color: primaryColor,
				wrap: brushSettings.textWrap || "word",
				padding: brushSettings.textPadding || 4,
				opacity: brushSettings.textOpacity || 100,
				isEditing: brushSettings.textEditingMode === "inline",
				layerId: activeLayerId || "layer-1",
			};

			// Pridať efekty podľa nastavení
			if (brushSettings.textShadow) {
				newText.shadowColor = brushSettings.textShadowColor || "#00000080";
				newText.shadowBlur = brushSettings.textShadowBlur || 5;
				newText.shadowOffsetX = brushSettings.textShadowOffsetX || 2;
				newText.shadowOffsetY = brushSettings.textShadowOffsetY || 2;
			}

			if (brushSettings.textOutline) {
				newText.outlineColor = brushSettings.textOutlineColor || "#ffffff";
				newText.outlineWidth = brushSettings.textOutlineWidth || 1;
			}

			if (brushSettings.textBackground) {
				newText.backgroundColor =
					brushSettings.textBackgroundColor || "#ffffff";
				newText.backgroundOpacity = brushSettings.textBackgroundOpacity || 20;
			}

			handleAddText(newText);
			toast.success("Text added - click to edit");
		},
		[primaryColor, activeLayerId, brushSettings, handleAddText],
	);

	useEffect(() => {
		if (selectedId && transformerRef.current && stageRef.current) {
			const node = stageRef.current.findOne(`#${selectedId}`);
			if (node) {
				transformerRef.current.nodes([node]);
				transformerRef.current.getLayer()?.batchDraw();
			}
		} else if (transformerRef.current) {
			transformerRef.current.nodes([]);
		}
	}, [selectedId]);

	// Effect to update selected object color when primaryColor or secondaryColor changes
	const prevColors = useRef({
		primary: primaryColor,
		secondary: secondaryColor,
	});
	useEffect(() => {
		if (
			selectedId &&
			(prevColors.current.primary !== primaryColor ||
				prevColors.current.secondary !== secondaryColor)
		) {
			setShapes((prev) =>
				prev.map((s) => {
					if (s.id === selectedId) {
						return {
							...s,
							stroke: primaryColor,
							fill: s.fill === "transparent" ? "transparent" : secondaryColor,
						};
					}
					return s;
				}),
			);
			setLines((prev) =>
				prev.map((l) => {
					if (l.id === selectedId) {
						return { ...l, stroke: primaryColor };
					}
					return l;
				}),
			);
			setTextObjects((prev) =>
				prev.map((t) => {
					if (t.id === selectedId) {
						return { ...t, color: primaryColor };
					}
					return t;
				}),
			);
		}
		prevColors.current = { primary: primaryColor, secondary: secondaryColor };
	}, [primaryColor, secondaryColor, selectedId]);

	/* --- INITIALIZE TEMP CANVAS --- */
	useEffect(() => {
		const tempCanvasEl = document.createElement("canvas");
		tempCanvasEl.width = actualWidth;
		tempCanvasEl.height = actualHeight;
		const tempCtx = tempCanvasEl.getContext("2d");
		if (tempCtx) {
			// Temp canvas should be transparent
			tempCtx.globalCompositeOperation = "source-over";
			setTempContext(tempCtx);
			setTempCanvas(tempCanvasEl);
		}
		return () => {
			tempCanvasEl.remove();
		};
	}, [actualWidth, actualHeight, actualBackground]);

	/* --- INITIALIZE AUXILIARY CANVASES --- */
	useEffect(() => {
		// Inicializácia pomocných canvasov
		const initAuxCanvases = () => {
			const auxCanvases = [
				{ ref: floodFillCanvas, ctx: floodFillContext },
				{ ref: eyedropperCanvas, ctx: eyedropperContext },
				{ ref: healingCanvas, ctx: healingContext },
				{ ref: blurCanvas, ctx: blurContext },
			];

			auxCanvases.forEach(({ ref, ctx }) => {
				if (!ref.current) {
					const canvas = document.createElement("canvas");
					canvas.width = actualWidth;
					canvas.height = actualHeight;
					canvas.style.display = "none";
					document.body.appendChild(canvas);
					ref.current = canvas;
				}
				if (ref.current && !ctx.current) {
					ctx.current = ref.current.getContext("2d", {
						willReadFrequently: true,
					});
				}
			});

			// Naplniť pomocné canvasy aktuálnym stavom
			updateAuxCanvases();
		};

		initAuxCanvases();
	}, [actualWidth, actualHeight, updateAuxCanvases]);

	const originalToolRef = useRef<Tool | null>(null);

	useEffect(() => {
		const handleClearCanvasEvent = (e: CustomEvent) => {
			const preserveBackground = e.detail?.preserveBackground || false;
			handleClearCanvas({ preserveBackground });
		};

		window.addEventListener(
			"artstudio:clear-canvas",
			handleClearCanvasEvent as EventListener,
		);

		const handleRestoreHistory = (e: any) => {
			const detail = e?.detail;
			if (!detail) return;

			let data = detail;
			if (typeof detail === "object" && detail.canvasData) {
				data = detail.canvasData;
			}

			if (typeof data === "string") {
				restoreCanvasState(data);
			} else if (typeof data === "object") {
				// Handle case where it's already an object
				setLines(data.lines || []);
				setShapes(data.shapes || []);
				setImages(data.images || []);
				setTextObjects(data.textObjects || []);
				setGradients(data.gradients || []);
				if (data.canvasSize) setCanvasSize(data.canvasSize);
			}
		};
		window.addEventListener("artstudio:restore-history", handleRestoreHistory);

		const handleRemoveLayer = (e: CustomEvent) => {
			const layerId = e.detail?.layerId;
			if (layerId) {
				setLines((prev) => prev.filter((l) => l.layerId !== layerId));
				setShapes((prev) => prev.filter((s) => s.layerId !== layerId));
				setImages((prev) => prev.filter((img) => img.layerId !== layerId));
				setTextObjects((prev) =>
					prev.filter((text) => text.layerId !== layerId),
				);
				setGradients(gradients.filter((g) => g.layerId !== layerId));

				if (selectedId) {
					const allObjects = [...lines, ...shapes, ...images, ...textObjects];
					const selectedObject = allObjects.find(
						(obj) => obj.id === selectedId,
					);
					if (selectedObject && selectedObject.layerId === layerId) {
						setSelectedId(null);
					}
				}

				if (
					editingTextId &&
					textObjects.some(
						(text) => text.id === editingTextId && text.layerId === layerId,
					)
				) {
					setEditingTextId(null);
				}

				saveCanvasState("Layer deleted");
			}
		};
		window.addEventListener(
			"artstudio:remove-layer",
			handleRemoveLayer as EventListener,
		);

		const handleImportImageEvent = (e: any) => {
			const { src, name } = e.detail;
			const img = new window.Image();
			img.onload = () => {
				const newImage = {
					id: generateId("img"),
					src,
					x: 100,
					y: 100,
					width: img.width,
					height: img.height,
					layerId: activeLayerId || "layer-1",
				};
				setImages((prev) => [...prev, newImage]);
				saveCanvasState("Image imported");
				toast.success(`Image "${name}" imported`);
			};
			img.src = src;
		};
		window.addEventListener("artstudio:import-image", handleImportImageEvent);

		const handleTempToolChange = (e: any) => {
			if (e.detail && e.detail.tool) {
				if (!originalToolRef.current) {
					originalToolRef.current = activeTool;
				}
				setActiveTool(e.detail.tool);
			}
		};
		window.addEventListener("artstudio:temp-tool-change", handleTempToolChange);

		const handleTempToolReset = () => {
			if (originalToolRef.current) {
				setActiveTool(originalToolRef.current);
				originalToolRef.current = null;
			}
		};
		window.addEventListener("artstudio:temp-tool-reset", handleTempToolReset);

		return () => {
			window.removeEventListener(
				"artstudio:clear-canvas",
				handleClearCanvasEvent as EventListener,
			);
			window.removeEventListener(
				"artstudio:restore-history",
				handleRestoreHistory,
			);
			window.removeEventListener(
				"artstudio:remove-layer",
				handleRemoveLayer as EventListener,
			);
			window.removeEventListener(
				"artstudio:temp-tool-change",
				handleTempToolChange,
			);
			window.removeEventListener(
				"artstudio:temp-tool-reset",
				handleTempToolReset,
			);
			window.removeEventListener(
				"artstudio:import-image",
				handleImportImageEvent,
			);
		};
	}, [
		setGradients,
		clearSelection,
		activeLayerId,
		activeTool,
		handleClearCanvas,
		restoreCanvasState,
		saveCanvasState,
		setSelectedId,
		setEditingTextId,
		setActiveTool,
		generateId,
	]);
	const getCanvasPosition = useCallback((clientX: number, clientY: number) => {
		if (!stageRef.current) return null;
		const stage = stageRef.current;

		// Correctly calculate relative pointer position considering zoom and pan
		const transform = stage.getAbsoluteTransform().copy().invert();
		const pos = stage.getPointerPosition();
		if (!pos) return null;

		const relativePos = transform.point(pos);

		// Allow drawing on the entire stage without strict clamping if needed,
		// or just ensure it covers the actual canvas area properly.
		return {
			x: relativePos.x,
			y: relativePos.y,
		};
	}, []);

	const handleMagicWand = useCallback(
		(startX: number, startY: number) => {
			updateAuxCanvases();
			const ctx = floodFillContext.current;
			if (!ctx?.canvas) return;

			const width = actualWidth;
			const height = actualHeight;
			const px = Math.max(0, Math.min(width - 1, Math.floor(startX)));
			const py = Math.max(0, Math.min(height - 1, Math.floor(startY)));

			let imageData: ImageData;
			try {
				imageData = ctx.getImageData(0, 0, width, height);
			} catch {
				toast.error("Could not read canvas for Magic Wand");
				return;
			}
			const data = imageData.data;

			const startIdx = (py * width + px) * 4;
			const targetR = data[startIdx];
			const targetG = data[startIdx + 1];
			const targetB = data[startIdx + 2];
			const targetA = data[startIdx + 3];

			const visited = new Uint8Array(width * height);
			const stack: number[] = [px, py];
			const isContiguous = brushSettings.fillContiguous ?? true;
			let iterations = 0;
			const maxIterations = width * height;

			if (isContiguous) {
				// Contiguous (Flood Fill style)
				while (stack.length > 0 && iterations < maxIterations) {
					iterations++;
					const y = stack.pop()!;
					const x = stack.pop()!;
					const idx = y * width + x;

					if (visited[idx]) continue;
					visited[idx] = 1;

					const dataIdx = idx * 4;
					const r = data[dataIdx];
					const g = data[dataIdx + 1];
					const b = data[dataIdx + 2];
					const a = data[dataIdx + 3];

					const distance =
						Math.abs(r - targetR) +
						Math.abs(g - targetG) +
						Math.abs(b - targetB) +
						Math.abs(a - targetA);

					if (distance <= magicWandTolerance * 10.2) {
						if (x > 0 && !visited[idx - 1]) stack.push(x - 1, y);
						if (x < width - 1 && !visited[idx + 1]) stack.push(x + 1, y);
						if (y > 0 && !visited[idx - width]) stack.push(x, y - 1);
						if (y < height - 1 && !visited[idx + width]) stack.push(x, y + 1);
					}
				}
			} else {
				// Non-contiguous (Global selection)
				for (let i = 0; i < width * height; i++) {
					const r = data[i * 4];
					const g = data[i * 4 + 1];
					const b = data[i * 4 + 2];
					const a = data[i * 4 + 3];

					const distance =
						Math.abs(r - targetR) +
						Math.abs(g - targetG) +
						Math.abs(b - targetB) +
						Math.abs(a - targetA);

					if (distance <= magicWandTolerance * 10.2) {
						visited[i] = 1;
					}
				}
			}

			// Trace the contour of the selection mask (Moore-Neighbor Tracing or similar)
			const contour: number[] = [];
			const directions = [
				[0, -1],
				[1, -1],
				[1, 0],
				[1, 1],
				[0, 1],
				[-1, 1],
				[-1, 0],
				[-1, -1],
			];

			// 1. Find the first pixel of the selection
			let startPoint: { x: number; y: number } | null = null;
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					if (visited[y * width + x]) {
						startPoint = { x, y };
						break;
					}
				}
				if (startPoint) break;
			}

			if (startPoint) {
				let currX = startPoint.x;
				let currY = startPoint.y;
				let dir = 0; // Initial direction

				const maxPathPoints = 5000; // Safety limit
				let pointsFound = 0;

				while (pointsFound < maxPathPoints) {
					contour.push(currX, currY);
					pointsFound++;

					let foundNext = false;
					// Check all 8 neighbors starting from the one after the previous direction
					for (let i = 0; i < 8; i++) {
						const checkDir = (dir + 4 + i) % 8;
						const nextX = currX + directions[checkDir][0];
						const nextY = currY + directions[checkDir][1];

						if (
							nextX >= 0 &&
							nextX < width &&
							nextY >= 0 &&
							nextY < height &&
							visited[nextY * width + nextX]
						) {
							// Ensure it's an EDGE pixel
							const isEdge =
								nextX === 0 ||
								nextX === width - 1 ||
								nextY === 0 ||
								nextY === height - 1 ||
								!visited[nextY * width + (nextX - 1)] ||
								!visited[nextY * width + (nextX + 1)] ||
								!visited[(nextY - 1) * width + nextX] ||
								!visited[(nextY + 1) * width + nextX];

							if (isEdge) {
								currX = nextX;
								currY = nextY;
								dir = checkDir;
								foundNext = true;
								break;
							}
						}
					}

					if (
						!foundNext ||
						(currX === startPoint.x && currY === startPoint.y)
					) {
						break;
					}
				}
			}

			if (contour.length > 4) {
				setSelectionPath(contour);
				if (iterations >= maxIterations) {
					toast.warning("Selection too large, showing partial result");
				}
			} else {
				toast.info("No matching area found");
			}
		},
		[
			actualWidth,
			actualHeight,
			magicWandTolerance,
			brushSettings.fillContiguous,
			setSelectionPath,
			updateAuxCanvases,
		],
	);

	const handleCloneBrush = useCallback(
		(targetX: number, targetY: number) => {
			if (!cloneSourcePoint.current || !shapeStartPoint.current || !tempContext)
				return;
			updateAuxCanvases();
			const ctx = floodFillContext.current;
			if (!ctx?.canvas) return;
			const w = actualWidth;
			const h = actualHeight;
			const size = Math.max(1, Math.round(brushSettings.size));
			if (isNaN(size) || size > 2000) return; // Safety limit

			const radius = size / 2;
			const offset = {
				x: targetX - shapeStartPoint.current.x,
				y: targetY - shapeStartPoint.current.y,
			};
			const srcBaseX = cloneSourcePoint.current.x + offset.x;
			const srcBaseY = cloneSourcePoint.current.y + offset.y;

			const startX = Math.floor(targetX - radius);
			const startY = Math.floor(targetY - radius);
			const srcX = Math.floor(srcBaseX - radius);
			const srcY = Math.floor(srcBaseY - radius);

			// Clamp to canvas bounds so getImageData/putImageData don't throw
			const clampStart = (s: number, maxVal: number) =>
				Math.max(0, Math.min(maxVal - size, s));
			const safeStartX = clampStart(startX, w);
			const safeStartY = clampStart(startY, h);
			const safeSrcX = clampStart(srcX, w);
			const safeSrcY = clampStart(srcY, h);

			try {
				const srcImgData = ctx.getImageData(safeSrcX, safeSrcY, size, size);
				const dstImgData = tempContext.getImageData(
					safeStartX,
					safeStartY,
					size,
					size,
				);
				const src = srcImgData.data;
				const dst = dstImgData.data;

				for (let py = 0; py < size; py++) {
					for (let px = 0; px < size; px++) {
						const dx = px - radius;
						const dy = py - radius;
						if (dx * dx + dy * dy <= radius * radius) {
							const i = (py * size + px) * 4;
							dst[i] = src[i];
							dst[i + 1] = src[i + 1];
							dst[i + 2] = src[i + 2];
							dst[i + 3] = src[i + 3];
						}
					}
				}

				tempContext.putImageData(dstImgData, safeStartX, safeStartY);
				if (tempCanvas) setTempImage(tempCanvas as any);
			} catch (err) {
				console.error("Clone brush operation failed:", err);
			}
		},
		[
			brushSettings.size,
			tempContext,
			tempCanvas,
			actualWidth,
			actualHeight,
			updateAuxCanvases,
		],
	);

	const applyHealingBrush = useCallback(
		(x: number, y: number) => {
			if (!healingSource || !tempContext) return;
			const ctx = healingContext.current;
			if (!ctx) return;
			const size = Math.round(brushSettings.size);
			if (isNaN(size) || size <= 0 || size > 2000) return;
			const radius = size / 2;

			const startX = Math.floor(x - radius);
			const startY = Math.floor(y - radius);
			const srcX = Math.floor(healingSource.x - radius);
			const srcY = Math.floor(healingSource.y - radius);

			// Clamp to canvas bounds
			const clamp = (val: number, max: number) =>
				Math.max(0, Math.min(max - size, val));
			const safeStartX = clamp(startX, actualWidth);
			const safeStartY = clamp(startY, actualHeight);
			const safeSrcX = clamp(srcX, actualWidth);
			const safeSrcY = clamp(srcY, actualHeight);

			try {
				const srcData = ctx.getImageData(safeSrcX, safeSrcY, size, size).data;
				const targetImgData = ctx.getImageData(
					safeStartX,
					safeStartY,
					size,
					size,
				);
				const dst = targetImgData.data;

				for (let py = 0; py < size; py++) {
					for (let px = 0; px < size; px++) {
						const dx = px - radius;
						const dy = py - radius;
						if (dx * dx + dy * dy <= radius * radius) {
							const i = (py * size + px) * 4;
							// Simple blending for healing
							dst[i] = dst[i] * 0.4 + srcData[i] * 0.6;
							dst[i + 1] = dst[i + 1] * 0.4 + srcData[i + 1] * 0.6;
							dst[i + 2] = dst[i + 2] * 0.4 + srcData[i + 2] * 0.6;
						}
					}
				}

				tempContext.putImageData(targetImgData, safeStartX, safeStartY);
				if (tempCanvas) setTempImage(tempCanvas as any);
			} catch (err) {
				console.error("Healing brush operation failed:", err);
			}
		},
		[
			brushSettings.size,
			healingSource,
			tempContext,
			tempCanvas,
			actualWidth,
			actualHeight,
		],
	);

	const applyBlurBrush = useCallback(
		(x: number, y: number) => {
			if (!tempContext) return;
			const ctx = blurContext.current;
			if (!ctx) return;
			const size = Math.round(brushSettings.size);
			const radius = size / 2;
			// Blur radius - could be linked to intensity
			const blurR = Math.min(
				5,
				Math.max(1, Math.round(brushSettings.blurIntensity || 10 / 5)),
			);

			const startX = Math.floor(x - radius);
			const startY = Math.floor(y - radius);

			// Clamp to canvas bounds
			const clamp = (val: number, max: number, s: number) =>
				Math.max(0, Math.min(max - s, val));
			const safeStartX = clamp(startX, actualWidth, size);
			const safeStartY = clamp(startY, actualHeight, size);

			// We need a larger area for convolution
			const sampleArea = size + blurR * 2;

			try {
				const sourceData = ctx.getImageData(
					safeStartX - blurR,
					safeStartY - blurR,
					sampleArea,
					sampleArea,
				);
				const targetData = ctx.createImageData(size, size);
				const src = sourceData.data;
				const dst = targetData.data;

				for (let py = 0; py < size; py++) {
					for (let px = 0; px < size; px++) {
						const dx = px - radius;
						const dy = py - radius;
						if (dx * dx + dy * dy <= radius * radius) {
							const dstIdx = (py * size + px) * 4;
							let r = 0,
								g = 0,
								b = 0,
								a = 0,
								count = 0;

							// Simple box blur kernel
							for (let ky = -blurR; ky <= blurR; ky++) {
								for (let kx = -blurR; kx <= blurR; kx++) {
									const srcX = px + blurR + kx;
									const srcY = py + blurR + ky;
									const srcIdx = (srcY * sampleArea + srcX) * 4;
									r += src[srcIdx];
									g += src[srcIdx + 1];
									b += src[srcIdx + 2];
									a += src[srcIdx + 3];
									count++;
								}
							}
							dst[dstIdx] = r / count;
							dst[dstIdx + 1] = g / count;
							dst[dstIdx + 2] = b / count;
							dst[dstIdx + 3] = a / count;
						} else {
							const dstIdx = (py * size + px) * 4;
							const srcIdx = ((py + blurR) * sampleArea + (px + blurR)) * 4;
							dst[dstIdx] = src[srcIdx];
							dst[dstIdx + 1] = src[srcIdx + 1];
							dst[dstIdx + 2] = src[srcIdx + 2];
							dst[dstIdx + 3] = src[srcIdx + 3];
						}
					}
				}

				tempContext.putImageData(targetData, safeStartX, safeStartY);
				if (tempCanvas) setTempImage(tempCanvas as any);
			} catch (err) {
				console.error("Blur brush operation failed:", err);
			}
		},
		[
			brushSettings.size,
			brushSettings.blurIntensity,
			tempContext,
			tempCanvas,
			actualWidth,
			actualHeight,
		],
	);

	const applyCrop = useCallback(() => {
		if (activeTool !== "crop" || !selectionBounds) return;
		const { x, y, width, height } = selectionBounds;
		if (width <= 0 || height <= 0) return;

		setCanvasSize({ width, height, backgroundColor: actualBackground });
		// Use functional updates to avoid stale closure issues
		setLines((prevLines) =>
			prevLines.map((l) => ({
				...l,
				points: l.points.map((p, i) => (i % 2 === 0 ? p - x : p - y)),
			})),
		);
		setShapes((prevShapes) =>
			prevShapes.map((s) => ({
				...s,
				x: typeof s.x === "number" ? s.x - x : s.x,
				y: typeof s.y === "number" ? s.y - y : s.y,
			})),
		);
		setImages((prevImages) =>
			prevImages.map((img) => ({ ...img, x: img.x - x, y: img.y - y })),
		);
		setTextObjects((prevTexts) =>
			prevTexts.map((t) => ({
				...t,
				x: t.x - x,
				y: t.y - y,
			})),
		);
		setGradients(
			gradients.map((g) => ({
				...g,
				x0: g.x0 - x,
				y0: g.y0 - y,
				x1: g.x1 - x,
				y1: g.y1 - y,
			})),
		);

		setSelectionBounds(null);
		setSelectionPath(null);
		saveCanvasState("Canvas cropped");
		toast.success("Canvas cropped");
	}, [
		activeTool,
		selectionBounds,
		actualBackground,
		gradients,
		setCanvasSize,
		setGradients,
		setLines,
		setShapes,
		setImages,
		setTextObjects,
		setSelectionBounds,
		setSelectionPath,
		saveCanvasState,
	]);

	/* --- IMPROVED START DRAWING --- */
	const startDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			const drawingTools = [
				"brush",
				"pencil",
				"eraser",
				"clone",
				"healing",
				"blur",
				"dodge",
				"burn",
			];
			if (!drawingTools.includes(activeTool)) return;

			if (activeTool === "clone" && !cloneSourcePoint.current) {
				toast.error("Alt+click to set clone source first");
				return;
			}

			setIsDrawing(true);
			shapeStartPoint.current = pos;

			// Handle brush, pencil, eraser
			if (["brush", "pencil", "eraser"].includes(activeTool)) {
				const strokeColor = activeTool === "eraser" ? "#000000" : primaryColor;
				const newLine: DrawingLine = {
					id: generateId("line"),
					points: [pos.x, pos.y],
					stroke: strokeColor,
					strokeWidth: brushSettings.size, // Eraser uses brush size too
					tool: activeTool as any,
					layerId: activeLayerId || "layer-1",
					opacity: brushSettings.opacity / 100,
					hardness: brushSettings.hardness / 100,
				};

				setActiveDrawingLine(newLine);
				setActiveLinePoints([pos.x, pos.y]);
			}

			// Dodge/Burn/Clone/Blur/Healing: copy current layer to temp so we draw on top of layer content
			if (["dodge", "burn", "clone", "blur", "healing"].includes(activeTool)) {
				updateAuxCanvases();
				if (tempContext && floodFillCanvas.current) {
					tempContext.drawImage(
						floodFillCanvas.current,
						0,
						0,
						actualWidth,
						actualHeight,
					);
					if (tempCanvas) setTempImage(tempCanvas as any);
				}
			}

			// Use helper functions for complex bitmap brushes
			if (activeTool === "clone") {
				handleCloneBrush(pos.x, pos.y);
			} else if (activeTool === "healing") {
				applyHealingBrush(pos.x, pos.y);
			} else if (activeTool === "blur") {
				applyBlurBrush(pos.x, pos.y);
			} else if (activeTool === "dodge") {
				applyDodgeBrush(pos.x, pos.y);
			} else if (activeTool === "burn") {
				applyBurnBrush(pos.x, pos.y);
			}
		},
		[
			activeTool,
			primaryColor,
			brushSettings.size,
			activeLayerId,
			tempContext,
			actualWidth,
			actualHeight,
			updateAuxCanvases,
			tempCanvas,
			handleCloneBrush,
			applyHealingBrush,
			applyBlurBrush,
			applyDodgeBrush,
			applyBurnBrush,
		],
	);

	/* --- IMPROVED CONTINUE DRAWING --- */
	const continueDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			if (!isDrawing) return;

			// Handle bitmap brushes
			if (activeTool === "clone") {
				handleCloneBrush(pos.x, pos.y);
			} else if (activeTool === "healing") {
				applyHealingBrush(pos.x, pos.y);
			} else if (activeTool === "blur") {
				applyBlurBrush(pos.x, pos.y);
			} else if (activeTool === "dodge") {
				applyDodgeBrush(pos.x, pos.y);
			} else if (activeTool === "burn") {
				applyBurnBrush(pos.x, pos.y);
			}
			// Handle vector tools (brush, pencil, eraser)
			else if (activeDrawingLine) {
				// Update active line points - much faster than updating main lines array
				setActiveLinePoints((prev) => [...prev, pos.x, pos.y]);
			}
		},
		[
			isDrawing,
			activeDrawingLine,
			tempContext,
			activeTool,
			handleCloneBrush,
			applyHealingBrush,
			applyBlurBrush,
			applyDodgeBrush,
			applyBurnBrush,
			tempCanvas,
		],
	);

	const stopDrawing = useCallback(() => {
		if (isDrawing) {
			setIsDrawing(false);

			// Finalize the vector line if we were drawing one
			if (activeDrawingLine && activeLinePoints.length > 2) {
				const completedLine = {
					...activeDrawingLine,
					points: activeLinePoints,
				};
				setLines((prev) => [...prev, completedLine]);
			}

			setActiveDrawingLine(null);
			setActiveLinePoints([]);

			if (tempContext) {
				tempContext.closePath();
			}

			// Handle bitmap brushes finalization
			if (
				tempCanvas &&
				["clone", "healing", "blur", "dodge", "burn"].includes(activeTool)
			) {
				const imgData = tempCanvas.toDataURL();
				const newImg: ImageObject = {
					id: generateId(`${activeTool}-stroke`),
					src: imgData,
					x: 0,
					y: 0,
					width: actualWidth,
					height: actualHeight,
					layerId: activeLayerId || "layer-1",
				};
				setImages((prev) => [...prev, newImg]);

				// Reset temp canvas
				if (tempContext) tempContext.clearRect(0, 0, actualWidth, actualHeight);
				setTempImage(null);
			} else if (tempContext) {
				// For vector tools (brush, eraser), just clear the temp preview
				tempContext.clearRect(0, 0, actualWidth, actualHeight);
				setTempImage(null);
			}

			saveCanvasState(`${activeTool === "eraser" ? "Erased" : "Stroke added"}`);
		}
	}, [
		isDrawing,
		activeDrawingLine,
		activeLinePoints,
		tempContext,
		saveCanvasState,
		activeTool,
		actualWidth,
		actualHeight,
		activeLayerId,
		tempCanvas,
		generateId,
		setLines,
		setImages,
	]);

	const finishPenDrawing = useCallback(() => {
		if (!currentPenLine) return;
		if (currentPenLine.points.length >= 4) {
			setLines((prev) => [...prev, currentPenLine]);
			saveCanvasState("Pen curve completed");
		}
		setCurrentPenLine(null);
		setPenPoints([]);
		setIsDrawing(false);
	}, [currentPenLine, setLines, setPenPoints, setIsDrawing, saveCanvasState]);

	const finishPolygonDrawing = useCallback(() => {
		if (currentShape && currentShape.type === "polygon") {
			setShapes((prev) => [...prev, currentShape]);
			saveCanvasState("Polygon created");
		}
		setCurrentShape(null);
		setPolygonPoints([]);
		setIsDrawingPolygon(false);
		setIsDrawing(false);
	}, [
		currentShape,
		setShapes,
		setPolygonPoints,
		setIsDrawingPolygon,
		setIsDrawing,
		saveCanvasState,
	]);

	// Cleanup drawings when tool changes
	useEffect(() => {
		if (activeTool !== "gradient" && isDrawingGradient) {
			setCurrentGradient(null);
			setIsDrawingGradient(false);
			gradientStartPoint.current = null;
			setIsDrawing(false);
		}
		if (activeTool !== "pen" && currentPenLine) {
			finishPenDrawing();
		}
		if (activeTool !== "polygon" && isDrawingPolygon) {
			finishPolygonDrawing();
		}
		if (
			!["rectangle", "ellipse", "star", "line"].includes(activeTool) &&
			currentShape &&
			currentShape.type !== "polygon"
		) {
			setCurrentShape(null);
			setIsDrawing(false);
		}
	}, [
		activeTool,
		isDrawingGradient,
		currentPenLine,
		isDrawingPolygon,
		currentShape,
		finishPenDrawing,
		finishPolygonDrawing,
	]);

	/* --- GLOBAL KEYBOARD SHORTCUTS --- */
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts if editing text
			if (
				editingTextId ||
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement).isContentEditable
			) {
				return;
			}

			const key = e.key.toUpperCase();
			const isCtrl = e.ctrlKey || e.metaKey;

			// Delete / Backspace
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				handleDeleteSelected();
				return;
			}

			// Ctrl+D (Deselect)
			if (isCtrl && key === "D") {
				e.preventDefault();
				handleDeselect();
				toast.info("Selection cleared");
				return;
			}

			// [ / ] (Brush Size)
			if (e.key === "[" || e.key === "]") {
				const delta = e.key === "[" ? -5 : 5;
				const newSize = Math.max(
					1,
					Math.min(500, (brushSettings.size || 10) + delta),
				);
				setBrushSettings({ size: newSize });
				toast.info(`Brush Size: ${newSize}px`);
				return;
			}

			// Escape (Cancel)
			if (e.key === "Escape") {
				handleDeselect();
				if (isDrawing) setIsDrawing(false);
				if (isDrawingPolygon) setIsDrawingPolygon(false);
				if (currentPenLine) setCurrentPenLine(null);
				if (currentShape) setCurrentShape(null);
				if (currentGradient) setCurrentGradient(null);
				return;
			}

			// Enter (Finalize)
			if (e.key === "Enter") {
				if (activeTool === "crop") {
					applyCrop();
				} else if (isDrawingPolygon) {
					finishPolygonDrawing();
				} else if (currentPenLine) {
					finishPenDrawing();
				}
				return;
			}
		};

		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, [
		editingTextId,
		handleDeleteSelected,
		handleDeselect,
		isDrawing,
		isDrawingPolygon,
		currentPenLine,
		currentShape,
		currentGradient,
		activeTool,
		brushSettings,
		setBrushSettings,
		applyCrop,
		finishPolygonDrawing,
		finishPenDrawing,
	]);

	const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		// Ak je v editácii textu, nechajme textarea spracovať kliknutie
		if (editingTextId && e.target === stageRef.current) {
			// Uložiť editáciu a zavrieť textarea
			const text = textObjects.find((t) => t.id === editingTextId);
			if (text) {
				handleUpdateText(editingTextId, { isEditing: false });
				setEditingTextId(null);
			}
			return;
		}

		const selectionTools: Tool[] = [
			"select",
			"move",
			"marquee",
			"lasso",
			"magicwand",
			"crop",
		];
		if (selectionTools.includes(activeTool)) {
			if (activeTool === "select" || activeTool === "move") {
				if (
					e.target === stageRef.current ||
					(e.target.name() && e.target.name() === "background")
				) {
					setSelectedId(null);
					clearSelection();
				}
			}
			if (activeTool === "marquee" || activeTool === "crop") {
				clearSelection();
				isSelectingRef.current = true;
				setIsSelecting(true);
				setSelectionStartPoint(pos);
				setSelectionBounds({ x: pos.x, y: pos.y, width: 0, height: 0 });
			}
			if (activeTool === "lasso") {
				clearSelection();
				isSelectingRef.current = true;
				setIsSelecting(true);
				setSelectionStartPoint(pos);
				setSelectionPath([pos.x, pos.y]);
			}
			if (activeTool === "magicwand") {
				clearSelection();
				handleMagicWand(pos.x, pos.y);
			}
			return;
		}

		if (activeTool === "gradient") {
			// Reset any previous gradient drawing
			if (isDrawingGradient && currentGradient) {
				setCurrentGradient(null);
				setIsDrawingGradient(false);
			}

			setIsDrawingGradient(true);
			setIsDrawing(true); // Bypass throttle
			gradientStartPoint.current = pos;
			const newGradient: GradientObject = {
				id: generateId("gradient"),
				type: brushSettings.gradientType || "linear",
				x0: pos.x,
				y0: pos.y,
				x1: pos.x,
				y1: pos.y,
				colorStops: (brushSettings.gradientStops || []).map((s) => ({
					offset: s.position,
					color: s.color,
				})),
				layerId: activeLayerId || "layer-1",
			};
			setCurrentGradient(newGradient);
			return;
		}

		// If another tool is selected while drawing gradient, cancel gradient
		if (isDrawingGradient) {
			setCurrentGradient(null);
			setIsDrawingGradient(false);
			gradientStartPoint.current = null;
		}

		if (activeTool === "pen") {
			if (e.evt.button === 0) {
				if (!currentPenLine) {
					const newLine: DrawingLine = {
						id: generateId("pen"),
						points: [pos.x, pos.y],
						stroke: primaryColor,
						strokeWidth: brushSettings.strokeWidth || 2,
						tool: "pen",
						layerId: activeLayerId || "layer-1",
						opacity: brushSettings.opacity / 100,
						hardness: brushSettings.hardness / 100,
					};
					setCurrentPenLine(newLine);
					setPenPoints([pos.x, pos.y]);
					setIsDrawing(true);
				} else {
					setPenPoints((prev) => [...prev, pos.x, pos.y]);
					setCurrentPenLine((prev) =>
						prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : null,
					);
				}
			}
			return;
		}

		if (activeTool === "polygon") {
			if (e.evt.button === 0) {
				shapeStartPoint.current = pos;
				setIsDrawingPolygon(true);
				setIsDrawing(true); // Bypass throttle
				const sides = brushSettings.sides || 5;
				const radius = 5;
				const points: number[] = [];
				for (let i = 0; i < sides; i++) {
					const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
					points.push(
						pos.x + radius * Math.cos(angle),
						pos.y + radius * Math.sin(angle),
					);
				}

				const polygonShape: ShapeObject = {
					id: generateId("polygon"),
					type: "polygon",
					points: points,
					x: 0,
					y: 0,
					stroke: primaryColor,
					strokeWidth: brushSettings.strokeWidth || 2,
					fill:
						brushSettings.fillType === "none"
							? "transparent"
							: brushSettings.fillType === "gradient"
								? "transparent"
								: `${primaryColor}40`,
					layerId: activeLayerId || "layer-1",
				};
				setCurrentShape(polygonShape);
			}
			return;
		}

		if (activeTool === "star") {
			shapeStartPoint.current = pos;
			setIsDrawing(true); // Bypass throttle
			const starShape: ShapeObject = {
				id: generateId("star"),
				type: "star",
				x: pos.x,
				y: pos.y,
				numPoints: brushSettings.starPoints || 5,
				innerRadius: brushSettings.starInnerRadius || 30,
				outerRadius: brushSettings.starOuterRadius || 60,
				rotation: brushSettings.starRotation || 0,
				fill:
					brushSettings.starFillType === "none"
						? "transparent"
						: brushSettings.starFillType === "gradient"
							? "transparent"
							: brushSettings.starFillColor || primaryColor,
				stroke: brushSettings.starStrokeColor || secondaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				layerId: activeLayerId || "layer-1",
			};
			setCurrentShape(starShape);
			return;
		}

		const drawingTools = [
			"brush",
			"pencil",
			"eraser",
			"healing",
			"blur",
			"clone",
			"dodge",
			"burn",
		];
		if (drawingTools.includes(activeTool)) {
			if (activeTool === "clone" && e.evt.altKey) {
				cloneSourcePoint.current = pos;
				toast.success("Clone source set");
				return;
			}
			startDrawing(pos);
			return;
		}

		if (["rectangle", "ellipse", "line"].includes(activeTool)) {
			shapeStartPoint.current = pos;
			setIsDrawing(true); // Bypass throttle
			const newShape: ShapeObject = {
				id: generateId("shape"),
				type:
					activeTool === "rectangle"
						? "rect"
						: activeTool === "ellipse"
							? "ellipse"
							: ("line" as any),
				x: pos.x,
				y: pos.y,
				width: 1,
				height: 1,
				radiusX: activeTool === "ellipse" ? 1 : undefined,
				radiusY: activeTool === "ellipse" ? 1 : undefined,
				points:
					activeTool === "line" ? [pos.x, pos.y, pos.x, pos.y] : undefined,
				fill: activeTool === "line" ? "transparent" : primaryColor,
				stroke: activeTool === "line" ? primaryColor : secondaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				layerId: activeLayerId || "layer-1",
			};
			setCurrentShape(newShape);
			return;
		}

		if (activeTool === "eyedropper") {
			handleEyedropper(pos.x, pos.y, e.evt.altKey);
			return;
		}

		if (activeTool === "fill") {
			floodFill(pos.x, pos.y, primaryColor);
			return;
		}

		if (activeTool === "text") {
			handleTextTool(pos);
			return;
		}

		if (activeTool === "hand") {
			isPanning.current = true;
			setIsPanningState(true);
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
			return;
		}

		if (activeTool === "zoom") {
			isScrubbyZooming.current = true;
			scrubbyZoomStartPos.current = { x: e.evt.clientX, y: e.evt.clientY };
			scrubbyZoomStartScale.current = zoom;
			return;
		}

		if (activeTool === "undoZoom") {
			zoomBack();
			return;
		}
	};

	const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
		// Throttle mouse move events for performance
		const now = performance.now();
		if (
			now - lastMouseMoveTime.current < throttleDelay &&
			!isDrawing &&
			!isSelecting &&
			!isSelectingRef.current &&
			!isDrawingGradient &&
			!isDrawingPolygon &&
			!currentPenLine &&
			!currentShape &&
			!isPanning.current
		) {
			return;
		}
		lastMouseMoveTime.current = now;

		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		setCursorPosition({ x: Math.round(pos.x), y: Math.round(pos.y) });

		// Paint bucket preview
		if (activeTool === "fill" && !isDrawing && tempContext) {
			// Clear previous preview
			tempContext.clearRect(0, 0, actualWidth, actualHeight);

			// Draw preview circle
			tempContext.save();
			tempContext.globalAlpha = 0.5;
			tempContext.fillStyle = primaryColor;
			tempContext.beginPath();
			tempContext.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
			tempContext.fill();
			tempContext.restore();

			// Update preview image
			if (tempCanvas) {
				const img = new window.Image();
				img.src = tempCanvas.toDataURL();
				img.onload = () => {
					setTempImage(img);
				};
			}
		}

		if (isSelecting && selectionStartPoint) {
			if (activeTool === "marquee" || activeTool === "crop") {
				const x = Math.min(selectionStartPoint.x, pos.x);
				const y = Math.min(selectionStartPoint.y, pos.y);
				const width = Math.abs(pos.x - selectionStartPoint.x);
				const height = Math.abs(pos.y - selectionStartPoint.y);
				setSelectionBounds({ x, y, width, height });
			} else if (activeTool === "lasso") {
				// Use current path from store to avoid stale closure
				const currentPath = useArtStudioStore.getState().selectionPath;
				const path = currentPath ?? [];
				const lastX = path[path.length - 2];
				const lastY = path[path.length - 1];
				if (
					path.length === 0 ||
					lastX === undefined ||
					lastY === undefined ||
					Math.abs(lastX - pos.x) > 3 ||
					Math.abs(lastY - pos.y) > 3
				) {
					setSelectionPath([...path, pos.x, pos.y]);
				}
			}
		}

		if (activeTool === "pen" && currentPenLine) {
			setCurrentPenLine({
				...currentPenLine,
				points: [...currentPenLine.points, pos.x, pos.y],
			});
			return;
		}

		if (isDrawingPolygon && polygonPoints.length > 0) {
			setCurrentShape({
				id: "polygon-preview",
				type: "polygon",
				x: 0,
				y: 0,
				points: [...polygonPoints, pos.x, pos.y],
				stroke: primaryColor,
				strokeWidth: 2,
				fill: `${primaryColor}40`,
				layerId: activeLayerId || "layer-1",
			});
		}

		if (isDrawing) {
			continueDrawing(pos);
		}

		if (currentShape && shapeStartPoint.current) {
			if (currentShape.type === "rect") {
				const x = Math.min(shapeStartPoint.current.x, pos.x);
				const y = Math.min(shapeStartPoint.current.y, pos.y);
				const width = Math.abs(pos.x - shapeStartPoint.current.x);
				const height = Math.abs(pos.y - shapeStartPoint.current.y);
				setCurrentShape({ ...currentShape, x, y, width, height });
			} else if (currentShape.type === "ellipse") {
				const radiusX = Math.abs(pos.x - shapeStartPoint.current.x);
				const radiusY = Math.abs(pos.y - shapeStartPoint.current.y);
				setCurrentShape({ ...currentShape, radiusX, radiusY });
			} else if (currentShape.type === "star") {
				const dx = pos.x - currentShape.x;
				const dy = pos.y - currentShape.y;
				const outerRadius = Math.sqrt(dx * dx + dy * dy);
				// Maintain ratio of inner to outer radius from brush settings
				const ratio =
					(brushSettings.starInnerRadius || 30) /
					(brushSettings.starOuterRadius || 60);
				const innerRadius = outerRadius * ratio;

				setCurrentShape({
					...currentShape,
					outerRadius: Math.max(5, outerRadius),
					innerRadius: Math.max(2, innerRadius),
					rotation: Math.atan2(dy, dx) * (180 / Math.PI),
				});
			} else if (currentShape.type === "line") {
				setCurrentShape({
					...currentShape,
					points: [
						shapeStartPoint.current.x,
						shapeStartPoint.current.y,
						pos.x,
						pos.y,
					],
				});
			} else if (currentShape.type === "polygon") {
				const startX = shapeStartPoint.current.x;
				const startY = shapeStartPoint.current.y;
				const radius = Math.sqrt((pos.x - startX) ** 2 + (pos.y - startY) ** 2);
				const rotation = Math.atan2(pos.y - startY, pos.x - startX);
				const sides = brushSettings.sides || 5;
				const points: number[] = [];
				for (let i = 0; i < sides; i++) {
					const angle = (i * 2 * Math.PI) / sides - Math.PI / 2 + rotation;
					points.push(
						startX + radius * Math.cos(angle),
						startY + radius * Math.sin(angle),
					);
				}
				setCurrentShape({
					...currentShape,
					points: points,
				});
			}
		}

		if (isDrawingGradient && currentGradient && gradientStartPoint.current) {
			setCurrentGradient({
				...currentGradient,
				x1: pos.x,
				y1: pos.y,
			});
		}

		if (isScrubbyZooming.current) {
			const deltaX = e.evt.clientX - scrubbyZoomStartPos.current.x;
			const sensitivity = 0.5;
			const newZoom = Math.max(
				10,
				Math.min(5000, scrubbyZoomStartScale.current + deltaX * sensitivity),
			);

			const stage = stageRef.current;
			if (stage) {
				const stageBox = stage.container().getBoundingClientRect();
				const centerPoint = {
					x: scrubbyZoomStartPos.current.x - stageBox.left,
					y: scrubbyZoomStartPos.current.y - stageBox.top,
				};
				zoomTo(newZoom, { centerOnPoint: centerPoint });
			}
			return;
		}

		if (isPanning.current) {
			const deltaX = e.evt.clientX - lastPanPos.current.x;
			const deltaY = e.evt.clientY - lastPanPos.current.y;

			setPanOffset({
				x: panOffset.x + deltaX,
				y: panOffset.y + deltaY,
			});
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
		}
	};

	const handleMouseUp = () => {
		// Clear paint bucket preview
		if (activeTool === "fill" && tempContext) {
			tempContext.clearRect(0, 0, actualWidth, actualHeight);
			setTempImage(null);
		}

		if (isSelecting) {
			isSelectingRef.current = false;
			setIsSelecting(false);
			if (activeTool === "marquee" && selectionBounds) {
				const { x, y, width, height } = selectionBounds;
				const selectedShapes = shapes.filter((s) => {
					if (s.type === "rect") {
						return (
							s.x < x + width &&
							s.x + (s.width || 0) > x &&
							s.y < y + height &&
							s.y + (s.height || 0) > y
						);
					}
					if (s.type === "ellipse") {
						return (
							s.x - (s.radiusX || 0) < x + width &&
							s.x + (s.radiusX || 0) > x &&
							s.y - (s.radiusY || 0) < y + height &&
							s.y + (s.radiusY || 0) > y
						);
					}
					if (s.type === "star") {
						const starRadius = s.outerRadius || 0;
						return (
							s.x - starRadius < x + width &&
							s.x + starRadius > x &&
							s.y - starRadius < y + height &&
							s.y + starRadius > y
						);
					}
					if (s.type === "polygon") {
						// Simple bounding box check for polygons
						let minPX = Infinity,
							minPY = Infinity,
							maxPX = -Infinity,
							maxPY = -Infinity;
						s.points?.forEach((p, i) => {
							if (i % 2 === 0) {
								minPX = Math.min(minPX, p);
								maxPX = Math.max(maxPX, p);
							} else {
								minPY = Math.min(minPY, p);
								maxPY = Math.max(maxPY, p);
							}
						});
						return (
							maxPX > x && minPX < x + width && maxPY > y && minPY < y + height
						);
					}
					if (s.type === "line") {
						const [x1, y1, x2, y2] = s.points || [0, 0, 0, 0];
						const lineMinX = Math.min(x1, x2);
						const lineMaxX = Math.max(x1, x2);
						const lineMinY = Math.min(y1, y2);
						const lineMaxY = Math.max(y1, y2);
						return (
							lineMaxX > x &&
							lineMinX < x + width &&
							lineMaxY > y &&
							lineMinY < y + height
						);
					}
					return s.x >= x && s.x <= x + width && s.y >= y && s.y <= y + height;
				});
				const selectedImgs = images.filter((img) => {
					return (
						img.x < x + width &&
						img.x + img.width > x &&
						img.y < y + height &&
						img.y + img.height > y
					);
				});
				const selectedTexts = textObjects.filter((text) => {
					return (
						text.x < x + width &&
						text.x + (text.width || 100) > x &&
						text.y < y + height &&
						text.y + (text.height || 50) > y
					);
				});
				const selectedLines = lines.filter((l) => {
					// Check if any point of the line is within selection bounds
					for (let i = 0; i < l.points.length; i += 2) {
						if (
							l.points[i] >= x &&
							l.points[i] <= x + width &&
							l.points[i + 1] >= y &&
							l.points[i + 1] <= y + height
						) {
							return true;
						}
					}
					return false;
				});

				if (selectedShapes.length > 0)
					setSelectedId(selectedShapes[selectedShapes.length - 1].id);
				else if (selectedImgs.length > 0)
					setSelectedId(selectedImgs[selectedImgs.length - 1].id);
				else if (selectedTexts.length > 0)
					setSelectedId(selectedTexts[selectedTexts.length - 1].id);
				else if (selectedLines.length > 0)
					setSelectedId(selectedLines[selectedLines.length - 1].id);
				else setSelectedId(null);
			} else if (
				activeTool === "lasso" &&
				selectionPath &&
				selectionPath.length >= 6
			) {
				let minX = Infinity,
					minY = Infinity,
					maxX = -Infinity,
					maxY = -Infinity;
				for (let i = 0; i < selectionPath.length; i += 2) {
					minX = Math.min(minX, selectionPath[i]);
					minY = Math.min(minY, selectionPath[i + 1]);
					maxX = Math.max(maxX, selectionPath[i]);
					maxY = Math.max(maxY, selectionPath[i + 1]);
				}
				const selectedShapes = shapes.filter(
					(s) =>
						s.x < maxX &&
						s.x + (s.width || 0) > minX &&
						s.y < maxY &&
						s.y + (s.height || 0) > minY,
				);
				const selectedImgs = images.filter(
					(img) =>
						img.x < maxX &&
						img.x + img.width > minX &&
						img.y < maxY &&
						img.y + img.height > minY,
				);
				const selectedTexts = textObjects.filter(
					(text) =>
						text.x < maxX &&
						text.x + (text.width || 100) > minX &&
						text.y < maxY &&
						text.y + (text.height || 50) > minY,
				);

				if (selectedShapes.length > 0)
					setSelectedId(selectedShapes[selectedShapes.length - 1].id);
				else if (selectedImgs.length > 0)
					setSelectedId(selectedImgs[selectedImgs.length - 1].id);
				else if (selectedTexts.length > 0)
					setSelectedId(selectedTexts[selectedTexts.length - 1].id);
				else setSelectedId(null);
			}
			setSelectionStartPoint(null);
		}
		if (isDrawing) stopDrawing();
		if (
			currentShape &&
			["rect", "ellipse", "polygon", "line", "star"].includes(currentShape.type)
		) {
			setShapes((prev) => [...prev, currentShape]);
			setCurrentShape(null);
			saveCanvasState(`${currentShape.type} created`);
		}
		if (isDrawingGradient && currentGradient) {
			// Only finalize if gradient has meaningful size
			const dx = currentGradient.x1 - currentGradient.x0;
			const dy = currentGradient.y1 - currentGradient.y0;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > 5 && currentGradient) {
				addGradient(currentGradient);
				saveCanvasState("Gradient added");
			}

			// Always reset gradient drawing state
			setCurrentGradient(null);
			setIsDrawingGradient(false);
			gradientStartPoint.current = null;
		}

		isPanning.current = false;
		isScrubbyZooming.current = false;
		setIsPanningState(false);
	};

	const handleDblClick = () => {
		if (isDrawingPolygon) finishPolygonDrawing();
		if (currentPenLine) finishPenDrawing();
		if (activeTool === "crop") applyCrop();
	};

	const handleObjectClick = (
		id: string,
		e?: Konva.KonvaEventObject<MouseEvent>,
	) => {
		if (activeTool === "select" || activeTool === "move") {
			setSelectedId(id);

			// Check if it's a text object
			const text = textObjects.find((t) => t.id === id);
			if (text && !text.isEditing) {
				// Start editing on double click
				if (e && e.evt.detail === 2) {
					handleStartTextEdit(id);
				}
			}
		} else if (activeTool === "text") {
			// When text tool is active and we click on a text object, start editing
			const text = textObjects.find((t) => t.id === id);
			if (text) {
				handleStartTextEdit(id);
			}
		}
	};

	const getCursor = () => {
		if (activeTool === "hand") return isPanningState ? "grabbing" : "grab";
		if (activeTool === "zoom") return "zoom-in";
		if (activeTool === "undoZoom") return "zoom-out";
		if (
			[
				"brush",
				"pencil",
				"eraser",
				"healing",
				"blur",
				"clone",
				"dodge",
				"burn",
			].includes(activeTool)
		)
			return "crosshair";
		if (["marquee", "lasso", "magicwand", "crop"].includes(activeTool))
			return "crosshair";
		if (activeTool === "text") return "text";
		if (activeTool === "move") return "move";
		if (activeTool === "eyedropper") return "copy";
		if (activeTool === "fill") return "alias";
		if (activeTool === "star") return "crosshair";
		return "default";
	};

	// Textarea change handler
	const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (!editingTextId) return;

		const text = textObjects.find((t) => t.id === editingTextId);
		if (text) {
			handleUpdateText(editingTextId, { text: e.target.value });
		}
	};

	// Textarea key down handler
	const handleTextAreaKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
	) => {
		if (!editingTextId) return;

		if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
			// Save and exit edit mode
			handleUpdateText(editingTextId, { isEditing: false });
			setEditingTextId(null);
		} else if (e.key === "Escape") {
			// Cancel edit mode
			handleCancelTextEdit(editingTextId);
			setEditingTextId(null);
		}
	};

	// Textarea blur handler
	const handleTextAreaBlur = () => {
		if (editingTextId) {
			// Save changes when textarea loses focus
			setTimeout(() => {
				handleUpdateText(editingTextId, { isEditing: false });
				setEditingTextId(null);
			}, 100);
		}
	};

	/* --- History Monitoring Removed for Performance --- */
	useEffect(() => {
		// Only monitor history index changes if needed
	}, [historyIndex]);

	// --- Canvas resize event listener ---
	useEffect(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent).detail as {
				width: number;
				height: number;
				backgroundColor: string;
			};
			if (detail) {
				setCanvasSize(detail);
			}
		};
		window.addEventListener("artstudio:resize-canvas", handler);
		return () => window.removeEventListener("artstudio:resize-canvas", handler);
	}, [setCanvasSize]);

	// --- Drag-and-drop image import ---
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const files = Array.from(e.dataTransfer.files).filter((f) =>
				f.type.startsWith("image/"),
			);
			if (!files.length) return;

			files.forEach((file) => {
				const reader = new FileReader();
				reader.onload = (ev) => {
					const src = ev.target?.result as string;
					if (!src) return;

					const img = new window.Image();
					img.onload = () => {
						const canvasRect = containerRef.current?.getBoundingClientRect();
						const dropX = canvasRect
							? (e.clientX - canvasRect.left - panOffset.x) / (zoom / 100)
							: 100;
						const dropY = canvasRect
							? (e.clientY - canvasRect.top - panOffset.y) / (zoom / 100)
							: 100;

						const newImage = {
							id: generateId("img"),
							src,
							x: Math.max(0, dropX - img.width / 2),
							y: Math.max(0, dropY - img.height / 2),
							width: img.width,
							height: img.height,
							layerId: activeLayerId || "layer-1",
						};
						setImages((prev) => [...prev, newImage]);
						saveCanvasState("Image dropped");
						toast.success(`Image "${file.name}" added to canvas`);
					};
					img.src = src;
				};
				reader.readAsDataURL(file);
			});
		},
		[activeLayerId, generateId, panOffset, zoom, saveCanvasState],
	);

	return (
		<div>
			<div
				ref={containerRef}
				className="flex-1 overflow-hidden bg-canvas relative flex items-center justify-center"
				style={{ cursor: getCursor() }}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<div
					className="absolute inset-0 opacity-20 pointer-events-none"
					style={{
						backgroundImage: `
            linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
            linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
            linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
          `,
						backgroundSize: "20px 20px",
						backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
					}}
				/>

				{showSessionNotification && (
					<div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/10 text-green-600 text-xs px-3 py-1.5 rounded-full border border-green-500/20 pointer-events-none z-20 flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
						<span>Session restored • Auto-save active</span>
					</div>
				)}

				<CanvasContextMenu>
					<div
						className="relative shadow-2xl rounded-sm overflow-hidden"
						style={{ backgroundColor: actualBackground }}
						onWheel={(e) => {
							if (e.ctrlKey || e.metaKey) {
								e.preventDefault();
								const stage = stageRef.current;
								if (stage) {
									const stageBox = stage.container().getBoundingClientRect();
									const point = {
										x: e.clientX - stageBox.left,
										y: e.clientY - stageBox.top,
									};
									zoomWithWheel(e.deltaY, point);
								}
							} else {
								// Pan with wheel
								setPanOffset({
									x: panOffset.x - e.deltaX / (zoom / 100),
									y: panOffset.y - e.deltaY / (zoom / 100),
								});
							}
						}}
					>
						<Stage
							ref={stageRef}
							width={stageSize.width}
							height={stageSize.height}
							scaleX={zoom / 100}
							scaleY={zoom / 100}
							x={panOffset.x}
							y={panOffset.y}
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
							onDblClick={handleDblClick}
						>
							<Layer ref={layerRef}>
								<Rect
									name="background"
									x={0}
									y={0}
									width={actualWidth}
									height={actualHeight}
									fill={actualBackground}
								/>

								{lines
									.filter((l) => isLayerVisible(l.layerId))
									.map((line) => {
										const blurAmount =
											line.hardness !== undefined
												? (1 - line.hardness) * line.strokeWidth
												: 0;
										return (
											<Line
												key={line.id}
												id={line.id}
												points={line.points}
												stroke={line.stroke}
												strokeWidth={line.strokeWidth}
												tension={
													line.tool === "brush" || line.tool === "eraser"
														? 0.5
														: 0
												}
												lineCap="round"
												lineJoin="round"
												perfectDrawEnabled={false}
												globalCompositeOperation={
													line.tool === "eraser"
														? "destination-out"
														: "source-over"
												}
												draggable={
													activeTool === "select" || activeTool === "move"
												}
												onClick={(e) => {
													if (
														activeTool === "select" ||
														activeTool === "move"
													) {
														handleObjectClick(line.id);
														e.cancelBubble = true;
													}
												}}
												onDragEnd={(e) => {
													const dx = e.target.x();
													const dy = e.target.y();
													setLines((prev) =>
														prev.map((l) =>
															l.id === line.id
																? {
																		...l,
																		points: l.points.map((p, i) =>
																			i % 2 === 0 ? p + dx : p + dy,
																		),
																	}
																: l,
														),
													);
													e.target.position({ x: 0, y: 0 });
													saveCanvasState("Line moved");
												}}
												opacity={
													(layerOpacities[line.layerId] || 1) *
													(line.opacity ?? 1)
												}
												shadowBlur={blurAmount}
												shadowColor={blurAmount > 0 ? line.stroke : undefined}
											/>
										);
									})}

								{/* Active Line (Live Preview) */}
								{activeDrawingLine && activeLinePoints.length >= 2 && (
									<Line
										points={activeLinePoints}
										stroke={activeDrawingLine.stroke}
										strokeWidth={activeDrawingLine.strokeWidth}
										tension={
											activeDrawingLine.tool === "brush" ||
											activeDrawingLine.tool === "eraser"
												? 0.5
												: 0
										}
										lineCap="round"
										lineJoin="round"
										perfectDrawEnabled={false}
										globalCompositeOperation={
											activeDrawingLine.tool === "eraser"
												? "destination-out"
												: "source-over"
										}
										listening={false}
										opacity={
											(layerOpacities[activeDrawingLine.layerId] || 1) *
											(activeDrawingLine.opacity ?? 1)
										}
										shadowBlur={
											activeDrawingLine.hardness !== undefined
												? (1 - activeDrawingLine.hardness) *
													activeDrawingLine.strokeWidth
												: 0
										}
										shadowColor={
											activeDrawingLine.hardness !== undefined &&
											activeDrawingLine.hardness < 1
												? activeDrawingLine.stroke
												: undefined
										}
									/>
								)}

								{shapes
									.filter((s) => isLayerVisible(s.layerId))
									.map((shape) => {
										const commonProps = {
											draggable:
												activeTool === "select" || activeTool === "move",
											onClick: () => handleObjectClick(shape.id),
											onTap: () => handleObjectClick(shape.id),
											onDragEnd: (e: any) => {
												setShapes(
													shapes.map((s) =>
														s.id === shape.id
															? { ...s, x: e.target.x(), y: e.target.y() }
															: s,
													),
												);
												saveCanvasState(`${shape.type} moved`);
											},
											opacity: layerOpacities[shape.layerId] || 1,
										};

										switch (shape.type) {
											case "rect":
												return (
													<Rect
														key={shape.id}
														id={shape.id}
														x={shape.x}
														y={shape.y}
														width={shape.width}
														height={shape.height}
														fill={shape.fill}
														stroke={shape.stroke}
														strokeWidth={shape.strokeWidth}
														rotation={shape.rotation}
														scaleX={shape.scaleX}
														scaleY={shape.scaleY}
														{...commonProps}
													/>
												);
											case "ellipse":
												return (
													<Ellipse
														key={shape.id}
														id={shape.id}
														x={shape.x}
														y={shape.y}
														radiusX={shape.radiusX || 0}
														radiusY={shape.radiusY || 0}
														fill={shape.fill}
														stroke={shape.stroke}
														strokeWidth={shape.strokeWidth}
														rotation={shape.rotation}
														scaleX={shape.scaleX}
														scaleY={shape.scaleY}
														{...commonProps}
													/>
												);
											case "polygon":
												return (
													<Line
														key={shape.id}
														id={shape.id}
														points={shape.points}
														closed
														fill={shape.fill}
														stroke={shape.stroke}
														strokeWidth={shape.strokeWidth}
														rotation={shape.rotation}
														scaleX={shape.scaleX}
														scaleY={shape.scaleY}
														lineJoin="round"
														lineCap="round"
														{...commonProps}
													/>
												);
											case "text":
												return (
													<Text
														key={shape.id}
														id={shape.id}
														text={shape.text}
														x={shape.x}
														y={shape.y}
														fontSize={shape.fontSize}
														fill={shape.fill}
														rotation={shape.rotation}
														scaleX={shape.scaleX}
														scaleY={shape.scaleY}
														{...commonProps}
													/>
												);
											case "line":
												return (
													<Line
														key={shape.id}
														id={shape.id}
														points={shape.points}
														stroke={shape.stroke}
														strokeWidth={shape.strokeWidth}
														lineCap="round"
														lineJoin="round"
														{...commonProps}
													/>
												);
											case "star":
												return (
													<KonvaStar
														key={shape.id}
														id={shape.id}
														x={shape.x}
														y={shape.y}
														numPoints={shape.numPoints || 5}
														innerRadius={shape.innerRadius || 30}
														outerRadius={shape.outerRadius || 60}
														fill={shape.fill}
														stroke={shape.stroke}
														strokeWidth={shape.strokeWidth}
														rotation={shape.rotation}
														scaleX={shape.scaleX}
														scaleY={shape.scaleY}
														{...(commonProps as any)}
													/>
												);
											default:
												return null;
										}
									})}

								{images
									.filter((img) => isLayerVisible(img.layerId))
									.map((img) => (
										<ImageNode
											key={img.id}
											image={img}
											onClick={handleObjectClick}
											draggable={
												activeTool === "select" || activeTool === "move"
											}
											onDragEnd={(id, x, y) => {
												setImages(
													images.map((i) => (i.id === id ? { ...i, x, y } : i)),
												);
												saveCanvasState("Image moved");
											}}
											opacity={layerOpacities[img.layerId] || 1}
										/>
									))}

								{/* Text Objects */}
								{textObjects
									.filter((text) => isLayerVisible(text.layerId))
									.map((text) => {
										const layerOpacity = layerOpacities[text.layerId] || 1;
										const textOpacity = (text.opacity || 100) / 100;
										const combinedOpacity = layerOpacity * textOpacity;

										const commonProps = {
											id: text.id,
											draggable:
												(activeTool === "select" || activeTool === "move") &&
												!text.isEditing,
											onClick: (e: any) => {
												if (activeTool === "select" || activeTool === "move") {
													setSelectedId(text.id);
													if (e.evt.detail === 2) {
														// Double click to edit
														handleStartTextEdit(text.id);
													}
												}
											},
											onTap: () => {
												if (activeTool === "select" || activeTool === "move") {
													setSelectedId(text.id);
												}
											},
											onDragEnd: (e: any) => {
												if (text.isEditing) return;
												setTextObjects((prev) =>
													prev.map((t) =>
														t.id === text.id
															? { ...t, x: e.target.x(), y: e.target.y() }
															: t,
													),
												);
												saveCanvasState("Text moved");
											},
											perfectDrawEnabled: false,
											listening: !text.isEditing,
											opacity: combinedOpacity,
										};

										// Vytvorte štýl pre text
										const textStyle: any = {
											fontFamily: text.fontFamily,
											fontSize: text.fontSize,
											fontWeight: text.fontWeight,
											fontStyle: text.fontStyle,
											textDecoration: text.textDecoration,
											lineHeight: text.lineHeight,
											letterSpacing: text.letterSpacing,
											fill: text.color,
											align: text.textAlign,
											padding: text.padding || 0,
											wrap:
												text.wrap === "none"
													? "none"
													: text.wrap === "char"
														? "char"
														: "word",
										};

										// Pridajte tieň
										if (text.shadowColor) {
											textStyle.shadowColor = text.shadowColor;
											textStyle.shadowBlur = text.shadowBlur || 5;
											textStyle.shadowOffsetX = text.shadowOffsetX || 2;
											textStyle.shadowOffsetY = text.shadowOffsetY || 2;
											textStyle.shadowEnabled = true;
											textStyle.shadowOpacity = 1;
										}

										return (
											<React.Fragment key={text.id}>
												{/* Pozadie textu ak existuje */}
												{text.backgroundColor && (
													<Rect
														x={text.x - (text.padding || 0)}
														y={text.y - (text.padding || 0)}
														width={
															(text.width || 100) + (text.padding || 0) * 2
														}
														height={
															(text.height || 50) + (text.padding || 0) * 2
														}
														fill={`${text.backgroundColor}${Math.round(
															(text.backgroundOpacity || 20) * 2.55,
														)
															.toString(16)
															.padStart(2, "0")}`}
														cornerRadius={4}
														listening={false}
														opacity={layerOpacity}
													/>
												)}

												{/* Hlavný text */}
												<Text
													{...commonProps}
													x={text.x}
													y={text.y}
													text={text.text}
													{...textStyle}
												/>

												{/* Obrys textu */}
												{text.outlineColor && text.outlineWidth && (
													<Text
														x={text.x}
														y={text.y}
														text={text.text}
														{...textStyle}
														fill={text.outlineColor}
														strokeEnabled={true}
														stroke={text.color}
														strokeWidth={text.outlineWidth}
														perfectDrawEnabled={false}
														listening={false}
														opacity={combinedOpacity}
													/>
												)}

												{/* Editovací indikátor */}
												{text.isEditing && (
													<Rect
														x={text.x - 5}
														y={text.y - 5}
														width={(text.width || 100) + 10}
														height={(text.height || 50) + 10}
														stroke="#3b82f6"
														strokeWidth={2}
														dash={[5, 5]}
														listening={false}
													/>
												)}
											</React.Fragment>
										);
									})}

								{/* Gradients - render after all objects */}
								{gradients
									.filter((g) => isLayerVisible(g.layerId))
									.map((g) => {
										// Create gradient as image to avoid white background
										const gradientCanvas = useMemo(() => {
											const canvas = document.createElement("canvas");
											canvas.width = actualWidth;
											canvas.height = actualHeight;
											const ctx = canvas.getContext("2d");
											if (ctx && g.colorStops && g.colorStops.length > 0) {
												const gradient = ctx.createLinearGradient(
													g.x0,
													g.y0,
													g.x1,
													g.y1,
												);
												g.colorStops.forEach((stop) => {
													gradient.addColorStop(stop.offset, stop.color);
												});
												ctx.fillStyle = gradient;
												ctx.fillRect(0, 0, actualWidth, actualHeight);
											}
											return canvas;
										}, [
											g.id,
											g.x0,
											g.y0,
											g.x1,
											g.y1,
											g.colorStops,
											actualWidth,
											actualHeight,
										]);

										return (
											<KonvaImage
												key={g.id}
												image={gradientCanvas}
												x={0}
												y={0}
												width={actualWidth}
												height={actualHeight}
												listening={false}
												globalCompositeOperation="multiply"
												opacity={layerOpacities[g.layerId] || 1}
											/>
										);
									})}

								{/* TEMP IMAGE PRE REAL-TIME PREVIEW - Only show during active drawing */}
								{tempImage && (
									<KonvaImage
										ref={tempImageRef}
										image={tempImage}
										x={0}
										y={0}
										width={actualWidth}
										height={actualHeight}
										opacity={1}
										listening={false}
										globalCompositeOperation="source-over"
									/>
								)}

								{/* Current Shape Previews */}
								{currentShape && currentShape.type === "rect" && (
									<Rect
										id="preview-rect"
										x={currentShape.x}
										y={currentShape.y}
										width={currentShape.width}
										height={currentShape.height}
										fill={currentShape.fill}
										stroke={currentShape.stroke}
										strokeWidth={currentShape.strokeWidth}
										opacity={layerOpacities[currentShape.layerId] || 1}
									/>
								)}

								{currentShape && currentShape.type === "ellipse" && (
									<Ellipse
										id="preview-ellipse"
										x={currentShape.x}
										y={currentShape.y}
										radiusX={currentShape.radiusX || 0}
										radiusY={currentShape.radiusY || 0}
										fill={currentShape.fill}
										stroke={currentShape.stroke}
										strokeWidth={currentShape.strokeWidth}
										opacity={layerOpacities[currentShape.layerId] || 1}
									/>
								)}

								{currentShape && currentShape.type === "polygon" && (
									<Line
										id="preview-polygon"
										points={currentShape.points}
										closed={true}
										stroke={currentShape.stroke}
										strokeWidth={currentShape.strokeWidth}
										lineJoin="round"
										lineCap="round"
										opacity={layerOpacities[currentShape.layerId] || 1}
									/>
								)}

								{currentShape && currentShape.type === "line" && (
									<Line
										id="preview-line"
										points={currentShape.points}
										stroke={currentShape.stroke}
										strokeWidth={currentShape.strokeWidth}
										opacity={layerOpacities[currentShape.layerId] || 1}
									/>
								)}

								{currentShape && currentShape.type === "star" && (
									<KonvaStar
										id="preview-star"
										x={currentShape.x}
										y={currentShape.y}
										numPoints={currentShape.numPoints || 5}
										innerRadius={currentShape.innerRadius || 30}
										outerRadius={currentShape.outerRadius || 60}
										fill={currentShape.fill}
										stroke={currentShape.stroke}
										strokeWidth={currentShape.strokeWidth}
										rotation={currentShape.rotation}
										opacity={layerOpacities[currentShape.layerId] || 1}
									/>
								)}

								{currentPenLine && (
									<Line
										points={currentPenLine.points}
										stroke={currentPenLine.stroke}
										strokeWidth={currentPenLine.strokeWidth}
										opacity={
											layerOpacities[
												currentPenLine?.layerId || activeLayerId || "layer-1"
											] || 1
										}
									/>
								)}

								{currentGradient && isDrawingGradient && (
									<Rect
										x={0}
										y={0}
										width={actualWidth}
										height={actualHeight}
										fillLinearGradientStartPoint={{
											x: currentGradient.x0,
											y: currentGradient.y0,
										}}
										fillLinearGradientEndPoint={{
											x: currentGradient.x1,
											y: currentGradient.y1,
										}}
										fillLinearGradientColorStops={(
											currentGradient.colorStops || []
										).flatMap((s) => [s.offset, s.color])}
										listening={false}
										opacity={
											0.6 * (layerOpacities[currentGradient.layerId] || 1)
										}
									/>
								)}

								{selectionBounds && (
									<Rect
										{...selectionBounds}
										stroke="#3b82f6"
										strokeWidth={1}
										dash={[4, 2]}
										fill="rgba(59, 130, 246, 0.1)"
										listening={false}
									/>
								)}
								{selectionPath && selectionPath.length >= 4 && (
									<Line
										points={selectionPath}
										stroke="#3b82f6"
										strokeWidth={1}
										dash={[5, 5]}
										closed
										fill="rgba(59, 130, 246, 0.1)"
										listening={false}
									/>
								)}

								{selectedId && <Transformer ref={transformerRef} />}
							</Layer>
						</Stage>

						{/* Textarea pre editáciu textu */}
						{editingTextId && textAreaPosition && (
							<textarea
								autoFocus
								className="fixed bg-white text-black border-2 border-blue-500 rounded p-2 resize-none z-50 shadow-lg"
								style={{
									fontFamily:
										textObjects.find((t) => t.id === editingTextId)
											?.fontFamily || "Arial",
									fontSize: `${
										textObjects.find((t) => t.id === editingTextId)?.fontSize ||
										16
									}px`,
									fontWeight:
										textObjects.find((t) => t.id === editingTextId)
											?.fontWeight || "normal",
									fontStyle:
										textObjects.find((t) => t.id === editingTextId)
											?.fontStyle || "normal",
									left: `${textAreaPosition.x}px`,
									top: `${textAreaPosition.y}px`,
									width: `${Math.max(100, textAreaPosition.width)}px`,
									height: `${Math.max(50, textAreaPosition.height)}px`,
									textAlign:
										(textObjects.find((t) => t.id === editingTextId)
											?.textAlign as any) || "left",
									lineHeight: `${
										textObjects.find((t) => t.id === editingTextId)
											?.lineHeight || 1.2
									}`,
									letterSpacing: `${
										textObjects.find((t) => t.id === editingTextId)
											?.letterSpacing || 0
									}px`,
								}}
								value={
									textObjects.find((t) => t.id === editingTextId)?.text || ""
								}
								onChange={handleTextAreaChange}
								onKeyDown={handleTextAreaKeyDown}
								onBlur={handleTextAreaBlur}
							/>
						)}
					</div>
				</CanvasContextMenu>

				{/* Grid Overlay */}
				{showGrid && (
					<div
						className="absolute pointer-events-none z-20"
						style={{
							transform: `scale(${zoom / 100}) translate(${panOffset.x / (zoom / 100)}px, ${panOffset.y / (zoom / 100)}px)`,
							transformOrigin: "0 0",
						}}
					>
						<GridOverlay width={actualWidth} height={actualHeight} />
					</div>
				)}

				{/* Ruler Overlay */}
				{showRulers && (
					<RulerOverlay
						width={stageSize.width}
						height={stageSize.height}
						zoom={zoom}
						panOffset={panOffset}
					/>
				)}

				<div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded pointer-events-none z-10">
					Zoom: {zoom}% | {actualWidth} × {actualHeight}px
				</div>

				{/* Hidden auxiliary canvases */}
				<canvas ref={floodFillCanvas} style={{ display: "none" }} />
				<canvas ref={eyedropperCanvas} style={{ display: "none" }} />
				<canvas ref={healingCanvas} style={{ display: "none" }} />
				<canvas ref={blurCanvas} style={{ display: "none" }} />
			</div>
		</div>
	);
};

export default KonvaCanvas;
