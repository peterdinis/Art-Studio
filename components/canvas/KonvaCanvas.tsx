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
	tool: "brush" | "pencil" | "eraser" | "healing" | "blur";
	layerId?: string;
}

interface ShapeObject {
	id: string;
	type: "rect" | "ellipse" | "circle" | "line" | "text";
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

interface FloodFillPoint {
	x: number;
	y: number;
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

	// Pridané stavy pre správu session
	const [isLoadingSession, setIsLoadingSession] = useState(true);
	const [hasRestoredState, setHasRestoredState] = useState(false);
	const [lastSessionId, setLastSessionId] = useState<string | null>(null);

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

	// Inicializácia session a načítanie stavu
	useEffect(() => {
		const loadSessionAndState = async () => {
			try {
				console.log('Loading session for canvas...');
				setIsLoadingSession(true);
				
				// Inicializuj session (ak ešte nebola inicializovaná)
				if (!sessionId) {
					await initializeSession();
				}
				
				// Skontroluj, či máme session dáta
				const storeState = useArtStudioStore.getState();
				console.log('Current session ID:', storeState.sessionId);
				
				if (storeState.sessionId) {
					setLastSessionId(storeState.sessionId);
					
					// Počkáme krátko, aby sa store stabilizoval
					await new Promise(resolve => setTimeout(resolve, 500));
					
					// Načítame session dát z IndexedDB priamo
					const { sessionDB } = await import('@/db/indexedDB');
					const savedData = await sessionDB.loadSessionData();
					
					if (savedData) {
						console.log('Found saved session data:', savedData);
						
						// Ak máme uložené dáta, obnovíme ich
						if (savedData.lines) setLines(savedData.lines || []);
						if (savedData.shapes) setShapes(savedData.shapes || []);
						if (savedData.images) setImages(savedData.images || []);
						if (savedData.gradients) setGradients(savedData.gradients || []);
						
						// Obnovíme healing a blur data
						if (savedData.healingData) setHealingData(savedData.healingData);
						if (savedData.blurData) setBlurData(savedData.blurData);
						
						console.log('Canvas state restored from session');
						setHasRestoredState(true);
						
						// Upozornime, že canvas je načítaný
						setTimeout(() => {
							toast.success('Session restored', {
								description: 'Your previous work has been loaded'
							});
						}, 1000);
					} else {
						console.log('No saved session data found');
						setHasRestoredState(false);
					}
				}
				
			} catch (error) {
				console.error('Error loading session:', error);
				toast.error('Failed to load session', {
					description: 'Starting with a fresh canvas'
				});
			} finally {
				setIsLoadingSession(false);
			}
		};

		loadSessionAndState();
	}, [sessionId, initializeSession, setGradients]);

	useEffect(() => {
		if (stageRef.current) {
			(window as any).konvaStage = stageRef.current;
		}
		return () => {
			delete (window as any).konvaStage;
		};
	}, []);

	useEffect(() => {
		const canvas = document.createElement("canvas");
		canvas.width = actualWidth;
		canvas.height = actualHeight;
		floodFillCanvas.current = canvas;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			floodFillContext.current = ctx;
		}
	}, [actualWidth, actualHeight]);

	useEffect(() => {
		const canvas = document.createElement("canvas");
		canvas.width = actualWidth;
		canvas.height = actualHeight;
		eyedropperCanvas.current = canvas;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (ctx) {
			eyedropperContext.current = ctx;
		}
	}, [actualWidth, actualHeight]);

	useEffect(() => {
		const canvas = document.createElement("canvas");
		canvas.width = actualWidth;
		canvas.height = actualHeight;
		healingCanvas.current = canvas;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (ctx) {
			healingContext.current = ctx;
		}
	}, [actualWidth, actualHeight]);

	useEffect(() => {
		const canvas = document.createElement("canvas");
		canvas.width = actualWidth;
		canvas.height = actualHeight;
		blurCanvas.current = canvas;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (ctx) {
			blurContext.current = ctx;
		}
	}, [actualWidth, actualHeight]);

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

	// Zlepšená funkcia pre obnovu stavu z histórie
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

				// Uložíme, že máme obnovený stav
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

	// Auto-save effect - ukladanie pri zmene stavu
	useEffect(() => {
		if (!hasRestoredState || isLoadingSession) return;
		
		const autoSave = setTimeout(() => {
			if (lines.length > 0 || shapes.length > 0 || images.length > 0) {
				console.log('Auto-saving canvas state...');
				saveCanvasState('auto_save');
			}
		}, 10000); // Ukladá každých 10 sekúnd po zmene
		
		return () => clearTimeout(autoSave);
	}, [lines, shapes, images, hasRestoredState, isLoadingSession, saveCanvasState]);

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

	const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const clickedOnEmpty =
			e.target === e.target.getStage() || e.target.name() === "background";

		if (clickedOnEmpty) {
			setSelectedId(null);
		}
	};

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

		if (color.startsWith("rgba")) {
			const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
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
				if (isCtrlPressed || activeTool === "eyedropper") {
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
			activeTool,
		],
	);

	const floodFill = useCallback(
		(
			startX: number,
			startY: number,
			targetColor: string,
			replacementColor: string,
			tolerance: number = brushSettings.tolerance,
		) => {
			if (!floodFillImageData.current || !floodFillContext.current) {
				console.error("Flood fill data not initialized");
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
			const startA = imageData.data[startIndex + 3];

			const colorDistance = Math.sqrt(
				Math.pow(startR - replacementRgb.r, 2) +
					Math.pow(startG - replacementRgb.g, 2) +
					Math.pow(startB - replacementRgb.b, 2),
			);

			if (colorDistance <= tolerance) {
				console.log("Same color, no fill needed");
				return false;
			}

			const visited = new Uint8Array(width * height);

			const queue: FloodFillPoint[] = [];
			queue.push({ x, y });
			visited[y * width + x] = 1;

			const processedPixels: FloodFillPoint[] = [];

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

			console.log(`Filled ${processedPixels.length} pixels`);

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

				const tempCanvas = floodFillCanvas.current;
				if (tempCanvas) {
					let minX = width,
						maxX = 0,
						minY = height,
						maxY = 0;
					for (const pixel of processedPixels) {
						if (pixel.x < minX) minX = pixel.x;
						if (pixel.x > maxX) maxX = pixel.x;
						if (pixel.y < minY) minY = pixel.y;
						if (pixel.y > maxY) maxY = pixel.y;
					}

					const fillShape: ShapeObject = {
						id: `fill-${Date.now()}`,
						type: "rect",
						x: minX,
						y: minY,
						width: Math.max(1, maxX - minX),
						height: Math.max(1, maxY - minY),
						fill: replacementColor,
						layerId: activeLayerId || undefined,
					};

					setShapes((prev) => [...prev, fillShape]);
					saveCanvasState("Fill applied");
					toast.success(`Area filled with ${replacementColor}`);
				}
			}

			return true;
		},
		[brushSettings.tolerance, activeLayerId, saveCanvasState],
	);

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
				stroke: "none",
				strokeWidth: 0,
				layerId: activeLayerId || undefined,
			};

			setShapes((prev) => [...prev, healedShape]);
			saveCanvasState("Healing applied");
			toast.success("Area healed");
		},
		[healingData, brushSettings.size, activeLayerId, saveCanvasState],
	);

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
			const diameter = radius * 2 + 1;

			for (let pass = 0; pass < 2; pass++) {
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

								if (pass === 0) {
									r += targetImageData.data[idx];
									g += targetImageData.data[idx + 1];
									b += targetImageData.data[idx + 2];
									a += targetImageData.data[idx + 3];
								} else {
									r += blurredData.data[idx];
									g += blurredData.data[idx + 1];
									b += blurredData.data[idx + 2];
									a += blurredData.data[idx + 3];
								}
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
				stroke: "none",
				strokeWidth: 0,
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

	const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
		const stage = stageRef.current;
		if (!stage) return;

		const pos = stage.getPointerPosition();
		if (!pos) return;

		const transformedPos = {
			x: pos.x / (zoom / 100) - panOffset.x,
			y: pos.y / (zoom / 100) - panOffset.y,
		};

		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur"];
		const selectionTools = ["select", "move"];
		const shapeTools = ["rectangle", "ellipse", "line"];

		// DÔLEŽITÉ: Kresliace nástroje majú prioritu
		if (drawingTools.includes(activeTool)) {
			// Zabrániť výberu objektu, keď kreslíme
			e.evt.preventDefault();
			setIsDrawing(true);

			if (activeTool === "healing") {
				updateHealingData();

				if (e.evt.altKey) {
					setHealingData((prev) => ({
						...prev,
						sourceX: transformedPos.x,
						sourceY: transformedPos.y,
						isActive: true,
						brushSize: brushSettings.size,
					}));
					setHealingSource({ x: transformedPos.x, y: transformedPos.y });
					toast.success("Healing source set (click to heal)");
					return;
				} else {
					if (!healingData.isActive) {
						toast.error("Alt+click to set healing source first");
						return;
					}
					applyHealingBrush(transformedPos.x, transformedPos.y);
					return;
				}
			}

			if (activeTool === "blur") {
				updateBlurData();

				applyBlurBrush(transformedPos.x, transformedPos.y);
				return;
			}

			const newLine: DrawingLine = {
				id: `line-${Date.now()}`,
				points: [transformedPos.x, transformedPos.y],
				stroke: activeTool === "eraser" ? actualBackground : primaryColor,
				strokeWidth: brushSettings.size,
				tool: activeTool as "brush" | "pencil" | "eraser" | "healing" | "blur",
				layerId: activeLayerId || undefined,
			};
			setLines([...lines, newLine]);
			return;
		}

		if (activeTool === "eyedropper" || e.evt.ctrlKey) {
			const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
			handleEyedropper(transformedPos.x, transformedPos.y, isCtrlPressed);

			if (activeTool === "eyedropper") return;
		}

		if (selectionTools.includes(activeTool)) {
			return;
		}

		if (shapeTools.includes(activeTool)) {
			shapeStartPoint.current = transformedPos;

			const newShape: ShapeObject = {
				id: `shape-${Date.now()}`,
				type:
					activeTool === "rectangle"
						? "rect"
						: activeTool === "ellipse"
							? "ellipse"
							: "line",
				x: transformedPos.x,
				y: transformedPos.y,
				width: 1,
				height: 1,
				fill: primaryColor,
				stroke: secondaryColor,
				strokeWidth: 2,
				layerId: activeLayerId || undefined,
				points:
					activeTool === "line"
						? [
								transformedPos.x,
								transformedPos.y,
								transformedPos.x,
								transformedPos.y,
							]
						: undefined,
			};
			setCurrentShape(newShape);
			return;
		}

		if (activeTool === "text") {
			const newTextShape: ShapeObject = {
				id: `text-${Date.now()}`,
				type: "text",
				x: transformedPos.x,
				y: transformedPos.y,
				text: "Type here",
				fontSize: brushSettings.size || 20,
				fill: primaryColor,
				layerId: activeLayerId || undefined,
			};
			setShapes([...shapes, newTextShape]);
			setSelectedId(newTextShape.id);
			saveCanvasState("Text added");
			toast.success("Text added - double click to edit");
			return;
		}

		if (activeTool === "fill") {
			setIsFilling(true);

			updateFloodFillData();

			if (floodFillContext.current) {
				try {
					const pixelData = floodFillContext.current.getImageData(
						Math.floor(transformedPos.x),
						Math.floor(transformedPos.y),
						1,
						1,
					).data;

					const targetColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

					const success = floodFill(
						transformedPos.x,
						transformedPos.y,
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

		if (activeTool === "gradient") {
			setIsDrawingGradient(true);
			gradientStartPoint.current = transformedPos;

			const newGradient: GradientObject = {
				id: `gradient-${Date.now()}`,
				type: brushSettings.gradientType,
				x0: transformedPos.x,
				y0: transformedPos.y,
				x1: transformedPos.x + 100,
				y1: transformedPos.y,
				colorStops: brushSettings.gradientStops.map((stop) => ({
					offset: stop.position,
					color: stop.color,
				})),
				layerId: activeLayerId || undefined,
			};

			setCurrentGradient(newGradient);
			return;
		}

		if (activeTool === "zoom") {
			if (e.evt.altKey) {
				setZoom(Math.max(10, zoom - 25));
			} else {
				setZoom(Math.min(500, zoom + 25));
			}
			return;
		}

		if (activeTool === "hand") {
			isPanning.current = true;
			lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
			return;
		}

		if (activeTool === "clone") {
			if (e.evt.altKey) {
				cloneSourcePoint.current = transformedPos;
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
		const stage = stageRef.current;
		if (!stage) return;

		const pos = stage.getPointerPosition();
		if (!pos) return;

		const transformedPos = {
			x: pos.x / (zoom / 100) - panOffset.x,
			y: pos.y / (zoom / 100) - panOffset.y,
		};

		if (isDrawing && lines.length > 0) {
			const lastLine = lines[lines.length - 1];
			const newPoints = [
				...lastLine.points,
				transformedPos.x,
				transformedPos.y,
			];

			setLines(
				lines.map((line, i) =>
					i === lines.length - 1 ? { ...line, points: newPoints } : line,
				),
			);
			return;
		}

		if (currentShape && shapeStartPoint.current) {
			const startX = shapeStartPoint.current.x;
			const startY = shapeStartPoint.current.y;

			if (currentShape.type === "rect") {
				const width = transformedPos.x - startX;
				const height = transformedPos.y - startY;

				setCurrentShape({
					...currentShape,
					x: width > 0 ? startX : transformedPos.x,
					y: height > 0 ? startY : transformedPos.y,
					width: Math.abs(width),
					height: Math.abs(height),
				});
			} else if (currentShape.type === "ellipse") {
				const radiusX = Math.abs(transformedPos.x - startX) / 2;
				const radiusY = Math.abs(transformedPos.y - startY) / 2;

				setCurrentShape({
					...currentShape,
					x: (startX + transformedPos.x) / 2,
					y: (startY + transformedPos.y) / 2,
					radiusX,
					radiusY,
				});
			} else if (currentShape.type === "line") {
				setCurrentShape({
					...currentShape,
					points: [startX, startY, transformedPos.x, transformedPos.y],
				});
			}
			return;
		}

		if (isDrawingGradient && currentGradient && gradientStartPoint.current) {
			setCurrentGradient({
				...currentGradient,
				x1: transformedPos.x,
				y1: transformedPos.y,
			});
			return;
		}

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

	const handleMouseUp = () => {
		if (isDrawing) {
			setIsDrawing(false);
			saveCanvasState("Stroke added");
			return;
		}

		if (currentShape) {
			setShapes([...shapes, currentShape]);
			setCurrentShape(null);
			shapeStartPoint.current = null;
			saveCanvasState(`${currentShape.type} created`);
			return;
		}

		if (isDrawingGradient && currentGradient) {
			addGradient(currentGradient);
			setCurrentGradient(null);
			setIsDrawingGradient(false);
			gradientStartPoint.current = null;
			saveCanvasState("Gradient added");
			toast.success("Gradient created");
			return;
		}

		if (isFilling) {
			setIsFilling(false);
		}

		if (isPanning.current) {
			isPanning.current = false;
		}
	};

	const handleWheel = useCallback(
		(e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				const delta = e.deltaY > 0 ? -10 : 10;
				setZoom(Math.max(10, Math.min(500, zoom + delta)));
			} else {
				setPanOffset({
					x: panOffset.x - e.deltaX / (zoom / 100),
					y: panOffset.y - e.deltaY / (zoom / 100),
				});
			}
		},
		[zoom, panOffset, setZoom, setPanOffset],
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [handleWheel]);

	const clearAll = useCallback(() => {
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
	}, [saveCanvasState, setHealingSource]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
				deleteSelected();
			}

			if (e.key === "Escape" && activeTool === "healing") {
				setHealingData((prev) => ({ ...prev, isActive: false }));
				setHealingSource(null);
				toast.info("Healing source cleared");
			}

			if (activeTool === "blur") {
				if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
					e.preventDefault();
					const store = useArtStudioStore.getState();
					const newIntensity = Math.max(1, brushSettings.blurIntensity - 1);
					store.setBrushSettings({ blurIntensity: newIntensity });
					toast.info(`Blur intensity: ${newIntensity}`);
				} else if (e.key === "]" && !e.ctrlKey && !e.metaKey) {
					e.preventDefault();
					const store = useArtStudioStore.getState();
					const newIntensity = Math.min(50, brushSettings.blurIntensity + 1);
					store.setBrushSettings({ blurIntensity: newIntensity });
					toast.info(`Blur intensity: ${newIntensity}`);
				}
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

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("artstudio:delete-selection", deleteSelected);
		window.addEventListener("artstudio:clear-canvas", clearAll);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("artstudio:delete-selection", deleteSelected);
			window.removeEventListener("artstudio:clear-canvas", clearAll);
		};
	}, [
		selectedId,
		shapes,
		lines,
		images,
		saveCanvasState,
		clearAll,
		activeTool,
		setHealingSource,
		brushSettings.blurIntensity,
	]);

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

	// Loading indicator
	if (isLoadingSession) {
		return (
			<div className="flex-1 flex items-center justify-center bg-canvas">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading your session...</p>
					<p className="text-xs text-gray-500 mt-2">Restoring your previous work</p>
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
			case "pen":
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

		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur"];

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

	const isLayerVisible = useCallback(
		(layerId?: string) => {
			if (!layerId) return true;
			return layers.find((l) => l.id === layerId)?.visible ?? true;
		},
		[layers],
	);

	const handleObjectClick = (id: string) => {
		const drawingTools = ["brush", "pencil", "eraser", "healing", "blur"];
		if (!drawingTools.includes(activeTool)) {
			setSelectedId(id);
		}
	};

	const drawingTools = ["brush", "pencil", "eraser", "healing", "blur"];

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
			{hasRestoredState && (
				<div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/10 text-green-600 text-xs px-3 py-1.5 rounded-full border border-green-500/20 pointer-events-none z-20 flex items-center gap-2">
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
					onClick={(e) => {
						const clickedOnEmpty =
							e.target === e.target.getStage() ||
							e.target.name() === "background";

						if (clickedOnEmpty) {
							setSelectedId(null);
						}
					}}
					onTouchStart={(e) => {
						const touch = e.evt.touches[0];
						if (touch) {
							const stage = stageRef.current;
							if (stage) {
								stage.setPointersPositions(e.evt);
							}
						}
					}}
					onTouchEnd={handleMouseUp}
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
									listening={!drawingTools.includes(activeTool)}
									onClick={() => {
										if (!drawingTools.includes(activeTool)) {
											handleObjectClick(line.id);
										}
									}}
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
										listening={!drawingTools.includes(activeTool)}
										onClick={() => {
											if (!drawingTools.includes(activeTool)) {
												handleObjectClick(gradient.id);
											}
										}}
										onTap={() => {
											if (!drawingTools.includes(activeTool)) {
												handleObjectClick(gradient.id);
											}
										}}
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
											listening={!drawingTools.includes(activeTool)}
											onClick={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
											onTap={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
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
											listening={!drawingTools.includes(activeTool)}
											onClick={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
											onTap={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
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
											listening={!drawingTools.includes(activeTool)}
											onClick={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
											onTap={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
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
											listening={!drawingTools.includes(activeTool)}
											onClick={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
											onTap={() => {
												if (!drawingTools.includes(activeTool)) {
													handleObjectClick(shape.id);
												}
											}}
											onDblClick={(e) => {
												if (drawingTools.includes(activeTool)) {
													e.cancelBubble = true;
													return;
												}

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

			{activeTool === "blur" && (
				<div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none z-10">
					<div>Blur Tool</div>
					<div className="text-gray-300">
						Size: {brushSettings.size}px | Intensity:{" "}
						{brushSettings.blurIntensity}
					</div>
					<div className="text-gray-400 text-[10px] mt-1">
						Use [ and ] to adjust intensity
					</div>
				</div>
			)}

			<canvas
				ref={(el) => {
					if (el) floodFillCanvas.current = el;
				}}
				width={actualWidth}
				height={actualHeight}
				style={{ display: "none" }}
			/>

			<canvas
				ref={(el) => {
					if (el) eyedropperCanvas.current = el;
				}}
				width={actualWidth}
				height={actualHeight}
				style={{ display: "none" }}
			/>

			<canvas
				ref={(el) => {
					if (el) healingCanvas.current = el;
				}}
				width={actualWidth}
				height={actualHeight}
				style={{ display: "none" }}
			/>

			<canvas
				ref={(el) => {
					if (el) blurCanvas.current = el;
				}}
				width={actualWidth}
				height={actualHeight}
				style={{ display: "none" }}
			/>
		</div>
	);
};