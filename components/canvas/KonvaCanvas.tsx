"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
	Stage,
	Layer,
	Rect,
	Ellipse,
	Line,
	Text,
	Image as KonvaImage,
	Transformer,
} from "react-konva";
import Konva from "konva";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { toast } from "sonner";

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
	layerId?: string;
}

interface ShapeObject {
	id: string;
	type: "rect" | "ellipse" | "circle" | "line" | "text" | "polygon";
	x: number;
	y: number;
	width?: number;
	height?: number;
	radiusX?: number;
	radiusY?: number;
	radius?: number;
	points?: number[];
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	text?: string;
	fontSize?: number;
	rotation?: number;
	scaleX?: number;
	scaleY?: number;
	layerId?: string;
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
	layerId?: string;
}

interface GradientObject {
	id: string;
	type: "linear" | "radial";
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	colorStops: { offset: number; color: string }[];
	layerId?: string;
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

interface CanvasState {
	lines: DrawingLine[];
	shapes: ShapeObject[];
	images: ImageObject[];
	gradients: GradientObject[];
	healingData: HealingData;
	blurData: BlurData;
}

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
	width = 1920,
	height = 1080,
	backgroundColor = "#2d3748",
}) => {
	const stageRef = useRef<Konva.Stage>(null);
	const layerRef = useRef<Konva.Layer>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const transformerRef = useRef<Konva.Transformer>(null);

	const [lines, setLines] = useState<DrawingLine[]>([]);
	const [shapes, setShapes] = useState<ShapeObject[]>([]);
	const [images, setImages] = useState<ImageObject[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [isFilling, setIsFilling] = useState(false);
	const [isDrawingGradient, setIsDrawingGradient] = useState(false);
	const [currentGradient, setCurrentGradient] = useState<GradientObject | null>(
		null,
	);
	const gradientStartPoint = useRef<{ x: number; y: number } | null>(null);

	const [currentShape, setCurrentShape] = useState<ShapeObject | null>(null);
	const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);

	// Nové stavy pre Pen a Polygon nástroje
	const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
	const [polygonPoints, setPolygonPoints] = useState<number[]>([]);
	const [currentPenLine, setCurrentPenLine] = useState<DrawingLine | null>(null);
	const [penPoints, setPenPoints] = useState<number[]>([]);

	const isPanning = useRef(false);
	const lastPanPos = useRef({ x: 0, y: 0 });

	const cloneSourcePoint = useRef<{ x: number; y: number } | null>(null);

	const [healingData, setHealingData] = useState<HealingData>({
		sourceX: 0,
		sourceY: 0,
		isActive: false,
		brushSize: 20,
	});
	const [isHealing, setIsHealing] = useState(false);
	const healingCanvas = useRef<HTMLCanvasElement | null>(null);
	const healingContext = useRef<CanvasRenderingContext2D | null>(null);

	const [blurData, setBlurData] = useState<BlurData>({
		isActive: false,
		brushSize: 20,
		intensity: 10,
	});
	const [isBlurring, setIsBlurring] = useState(false);
	const blurCanvas = useRef<HTMLCanvasElement | null>(null);
	const blurContext = useRef<CanvasRenderingContext2D | null>(null);

	const floodFillImageData = useRef<ImageData | null>(null);
	const floodFillCanvas = useRef<HTMLCanvasElement | null>(null);
	const floodFillContext = useRef<CanvasRenderingContext2D | null>(null);

	const eyedropperCanvas = useRef<HTMLCanvasElement | null>(null);
	const eyedropperContext = useRef<CanvasRenderingContext2D | null>(null);

	// Stavy pre správu session
	const [isLoadingSession, setIsLoadingSession] = useState(true);
	const [hasRestoredState, setHasRestoredState] = useState(false);
	const [lastSessionId, setLastSessionId] = useState<string | null>(null);
	const [showSessionNotification, setShowSessionNotification] = useState(false);

	// Nové stavy pre správu kreslenia
	const [activeDrawingLine, setActiveDrawingLine] = useState<DrawingLine | null>(
		null,
	);
	const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null);
	const [tempContext, setTempContext] = useState<CanvasRenderingContext2D | null>(
		null,
	);

	const {
		activeTool,
		primaryColor,
		secondaryColor,
		brushSettings,
		zoom,
		panOffset,
		setZoom,
		setPanOffset,
		addToHistory,
		canvasSize,
		loadedImages,
		setPrimaryColor,
		setSecondaryColor,
		layers,
		activeLayerId,
		gradients,
		addGradient,
		updateGradient,
		setGradients,
		healingSource,
		setHealingSource,
		sessionId,
		initializeSession,
	} = useArtStudioStore();

	const actualWidth = canvasSize?.width || width;
	const actualHeight = canvasSize?.height || height;
	const actualBackground = canvasSize?.backgroundColor || backgroundColor;

	// Cleanup efekt
	useEffect(() => {
		console.log("KonvaCanvas mounting...");

		// Inicializácia temporary canvasu pre kreslenie
		const tempCanvasEl = document.createElement("canvas");
		tempCanvasEl.width = actualWidth;
		tempCanvasEl.height = actualHeight;
		const tempCtx = tempCanvasEl.getContext("2d");
		if (tempCtx) {
			setTempCanvas(tempCanvasEl);
			setTempContext(tempCtx);
		}

		return () => {
			console.log("KonvaCanvas unmounting, vykonávam cleanup...");

			// Znič stage ak existuje
			if (stageRef.current) {
				try {
					stageRef.current.destroy();
					console.log("Stage úspešne zničená");
				} catch (error) {
					console.error("Chyba pri ničení stage:", error);
				}
			}

			// Vyčisti globálnu referenciu
			if ((window as any).konvaStage === stageRef.current) {
				delete (window as any).konvaStage;
			}

			// Vyčisti referencie na canvasy
			floodFillCanvas.current = null;
			eyedropperCanvas.current = null;
			healingCanvas.current = null;
			blurCanvas.current = null;
			floodFillContext.current = null;
			eyedropperContext.current = null;
			healingContext.current = null;
			blurContext.current = null;
			if (tempCanvasEl) tempCanvasEl.remove();
		};
	}, [actualWidth, actualHeight]);

	// Nastav globálnu referenciu len raz
	useEffect(() => {
		if (stageRef.current && !(window as any).konvaStage) {
			(window as any).konvaStage = stageRef.current;
			console.log("Globálna Konva stage referencia nastavená");
		}
	}, []);

	// Inicializácia session a načítanie stavu
	useEffect(() => {
		const loadSessionAndState = async () => {
			try {
				console.log("Loading session for canvas...");
				setIsLoadingSession(true);

				// Inicializuj session (ak ešte nebola inicializovaná)
				if (!sessionId) {
					await initializeSession();
				}

				// Skontroluj, či máme session dáta
				const storeState = useArtStudioStore.getState();
				console.log("Current session ID:", storeState.sessionId);

				if (storeState.sessionId) {
					setLastSessionId(storeState.sessionId);

					// Počkáme krátko, aby sa store stabilizoval
					await new Promise((resolve) => setTimeout(resolve, 500));

					// Načítame session dát z IndexedDB priamo
					const { sessionDB } = await import("@/db/indexedDB");
					const savedData = await sessionDB.loadSessionData();

					if (savedData) {
						console.log("Found saved session data:", savedData);

						// Ak máme uložené dáta, obnovíme ich
						if (savedData.lines) setLines(savedData.lines || []);
						if (savedData.shapes) setShapes(savedData.shapes || []);
						if (savedData.images) setImages(savedData.images || []);
						if (savedData.gradients) setGradients(savedData.gradients || []);

						// Obnovíme healing a blur data
						if (savedData.healingData) setHealingData(savedData.healingData);
						if (savedData.blurData) setBlurData(savedData.blurData);

						console.log("Canvas state restored from session");
						setHasRestoredState(true);

						// Upozornime, že canvas je načítaný
						setTimeout(() => {
							toast.success("Session restored", {
								description: "Your previous work has been loaded",
							});
						}, 1000);
					} else {
						console.log("No saved session data found");
						setHasRestoredState(false);
					}
				}
			} catch (error) {
				console.error("Error loading session:", error);
				toast.error("Failed to load session", {
					description: "Starting with a fresh canvas",
				});
			} finally {
				setIsLoadingSession(false);
			}
		};

		loadSessionAndState();
	}, [sessionId, initializeSession, setGradients]);

	// Inicializácia pomocných canvasov
	useEffect(() => {
		// Flood fill canvas
		const floodCanvas = document.createElement("canvas");
		floodCanvas.width = actualWidth;
		floodCanvas.height = actualHeight;
		floodFillCanvas.current = floodCanvas;
		const floodCtx = floodCanvas.getContext("2d");
		if (floodCtx) {
			floodFillContext.current = floodCtx;
		}

		// Eyedropper canvas
		const eyedropperCanvasEl = document.createElement("canvas");
		eyedropperCanvasEl.width = actualWidth;
		eyedropperCanvasEl.height = actualHeight;
		eyedropperCanvas.current = eyedropperCanvasEl;
		const eyedropperCtx = eyedropperCanvasEl.getContext("2d", {
			willReadFrequently: true,
		});
		if (eyedropperCtx) {
			eyedropperContext.current = eyedropperCtx;
		}

		// Healing canvas
		const healingCanvasEl = document.createElement("canvas");
		healingCanvasEl.width = actualWidth;
		healingCanvasEl.height = actualHeight;
		healingCanvas.current = healingCanvasEl;
		const healingCtx = healingCanvasEl.getContext("2d", {
			willReadFrequently: true,
		});
		if (healingCtx) {
			healingContext.current = healingCtx;
		}

		// Blur canvas
		const blurCanvasEl = document.createElement("canvas");
		blurCanvasEl.width = actualWidth;
		blurCanvasEl.height = actualHeight;
		blurCanvas.current = blurCanvasEl;
		const blurCtx = blurCanvasEl.getContext("2d", { willReadFrequently: true });
		if (blurCtx) {
			blurContext.current = blurCtx;
		}

		return () => {
			if (floodCanvas) floodCanvas.remove();
			if (eyedropperCanvasEl) eyedropperCanvasEl.remove();
			if (healingCanvasEl) healingCanvasEl.remove();
			if (blurCanvasEl) blurCanvasEl.remove();
		};
	}, [actualWidth, actualHeight]);

	// Hlavná funkcia pre získanie pozície na canvase
	const getCanvasPosition = useCallback(
		(clientX: number, clientY: number) => {
			if (!stageRef.current) return null;

			const stage = stageRef.current;
			const stageRect = stage.container().getBoundingClientRect();

			// Vypočítaj relatívnu pozíciu vzhľadom k stage
			const x = (clientX - stageRect.left) * (actualWidth / stageRect.width);
			const y = (clientY - stageRect.top) * (actualHeight / stageRect.height);

			// Aplikuj zoom a pan offset
			const transformedX = x / (zoom / 100) - panOffset.x;
			const transformedY = y / (zoom / 100) - panOffset.y;

			return {
				x: Math.max(0, Math.min(actualWidth, transformedX)),
				y: Math.max(0, Math.min(actualHeight, transformedY)),
			};
		},
		[actualWidth, actualHeight, zoom, panOffset],
	);

	const updateEyedropperData = useCallback(() => {
		if (!stageRef.current || !eyedropperContext.current) return;

		const stage = stageRef.current;
		const tempCanvas = stage.toCanvas();
		const ctx = eyedropperContext.current;
		ctx.clearRect(0, 0, actualWidth, actualHeight);

		ctx.fillStyle = actualBackground;
		ctx.fillRect(0, 0, actualWidth, actualHeight);

		ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
	}, [actualWidth, actualHeight, actualBackground]);

	const updateFloodFillData = useCallback(() => {
		if (!stageRef.current || !floodFillContext.current) return;

		const stage = stageRef.current;
		const tempCanvas = stage.toCanvas();
		const ctx = floodFillContext.current;
		ctx.clearRect(0, 0, actualWidth, actualHeight);

		ctx.fillStyle = actualBackground;
		ctx.fillRect(0, 0, actualWidth, actualHeight);

		ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);

		floodFillImageData.current = ctx.getImageData(
			0,
			0,
			actualWidth,
			actualHeight,
		);
	}, [actualWidth, actualHeight, actualBackground]);

	const updateHealingData = useCallback(() => {
		if (!stageRef.current || !healingContext.current) return;

		const stage = stageRef.current;
		const tempCanvas = stage.toCanvas();
		const ctx = healingContext.current;

		ctx.fillStyle = actualBackground;
		ctx.fillRect(0, 0, actualWidth, actualHeight);

		ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
	}, [actualWidth, actualHeight, actualBackground]);

	const updateBlurData = useCallback(() => {
		if (!stageRef.current || !blurContext.current) return;

		const stage = stageRef.current;
		const tempCanvas = stage.toCanvas();
		const ctx = blurContext.current;

		ctx.fillStyle = actualBackground;
		ctx.fillRect(0, 0, actualWidth, actualHeight);

		ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
	}, [actualWidth, actualHeight, actualBackground]);

	const saveCanvasState = useCallback(
		(action: string) => {
			if (!stageRef.current) return;
			try {
				const canvasState: CanvasState = {
					lines,
					shapes,
					images: images.map((img) => ({ ...img })),
					gradients: gradients.map((grad) => ({ ...grad })),
					healingData,
					blurData,
				};
				const stateString = JSON.stringify(canvasState);
				const dataURL = stageRef.current.toDataURL({ pixelRatio: 0.2 });
				addToHistory(stateString, dataURL, action);
			} catch (err) {
				console.error("Failed to save canvas state:", err);
			}
		},
		[lines, shapes, images, gradients, healingData, blurData, addToHistory],
	);

	const restoreCanvasState = useCallback(
		(stateString: string) => {
			try {
				const state: CanvasState = JSON.parse(stateString);

				setLines(state.lines || []);
				setShapes(state.shapes || []);
				setImages(state.images || []);
				setGradients(state.gradients || []);
				if (state.healingData) setHealingData(state.healingData);
				if (state.blurData) setBlurData(state.blurData);

				setHasRestoredState(true);

				console.log("Canvas state restored from history");
			} catch (error) {
				console.error("Failed to restore canvas state:", error);
				toast.error("Failed to restore history state");
			}
		},
		[setGradients],
	);

	useEffect(() => {
		const handleRestoreHistory = (e: CustomEvent) => {
			if (e.detail?.canvasData) {
				restoreCanvasState(e.detail.canvasData);
			}
		};

		window.addEventListener(
			"artstudio:restore-history",
			handleRestoreHistory as EventListener,
		);

		return () => {
			window.removeEventListener(
				"artstudio:restore-history",
				handleRestoreHistory as EventListener,
			);
		};
	}, [restoreCanvasState]);

	// Transformer update efekt
	useEffect(() => {
		if (!transformerRef.current || !stageRef.current) return;

		if (selectedId) {
			const selectedNode = stageRef.current.findOne(`#${selectedId}`);
			if (selectedNode) {
				transformerRef.current.nodes([selectedNode]);
				transformerRef.current.getLayer()?.batchDraw();
			}
		} else {
			transformerRef.current.nodes([]);
		}
	}, [selectedId]);

	// Hlavná funkcia pre kreslenie
	const startDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			const drawingTools = ["brush", "pencil", "eraser"];
			if (!drawingTools.includes(activeTool)) return;

			setIsDrawing(true);

			const newLine: DrawingLine = {
				id: `line-${Date.now()}`,
				points: [pos.x, pos.y],
				stroke: activeTool === "eraser" ? actualBackground : primaryColor,
				strokeWidth: brushSettings.size,
				tool: activeTool as "brush" | "pencil" | "eraser",
				layerId: activeLayerId || undefined,
			};

			setActiveDrawingLine(newLine);
			setLines((prev) => [...prev, newLine]);

			// Aktualizuj temporary canvas
			if (tempContext) {
				tempContext.strokeStyle = newLine.stroke;
				tempContext.lineWidth = newLine.strokeWidth;
				tempContext.lineCap = "round";
				tempContext.lineJoin = "round";
				tempContext.beginPath();
				tempContext.moveTo(pos.x, pos.y);
			}
		},
		[
			activeTool,
			actualBackground,
			primaryColor,
			brushSettings.size,
			activeLayerId,
			tempContext,
		],
	);

	const continueDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			if (!isDrawing || !activeDrawingLine) return;

			// Aktualizuj temporary canvas
			if (tempContext) {
				tempContext.lineTo(pos.x, pos.y);
				tempContext.stroke();
			}

			// Aktualizuj líniu v stave
			setLines((prev) =>
				prev.map((line) =>
					line.id === activeDrawingLine.id
						? {
								...line,
								points: [...line.points, pos.x, pos.y],
							}
						: line,
				),
			);
		},
		[isDrawing, activeDrawingLine, tempContext],
	);

	const stopDrawing = useCallback(() => {
		if (isDrawing) {
			setIsDrawing(false);
			setActiveDrawingLine(null);
			if (tempContext) {
				tempContext.closePath();
			}
			saveCanvasState("Stroke added");
		}
	}, [isDrawing, tempContext, saveCanvasState]);

	// PEN NÁSTROJ - Začiatok kreslenia krivky
	const startPenDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			if (activeTool !== "pen") return;

			const newPenLine: DrawingLine = {
				id: `pen-${Date.now()}`,
				points: [pos.x, pos.y],
				stroke: primaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				tool: "pen",
				layerId: activeLayerId || undefined,
			};
			setCurrentPenLine(newPenLine);
			setPenPoints([pos.x, pos.y]);
			setIsDrawing(true);
		},
		[activeTool, primaryColor, brushSettings.strokeWidth, activeLayerId],
	);

	// PEN NÁSTROJ - Pridanie bodu
	const addPenPoint = useCallback(
		(pos: { x: number; y: number }) => {
			if (!currentPenLine) return;

			setPenPoints((prev) => [...prev, pos.x, pos.y]);
			setCurrentPenLine((prev) =>
				prev
					? {
							...prev,
							points: [...prev.points, pos.x, pos.y],
						}
					: prev,
			);
		},
		[currentPenLine],
	);

	// PEN NÁSTROJ - Dokončenie krivky
	const finishPenDrawing = useCallback(() => {
		if (!currentPenLine) return;

		if (currentPenLine.points.length >= 4) {
			setLines((prev) => [...prev, currentPenLine]);
			saveCanvasState("Pen curve completed");
			toast.success("Pen curve completed");
		} else {
			toast.error("Pen curve needs at least 2 points");
		}

		setCurrentPenLine(null);
		setPenPoints([]);
		setIsDrawing(false);
	}, [currentPenLine, saveCanvasState]);

	// POLYGON NÁSTROJ - Začiatok
	const startPolygonDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			if (activeTool !== "polygon") return;

			setIsDrawingPolygon(true);
			setPolygonPoints([pos.x, pos.y]);
		},
		[activeTool],
	);

	// POLYGON NÁSTROJ - Pridanie vrcholu
	const addPolygonPoint = useCallback((pos: { x: number; y: number }) => {
		setPolygonPoints((prev) => [...prev, pos.x, pos.y]);
	}, []);

	// POLYGON NÁSTROJ - Dokončenie
	const finishPolygonDrawing = useCallback(() => {
		if (polygonPoints.length >= 6) {
			const polygonShape: ShapeObject = {
				id: `polygon-${Date.now()}`,
				type: "polygon",
				points: [...polygonPoints],
				x: 0,
				y: 0,
				stroke: primaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				fill: `${primaryColor}40`,
				layerId: activeLayerId || undefined,
			};
			setShapes((prev) => [...prev, polygonShape]);
			saveCanvasState("Polygon created");
			toast.success(`Polygon with ${polygonPoints.length / 2} sides created`);
		} else {
			toast.error("Polygon needs at least 3 points");
		}

		setIsDrawingPolygon(false);
		setPolygonPoints([]);
		setCurrentShape(null);
	}, [polygonPoints, primaryColor, brushSettings.strokeWidth, activeLayerId, saveCanvasState]);

	// LINE NÁSTROJ - Začiatok
	const startLineDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			if (activeTool !== "line") return;

			shapeStartPoint.current = pos;

			const newLine: ShapeObject = {
				id: `line-${Date.now()}`,
				type: "line",
				x: pos.x,
				y: pos.y,
				points: [pos.x, pos.y, pos.x, pos.y],
				stroke: primaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				fill: primaryColor,
				layerId: activeLayerId || undefined,
			};

			setCurrentShape(newLine);
		},
		[activeTool, primaryColor, brushSettings.strokeWidth, activeLayerId],
	);

	// LINE NÁSTROJ - Aktualizácia
	const updateLineDrawing = useCallback(
		(pos: { x: number; y: number }) => {
			if (!currentShape || !shapeStartPoint.current) return;

			const startX = shapeStartPoint.current.x;
			const startY = shapeStartPoint.current.y;

			setCurrentShape({
				...currentShape,
				points: [startX, startY, pos.x, pos.y],
			});
		},
		[currentShape],
	);

	// LINE NÁSTROJ - Dokončenie
	const finishLineDrawing = useCallback(() => {
		if (currentShape && currentShape.type === "line") {
			setShapes((prev) => [...prev, currentShape]);
			setCurrentShape(null);
			shapeStartPoint.current = null;
			saveCanvasState("Line created");
		}
	}, [currentShape, saveCanvasState]);

	const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur"];
		const shapeTools = ["rectangle", "ellipse"];

		// PEN NÁSTROJ
		if (activeTool === "pen") {
			if (e.evt.button !== 0) return;
			
			if (!currentPenLine) {
				startPenDrawing(pos);
			} else {
				addPenPoint(pos);
			}
			return;
		}

		// POLYGON NÁSTROJ
		if (activeTool === "polygon") {
			if (e.evt.button !== 0) return;

			if (!isDrawingPolygon) {
				startPolygonDrawing(pos);
			} else {
				addPolygonPoint(pos);
			}
			return;
		}

		// LINE NÁSTROJ
		if (activeTool === "line") {
			if (e.evt.button !== 0) return;

			startLineDrawing(pos);
			return;
		}

		// Kreslenie (brush, pencil, eraser)
		if (drawingTools.includes(activeTool)) {
			if (activeTool === "healing") {
				updateHealingData();

				if (e.evt.altKey) {
					setHealingData((prev) => ({
						...prev,
						sourceX: pos.x,
						sourceY: pos.y,
						isActive: true,
						brushSize: brushSettings.size,
					}));
					setHealingSource({ x: pos.x, y: pos.y });
					toast.success("Healing source set (click to heal)");
					return;
				} else {
					if (!healingData.isActive) {
						toast.error("Alt+click to set healing source first");
						return;
					}
					applyHealingBrush(pos.x, pos.y);
					return;
				}
			}

			if (activeTool === "blur") {
				updateBlurData();
				applyBlurBrush(pos.x, pos.y);
				return;
			}

			// Normálne kreslenie
			startDrawing(pos);
			return;
		}

		// Eyedropper
		if (activeTool === "eyedropper" || e.evt.ctrlKey) {
			const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
			handleEyedropper(pos.x, pos.y, isCtrlPressed);
			return;
		}

		// Tvary (rectangle, ellipse)
		if (shapeTools.includes(activeTool)) {
			shapeStartPoint.current = pos;

			const newShape: ShapeObject = {
				id: `shape-${Date.now()}`,
				type: activeTool === "rectangle" ? "rect" : "ellipse",
				x: pos.x,
				y: pos.y,
				width: 1,
				height: 1,
				fill: primaryColor,
				stroke: secondaryColor,
				strokeWidth: 2,
				layerId: activeLayerId || undefined,
			};
			setCurrentShape(newShape);
			return;
		}

		// Text
		if (activeTool === "text") {
			const newTextShape: ShapeObject = {
				id: `text-${Date.now()}`,
				type: "text",
				x: pos.x,
				y: pos.y,
				text: "Type here",
				fontSize: brushSettings.fontSize || 20,
				fill: primaryColor,
				layerId: activeLayerId || undefined,
			};
			setShapes((prev) => [...prev, newTextShape]);
			setSelectedId(newTextShape.id);
			saveCanvasState("Text added");
			toast.success("Text added - double click to edit");
			return;
		}

		// Fill
		if (activeTool === "fill") {
			setIsFilling(true);

			updateFloodFillData();

			if (floodFillContext.current) {
				try {
					const pixelData = floodFillContext.current.getImageData(
						Math.floor(pos.x),
						Math.floor(pos.y),
						1,
						1,
					).data;

					const targetColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

					const success = floodFill(
						pos.x,
						pos.y,
						targetColor,
						primaryColor,
						brushSettings.tolerance,
					);

					if (!success) {
						toast.error("No area to fill or same color");
					}
				} catch (error) {
					console.error("Fill error:", error);
					toast.error("Failed to fill area");
				}
			} else {
				toast.error("Fill context not available");
			}
			return;
		}

		// Gradient
		if (activeTool === "gradient") {
			setIsDrawingGradient(true);
			gradientStartPoint.current = pos;

			const newGradient: GradientObject = {
				id: `gradient-${Date.now()}`,
				type: brushSettings.gradientType as "linear" | "radial",
				x0: pos.x,
				y0: pos.y,
				x1: pos.x + 100,
				y1: pos.y,
				colorStops: brushSettings.gradientStops.map((stop) => ({
					offset: stop.position,
					color: stop.color,
				})),
				layerId: activeLayerId || undefined,
			};

			setCurrentGradient(newGradient);
			return;
		}

		// Zoom
		if (activeTool === "zoom") {
			if (e.evt.altKey) {
				setZoom(Math.max(10, zoom - 25));
			} else {
				setZoom(Math.min(500, zoom + 25));
			}
			return;
		}

		// Hand (panning)
		if (activeTool === "hand") {
			isPanning.current = true;
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
			return;
		}

		// Clone
		if (activeTool === "clone") {
			if (e.evt.altKey) {
				cloneSourcePoint.current = pos;
				toast.success("Clone source set");
				return;
			}

			if (!cloneSourcePoint.current) {
				toast.error("Alt+click to set clone source first");
				return;
			}
		}
	};

	const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		// PEN NÁSTROJ - Ukážka krivky
		if (activeTool === "pen" && currentPenLine) {
			// Pri pohybe myšou ukážeme preview posledného segmentu
			const previewPoints = [...currentPenLine.points, pos.x, pos.y];
			setCurrentPenLine({
				...currentPenLine,
				points: previewPoints,
			});
			return;
		}

		// POLYGON NÁSTROJ - Ukážka
		if (activeTool === "polygon" && isDrawingPolygon && polygonPoints.length > 0) {
			// Ukážeme preview posledného segmentu
			const previewPoints = [...polygonPoints, pos.x, pos.y];
			setCurrentShape({
				id: `polygon-preview-${Date.now()}`,
				type: "polygon",
				points: previewPoints,
				x: 0,
				y: 0,
				stroke: primaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				fill: `${primaryColor}40`,
				layerId: activeLayerId || undefined,
			});
			return;
		}

		// LINE NÁSTROJ
		if (activeTool === "line" && currentShape) {
			updateLineDrawing(pos);
			return;
		}

		// Kreslenie
		if (isDrawing && activeDrawingLine) {
			continueDrawing(pos);
			return;
		}

		// Tvary (rectangle, ellipse)
		if (currentShape && shapeStartPoint.current) {
			const startX = shapeStartPoint.current.x;
			const startY = shapeStartPoint.current.y;

			if (currentShape.type === "rect") {
				const width = pos.x - startX;
				const height = pos.y - startY;

				setCurrentShape({
					...currentShape,
					x: width > 0 ? startX : pos.x,
					y: height > 0 ? startY : pos.y,
					width: Math.abs(width),
					height: Math.abs(height),
				});
			} else if (currentShape.type === "ellipse") {
				const radiusX = Math.abs(pos.x - startX) / 2;
				const radiusY = Math.abs(pos.y - startY) / 2;

				setCurrentShape({
					...currentShape,
					x: (startX + pos.x) / 2,
					y: (startY + pos.y) / 2,
					radiusX,
					radiusY,
				});
			}
			return;
		}

		// Gradient
		if (isDrawingGradient && currentGradient && gradientStartPoint.current) {
			setCurrentGradient({
				...currentGradient,
				x1: pos.x,
				y1: pos.y,
			});
			return;
		}

		// Panning
		if (isPanning.current && activeTool === "hand") {
			const deltaX = e.evt.clientX - lastPanPos.current.x;
			const deltaY = e.evt.clientY - lastPanPos.current.y;

			setPanOffset({
				x: panOffset.x + deltaX / (zoom / 100),
				y: panOffset.y + deltaY / (zoom / 100),
			});

			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
		}
	};

	const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
		// PEN NÁSTROJ - Dokončenie krivky pravým tlačidlom
		if (activeTool === "pen" && currentPenLine) {
			if (e.evt.button === 2) {
				finishPenDrawing();
			}
			return;
		}

		// POLYGON NÁSTROJ - Dokončenie pravým tlačidlom
		if (activeTool === "polygon" && isDrawingPolygon) {
			if (e.evt.button === 2) {
				finishPolygonDrawing();
			}
			return;
		}

		// LINE NÁSTROJ - Dokončenie čiary
		if (activeTool === "line" && currentShape) {
			finishLineDrawing();
			return;
		}

		// Dokonči kreslenie
		if (isDrawing) {
			stopDrawing();
		}

		// Dokonči tvar (rectangle, ellipse)
		if (currentShape && (currentShape.type === "rect" || currentShape.type === "ellipse")) {
			setShapes((prev) => [...prev, currentShape]);
			setCurrentShape(null);
			shapeStartPoint.current = null;
			saveCanvasState(`${currentShape.type} created`);
			return;
		}

		// Dokonči gradient
		if (isDrawingGradient && currentGradient) {
			addGradient(currentGradient);
			setCurrentGradient(null);
			setIsDrawingGradient(false);
			gradientStartPoint.current = null;
			saveCanvasState("Gradient added");
			toast.success("Gradient created");
			return;
		}

		// Dokonči fill
		if (isFilling) {
			setIsFilling(false);
		}

		// Dokonči panning
		if (isPanning.current) {
			isPanning.current = false;
		}
	};

	const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
		// Pre Polygon nástroj - dokonči polygon dvojklikom
		if (activeTool === "polygon" && isDrawingPolygon) {
			finishPolygonDrawing();
			return;
		}

		// Pre Pen nástroj - dokonči krivku dvojklikom
		if (activeTool === "pen" && currentPenLine) {
			finishPenDrawing();
			return;
		}
	};

	const handleWheel = useCallback(
		(e: WheelEvent) => {
			e.preventDefault();

			if (e.ctrlKey || e.metaKey) {
				// Zoom
				const delta = e.deltaY > 0 ? -10 : 10;
				setZoom(Math.max(10, Math.min(500, zoom + delta)));
			} else if (e.shiftKey) {
				// Horizontálny posun
				setPanOffset({
					x: panOffset.x - e.deltaY / (zoom / 100),
					y: panOffset.y,
				});
			} else {
				// Vertikálny posun
				setPanOffset({
					x: panOffset.x - e.deltaX / (zoom / 100),
					y: panOffset.y - e.deltaY / (zoom / 100),
				});
			}
		},
		[zoom, panOffset, setZoom, setPanOffset],
	);

	// Event listener pre wheel
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [handleWheel]);

	// Key handler pre klávesové skratky
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			// Escape pre zrušenie všetkého kreslenia
			if (e.key === "Escape") {
				// Zruš pen kreslenie
				if (activeTool === "pen" && currentPenLine) {
					setCurrentPenLine(null);
					setPenPoints([]);
					setIsDrawing(false);
					toast.info("Pen drawing cancelled");
				}

				// Zruš polygon kreslenie
				if (activeTool === "polygon" && isDrawingPolygon) {
					setIsDrawingPolygon(false);
					setPolygonPoints([]);
					setCurrentShape(null);
					toast.info("Polygon drawing cancelled");
				}

				// Zruš line kreslenie
				if (activeTool === "line" && currentShape) {
					setCurrentShape(null);
					shapeStartPoint.current = null;
					toast.info("Line drawing cancelled");
				}

				// Zruš healing source
				if (healingData.isActive) {
					setHealingData((prev) => ({ ...prev, isActive: false }));
					setHealingSource(null);
					toast.info("Healing source cleared");
				}
			}

			// Enter pre dokončenie polygonu
			if (e.key === "Enter" && activeTool === "polygon" && isDrawingPolygon) {
				finishPolygonDrawing();
			}

			// Delete/Backspace pre vymazanie vybraného
			if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
				e.preventDefault();
				deleteSelected();
			}
		};

		const deleteSelected = () => {
			if (selectedId) {
				setShapes((prev) => prev.filter((s) => s.id !== selectedId));
				setLines((prev) => prev.filter((l) => l.id !== selectedId));
				setImages((prev) => prev.filter((i) => i.id !== selectedId));
				setSelectedId(null);
				saveCanvasState("Object deleted");
				toast.success("Selection deleted");
			}
		};

		const handleClearCanvas = () => {
			setShapes([]);
			setLines([]);
			setImages([]);
			setSelectedId(null);
			setHealingData({
				sourceX: 0,
				sourceY: 0,
				isActive: false,
				brushSize: 20,
			});
			setBlurData({
				isActive: false,
				brushSize: 20,
				intensity: 10,
			});
			setHealingSource(null);
			saveCanvasState("Canvas cleared");
			toast.success("Canvas cleared");
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("artstudio:delete-selection", deleteSelected);
		window.addEventListener("artstudio:clear-canvas", handleClearCanvas);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("artstudio:delete-selection", deleteSelected);
			window.removeEventListener("artstudio:clear-canvas", handleClearCanvas);
		};
	}, [
		selectedId,
		shapes,
		lines,
		images,
		saveCanvasState,
		activeTool,
		currentPenLine,
		isDrawingPolygon,
		currentShape,
		healingData,
		setHealingSource,
	]);

	// Načítanie obrázkov
	useEffect(() => {
		if (loadedImages.length === 0) return;

		const latestImage = loadedImages[loadedImages.length - 1];
		const alreadyLoaded = images.some((img) => img.id === latestImage.id);
		if (alreadyLoaded) return;

		const img = new window.Image();
		img.src = latestImage.src;
		img.onload = () => {
			const scale = Math.min(
				(actualWidth * 0.8) / img.width,
				(actualHeight * 0.8) / img.height,
				1,
			);

			const newImage: ImageObject = {
				id: latestImage.id,
				src: latestImage.src,
				x: (actualWidth - img.width * scale) / 2,
				y: (actualHeight - img.height * scale) / 2,
				width: img.width * scale,
				height: img.height * scale,
				layerId: activeLayerId || undefined,
			};

			setImages([...images, newImage]);
			setSelectedId(newImage.id);
			toast.success(`Image loaded: ${latestImage.name}`);
			saveCanvasState("Image added");
		};
	}, [
		loadedImages,
		images,
		actualWidth,
		actualHeight,
		saveCanvasState,
		activeLayerId,
	]);

	// Update pomocných canvasov
	useEffect(() => {
		if (activeTool === "fill") {
			updateFloodFillData();
		}
		if (activeTool === "eyedropper") {
			updateEyedropperData();
		}
		if (activeTool === "healing") {
			updateHealingData();
		}
		if (activeTool === "blur") {
			updateBlurData();
		}
	}, [
		activeTool,
		updateFloodFillData,
		updateEyedropperData,
		updateHealingData,
		updateBlurData,
	]);

	// Eyedropper funkcie
	const parseColorToRgb = (color: string) => {
		if (color.startsWith("#")) {
			const hex = color.replace("#", "");
			let r = 0,
				g = 0,
				b = 0;

			if (hex.length === 3) {
				r = parseInt(hex[0] + hex[0], 16);
				g = parseInt(hex[1] + hex[1], 16);
				b = parseInt(hex[2] + hex[2], 16);
			} else if (hex.length === 6) {
				r = parseInt(hex.substring(0, 2), 16);
				g = parseInt(hex.substring(2, 4), 16);
				b = parseInt(hex.substring(4, 6), 16);
			}
			return { r, g, b };
		}

		if (color.startsWith("rgb")) {
			const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
			if (match) {
				return {
					r: parseInt(match[1]),
					g: parseInt(match[2]),
					b: parseInt(match[3]),
				};
			}
		}

		return { r: 0, g: 0, b: 0 };
	};

	const getColorFromCanvas = useCallback(
		(x: number, y: number) => {
			if (!eyedropperContext.current) return null;

			const ctx = eyedropperContext.current;
			const pixelData = ctx.getImageData(
				Math.floor(x),
				Math.floor(y),
				1,
				1,
			).data;

			if (pixelData[3] === 0) {
				return actualBackground;
			}

			const r = pixelData[0].toString(16).padStart(2, "0");
			const g = pixelData[1].toString(16).padStart(2, "0");
			const b = pixelData[2].toString(16).padStart(2, "0");
			return `#${r}${g}${b}`;
		},
		[actualBackground],
	);

	const handleEyedropper = useCallback(
		(x: number, y: number, isCtrlPressed: boolean = false) => {
			updateEyedropperData();

			const color = getColorFromCanvas(x, y);
			if (color) {
				if (isCtrlPressed) {
					setSecondaryColor(color);
					toast.success(`Secondary color set to ${color}`);
				} else {
					setPrimaryColor(color);
					toast.success(`Primary color set to ${color}`);
				}
				return color;
			}
			return null;
		},
		[
			updateEyedropperData,
			getColorFromCanvas,
			setPrimaryColor,
			setSecondaryColor,
		],
	);

	// Flood fill funkcie
	const floodFill = useCallback(
		(
			startX: number,
			startY: number,
			targetColor: string,
			replacementColor: string,
			tolerance: number = brushSettings.tolerance,
		) => {
			if (!floodFillImageData.current || !floodFillContext.current) {
				return false;
			}

			const imageData = floodFillImageData.current;
			const width = imageData.width;
			const height = imageData.height;

			const targetRgb = parseColorToRgb(targetColor);
			const replacementRgb = parseColorToRgb(replacementColor);

			const x = Math.floor(Math.max(0, Math.min(width - 1, startX)));
			const y = Math.floor(Math.max(0, Math.min(height - 1, startY)));

			const startIndex = (y * width + x) * 4;

			const startR = imageData.data[startIndex];
			const startG = imageData.data[startIndex + 1];
			const startB = imageData.data[startIndex + 2];

			const colorDistance = Math.sqrt(
				Math.pow(startR - replacementRgb.r, 2) +
					Math.pow(startG - replacementRgb.g, 2) +
					Math.pow(startB - replacementRgb.b, 2),
			);

			if (colorDistance <= tolerance) {
				return false;
			}

			const visited = new Uint8Array(width * height);
			const queue = [{ x, y }];
			visited[y * width + x] = 1;
			const processedPixels: { x: number; y: number }[] = [];

			while (queue.length > 0) {
				const point = queue.shift()!;
				const px = point.x;
				const py = point.y;

				processedPixels.push({ x: px, y: py });

				const directions = [
					{ dx: 1, dy: 0 },
					{ dx: -1, dy: 0 },
					{ dx: 0, dy: 1 },
					{ dx: 0, dy: -1 },
				];

				for (const dir of directions) {
					const nx = px + dir.dx;
					const ny = py + dir.dy;

					if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
						continue;
					}

					if (visited[ny * width + nx]) {
						continue;
					}

					const index = (ny * width + nx) * 4;
					const r = imageData.data[index];
					const g = imageData.data[index + 1];
					const b = imageData.data[index + 2];
					const a = imageData.data[index + 3];

					const pixelColorDistance = Math.sqrt(
						Math.pow(r - startR, 2) +
							Math.pow(g - startG, 2) +
							Math.pow(b - startB, 2),
					);

					if (pixelColorDistance <= tolerance && a > 0) {
						visited[ny * width + nx] = 1;
						queue.push({ x: nx, y: ny });
					}
				}
			}

			if (processedPixels.length === 0) {
				return false;
			}

			for (const pixel of processedPixels) {
				const index = (pixel.y * width + pixel.x) * 4;
				imageData.data[index] = replacementRgb.r;
				imageData.data[index + 1] = replacementRgb.g;
				imageData.data[index + 2] = replacementRgb.b;
			}

			if (floodFillContext.current) {
				floodFillContext.current.putImageData(imageData, 0, 0);

				const fillShape: ShapeObject = {
					id: `fill-${Date.now()}`,
					type: "rect",
					x: Math.min(...processedPixels.map((p) => p.x)),
					y: Math.min(...processedPixels.map((p) => p.y)),
					width: Math.max(1, Math.max(...processedPixels.map((p) => p.x)) - Math.min(...processedPixels.map((p) => p.x))),
					height: Math.max(1, Math.max(...processedPixels.map((p) => p.y)) - Math.min(...processedPixels.map((p) => p.y))),
					fill: replacementColor,
					layerId: activeLayerId || undefined,
				};

				setShapes((prev) => [...prev, fillShape]);
				saveCanvasState("Fill applied");
				toast.success(`Area filled with ${replacementColor}`);
			}

			return true;
		},
		[brushSettings.tolerance, activeLayerId, saveCanvasState],
	);

	// Healing brush funkcie
	const applyHealingBrush = useCallback(
		(targetX: number, targetY: number) => {
			if (!healingContext.current || !healingData.isActive) {
				toast.error("Set healing source first (Alt+click)");
				return;
			}

			const brushSize = brushSettings.size;
			const halfSize = Math.floor(brushSize / 2);

			const sourceX = healingData.sourceX;
			const sourceY = healingData.sourceY;

			const sourceImageData = healingContext.current.getImageData(
				Math.max(0, sourceX - halfSize),
				Math.max(0, sourceY - halfSize),
				brushSize,
				brushSize,
			);

			const targetImageData = healingContext.current.getImageData(
				Math.max(0, targetX - halfSize),
				Math.max(0, targetY - halfSize),
				brushSize,
				brushSize,
			);

			for (let i = 0; i < targetImageData.data.length; i += 4) {
				const sourceIdx = i;

				const sr = sourceImageData.data[sourceIdx];
				const sg = sourceImageData.data[sourceIdx + 1];
				const sb = sourceImageData.data[sourceIdx + 2];
				const sa = sourceImageData.data[sourceIdx + 3];

				const tr = targetImageData.data[i];
				const tg = targetImageData.data[i + 1];
				const tb = targetImageData.data[i + 2];
				const ta = targetImageData.data[i + 3];

				if (sa > 0 && ta > 0) {
					const blendFactor = 0.7;

					targetImageData.data[i] = Math.round(
						tr * (1 - blendFactor) + sr * blendFactor,
					);
					targetImageData.data[i + 1] = Math.round(
						tg * (1 - blendFactor) + sg * blendFactor,
					);
					targetImageData.data[i + 2] = Math.round(
						tb * (1 - blendFactor) + sb * blendFactor,
					);
				} else if (sa > 0) {
					targetImageData.data[i] = sr;
					targetImageData.data[i + 1] = sg;
					targetImageData.data[i + 2] = sb;
					targetImageData.data[i + 3] = sa;
				}
			}

			healingContext.current.putImageData(
				targetImageData,
				Math.max(0, targetX - halfSize),
				Math.max(0, targetY - halfSize),
			);

			const healedShape: ShapeObject = {
				id: `healed-${Date.now()}`,
				type: "rect",
				x: Math.max(0, targetX - halfSize),
				y: Math.max(0, targetY - halfSize),
				width: brushSize,
				height: brushSize,
				fill: `rgba(255, 255, 255, 0.3)`,
				layerId: activeLayerId || undefined,
			};

			setShapes((prev) => [...prev, healedShape]);
			saveCanvasState("Healing applied");
			toast.success("Area healed");
		},
		[healingData, brushSettings.size, activeLayerId, saveCanvasState],
	);

	// Blur brush funkcie
	const applyBlurBrush = useCallback(
		(targetX: number, targetY: number) => {
			if (!blurContext.current) {
				toast.error("Blur context not available");
				return;
			}

			const brushSize = brushSettings.size;
			const intensity = brushSettings.blurIntensity;
			const halfSize = Math.floor(brushSize / 2);

			const targetImageData = blurContext.current.getImageData(
				Math.max(0, targetX - halfSize),
				Math.max(0, targetY - halfSize),
				brushSize,
				brushSize,
			);

			const blurredData = new ImageData(
				new Uint8ClampedArray(targetImageData.data),
				targetImageData.width,
				targetImageData.height,
			);

			const radius = Math.floor(intensity / 2);

			for (let y = 0; y < brushSize; y++) {
				for (let x = 0; x < brushSize; x++) {
					let r = 0,
						g = 0,
						b = 0,
						a = 0;
					let count = 0;

					for (let ky = -radius; ky <= radius; ky++) {
						const ny = y + ky;
						if (ny < 0 || ny >= brushSize) continue;

						for (let kx = -radius; kx <= radius; kx++) {
							const nx = x + kx;
							if (nx < 0 || nx >= brushSize) continue;

							const idx = (ny * brushSize + nx) * 4;
							r += targetImageData.data[idx];
							g += targetImageData.data[idx + 1];
							b += targetImageData.data[idx + 2];
							a += targetImageData.data[idx + 3];
							count++;
						}
					}

					const targetIdx = (y * brushSize + x) * 4;

					if (count > 0) {
						blurredData.data[targetIdx] = Math.round(r / count);
						blurredData.data[targetIdx + 1] = Math.round(g / count);
						blurredData.data[targetIdx + 2] = Math.round(b / count);
						blurredData.data[targetIdx + 3] = Math.round(a / count);
					}
				}
			}

			blurContext.current.putImageData(
				blurredData,
				Math.max(0, targetX - halfSize),
				Math.max(0, targetY - halfSize),
			);

			const blurredShape: ShapeObject = {
				id: `blurred-${Date.now()}`,
				type: "rect",
				x: Math.max(0, targetX - halfSize),
				y: Math.max(0, targetY - halfSize),
				width: brushSize,
				height: brushSize,
				fill: `rgba(128, 128, 128, 0.1)`,
				layerId: activeLayerId || undefined,
			};

			setShapes((prev) => [...prev, blurredShape]);
			saveCanvasState("Blur applied");
			toast.success(`Area blurred (intensity: ${intensity})`);
		},
		[
			brushSettings.size,
			brushSettings.blurIntensity,
			activeLayerId,
			saveCanvasState,
		],
	);

	// Funkcia pre kontrolu viditeľnosti vrstvy
	const isLayerVisible = useCallback(
		(layerId?: string) => {
			if (!layerId) return true;
			return layers.find((l) => l.id === layerId)?.visible ?? true;
		},
		[layers],
	);

	// Loading indicator
	if (isLoadingSession) {
		return (
			<div className="flex-1 flex items-center justify-center bg-canvas">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading your session...</p>
					<p className="text-xs text-gray-500 mt-2">
						Restoring your previous work
					</p>
				</div>
			</div>
		);
	}

	const getCursor = () => {
		switch (activeTool) {
			case "brush":
			case "pencil":
			case "eraser":
			case "clone":
			case "healing":
			case "blur":
			case "gradient":
			case "pen":
				return "crosshair";
			case "hand":
				return isPanning.current ? "grabbing" : "grab";
			case "eyedropper":
				return "crosshair";
			case "zoom":
				return "zoom-in";
			case "fill":
				return "cell";
			case "text":
				return "text";
			case "rectangle":
			case "ellipse":
			case "polygon":
			case "line":
				return "crosshair";
			default:
				return "default";
		}
	};

	const ImageNode: React.FC<{
		image: ImageObject;
		onClick: (id: string) => void;
	}> = ({ image, onClick }) => {
		const [img, setImg] = useState<HTMLImageElement | null>(null);

		useEffect(() => {
			const loadedImg = new window.Image();
			loadedImg.src = image.src;
			loadedImg.onload = () => setImg(loadedImg);
		}, [image.src]);

		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur", "pen"];

		if (!img) return null;

		return (
			<KonvaImage
				id={image.id}
				image={img}
				x={image.x}
				y={image.y}
				width={image.width}
				height={image.height}
				draggable={activeTool === "select" || activeTool === "move"}
				listening={!drawingTools.includes(activeTool)}
				onClick={() => {
					if (!drawingTools.includes(activeTool)) {
						onClick(image.id);
					}
				}}
				onTap={() => {
					if (!drawingTools.includes(activeTool)) {
						onClick(image.id);
					}
				}}
				onDragEnd={(e) => {
					setImages(
						images.map((i) =>
							i.id === image.id
								? { ...i, x: e.target.x(), y: e.target.y() }
								: i,
						),
					);
					saveCanvasState("Image moved");
				}}
				onTransformEnd={(e) => {
					const node = e.target;
					setImages(
						images.map((i) =>
							i.id === image.id
								? {
										...i,
										x: node.x(),
										y: node.y(),
										width: node.width() * node.scaleX(),
										height: node.height() * node.scaleY(),
										rotation: node.rotation(),
									}
								: i,
						),
					);
					node.scaleX(1);
					node.scaleY(1);
					saveCanvasState("Image transformed");
				}}
			/>
		);
	};

	const handleObjectClick = (id: string) => {
		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur", "pen"];
		if (!drawingTools.includes(activeTool)) {
			setSelectedId(id);
		}
	};

	const renderPolygon = (shape: ShapeObject) => {
		if (shape.points && shape.points.length >= 6) {
			return (
				<Line
					key={shape.id}
					id={shape.id}
					points={shape.points}
					closed={true}
					fill={shape.fill}
					stroke={shape.stroke}
					strokeWidth={shape.strokeWidth}
					draggable={activeTool === "select" || activeTool === "move"}
					listening={false}
					onClick={() => handleObjectClick(shape.id)}
					onTap={() => handleObjectClick(shape.id)}
					onDragEnd={(e) => {
						const deltaX = e.target.x();
						const deltaY = e.target.y();
						const newPoints = shape.points?.map((point, index) =>
							index % 2 === 0 ? point + deltaX : point + deltaY,
						);
						setShapes((prev) =>
							prev.map((s) =>
								s.id === shape.id
									? { ...s, points: newPoints, x: s.x + deltaX, y: s.y + deltaY }
									: s,
							),
						);
						saveCanvasState("Polygon moved");
					}}
				/>
			);
		}
		return null;
	};

	return (
		<div
			ref={containerRef}
			className="flex-1 overflow-hidden bg-canvas relative flex items-center justify-center"
			style={{ cursor: getCursor() }}
		>
			<div
				className="absolute inset-0 opacity-20"
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

			{/* Session status indicator */}
			{showSessionNotification && (
				<div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/10 text-green-600 text-xs px-3 py-1.5 rounded-full border border-green-500/20 pointer-events-none z-20 flex items-center gap-2 transition-opacity duration-300">
					<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
					<span>Session restored • Auto-save active</span>
				</div>
			)}

			<div
				className="relative shadow-2xl rounded-sm overflow-hidden"
				style={{
					transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
					transformOrigin: "center center",
					transition: "transform 0.1s ease-out",
				}}
			>
				<Stage
					ref={stageRef}
					width={actualWidth}
					height={actualHeight}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onDblClick={handleDblClick}
					onTouchStart={(e) => {
						const touch = e.evt.touches[0];
						if (touch) {
							const stage = stageRef.current;
							if (stage) {
								stage.setPointersPositions(e.evt);
							}
						}
					}}
				>
					<Layer ref={layerRef}>
						<Rect
							name="background"
							x={0}
							y={0}
							width={actualWidth}
							height={actualHeight}
							fill={actualBackground}
							onClick={(e) => {
								if (activeTool !== "select" && activeTool !== "move") {
									e.cancelBubble = true;
								}
							}}
						/>

						{lines
							.filter((line) => isLayerVisible(line.layerId))
							.map((line) => (
								<Line
									key={line.id}
									id={line.id}
									points={line.points}
									stroke={line.stroke}
									strokeWidth={line.strokeWidth}
									tension={line.tool === "brush" ? 0.5 : 0}
									lineCap="round"
									lineJoin="round"
									globalCompositeOperation={
										line.tool === "eraser" ? "destination-out" : "source-over"
									}
									listening={false}
								/>
							))}

						{images
							.filter((img) => isLayerVisible(img.layerId))
							.map((image) => (
								<ImageNode
									key={image.id}
									image={image}
									onClick={handleObjectClick}
								/>
							))}

						{gradients
							.filter((gradient) => isLayerVisible(gradient.layerId))
							.map((gradient) => {
								const x = Math.min(gradient.x0, gradient.x1);
								const y = Math.min(gradient.y0, gradient.y1);
								const width = Math.abs(gradient.x1 - gradient.x0);
								const height = Math.abs(gradient.y1 - gradient.y0);

								return (
									<Rect
										key={gradient.id}
										id={gradient.id}
										x={x}
										y={y}
										width={width}
										height={height}
										draggable={activeTool === "select" || activeTool === "move"}
										listening={false}
										onClick={() => handleObjectClick(gradient.id)}
										onTap={() => handleObjectClick(gradient.id)}
										onDragEnd={(e) => {
											const deltaX = e.target.x() - x;
											const deltaY = e.target.y() - y;

											updateGradient(gradient.id, {
												x0: gradient.x0 + deltaX,
												y0: gradient.y0 + deltaY,
												x1: gradient.x1 + deltaX,
												y1: gradient.y1 + deltaY,
											});
											saveCanvasState("Gradient moved");
										}}
										fillLinearGradientStartPoint={{
											x: gradient.x0 - x,
											y: gradient.y0 - y,
										}}
										fillLinearGradientEndPoint={{
											x: gradient.x1 - x,
											y: gradient.y1 - y,
										}}
										fillLinearGradientColorStops={gradient.colorStops.flatMap(
											(stop) => [stop.offset, stop.color],
										)}
									/>
								);
							})}

						{shapes
							.filter((shape) => isLayerVisible(shape.layerId))
							.map((shape) => {
								if (shape.type === "polygon") {
									return renderPolygon(shape);
								}

								if (shape.type === "rect") {
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
											draggable={
												activeTool === "select" || activeTool === "move"
											}
											listening={false}
											onClick={() => handleObjectClick(shape.id)}
											onTap={() => handleObjectClick(shape.id)}
											onDragEnd={(e) => {
												setShapes(
													shapes.map((s) =>
														s.id === shape.id
															? { ...s, x: e.target.x(), y: e.target.y() }
															: s,
													),
												);
												saveCanvasState("Shape moved");
											}}
										/>
									);
								}

								if (shape.type === "ellipse") {
									return (
										<Ellipse
											key={shape.id}
											id={shape.id}
											x={shape.x}
											y={shape.y}
											radiusX={shape.radiusX || 50}
											radiusY={shape.radiusY || 50}
											fill={shape.fill}
											stroke={shape.stroke}
											strokeWidth={shape.strokeWidth}
											draggable={
												activeTool === "select" || activeTool === "move"
											}
											listening={false}
											onClick={() => handleObjectClick(shape.id)}
											onTap={() => handleObjectClick(shape.id)}
											onDragEnd={(e) => {
												setShapes(
													shapes.map((s) =>
														s.id === shape.id
															? { ...s, x: e.target.x(), y: e.target.y() }
															: s,
													),
												);
												saveCanvasState("Shape moved");
											}}
										/>
									);
								}

								if (shape.type === "line") {
									return (
										<Line
											key={shape.id}
											id={shape.id}
											points={shape.points || [0, 0, 100, 100]}
											stroke={shape.fill}
											strokeWidth={shape.strokeWidth}
											lineCap="round"
											draggable={
												activeTool === "select" || activeTool === "move"
											}
											listening={false}
											onClick={() => handleObjectClick(shape.id)}
											onTap={() => handleObjectClick(shape.id)}
										/>
									);
								}

								if (shape.type === "text") {
									return (
										<Text
											key={shape.id}
											id={shape.id}
											x={shape.x}
											y={shape.y}
											text={shape.text}
											fontSize={shape.fontSize}
											fill={shape.fill}
											draggable={
												activeTool === "select" || activeTool === "move"
											}
											listening={false}
											onClick={() => handleObjectClick(shape.id)}
											onTap={() => handleObjectClick(shape.id)}
											onDblClick={(e) => {
												const textNode = e.target as Konva.Text;
												const stage = textNode.getStage();
												if (!stage) return;

												const textPosition = textNode.absolutePosition();
												const areaPosition = {
													x: stage.container().offsetLeft + textPosition.x,
													y: stage.container().offsetTop + textPosition.y,
												};

												const textarea = document.createElement("textarea");
												document.body.appendChild(textarea);

												textarea.value = textNode.text();
												textarea.style.position = "absolute";
												textarea.style.top = areaPosition.y + "px";
												textarea.style.left = areaPosition.x + "px";
												textarea.style.width = textNode.width() + "px";
												textarea.style.fontSize = textNode.fontSize() + "px";
												textarea.style.border = "none";
												textarea.style.padding = "0px";
												textarea.style.margin = "0px";
												textarea.style.overflow = "hidden";
												textarea.style.background = "none";
												textarea.style.outline = "none";
												textarea.style.resize = "none";
												textarea.style.color = textNode.fill() as string;
												textarea.style.fontFamily = "Arial";
												textarea.style.zIndex = "1000";

												textarea.focus();

												textarea.addEventListener("blur", () => {
													setShapes(
														shapes.map((s) =>
															s.id === shape.id
																? { ...s, text: textarea.value }
																: s,
														),
													);
													document.body.removeChild(textarea);
													saveCanvasState("Text edited");
												});
											}}
											onDragEnd={(e) => {
												setShapes(
													shapes.map((s) =>
														s.id === shape.id
															? { ...s, x: e.target.x(), y: e.target.y() }
															: s,
													),
												);
												saveCanvasState("Text moved");
											}}
										/>
									);
								}

								return null;
							})}

						{/* Aktívny gradient pri kreslení */}
						{currentGradient && activeTool === "gradient" && (
							<Rect
								x={Math.min(currentGradient.x0, currentGradient.x1)}
								y={Math.min(currentGradient.y0, currentGradient.y1)}
								width={Math.abs(currentGradient.x1 - currentGradient.x0)}
								height={Math.abs(currentGradient.y1 - currentGradient.y0)}
								fillLinearGradientStartPoint={{
									x:
										currentGradient.x0 -
										Math.min(currentGradient.x0, currentGradient.x1),
									y:
										currentGradient.y0 -
										Math.min(currentGradient.y0, currentGradient.y1),
								}}
								fillLinearGradientEndPoint={{
									x:
										currentGradient.x1 -
										Math.min(currentGradient.x0, currentGradient.x1),
									y:
										currentGradient.y1 -
										Math.min(currentGradient.y0, currentGradient.y1),
								}}
								fillLinearGradientColorStops={currentGradient.colorStops.flatMap(
									(stop) => [stop.offset, stop.color],
								)}
								stroke="#666"
								strokeWidth={1}
								dash={[5, 5]}
								listening={false}
							/>
						)}

						{/* Aktívny tvar pri kreslení */}
						{currentShape && currentShape.type === "rect" && (
							<Rect
								x={currentShape.x}
								y={currentShape.y}
								width={currentShape.width}
								height={currentShape.height}
								fill={currentShape.fill}
								stroke={currentShape.stroke}
								strokeWidth={currentShape.strokeWidth}
								listening={false}
							/>
						)}

						{currentShape && currentShape.type === "ellipse" && (
							<Ellipse
								x={currentShape.x}
								y={currentShape.y}
								radiusX={currentShape.radiusX || 1}
								radiusY={currentShape.radiusY || 1}
								fill={currentShape.fill}
								stroke={currentShape.stroke}
								strokeWidth={currentShape.strokeWidth}
								listening={false}
							/>
						)}

						{currentShape && currentShape.type === "line" && (
							<Line
								points={currentShape.points || [0, 0, 0, 0]}
								stroke={currentShape.fill}
								strokeWidth={currentShape.strokeWidth}
								lineCap="round"
								listening={false}
							/>
						)}

						{/* Polygon preview while drawing */}
						{isDrawingPolygon && polygonPoints.length > 0 && currentShape && currentShape.type === "polygon" && (
							<Line
								points={currentShape.points || []}
								closed={true}
								fill={currentShape.fill}
								stroke={currentShape.stroke}
								strokeWidth={currentShape.strokeWidth}
								listening={false}
							/>
						)}

						{/* Pen preview while drawing */}
						{currentPenLine && (
							<Line
								points={currentPenLine.points}
								stroke={currentPenLine.stroke}
								strokeWidth={currentPenLine.strokeWidth}
								tension={0.5}
								lineCap="round"
								lineJoin="round"
								listening={false}
							/>
						)}

						<Transformer
							ref={transformerRef}
							boundBoxFunc={(oldBox, newBox) => {
								if (newBox.width < 5 || newBox.height < 5) {
									return oldBox;
								}
								return newBox;
							}}
							enabledAnchors={[
								"middle-left",
								"middle-right",
								"top-center",
								"bottom-center",
								"top-left",
								"top-right",
								"bottom-left",
								"bottom-right",
							]}
							rotateEnabled={true}
							borderEnabled={true}
							anchorStroke="#0077ff"
							anchorFill="#ffffff"
							anchorStrokeWidth={2}
							anchorSize={8}
							borderStroke="#0077ff"
							borderDash={[3, 3]}
						/>
					</Layer>
				</Stage>
			</div>

			{/* Healing source indicator */}
			{healingData.isActive && activeTool === "healing" && (
				<div
					className="absolute border-2 border-blue-500 pointer-events-none z-10 rounded-full"
					style={{
						left: `${healingData.sourceX}px`,
						top: `${healingData.sourceY}px`,
						width: `${brushSettings.size}px`,
						height: `${brushSettings.size}px`,
						transform: `translate(-50%, -50%) scale(${zoom / 100})`,
						transformOrigin: "center center",
						borderStyle: "dashed",
					}}
				>
					<div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-blue-500 text-white px-2 py-1 rounded whitespace-nowrap">
						Healing Source
					</div>
				</div>
			)}

			{/* Tool instructions */}
			{activeTool === "pen" && (
				<div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none z-10">
					<div>Pen Tool</div>
					<div className="text-gray-300">
						Click to add points, right-click or double-click to finish
					</div>
					<div className="text-gray-400 text-[10px] mt-1">
						Press ESC to cancel
					</div>
				</div>
			)}

			{activeTool === "polygon" && (
				<div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none z-10">
					<div>Polygon Tool</div>
					<div className="text-gray-300">
						Click to add vertices, right-click, double-click or press Enter to finish
					</div>
					<div className="text-gray-400 text-[10px] mt-1">
						Press ESC to cancel
					</div>
				</div>
			)}

			{activeTool === "line" && (
				<div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none z-10">
					<div>Line Tool</div>
					<div className="text-gray-300">Click and drag to draw a line</div>
				</div>
			)}

			{activeTool === "blur" && (
				<div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none z-10">
					<div>Blur Tool</div>
					<div className="text-gray-300">
						Size: {brushSettings.size}px | Intensity:{" "}
						{brushSettings.blurIntensity}
					</div>
				</div>
			)}

			{/* Hidden canvases */}
			<canvas ref={floodFillCanvas} style={{ display: "none" }} />
			<canvas ref={eyedropperCanvas} style={{ display: "none" }} />
			<canvas ref={healingCanvas} style={{ display: "none" }} />
			<canvas ref={blurCanvas} style={{ display: "none" }} />
		</div>
	);
};