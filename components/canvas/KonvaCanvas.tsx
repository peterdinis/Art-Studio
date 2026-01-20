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
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
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
	layerId: string;
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

interface CanvasState {
	lines: DrawingLine[];
	shapes: ShapeObject[];
	images: ImageObject[];
	gradients: GradientObject[];
	healingData: HealingData;
	blurData: BlurData;
}

const ImageNode = ({ image, onClick, onDragEnd, draggable }: { image: ImageObject; onClick: (id: string) => void; onDragEnd?: (id: string, x: number, y: number) => void; draggable?: boolean }) => {
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
		/>
	);
};

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
	const [currentGradient, setCurrentGradient] = useState<GradientObject | null>(null);
	const gradientStartPoint = useRef<{ x: number; y: number } | null>(null);

	const [currentShape, setCurrentShape] = useState<ShapeObject | null>(null);
	const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);

	const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
	const [polygonPoints, setPolygonPoints] = useState<number[]>([]);
	const [currentPenLine, setCurrentPenLine] = useState<DrawingLine | null>(null);
	const [penPoints, setPenPoints] = useState<number[]>([]);

	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionStartPoint, setSelectionStartPoint] = useState<{ x: number; y: number } | null>(null);

	const isPanning = useRef(false);
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

	const floodFillImageData = useRef<ImageData | null>(null);
	const floodFillCanvas = useRef<HTMLCanvasElement | null>(null);
	const floodFillContext = useRef<CanvasRenderingContext2D | null>(null);

	const eyedropperCanvas = useRef<HTMLCanvasElement | null>(null);
	const eyedropperContext = useRef<CanvasRenderingContext2D | null>(null);

	const [isLoadingSession, setIsLoadingSession] = useState(true);
	const [showSessionNotification, setShowSessionNotification] = useState(false);

	const [activeDrawingLine, setActiveDrawingLine] = useState<DrawingLine | null>(null);
	const [tempContext, setTempContext] = useState<CanvasRenderingContext2D | null>(null);

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
		selectionBounds,
		selectionPath,
		setSelectionBounds,
		setSelectionPath,
		clearSelection,
	} = useArtStudioStore();

	const magicWandTolerance = brushSettings.tolerance || 20;

	const actualWidth = canvasSize?.width || width;
	const actualHeight = canvasSize?.height || height;
	const actualBackground = canvasSize?.backgroundColor || backgroundColor;

	const generateId = useCallback((prefix: string) => {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	/* --- CORE UTILITIES (Hoisted) --- */

	const saveCanvasState = useCallback((action: string) => {
		if (!stageRef.current) return;
		try {
			const canvasState: CanvasState = {
				lines, shapes, images, gradients, healingData, blurData
			};
			const stateString = JSON.stringify(canvasState);
			const dataURL = stageRef.current.toDataURL({ pixelRatio: 0.2 });
			addToHistory(stateString, dataURL, action);
		} catch (err) {
			console.error("Failed to save canvas state:", err);
		}
	}, [lines, shapes, images, gradients, healingData, blurData, addToHistory]);

	const updateAuxCanvases = useCallback(() => {
		if (!stageRef.current) return;
		const stage = stageRef.current;
		const tempCanvas = stage.toCanvas();
		const canvases = [floodFillCanvas, eyedropperCanvas, healingCanvas, blurCanvas];
		const contexts = [floodFillContext, eyedropperContext, healingContext, blurContext];

		contexts.forEach((ctxRef, i) => {
			if (ctxRef.current) {
				const ctx = ctxRef.current;
				ctx.clearRect(0, 0, actualWidth, actualHeight);
				ctx.fillStyle = actualBackground;
				ctx.fillRect(0, 0, actualWidth, actualHeight);
				ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
			}
		});
	}, [actualWidth, actualHeight, actualBackground]);

	const restoreCanvasState = useCallback((stateString: string) => {
		try {
			const state: CanvasState = JSON.parse(stateString);
			setLines(state.lines || []);
			setShapes(state.shapes || []);
			setImages(state.images || []);
			setGradients(state.gradients || []);
			if (state.healingData) setHealingData(state.healingData);
			if (state.blurData) setBlurData(state.blurData);
		} catch (error) {
			console.error("Failed to restore canvas state:", error);
		}
	}, [setGradients]);

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

	useEffect(() => {
		const tempCanvasEl = document.createElement("canvas");
		tempCanvasEl.width = actualWidth;
		tempCanvasEl.height = actualHeight;
		const tempCtx = tempCanvasEl.getContext("2d");
		if (tempCtx) {
			setTempContext(tempCtx);
		}
		return () => { tempCanvasEl.remove(); };
	}, [actualWidth, actualHeight]);

	useEffect(() => {
		const loadSessionAndState = async () => {
			try {
				setIsLoadingSession(true);
				if (!sessionId) await initializeSession();

				const { sessionDB } = await import("@/db/indexedDB");
				const savedData = await sessionDB.loadSessionData();

				if (savedData) {
					if (savedData.lines) setLines(savedData.lines);
					if (savedData.shapes) setShapes(savedData.shapes);
					if (savedData.images) setImages(savedData.images);
					if (savedData.gradients) setGradients(savedData.gradients);
					if (savedData.healingData) setHealingData(savedData.healingData);
					if (savedData.blurData) setBlurData(savedData.blurData);
					setShowSessionNotification(true);
					setTimeout(() => setShowSessionNotification(false), 5000);
				}
			} catch (error) {
				console.error("Error loading session:", error);
			} finally {
				setIsLoadingSession(false);
			}
		};
		loadSessionAndState();
	}, [sessionId, initializeSession, setGradients]);

	useEffect(() => {
		const handleClearCanvas = () => {
			setLines([]);
			setShapes([]);
			setImages([]);
			setGradients([]);
			clearSelection();
			toast.info("Canvas cleared");
		};
		window.addEventListener("artstudio:clear-canvas", handleClearCanvas);
		return () => window.removeEventListener("artstudio:clear-canvas", handleClearCanvas);
	}, [setGradients, clearSelection]);

	const getCanvasPosition = useCallback((clientX: number, clientY: number) => {
		if (!stageRef.current) return null;
		const stage = stageRef.current;
		const stageRect = stage.container().getBoundingClientRect();
		const x = (clientX - stageRect.left) * (actualWidth / stageRect.width);
		const y = (clientY - stageRect.top) * (actualHeight / stageRect.height);
		const transformedX = x / (zoom / 100) - panOffset.x;
		const transformedY = y / (zoom / 100) - panOffset.y;
		return {
			x: Math.max(0, Math.min(actualWidth, transformedX)),
			y: Math.max(0, Math.min(actualHeight, transformedY)),
		};
	}, [actualWidth, actualHeight, zoom, panOffset]);



	const handleMagicWand = useCallback((startX: number, startY: number) => {
		updateAuxCanvases();
		if (!floodFillContext.current) return;

		const ctx = floodFillContext.current;
		const imageData = ctx.getImageData(0, 0, actualWidth, actualHeight);
		const data = imageData.data;
		const width = actualWidth;
		const height = actualHeight;

		const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
		const targetR = data[startIdx];
		const targetG = data[startIdx + 1];
		const targetB = data[startIdx + 2];
		const targetA = data[startIdx + 3];

		const visited = new Uint8Array(width * height);
		const queue: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
		const path: number[] = [];

		while (queue.length > 0) {
			const [x, y] = queue.shift()!;
			const idx = (y * width + x);
			if (visited[idx]) continue;
			visited[idx] = 1;

			const dataIdx = idx * 4;
			const r = data[dataIdx];
			const g = data[dataIdx + 1];
			const b = data[dataIdx + 2];
			const a = data[dataIdx + 3];

			const distance = Math.sqrt(
				(r - targetR) ** 2 +
				(g - targetG) ** 2 +
				(b - targetB) ** 2 +
				(a - targetA) ** 2
			);

			if (distance <= magicWandTolerance) {
				path.push(x, y);
				if (x > 0) queue.push([x - 1, y]);
				if (x < width - 1) queue.push([x + 1, y]);
				if (y > 0) queue.push([x, y - 1]);
				if (y < height - 1) queue.push([x, y + 1]);
			}
		}

		if (path.length > 0) {
			setSelectionPath(path);
		}
	}, [actualWidth, actualHeight, magicWandTolerance, setSelectionPath, updateAuxCanvases]);

	const handleCloneBrush = useCallback((targetX: number, targetY: number) => {
		if (!cloneSourcePoint.current || !shapeStartPoint.current || !tempContext) return;
		updateAuxCanvases();
		const ctx = floodFillContext.current;
		if (!ctx) return;
		const size = brushSettings.size;
		const offset = { x: targetX - shapeStartPoint.current.x, y: targetY - shapeStartPoint.current.y };
		const srcX = cloneSourcePoint.current.x + offset.x;
		const srcY = cloneSourcePoint.current.y + offset.y;
		const imgData = ctx.getImageData(srcX - size / 2, srcY - size / 2, size, size);
		tempContext.putImageData(imgData, targetX - size / 2, targetY - size / 2);
	}, [brushSettings.size, tempContext, updateAuxCanvases]);

	const applyHealingBrush = useCallback((x: number, y: number) => {
		if (!healingSource || !tempContext) return;
		updateAuxCanvases();
		const ctx = healingContext.current;
		if (!ctx) return;
		const size = brushSettings.size;
		const srcData = ctx.getImageData(healingSource.x - size / 2, healingSource.y - size / 2, size, size);
		const targetData = ctx.getImageData(x - size / 2, y - size / 2, size, size);
		for (let i = 0; i < targetData.data.length; i += 4) {
			targetData.data[i] = (targetData.data[i] + srcData.data[i]) / 2;
			targetData.data[i + 1] = (targetData.data[i + 1] + srcData.data[i + 1]) / 2;
			targetData.data[i + 2] = (targetData.data[i + 2] + srcData.data[i + 2]) / 2;
		}
		tempContext.putImageData(targetData, x - size / 2, y - size / 2);
	}, [brushSettings.size, healingSource, tempContext, updateAuxCanvases]);

	const applyBlurBrush = useCallback((x: number, y: number) => {
		if (!tempContext) return;
		updateAuxCanvases();
		const ctx = blurContext.current;
		if (!ctx) return;
		const size = brushSettings.size;
		const imgData = ctx.getImageData(x - size / 2, y - size / 2, size, size);
		const d = imgData.data;
		for (let i = 0; i < d.length; i += 4) {
			d[i] = (d[i] + (d[i - 4] || d[i]) + (d[i + 4] || d[i])) / 3;
		}
		tempContext.putImageData(imgData, x - size / 2, y - size / 2);
	}, [brushSettings.size, tempContext, updateAuxCanvases]);

	/* --- AUXILIARY TOOL HANDLERS --- */

	const handleEyedropper = useCallback((x: number, y: number, isAltPressed: boolean = false) => {
		updateAuxCanvases();
		if (!eyedropperContext.current) return;
		const ctx = eyedropperContext.current;
		const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
		const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
		if (isAltPressed) {
			setSecondaryColor(color);
		} else {
			setPrimaryColor(color);
		}
		toast.success(`Color picked: ${color}`);
	}, [setPrimaryColor, setSecondaryColor, updateAuxCanvases]);

	const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
		updateAuxCanvases();
		if (!floodFillContext.current) return;
		const ctx = floodFillContext.current;
		const imageData = ctx.getImageData(0, 0, actualWidth, actualHeight);
		const { data, width, height } = imageData;
		const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
		const targetColor = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];

		const fillRGB = parseColorToRgb(fillColor);
		if (fillRGB.r === targetColor[0] && fillRGB.g === targetColor[1] && fillRGB.b === targetColor[2]) return;

		const queue: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
		while (queue.length > 0) {
			const [x, y] = queue.shift()!;
			const idx = (y * width + x) * 4;
			if (data[idx] === targetColor[0] && data[idx + 1] === targetColor[1] && data[idx + 2] === targetColor[2]) {
				data[idx] = fillRGB.r;
				data[idx + 1] = fillRGB.g;
				data[idx + 2] = fillRGB.b;
				data[idx + 3] = 255;
				if (x > 0) queue.push([x - 1, y]);
				if (x < width - 1) queue.push([x + 1, y]);
				if (y > 0) queue.push([x, y - 1]);
				if (y < height - 1) queue.push([x, y + 1]);
			}
		}
		ctx.putImageData(imageData, 0, 0);
		// In a real app, we'd save this to a layer. For now, it's a visual effect on the aux canvas.
		// We'll add it as an image object to make it permanent.
		const fillImage: ImageObject = {
			id: generateId("fill"),
			src: ctx.canvas.toDataURL(),
			x: 0, y: 0, width, height,
			layerId: activeLayerId || "layer-1",
		};
		setImages((prev) => [...prev, fillImage]);
		saveCanvasState("Flood Fill applied");
	}, [actualWidth, actualHeight, activeLayerId, saveCanvasState, setImages]);

	const parseColorToRgb = (color: string) => {
		const div = document.createElement("div");
		div.style.color = color;
		document.body.appendChild(div);
		const computed = getComputedStyle(div).color;
		document.body.removeChild(div);
		const match = computed.match(/\d+/g);
		return match ? { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) } : { r: 0, g: 0, b: 0 };
	};

	const handleTextTool = useCallback((pos: { x: number; y: number }) => {
		const text = prompt("Enter text:", "New Text");
		if (text) {
			const newText: ShapeObject = {
				id: generateId("text"),
				type: "text",
				x: pos.x, y: pos.y,
				text,
				fontSize: 24,
				fill: primaryColor,
				layerId: activeLayerId || "layer-1",
			};
			setShapes((prev) => [...prev, newText]);
			saveCanvasState("Text added");
		}
	}, [primaryColor, activeLayerId, setShapes, saveCanvasState]);

	useEffect(() => {
		const handleRestoreHistory = (e: any) => {
			if (e.detail?.canvasData) restoreCanvasState(e.detail.canvasData);
		};
		window.addEventListener("artstudio:restore-history", handleRestoreHistory as EventListener);
		return () => window.removeEventListener("artstudio:restore-history", handleRestoreHistory as EventListener);
	}, [restoreCanvasState]);

	const startDrawing = useCallback((pos: { x: number; y: number }) => {
		const drawingTools = ["brush", "pencil", "eraser", "clone", "healing", "blur"];
		if (!drawingTools.includes(activeTool)) return;

		if (activeTool === "clone" && !cloneSourcePoint.current) {
			toast.error("Alt+click to set clone source first");
			return;
		}

		setIsDrawing(true);
		shapeStartPoint.current = pos; // Used as starting point for relative cloning

		const strokeColor = activeTool === "eraser" ? "transparent" : primaryColor;
		const newLine: DrawingLine = {
			id: generateId("line"),
			points: [pos.x, pos.y],
			stroke: strokeColor,
			strokeWidth: activeTool === "pencil" ? 1 : brushSettings.size,
			tool: activeTool as any,
			layerId: activeLayerId || "layer-1",
		};
		setActiveDrawingLine(newLine);
		setLines((prev) => [...prev, newLine]);

		if (tempContext) {
			tempContext.strokeStyle = activeTool === "eraser" ? "rgba(0,0,0,0)" : newLine.stroke;
			tempContext.lineWidth = newLine.strokeWidth;
			tempContext.lineCap = "round";
			tempContext.lineJoin = "round";
			tempContext.beginPath();
			tempContext.moveTo(pos.x, pos.y);
		}

		if (activeTool === "clone") {
			handleCloneBrush(pos.x, pos.y);
		}
		if (activeTool === "healing") {
			applyHealingBrush(pos.x, pos.y);
		}
		if (activeTool === "blur") {
			applyBlurBrush(pos.x, pos.y);
		}
	}, [activeTool, primaryColor, brushSettings.size, activeLayerId, tempContext, handleCloneBrush, applyHealingBrush, applyBlurBrush]);

	const continueDrawing = useCallback((pos: { x: number; y: number }) => {
		if (!isDrawing || !activeDrawingLine) return;

		if (activeTool === "clone") {
			handleCloneBrush(pos.x, pos.y);
		} else if (activeTool === "healing") {
			applyHealingBrush(pos.x, pos.y);
		} else if (activeTool === "blur") {
			applyBlurBrush(pos.x, pos.y);
		} else if (tempContext) {
			tempContext.lineTo(pos.x, pos.y);
			tempContext.stroke();
		}

		setLines((prev) => prev.map((line) =>
			line.id === activeDrawingLine.id ? { ...line, points: [...line.points, pos.x, pos.y] } : line
		));
	}, [isDrawing, activeDrawingLine, tempContext, activeTool, handleCloneBrush, applyHealingBrush, applyBlurBrush]);

	const stopDrawing = useCallback(() => {
		if (isDrawing) {
			setIsDrawing(false);
			setActiveDrawingLine(null);
			if (tempContext) tempContext.closePath();
			saveCanvasState(`${activeTool === "eraser" ? "Erased" : "Stroke added"}`);
		}
	}, [isDrawing, tempContext, saveCanvasState, activeTool]);

	const finishPenDrawing = useCallback(() => {
		if (!currentPenLine) return;
		if (currentPenLine.points.length >= 4) {
			setLines((prev) => [...prev, currentPenLine]);
			saveCanvasState("Pen curve completed");
		}
		setCurrentPenLine(null);
		setPenPoints([]);
		setIsDrawing(false);
	}, [currentPenLine, saveCanvasState]);

	const finishPolygonDrawing = useCallback(() => {
		if (polygonPoints.length >= 6) {
			const polygonShape: ShapeObject = {
				id: generateId("polygon"),
				type: "polygon",
				points: [...polygonPoints],
				x: 0, y: 0,
				stroke: primaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				fill: `${primaryColor}40`,
				layerId: activeLayerId || "layer-1",
			};
			setShapes((prev) => [...prev, polygonShape]);
			saveCanvasState("Polygon created");
		}
		setIsDrawingPolygon(false);
		setPolygonPoints([]);
	}, [polygonPoints, primaryColor, brushSettings.strokeWidth, activeLayerId, saveCanvasState]);

	const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		const selectionTools: Tool[] = ["select", "move", "marquee", "lasso", "magicwand"];
		if (selectionTools.includes(activeTool)) {
			if (activeTool === "select" || activeTool === "move") {
				if (e.target === stageRef.current || e.target.name() === "background") {
					setSelectedId(null);
					clearSelection();
				}
			}
			if (activeTool === "marquee") {
				setIsSelecting(true);
				setSelectionStartPoint(pos);
				setSelectionBounds({ x: pos.x, y: pos.y, width: 0, height: 0 });
			}
			if (activeTool === "lasso") {
				setIsSelecting(true);
				setSelectionPath([pos.x, pos.y]);
			}
			if (activeTool === "magicwand") {
				handleMagicWand(pos.x, pos.y);
			}
			return;
		}

		if (activeTool === "gradient") {
			setIsDrawingGradient(true);
			gradientStartPoint.current = pos;
			const newGradient: GradientObject = {
				id: generateId("gradient"),
				type: brushSettings.gradientType || "linear",
				x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y,
				colorStops: (brushSettings.gradientStops || []).map(s => ({ offset: s.position, color: s.color })),
				layerId: activeLayerId || "layer-1",
			};
			setCurrentGradient(newGradient);
			return;
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
					};
					setCurrentPenLine(newLine);
					setPenPoints([pos.x, pos.y]);
					setIsDrawing(true);
				} else {
					setPenPoints((prev) => [...prev, pos.x, pos.y]);
					setCurrentPenLine((prev) => prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : null);
				}
			}
			return;
		}

		if (activeTool === "polygon") {
			if (e.evt.button === 0) {
				if (!isDrawingPolygon) {
					setIsDrawingPolygon(true);
					setPolygonPoints([pos.x, pos.y]);
				} else {
					setPolygonPoints((prev) => [...prev, pos.x, pos.y]);
				}
			}
			return;
		}

		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur", "clone"];
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
			const newShape: ShapeObject = {
				id: generateId("shape"),
				type: activeTool === "rectangle" ? "rect" : (activeTool === "ellipse" ? "ellipse" : "line" as any),
				x: pos.x, y: pos.y,
				width: 1, height: 1,
				points: activeTool === "line" ? [pos.x, pos.y, pos.x, pos.y] : undefined,
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
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
			return;
		}

		if (activeTool === "zoom") {
			const zoomStep = 20;
			const isZoomOut = e.evt.altKey;
			const oldZoom = zoom / 100;
			const newZoomVal = isZoomOut ? Math.max(10, zoom - zoomStep) : Math.min(800, zoom + zoomStep);
			const newZoom = newZoomVal / 100;

			// Zoom towards mouse logic
			const pointer = stageRef.current?.getPointerPosition();
			if (pointer) {
				const mousePointTo = {
					x: (pointer.x / oldZoom) - panOffset.x,
					y: (pointer.y / oldZoom) - panOffset.y,
				};

				const newOffset = {
					x: (pointer.x / newZoom) - mousePointTo.x,
					y: (pointer.y / newZoom) - mousePointTo.y,
				};

				setZoom(newZoomVal);
				setPanOffset(newOffset);
			} else {
				setZoom(newZoomVal);
			}
			return;
		}
	};

	const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		if (isSelecting && selectionStartPoint) {
			if (activeTool === "marquee") {
				const x = Math.min(selectionStartPoint.x, pos.x);
				const y = Math.min(selectionStartPoint.y, pos.y);
				const width = Math.abs(pos.x - selectionStartPoint.x);
				const height = Math.abs(pos.y - selectionStartPoint.y);
				setSelectionBounds({ x, y, width, height });
			} else if (activeTool === "lasso" && selectionPath) {
				setSelectionPath([...selectionPath, pos.x, pos.y]);
			}
		}

		if (activeTool === "pen" && currentPenLine) {
			setCurrentPenLine({ ...currentPenLine, points: [...penPoints, pos.x, pos.y] });
			return;
		}

		if (isDrawingPolygon && polygonPoints.length > 0) {
			setCurrentShape({
				id: "polygon-preview", type: "polygon", x: 0, y: 0,
				points: [...polygonPoints, pos.x, pos.y],
				stroke: primaryColor, strokeWidth: 2, fill: `${primaryColor}40`,
				layerId: activeLayerId || "layer-1"
			});
			return;
		}

		if (isDrawing) continueDrawing(pos);

		if (currentShape && shapeStartPoint.current) {
			const startX = shapeStartPoint.current.x;
			const startY = shapeStartPoint.current.y;
			if (currentShape.type === "rect") {
				setCurrentShape({
					...currentShape,
					x: Math.min(startX, pos.x), y: Math.min(startY, pos.y),
					width: Math.abs(pos.x - startX), height: Math.abs(pos.y - startY)
				});
			} else if (currentShape.type === "ellipse") {
				setCurrentShape({
					...currentShape,
					x: (startX + pos.x) / 2, y: (startY + pos.y) / 2,
					radiusX: Math.abs(pos.x - startX) / 2, radiusY: Math.abs(pos.y - startY) / 2
				});
			} else if (currentShape.type === "line" as any) {
				setCurrentShape({
					...currentShape,
					points: [startX, startY, pos.x, pos.y]
				});
			}
		}

		if (isDrawingGradient && currentGradient && gradientStartPoint.current) {
			setCurrentGradient({
				...currentGradient,
				x1: pos.x, y1: pos.y
			});
		}

		if (isPanning.current) {
			const deltaX = e.evt.clientX - lastPanPos.current.x;
			const deltaY = e.evt.clientY - lastPanPos.current.y;
			setPanOffset({
				x: panOffset.x + deltaX / (zoom / 100),
				y: panOffset.y + deltaY / (zoom / 100)
			});
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
		}
	};

	const handleMouseUp = () => {
		if (isSelecting) {
			setIsSelecting(false);
			if (activeTool === "marquee" && selectionBounds) {
				const { x, y, width, height } = selectionBounds;
				// Better selection logic: find all overlapping shapes/images
				const selectedShapes = shapes.filter(s => {
					// Handle different shape types
					if (s.type === "rect") {
						return s.x < x + width && s.x + (s.width || 0) > x && s.y < y + height && s.y + (s.height || 0) > y;
					}
					if (s.type === "ellipse") {
						return s.x - (s.radiusX || 0) < x + width && s.x + (s.radiusX || 0) > x && s.y - (s.radiusY || 0) < y + height && s.y + (s.radiusY || 0) > y;
					}
					return s.x >= x && s.x <= x + width && s.y >= y && s.y <= y + height;
				});
				const selectedImgs = images.filter(img => {
					return img.x < x + width && img.x + img.width > x && img.y < y + height && img.y + img.height > y;
				});

				if (selectedShapes.length > 0) setSelectedId(selectedShapes[selectedShapes.length - 1].id);
				else if (selectedImgs.length > 0) setSelectedId(selectedImgs[selectedImgs.length - 1].id);
				else setSelectedId(null);
			} else if (activeTool === "lasso" && selectionPath && selectionPath.length >= 6) {
				// Simple check: is object origin inside bounding box of lasso
				let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
				for (let i = 0; i < selectionPath.length; i += 2) {
					minX = Math.min(minX, selectionPath[i]);
					minY = Math.min(minY, selectionPath[i + 1]);
					maxX = Math.max(maxX, selectionPath[i]);
					maxY = Math.max(maxY, selectionPath[i + 1]);
				}
				const selectedShapes = shapes.filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY);
				const selectedImgs = images.filter(img => img.x >= minX && img.x <= maxX && img.y >= minY && img.y <= maxY);

				if (selectedShapes.length > 0) setSelectedId(selectedShapes[selectedShapes.length - 1].id);
				else if (selectedImgs.length > 0) setSelectedId(selectedImgs[selectedImgs.length - 1].id);
				else setSelectedId(null);
			}
			setSelectionStartPoint(null);
		}
		if (isDrawing) stopDrawing();
		if (currentShape && (currentShape.type === "rect" || currentShape.type === "ellipse" || currentShape.type === "line" as any)) {
			setShapes((prev) => [...prev, currentShape]);
			setCurrentShape(null);
			saveCanvasState(`${currentShape.type} created`);
		}
		if (isDrawingGradient && currentGradient) {
			setIsDrawingGradient(false);
			addGradient(currentGradient);
			setCurrentGradient(null);
			saveCanvasState("Gradient added");
		}
		if (activeTool === "clone" || activeTool === "healing" || activeTool === "blur") {
			if (tempContext) {
				const imgData = tempContext.canvas.toDataURL();
				const newImg: ImageObject = {
					id: generateId("pixel-stroke"),
					src: imgData,
					x: 0, y: 0, width: actualWidth, height: actualHeight,
					layerId: activeLayerId || "layer-1",
				};
				setImages((prev) => [...prev, newImg]);
				tempContext.clearRect(0, 0, actualWidth, actualHeight);
				saveCanvasState(`${activeTool} stroke applied`);
			}
		}
		isPanning.current = false;
	};

	const handleDblClick = () => {
		if (isDrawingPolygon) finishPolygonDrawing();
		if (currentPenLine) finishPenDrawing();
	};

	const handleObjectClick = (id: string) => {
		if (activeTool === "select" || activeTool === "move") setSelectedId(id);
	};

	const isLayerVisible = (id: string) => layers.find(l => l.id === id)?.visible !== false;

	const getCursor = () => {
		if (activeTool === "hand") return isPanning.current ? "grabbing" : "grab";
		if (activeTool === "zoom") return "zoom-in";
		if (["brush", "pencil", "eraser", "healing", "blur", "clone"].includes(activeTool)) return "crosshair";
		if (["marquee", "lasso", "magicwand"].includes(activeTool)) return "cell";
		if (activeTool === "text") return "text";
		if (activeTool === "move") return "move";
		if (activeTool === "eyedropper") return "wait";
		return "default";
	};

	return (
		<div ref={containerRef} className="flex-1 overflow-hidden bg-canvas relative flex items-center justify-center" style={{ cursor: getCursor() }}>
			<div className="absolute inset-0 opacity-20" style={{
				backgroundImage: `
					linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
					linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
					linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
					linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
				`,
				backgroundSize: "20px 20px",
				backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
			}} />

			{showSessionNotification && (
				<div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/10 text-green-600 text-xs px-3 py-1.5 rounded-full border border-green-500/20 pointer-events-none z-20 flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
					<span>Session restored • Auto-save active</span>
				</div>
			)}

			<div className="relative shadow-2xl rounded-sm overflow-hidden" style={{
				transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
				transformOrigin: "center center",
				transition: "transform 0.1s ease-out",
			}}>
				<Stage
					ref={stageRef} width={actualWidth} height={actualHeight}
					onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp} onDblClick={handleDblClick}
				>
					<Layer ref={layerRef}>
						<Rect name="background" x={0} y={0} width={actualWidth} height={actualHeight} fill={actualBackground} />

						{lines.filter(l => isLayerVisible(l.layerId)).map(line => (
							<Line
								key={line.id} id={line.id} points={line.points} stroke={line.stroke} strokeWidth={line.strokeWidth}
								tension={line.tool === "brush" ? 0.5 : 0} lineCap="round" lineJoin="round"
								globalCompositeOperation={line.tool === "eraser" ? "destination-out" : "source-over"}
							/>
						))}

						{shapes.filter(s => isLayerVisible(s.layerId)).map(shape => {
							const commonProps = {
								draggable: activeTool === "select" || activeTool === "move",
								onClick: () => handleObjectClick(shape.id),
								onTap: () => handleObjectClick(shape.id),
								onDragEnd: (e: any) => {
									setShapes(shapes.map(s => s.id === shape.id ? { ...s, x: e.target.x(), y: e.target.y() } : s));
									saveCanvasState(`${shape.type} moved`);
								}
							};
							if (shape.type === "rect") return <Rect key={shape.id} id={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} rotation={shape.rotation} scaleX={shape.scaleX} scaleY={shape.scaleY} {...commonProps} />;
							if (shape.type === "ellipse") return <Ellipse key={shape.id} id={shape.id} x={shape.x} y={shape.y} radiusX={shape.radiusX || 0} radiusY={shape.radiusY || 0} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} rotation={shape.rotation} scaleX={shape.scaleX} scaleY={shape.scaleY} {...commonProps} />;
							if (shape.type === "polygon") return <Line key={shape.id} id={shape.id} points={shape.points} closed fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} rotation={shape.rotation} scaleX={shape.scaleX} scaleY={shape.scaleY} lineJoin="round" lineCap="round" {...commonProps} />;
							if (shape.type === "text") return <Text key={shape.id} id={shape.id} text={shape.text} x={shape.x} y={shape.y} fontSize={shape.fontSize} fill={shape.fill} rotation={shape.rotation} scaleX={shape.scaleX} scaleY={shape.scaleY} {...commonProps} />;
							return null;
						})}

						{gradients.filter(g => isLayerVisible(g.layerId)).map(g => (
							<Rect key={g.id} x={0} y={0} width={actualWidth} height={actualHeight} fillLinearGradientStartPoint={{ x: g.x0, y: g.y0 }} fillLinearGradientEndPoint={{ x: g.x1, y: g.y1 }} fillLinearGradientColorStops={(g.colorStops || []).flatMap(s => [s.offset, s.color])} listening={false} />
						))}

						{images.filter(img => isLayerVisible(img.layerId)).map(img => (
							<ImageNode
								key={img.id}
								image={img}
								onClick={handleObjectClick}
								draggable={activeTool === "select" || activeTool === "move"}
								onDragEnd={(id, x, y) => {
									setImages(images.map(i => i.id === id ? { ...i, x, y } : i));
									saveCanvasState("Image moved");
								}}
							/>
						))}

						{currentShape && currentShape.type === "rect" && <Rect id="preview-rect" x={currentShape.x} y={currentShape.y} width={currentShape.width} height={currentShape.height} fill={currentShape.fill} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth} />}
						{currentShape && currentShape.type === "ellipse" && <Ellipse id="preview-ellipse" x={currentShape.x} y={currentShape.y} radiusX={currentShape.radiusX || 0} radiusY={currentShape.radiusY || 0} fill={currentShape.fill} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth} />}
						{currentShape && currentShape.type === "polygon" && <Line id="preview-polygon" points={currentShape.points} closed={false} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth} lineJoin="round" lineCap="round" />}

						{currentPenLine && <Line points={currentPenLine.points} stroke={currentPenLine.stroke} strokeWidth={currentPenLine.strokeWidth} />}

						{tempContext && <KonvaImage image={tempContext.canvas} x={0} y={0} opacity={0.8} listening={false} />}

						{currentGradient && <Rect x={0} y={0} width={actualWidth} height={actualHeight} fillLinearGradientStartPoint={{ x: currentGradient.x0, y: currentGradient.y0 }} fillLinearGradientEndPoint={{ x: currentGradient.x1, y: currentGradient.y1 }} fillLinearGradientColorStops={(currentGradient.colorStops || []).flatMap(s => [s.offset, s.color])} listening={false} />}

						{selectionBounds && <Rect {...selectionBounds} stroke="#3b82f6" strokeWidth={1} dash={[4, 2]} fill="rgba(59, 130, 246, 0.1)" />}
						{selectionPath && selectionPath.length >= 4 && <Line points={selectionPath} stroke="#3b82f6" strokeWidth={1} dash={[5, 5]} closed fill="rgba(59, 130, 246, 0.1)" />}

						{selectedId && <Transformer ref={transformerRef} />}
					</Layer>
				</Stage>
			</div>

			<div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded pointer-events-none z-10">
				Zoom: {zoom}% | {actualWidth} × {actualHeight}px
			</div>

			<canvas ref={floodFillCanvas} style={{ display: "none" }} />
			<canvas ref={eyedropperCanvas} style={{ display: "none" }} />
			<canvas ref={healingCanvas} style={{ display: "none" }} />
			<canvas ref={blurCanvas} style={{ display: "none" }} />
		</div>
	);
};
