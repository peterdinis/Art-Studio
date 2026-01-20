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
	Star,
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

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
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
		setActiveTool,
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
		setCanvasSize,
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
		const tempCanvas = stage.toCanvas({ pixelRatio: 1 });
		const canvases = [floodFillCanvas, eyedropperCanvas, healingCanvas, blurCanvas];
		const contexts = [floodFillContext, eyedropperContext, healingContext, blurContext];

		contexts.forEach((ctxRef, i) => {
			if (ctxRef.current) {
				const ctx = ctxRef.current;
				ctx.clearRect(0, 0, actualWidth, actualHeight);
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

		const handleRestoreHistory = (e: any) => {
			if (e.detail && typeof e.detail === "string") {
				restoreCanvasState(e.detail);
			}
		};
		window.addEventListener("artstudio:restore-history", handleRestoreHistory);

		const handleTempToolChange = (e: any) => {
			if (e.detail) setActiveTool(e.detail);
		};
		window.addEventListener("artstudio:temp-tool-change", handleTempToolChange);

		return () => {
			window.removeEventListener("artstudio:clear-canvas", handleClearCanvas);
			window.removeEventListener("artstudio:restore-history", handleRestoreHistory);
			window.removeEventListener("artstudio:temp-tool-change", handleTempToolChange);
		};
	}, [setGradients, clearSelection, restoreCanvasState, setActiveTool]);

	const getCanvasPosition = useCallback((clientX: number, clientY: number) => {
		if (!stageRef.current) return null;
		const stage = stageRef.current;
		const pos = stage.getRelativePointerPosition();
		if (!pos) return null;
		// Return position within canvas bounds
		return {
			x: Math.max(0, Math.min(actualWidth, pos.x)),
			y: Math.max(0, Math.min(actualHeight, pos.y)),
		};
	}, [actualWidth, actualHeight]);

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
	}, [actualWidth, actualHeight, brushSettings.tolerance, setSelectionPath, updateAuxCanvases]);

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

	const applyDodgeBrush = useCallback((x: number, y: number) => {
		if (!tempContext) return;
		updateAuxCanvases();
		const ctx = floodFillContext.current;
		if (!ctx) return;
		const size = brushSettings.size;
		const intensity = (brushSettings.dodgeIntensity || 50) / 200; // Scaled down for smoothness
		const imgData = ctx.getImageData(x - size / 2, y - size / 2, size, size);
		const d = imgData.data;
		for (let i = 0; i < d.length; i += 4) {
			d[i] = Math.min(255, d[i] + 255 * intensity);
			d[i + 1] = Math.min(255, d[i + 1] + 255 * intensity);
			d[i + 2] = Math.min(255, d[i + 2] + 255 * intensity);
		}
		tempContext.putImageData(imgData, x - size / 2, y - size / 2);
	}, [brushSettings.size, brushSettings.dodgeIntensity, tempContext, updateAuxCanvases]);

	const applyBurnBrush = useCallback((x: number, y: number) => {
		if (!tempContext) return;
		updateAuxCanvases();
		const ctx = floodFillContext.current;
		if (!ctx) return;
		const size = brushSettings.size;
		const intensity = (brushSettings.burnIntensity || 50) / 200;
		const imgData = ctx.getImageData(x - size / 2, y - size / 2, size, size);
		const d = imgData.data;
		for (let i = 0; i < d.length; i += 4) {
			d[i] = Math.max(0, d[i] - 255 * intensity);
			d[i + 1] = Math.max(0, d[i + 1] - 255 * intensity);
			d[i + 2] = Math.max(0, d[i + 2] - 255 * intensity);
		}
		tempContext.putImageData(imgData, x - size / 2, y - size / 2);
	}, [brushSettings.size, brushSettings.burnIntensity, tempContext, updateAuxCanvases]);

	const applyCrop = useCallback(() => {
		if (activeTool !== "crop" || !selectionBounds) return;
		const { x, y, width, height } = selectionBounds;
		if (width <= 0 || height <= 0) return;

		setCanvasSize({ width, height, backgroundColor: actualBackground });
		setLines(lines.map(l => ({ ...l, points: l.points.map((p, i) => i % 2 === 0 ? p - x : p - y) })));
		setShapes(shapes.map(s => ({ ...s, x: s.x - (s.x ? x : 0), y: s.y - (s.y ? y : 0) })));
		setImages(images.map(img => ({ ...img, x: img.x - x, y: img.y - y })));
		setGradients(gradients.map(g => ({ ...g, x0: g.x0 - x, y0: g.y0 - y, x1: g.x1 - x, y1: g.y1 - y })));

		setSelectionBounds(null);
		saveCanvasState("Canvas cropped");
		toast.success("Canvas cropped");
	}, [activeTool, selectionBounds, actualBackground, lines, shapes, images, gradients, setCanvasSize, setLines, setShapes, setImages, setGradients, saveCanvasState]);

	/* --- AUXILIARY TOOL HANDLERS --- */

	const handleEyedropper = useCallback((x: number, y: number, isAltPressed: boolean = false) => {
		updateAuxCanvases();
		if (!eyedropperContext.current) return;
		const ctx = eyedropperContext.current;
		// Since updateAuxCanvases draws the stage to the canvas, we can sample directly
		const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
		const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;

		// Convert to Hex for better UX if needed, but rgba is fine
		const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);

		if (isAltPressed) {
			setSecondaryColor(hex);
		} else {
			setPrimaryColor(hex);
		}
		toast.success(`Color picked: ${hex}`);
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
	}, [actualWidth, actualHeight, activeLayerId, saveCanvasState, setImages, updateAuxCanvases]);

	const parseColorToRgb = (color: string) => {
		if (color.startsWith("#")) {
			const r = parseInt(color.slice(1, 3), 16);
			const g = parseInt(color.slice(3, 5), 16);
			const b = parseInt(color.slice(5, 7), 16);
			return { r, g, b };
		}
		if (color.startsWith("rgb")) {
			const match = color.match(/\d+/g);
			if (match) return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
		}
		return { r: 255, g: 255, b: 255 };
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
		const drawingTools = ["brush", "pencil", "eraser", "clone", "healing", "blur", "dodge", "burn"];
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
		if (activeTool === "dodge") {
			applyDodgeBrush(pos.x, pos.y);
		}
		if (activeTool === "burn") {
			applyBurnBrush(pos.x, pos.y);
		}
	}, [activeTool, primaryColor, brushSettings.size, activeLayerId, tempContext, handleCloneBrush, applyHealingBrush, applyBlurBrush, applyDodgeBrush, applyBurnBrush]);

	const continueDrawing = useCallback((pos: { x: number; y: number }) => {
		if (!isDrawing || !activeDrawingLine) return;

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
		if (currentShape && currentShape.type === "polygon") {
			setShapes((prev) => [...prev, currentShape]);
			saveCanvasState("Polygon created");
		}
		setCurrentShape(null);
		setIsDrawingPolygon(false);
	}, [currentShape, saveCanvasState]);

	const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		const selectionTools: Tool[] = ["select", "move", "marquee", "lasso", "magicwand", "crop"];
		if (selectionTools.includes(activeTool)) {
			if (activeTool === "select" || activeTool === "move") {
				if (e.target === stageRef.current || (e.target.name() && e.target.name() === "background")) {
					setSelectedId(null);
					clearSelection();
				}
			}
			if (activeTool === "marquee" || activeTool === "crop") {
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
				// Adding angle and scale for potential use in rendering logic
				...(brushSettings.gradientType === "linear" ? { angle: brushSettings.gradientAngle } : { scale: brushSettings.gradientScale })
			} as any;
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
				shapeStartPoint.current = pos;
				const sides = brushSettings.sides || 5;
				const radius = 5; // Initial radius
				const points: number[] = [];
				for (let i = 0; i < sides; i++) {
					const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
					points.push(pos.x + radius * Math.cos(angle), pos.y + radius * Math.sin(angle));
				}

				const polygonShape: ShapeObject = {
					id: generateId("polygon"),
					type: "polygon",
					points: points,
					x: 0, y: 0,
					stroke: primaryColor,
					strokeWidth: brushSettings.strokeWidth || 2,
					fill: brushSettings.fillType === "none" ? "transparent" : (brushSettings.fillType === "gradient" ? "transparent" : `${primaryColor}40`),
					layerId: activeLayerId || "layer-1",
				};
				setCurrentShape(polygonShape);
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

		if (["rectangle", "ellipse", "line", "star"].includes(activeTool)) {
			shapeStartPoint.current = pos;
			const newShape: ShapeObject = {
				id: generateId("shape"),
				type: activeTool === "rectangle" ? "rect" : (activeTool === "ellipse" ? "ellipse" : (activeTool === "star" ? "star" : "line" as any)),
				x: pos.x, y: pos.y,
				width: 1, height: 1,
				radiusX: activeTool === "ellipse" ? 1 : undefined,
				radiusY: activeTool === "ellipse" ? 1 : undefined,
				radius: activeTool === "star" ? 1 : undefined,
				points: activeTool === "line" ? [pos.x, pos.y, pos.x, pos.y] : undefined,
				fill: activeTool === "line" ? "transparent" : primaryColor,
				stroke: activeTool === "line" ? primaryColor : secondaryColor,
				strokeWidth: brushSettings.strokeWidth || 2,
				layerId: activeLayerId || "layer-1",
				sides: activeTool === "star" ? (brushSettings.sides || 5) : undefined,
			} as any;
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
			const zoomStep = 0.2; // 20%
			const isZoomOut = e.evt.altKey;
			const oldScale = stageRef.current?.scaleX() || 1;
			const newScale = isZoomOut ? Math.max(0.1, oldScale - zoomStep) : Math.min(8, oldScale + zoomStep);

			const stage = stageRef.current;
			if (stage) {
				const pointer = stage.getPointerPosition();
				if (pointer) {
					const mousePointTo = {
						x: (pointer.x - stage.x()) / oldScale,
						y: (pointer.y - stage.y()) / oldScale,
					};

					const newPos = {
						x: pointer.x - mousePointTo.x * newScale,
						y: pointer.y - mousePointTo.y * newScale,
					};

					setZoom(newScale * 100);
					setPanOffset(newPos);
				}
			}
			return;
		}
	};

	const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const pos = getCanvasPosition(e.evt.clientX, e.evt.clientY);
		if (!pos) return;

		if (isSelecting && selectionStartPoint) {
			if (activeTool === "marquee" || activeTool === "crop") {
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
			} else if (currentShape.type === "star" as any) {
				const radius = Math.sqrt((pos.x - currentShape.x) ** 2 + (pos.y - currentShape.y) ** 2);
				setCurrentShape({ ...currentShape, radius });
			} else if (currentShape.type === "line" as any) {
				setCurrentShape({ ...currentShape, points: [shapeStartPoint.current.x, shapeStartPoint.current.y, pos.x, pos.y] });
			}
		}

		if (isDrawingGradient && currentGradient && gradientStartPoint.current) {
			setCurrentGradient({
				...currentGradient,
				x1: pos.x, y1: pos.y
			});
		}

		if (currentShape && shapeStartPoint.current && activeTool === "polygon") {
			const startX = shapeStartPoint.current.x;
			const startY = shapeStartPoint.current.y;
			const radius = Math.sqrt((pos.x - startX) ** 2 + (pos.y - startY) ** 2);
			const rotation = Math.atan2(pos.y - startY, pos.x - startX);
			const sides = brushSettings.sides || 5;
			const points: number[] = [];
			for (let i = 0; i < sides; i++) {
				const angle = (i * 2 * Math.PI) / sides - Math.PI / 2 + rotation;
				points.push(startX + radius * Math.cos(angle), startY + radius * Math.sin(angle));
			}
			setCurrentShape({
				...currentShape,
				points: points
			});
		}

		if (isPanning.current) {
			const deltaX = e.evt.clientX - lastPanPos.current.x;
			const deltaY = e.evt.clientY - lastPanPos.current.y;

			setPanOffset({
				x: panOffset.x + deltaX,
				y: panOffset.y + deltaY
			});
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
		}
	};

	const handleMouseUp = () => {
		if (isSelecting) {
			setIsSelecting(false);
			if (activeTool === "marquee" && selectionBounds) {
				const { x, y, width, height } = selectionBounds;
				const selectedShapes = shapes.filter(s => {
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
				let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
				for (let i = 0; i < selectionPath.length; i += 2) {
					minX = Math.min(minX, selectionPath[i]);
					minY = Math.min(minY, selectionPath[i + 1]);
					maxX = Math.max(maxX, selectionPath[i]);
					maxY = Math.max(maxY, selectionPath[i + 1]);
				}
				const selectedShapes = shapes.filter(s => s.x < maxX && s.x + (s.width || 0) > minX && s.y < maxY && s.y + (s.height || 0) > minY);
				const selectedImgs = images.filter(img => img.x < maxX && img.x + img.width > minX && img.y < maxY && img.y + img.height > minY);

				if (selectedShapes.length > 0) setSelectedId(selectedShapes[selectedShapes.length - 1].id);
				else if (selectedImgs.length > 0) setSelectedId(selectedImgs[selectedImgs.length - 1].id);
				else setSelectedId(null);
			}
			setSelectionStartPoint(null);
		}
		if (isDrawing) stopDrawing();
		if (currentShape && (currentShape.type === "rect" || currentShape.type === "ellipse" || currentShape.type === "polygon" || currentShape.type === "line" as any)) {
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
		if (activeTool === "clone" || activeTool === "healing" || activeTool === "blur" || activeTool === "dodge" || activeTool === "burn") {
			if (tempContext) {
				// Optimization: instead of full canvas, just save the part that was modified?
				// For now, let's stick to full canvas but maybe a lower quality or better management.
				// Better: Use a permanent hidden canvas for these effects and just draw it.
				const imgData = tempContext.canvas.toDataURL();
				const newImg: ImageObject = {
					id: generateId("pixel-stroke"),
					src: imgData,
					x: 0, y: 0, width: actualWidth, height: actualHeight,
					layerId: activeLayerId || "layer-1",
				};
				setImages((prev) => [...prev, newImg]);
				// Don't clear if we want to keep it? No, we add it to shapes so we clear temp.
				tempContext.clearRect(0, 0, actualWidth, actualHeight);
				saveCanvasState(`${activeTool} stroke applied`);
			}
		}
		isPanning.current = false;
	};

	const handleDblClick = () => {
		if (isDrawingPolygon) finishPolygonDrawing();
		if (currentPenLine) finishPenDrawing();
		if (activeTool === "crop") applyCrop();
	};

	const handleObjectClick = (id: string, e?: Konva.KonvaEventObject<MouseEvent>) => {
		if (activeTool === "select" || activeTool === "move") {
			setSelectedId(id);
		} else if (activeTool === "text") {
			const shape = shapes.find(s => s.id === id);
			if (shape && shape.type === "text") {
				const newText = prompt("Edit text:", shape.text);
				if (newText !== null) {
					setShapes(shapes.map(s => s.id === id ? { ...s, text: newText } : s));
					saveCanvasState("Text edited");
				}
			}
		}
	};

	const isLayerVisible = (id: string) => layers.find(l => l.id === id)?.visible !== false;

	const getCursor = () => {
		if (activeTool === "hand") return isPanning.current ? "grabbing" : "grab";
		if (activeTool === "zoom") return "zoom-in";
		if (["brush", "pencil", "eraser", "healing", "blur", "clone"].includes(activeTool)) return "crosshair";
		if (["marquee", "lasso", "magicwand"].includes(activeTool)) return "crosshair";
		if (activeTool === "text") return "text";
		if (activeTool === "move") return "move";
		if (activeTool === "eyedropper") return "copy";
		if (activeTool === "fill") return "alias";
		return "default";
	};

	return (
		<div ref={containerRef} className="flex-1 overflow-hidden bg-canvas relative flex items-center justify-center" style={{ cursor: getCursor() }}>
			<div className="absolute inset-0 opacity-20 pointer-events-none" style={{
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

			<div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
				<Stage
					ref={stageRef}
					width={actualWidth}
					height={actualHeight}
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
							if (shape.type === "line" as any) return <Line key={shape.id} id={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={shape.strokeWidth} lineCap="round" lineJoin="round" {...commonProps} />;
							if (shape.type === "star" as any) {
								const sides = (shape as any).sides || 5;
								const outerRadius = (shape as any).radius || 50;
								const innerRadius = outerRadius / 2.5;
								return <Star key={shape.id} id={shape.id} x={shape.x} y={shape.y} numPoints={sides} innerRadius={innerRadius} outerRadius={outerRadius} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} rotation={shape.rotation} scaleX={shape.scaleX} scaleY={shape.scaleY} {...commonProps as any} />;
							}
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
						{currentShape && (currentShape.type as any) === "line" && <Line id="preview-line" points={currentShape.points} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth} />}

						{currentPenLine && <Line points={currentPenLine.points} stroke={currentPenLine.stroke} strokeWidth={currentPenLine.strokeWidth} />}

						{tempContext && <KonvaImage image={tempContext.canvas} x={0} y={0} opacity={0.8} listening={false} />}

						{currentGradient && <Rect x={0} y={0} width={actualWidth} height={actualHeight} fillLinearGradientStartPoint={{ x: currentGradient.x0, y: currentGradient.y0 }} fillLinearGradientEndPoint={{ x: currentGradient.x1, y: currentGradient.y1 }} fillLinearGradientColorStops={(currentGradient.colorStops || []).flatMap(s => [s.offset, s.color])} listening={false} />}

						{selectionBounds && <Rect {...selectionBounds} stroke="#3b82f6" strokeWidth={1} dash={[4, 2]} fill="rgba(59, 130, 246, 0.1)" listening={false} />}
						{selectionPath && selectionPath.length >= 4 && <Line points={selectionPath} stroke="#3b82f6" strokeWidth={1} dash={[5, 5]} closed fill="rgba(59, 130, 246, 0.1)" listening={false} />}

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

export default KonvaCanvas;