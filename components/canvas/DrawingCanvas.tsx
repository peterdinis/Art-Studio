"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
	Canvas as FabricCanvas,
	PencilBrush,
	FabricImage,
	Rect,
	Circle,
	Line,
	Polygon,
	IText,
	FabricObject,
	Gradient,
	Ellipse,
	Path,
	Point,
	filters,
} from "fabric";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { toast } from "sonner";

interface DrawingCanvasProps {
	width?: number;
	height?: number;
	backgroundColor?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
	width = 1920,
	height = 1080,
	backgroundColor = "#2d3748",
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const fabricRef = useRef<any | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Shape drawing state
	const isDrawingShape = useRef(false);
	const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);
	const currentShape = useRef<FabricObject | null>(null);

	// Panning state
	const isPanning = useRef(false);
	const lastPanPos = useRef({ x: 0, y: 0 });

	// Clone tool state
	const cloneSourcePoint = useRef<{ x: number; y: number } | null>(null);
	const cloneStartPointer = useRef<{ x: number; y: number } | null>(null);
	const isCloning = useRef(false);
	const cloneSnapshot = useRef<HTMLCanvasElement | null>(null);

	// Selection tool state (marquee, lasso)
	const selectionPoints = useRef<{ x: number; y: number }[]>([]);
	const selectionRect = useRef<Rect | null>(null);
	const selectionPath = useRef<Path | null>(null);

	// Pen tool state
	const penPoints = useRef<{ x: number; y: number }[]>([]);
	const penPath = useRef<Path | null>(null);

	const {
		activeTool,
		primaryColor,
		secondaryColor,
		brushSettings,
		zoom,
		panOffset,
		layers,
		activeLayerId,
		setZoom,
		setPanOffset,
		addToHistory,
		canvasSize,
		loadedImages,
		history,
		historyIndex,
		setPrimaryColor,
	} = useArtStudioStore();

	const actualWidth = canvasSize?.width || width;
	const actualHeight = canvasSize?.height || height;
	const actualBackground = canvasSize?.backgroundColor || backgroundColor;

	// Save canvas state helper
	const saveCanvasState = useCallback(
		(action: string) => {
			if (!fabricRef.current) return;
			try {
				const state = JSON.stringify(fabricRef.current.toJSON());
				const thumbnail = fabricRef.current.toDataURL({
					format: "png",
					quality: 0.3,
					multiplier: 0.2,
				});
				addToHistory(state, thumbnail, action);
			} catch (err) {
				console.error("Failed to save canvas state:", err);
			}
		},
		[addToHistory],
	);

	// Initialize canvas
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = new FabricCanvas(canvasRef.current, {
			width: actualWidth,
			height: actualHeight,
			backgroundColor: actualBackground,
			isDrawingMode: true,
			selection: true,
		});

		// Initialize brush
		const brush = new PencilBrush(canvas);
		brush.color = primaryColor;
		brush.width = brushSettings.size;
		canvas.freeDrawingBrush = brush;

		fabricRef.current = canvas;
		// Expose canvas to window for menu bar access
		(window as any).fabricCanvas = canvas;
		setIsReady(true);

		// Save initial state
		setTimeout(() => {
			try {
				const initialState = JSON.stringify(canvas.toJSON());
				const initialThumbnail = canvas.toDataURL({
					format: "png",
					quality: 0.3,
					multiplier: 0.2,
				});
				addToHistory(initialState, initialThumbnail, "Initial state");
			} catch (err) {
				console.error("Failed to save initial state:", err);
			}
		}, 100);

		// Save state after each drawing path
		canvas.on("path:created", () => {
			try {
				const state = JSON.stringify(canvas.toJSON());
				const thumbnail = canvas.toDataURL({
					format: "png",
					quality: 0.3,
					multiplier: 0.2,
				});
				addToHistory(state, thumbnail, "Stroke added");
			} catch (err) {
				console.error("Failed to save path state:", err);
			}
		});

		// Save state after object modified
		canvas.on("object:modified", () => {
			try {
				const state = JSON.stringify(canvas.toJSON());
				const thumbnail = canvas.toDataURL({
					format: "png",
					quality: 0.3,
					multiplier: 0.2,
				});
				addToHistory(state, thumbnail, "Object modified");
			} catch (err) {
				console.error("Failed to save modified state:", err);
			}
		});

		return () => {
			canvas.dispose();
			fabricRef.current = null;
		};
	}, [actualWidth, actualHeight, actualBackground]);

	// Handle tool mode changes
	useEffect(() => {
		if (!fabricRef.current || !isReady) return;

		const canvas = fabricRef.current;
		const drawingTools = ["brush", "pencil", "eraser"];
		const selectionTools = ["select", "move"];
		const shapeTools = ["rectangle", "ellipse", "line", "polygon", "pen"];
		const clickTools = ["fill", "gradient", "eyedropper", "text", "zoom"];
		const panTools = ["hand"];

		// Reset all modes
		canvas.isDrawingMode = false;
		canvas.selection = false;

		if (drawingTools.includes(activeTool)) {
			// Drawing mode
			canvas.isDrawingMode = true;

			if (!canvas.freeDrawingBrush) {
				canvas.freeDrawingBrush = new PencilBrush(canvas);
			}

			canvas.freeDrawingBrush.color =
				activeTool === "eraser" ? actualBackground : primaryColor;
			canvas.freeDrawingBrush.width = brushSettings.size;

			if (activeTool === "eraser") {
				(canvas.freeDrawingBrush as any).globalCompositeOperation =
					"destination-out";
			} else {
				(canvas.freeDrawingBrush as any).globalCompositeOperation =
					"source-over";
			}
		} else if (selectionTools.includes(activeTool)) {
			// Selection mode
			canvas.selection = true;
			canvas.forEachObject((obj: { selectable: boolean; evented: boolean }) => {
				obj.selectable = true;
				obj.evented = true;
			});
		} else if (
			shapeTools.includes(activeTool) ||
			clickTools.includes(activeTool) ||
			panTools.includes(activeTool)
		) {
			// Custom tool handling - disable default modes
			canvas.selection = false;
			canvas.forEachObject((obj: { selectable: boolean; evented: boolean }) => {
				obj.selectable = false;
				obj.evented = clickTools.includes(activeTool);
			});
		}

		canvas.renderAll();
	}, [activeTool, primaryColor, brushSettings, isReady, actualBackground]);

	// Sync layers and objects visibility
	useEffect(() => {
		if (!fabricRef.current || !isReady) return;

		const canvas = fabricRef.current;
		canvas.getObjects().forEach((obj: any) => {
			const layer = layers.find((l) => l.id === obj.layerId);
			if (layer) {
				obj.visible = layer.visible;
				obj.opacity = layer.opacity / 100;
				obj.selectable = !layer.locked;
			}
		});
		canvas.renderAll();
	}, [layers, isReady]);

	// Assign layer to new objects
	useEffect(() => {
		if (!fabricRef.current || !isReady) return;

		const canvas = fabricRef.current;

		const handleObjectAdded = (e: any) => {
			const obj = e.target;
			if (obj && !obj.layerId) {
				obj.layerId = activeLayerId;
			}
		};

		canvas.on("object:added", handleObjectAdded);
		return () => {
			canvas.off("object:added", handleObjectAdded);
		};
	}, [activeLayerId, isReady]);

	// Unified mouse event handler
	useEffect(() => {
		if (!fabricRef.current || !isReady) return;

		const canvas = fabricRef.current;
		const shapeTools = ["rectangle", "ellipse", "line", "polygon"];
		const nativeSelectionTools = ["select", "move"];
		const drawingTools = ["brush", "pencil", "eraser"];
		const customSelectionTools = ["marquee", "lasso", "magicwand"];

		const handleMouseDown = (e: any) => {
			// Let Fabric.js handle native selection/move and drawing tools
			if (
				nativeSelectionTools.includes(activeTool) ||
				drawingTools.includes(activeTool)
			) {
				return;
			}

			const pointer = canvas.getScenePoint(e.e);

			// Marquee selection tool
			if (activeTool === "marquee") {
				isDrawingShape.current = true;
				shapeStartPoint.current = { x: pointer.x, y: pointer.y };

				const rect = new Rect({
					left: pointer.x,
					top: pointer.y,
					width: 1,
					height: 1,
					fill: "rgba(0, 120, 255, 0.1)",
					stroke: "#0078ff",
					strokeWidth: 1,
					strokeDashArray: [5, 5],
					selectable: false,
					evented: false,
				});

				selectionRect.current = rect;
				canvas.add(rect);
				canvas.renderAll();
				return;
			}

			// Lasso selection tool
			if (activeTool === "lasso") {
				selectionPoints.current = [{ x: pointer.x, y: pointer.y }];
				isDrawingShape.current = true;

				const pathData = `M ${pointer.x} ${pointer.y}`;
				const path = new Path(pathData, {
					fill: "rgba(0, 120, 255, 0.1)",
					stroke: "#0078ff",
					strokeWidth: 1,
					strokeDashArray: [5, 5],
					selectable: false,
					evented: false,
				});

				selectionPath.current = path;
				canvas.add(path);
				canvas.renderAll();
				return;
			}

			// Magic wand tool - select similar colored objects
			if (activeTool === "magicwand") {
				const target = canvas.findTarget(e.e);
				if (target && target.fill) {
					const targetColor =
						typeof target.fill === "string" ? target.fill : null;
					if (targetColor) {
						const similarObjects = canvas.getObjects().filter((obj: any) => {
							if (typeof obj.fill === "string") {
								return obj.fill === targetColor;
							}
							return false;
						});

						if (similarObjects.length > 0) {
							canvas.discardActiveObject();
							const selection = new (canvas as any).ActiveSelection(
								similarObjects,
								{ canvas },
							);
							canvas.setActiveObject(selection);
							canvas.renderAll();
							toast.success(
								`Selected ${similarObjects.length} similar objects`,
							);
						}
					}
				}
				return;
			}

			// Clone stamp tool - Alt+click to set source, click to paint
			if (activeTool === "clone") {
				if (e.e.altKey) {
					cloneSourcePoint.current = { x: pointer.x, y: pointer.y };
					toast.success("Clone source set");
					return;
				}

				if (!cloneSourcePoint.current) {
					toast.error("Alt+click to set clone source first");
					return;
				}

				cloneStartPointer.current = { x: pointer.x, y: pointer.y };
				isCloning.current = true;
				// Capture a snapshot of the canvas for cloning
				cloneSnapshot.current = canvas.toCanvasElement();
				return;
			}

			// Healing brush - simplified version (copies nearby content)
			if (activeTool === "healing") {
				if (e.e.altKey) {
					cloneSourcePoint.current = { x: pointer.x, y: pointer.y };
					toast.success("Healing source set");
					return;
				}

				if (!cloneSourcePoint.current) {
					toast.error("Alt+click to set healing source first");
					return;
				}

				cloneStartPointer.current = { x: pointer.x, y: pointer.y };
				isCloning.current = true;
				// Capture a snapshot of the canvas for healing
				cloneSnapshot.current = canvas.toCanvasElement();
				return;
			}

			// Blur tool - applies blur effect to clicked object
			if (activeTool === "blur") {
				const target = canvas.findTarget(e.e);
				if (target) {
					if (target instanceof FabricImage) {
						const blurFilter = new filters.Blur({ blur: 0.1 });
						target.filters.push(blurFilter);
						target.applyFilters();
					} else {
						// For shapes, we simulate blur by creating a semi-transparent copy
						const clone = target.toObject();
						target.set({ opacity: (target.opacity || 1) * 0.8 });
					}
					canvas.renderAll();
					saveCanvasState("Blur applied");
					toast.success("Blur effect applied");
				}
				return;
			}

			// Pen tool - click to add points
			if (activeTool === "pen") {
				penPoints.current.push({ x: pointer.x, y: pointer.y });

				if (penPoints.current.length === 1) {
					// First point - create initial path
					const pathData = `M ${pointer.x} ${pointer.y}`;
					const path = new Path(pathData, {
						fill: "transparent",
						stroke: primaryColor,
						strokeWidth: brushSettings.size,
						selectable: false,
						evented: false,
					});
					penPath.current = path;
					canvas.add(path);
				} else {
					// Update path with new point
					const points = penPoints.current;
					let pathData = `M ${points[0].x} ${points[0].y}`;
					for (let i = 1; i < points.length; i++) {
						pathData += ` L ${points[i].x} ${points[i].y}`;
					}

					if (penPath.current) {
						canvas.remove(penPath.current);
					}

					const path = new Path(pathData, {
						fill: "transparent",
						stroke: primaryColor,
						strokeWidth: brushSettings.size,
						selectable: false,
						evented: false,
					});
					penPath.current = path;
					canvas.add(path);
				}

				canvas.renderAll();

				// Double click to finish
				if (e.e.detail === 2 && penPoints.current.length > 1) {
					if (penPath.current) {
						penPath.current.set({ selectable: true, evented: true });
						penPath.current.setCoords();
					}
					penPoints.current = [];
					penPath.current = null;
					saveCanvasState("Pen path created");
				}
				return;
			}

			// Shape tools
			if (shapeTools.includes(activeTool)) {
				isDrawingShape.current = true;
				shapeStartPoint.current = { x: pointer.x, y: pointer.y };

				let shape: FabricObject | null = null;

				if (activeTool === "rectangle") {
					shape = new Rect({
						left: pointer.x,
						top: pointer.y,
						width: 1,
						height: 1,
						fill: primaryColor,
						stroke: secondaryColor,
						strokeWidth: 2,
						selectable: false,
						evented: false,
					});
				} else if (activeTool === "ellipse") {
					shape = new Ellipse({
						left: pointer.x,
						top: pointer.y,
						rx: 1,
						ry: 1,
						fill: primaryColor,
						stroke: secondaryColor,
						strokeWidth: 2,
						selectable: false,
						evented: false,
					});
				} else if (activeTool === "line") {
					shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
						stroke: primaryColor,
						strokeWidth: brushSettings.size,
						selectable: false,
						evented: false,
					});
				} else if (activeTool === "polygon") {
					shape = new Polygon(
						[
							{ x: pointer.x, y: pointer.y },
							{ x: pointer.x + 1, y: pointer.y },
							{ x: pointer.x, y: pointer.y + 1 },
						],
						{
							fill: primaryColor,
							stroke: secondaryColor,
							strokeWidth: 2,
							selectable: false,
							evented: false,
						},
					);
				}

				if (shape) {
					currentShape.current = shape;
					canvas.add(shape);
					canvas.renderAll();
				}
				return;
			}

			// Text tool
			if (activeTool === "text") {
				const existingText = canvas.getActiveObject();
				if (existingText instanceof IText) return; // Don't add new text while editing

				const text = new IText("Type here", {
					left: pointer.x,
					top: pointer.y,
					fontFamily: "Arial",
					fontSize: Math.max(16, brushSettings.size * 2),
					fill: primaryColor,
					editable: true,
				});

				canvas.add(text);
				canvas.setActiveObject(text);
				text.enterEditing();
				text.selectAll();
				canvas.renderAll();
				saveCanvasState("Text added");
				return;
			}

			// Fill tool
			if (activeTool === "fill") {
				const target = canvas.findTarget(e.e);
				if (target) {
					target.set({ fill: primaryColor });
					canvas.renderAll();
					saveCanvasState("Fill applied");
				} else {
					canvas.backgroundColor = primaryColor;
					canvas.renderAll();
					saveCanvasState("Background filled");
				}
				return;
			}

			// Gradient tool
			if (activeTool === "gradient") {
				const target = canvas.findTarget(e.e);
				if (target) {
					const gradient = new Gradient({
						type: "linear",
						coords: {
							x1: 0,
							y1: 0,
							x2: target.width || 100,
							y2: target.height || 100,
						},
						colorStops: [
							{ offset: 0, color: primaryColor },
							{ offset: 1, color: secondaryColor },
						],
					});
					target.set({ fill: gradient });
					canvas.renderAll();
					saveCanvasState("Gradient applied");
				}
				return;
			}

			// Eyedropper tool
			if (activeTool === "eyedropper") {
				const target = canvas.findTarget(e.e);
				if (target && target.fill && typeof target.fill === "string") {
					setPrimaryColor(target.fill);
					toast.success(`Color sampled: ${target.fill}`);
				} else {
					const bgColor = canvas.backgroundColor;
					if (typeof bgColor === "string") {
						setPrimaryColor(bgColor);
						toast.success(`Background color sampled: ${bgColor}`);
					}
				}
				return;
			}

			// Zoom tool
			if (activeTool === "zoom") {
				if (e.e.altKey) {
					setZoom(Math.max(10, zoom - 25));
				} else {
					setZoom(Math.min(500, zoom + 25));
				}
				return;
			}

			// Hand tool (panning)
			if (activeTool === "hand") {
				isPanning.current = true;
				lastPanPos.current = { x: e.e.clientX, y: e.e.clientY };
				canvas.setCursor("grabbing");
				return;
			}
		};

		const handleMouseMove = (e: any) => {
			// Let Fabric.js handle native selection/move and drawing tools
			if (
				nativeSelectionTools.includes(activeTool) ||
				drawingTools.includes(activeTool)
			) {
				return;
			}

			const pointer = canvas.getScenePoint(e.e);

			// Marquee selection drawing
			if (
				activeTool === "marquee" &&
				isDrawingShape.current &&
				shapeStartPoint.current &&
				selectionRect.current
			) {
				const startX = shapeStartPoint.current.x;
				const startY = shapeStartPoint.current.y;
				const width = pointer.x - startX;
				const height = pointer.y - startY;

				selectionRect.current.set({
					left: width > 0 ? startX : pointer.x,
					top: height > 0 ? startY : pointer.y,
					width: Math.abs(width) || 1,
					height: Math.abs(height) || 1,
				});
				canvas.renderAll();
				return;
			}

			// Lasso selection drawing
			if (
				activeTool === "lasso" &&
				isDrawingShape.current &&
				selectionPath.current
			) {
				selectionPoints.current.push({ x: pointer.x, y: pointer.y });

				const points = selectionPoints.current;
				let pathData = `M ${points[0].x} ${points[0].y}`;
				for (let i = 1; i < points.length; i++) {
					pathData += ` L ${points[i].x} ${points[i].y}`;
				}
				pathData += " Z";

				canvas.remove(selectionPath.current);
				const path = new Path(pathData, {
					fill: "rgba(0, 120, 255, 0.1)",
					stroke: "#0078ff",
					strokeWidth: 1,
					strokeDashArray: [5, 5],
					selectable: false,
					evented: false,
				});
				selectionPath.current = path;
				canvas.add(path);
				canvas.renderAll();
				return;
			}

			// Clone/Healing brush painting
			if (
				(activeTool === "clone" || activeTool === "healing") &&
				isCloning.current &&
				cloneSourcePoint.current &&
				cloneStartPointer.current &&
				cloneSnapshot.current
			) {
				const offset = {
					x: pointer.x - cloneStartPointer.current.x,
					y: pointer.y - cloneStartPointer.current.y,
				};

				const srcX = cloneSourcePoint.current.x + offset.x;
				const srcY = cloneSourcePoint.current.y + offset.y;

				// Create a small portion of the captured canvas as a pattern or image
				import("fabric").then(({ FabricImage, Circle }) => {
					// We'll create a small circle and fill it with a pattern from the snapshot
					const size = brushSettings.size;
					const radius = size / 2;

					// Create a temporary canvas to hold the cropped source area
					const tempCanvas = document.createElement("canvas");
					tempCanvas.width = size;
					tempCanvas.height = size;
					const tempCtx = tempCanvas.getContext("2d");

					if (tempCtx && cloneSnapshot.current) {
						tempCtx.drawImage(
							cloneSnapshot.current,
							srcX - radius,
							srcY - radius,
							size,
							size,
							0,
							0,
							size,
							size,
						);

						FabricImage.fromURL(tempCanvas.toDataURL()).then((img: any) => {
							img.set({
								left: pointer.x - radius,
								top: pointer.y - radius,
								selectable: false,
								evented: false,
								layerId: activeLayerId,
							});

							if (activeTool === "healing") {
								img.set({
									opacity: 0.7,
									blur: 5,
								});
							}

							canvas.add(img);
							canvas.renderAll();
						});
					}
				});
				return;
			}

			// Shape drawing
			if (
				isDrawingShape.current &&
				shapeStartPoint.current &&
				currentShape.current
			) {
				const startX = shapeStartPoint.current.x;
				const startY = shapeStartPoint.current.y;

				if (activeTool === "rectangle") {
					const rect = currentShape.current as Rect;
					const width = pointer.x - startX;
					const height = pointer.y - startY;

					rect.set({
						left: width > 0 ? startX : pointer.x,
						top: height > 0 ? startY : pointer.y,
						width: Math.abs(width) || 1,
						height: Math.abs(height) || 1,
					});
				} else if (activeTool === "ellipse") {
					const ellipse = currentShape.current as Ellipse;
					const rx = Math.abs(pointer.x - startX) / 2;
					const ry = Math.abs(pointer.y - startY) / 2;

					ellipse.set({
						rx: rx || 1,
						ry: ry || 1,
						left: Math.min(startX, pointer.x),
						top: Math.min(startY, pointer.y),
					});
				} else if (activeTool === "line") {
					const line = currentShape.current as Line;
					line.set({ x2: pointer.x, y2: pointer.y });
				} else if (activeTool === "polygon") {
					const polygon = currentShape.current as Polygon;
					const dx = pointer.x - startX;
					const dy = pointer.y - startY;
					const size = Math.sqrt(dx * dx + dy * dy);

					if (size > 5) {
						const points = [
							{ x: startX, y: startY - size },
							{ x: startX - size * 0.866, y: startY + size * 0.5 },
							{ x: startX + size * 0.866, y: startY + size * 0.5 },
						];
						polygon.set({ points });
					}
				}

				canvas.renderAll();
				return;
			}

			// Panning
			if (isPanning.current && activeTool === "hand") {
				const deltaX = e.e.clientX - lastPanPos.current.x;
				const deltaY = e.e.clientY - lastPanPos.current.y;

				setPanOffset({
					x: panOffset.x + deltaX,
					y: panOffset.y + deltaY,
				});

				lastPanPos.current = { x: e.e.clientX, y: e.e.clientY };
				return;
			}
		};

		const handleMouseUp = () => {
			// Let Fabric.js handle native selection/move and drawing tools
			if (
				nativeSelectionTools.includes(activeTool) ||
				drawingTools.includes(activeTool)
			) {
				return;
			}

			// Finish marquee selection
			if (
				activeTool === "marquee" &&
				isDrawingShape.current &&
				selectionRect.current
			) {
				const rect = selectionRect.current;
				const bounds = rect.getBoundingRect();

				// Find objects within selection
				const objectsInSelection = canvas.getObjects().filter((obj: any) => {
					if (obj === rect) return false;
					const objBounds = obj.getBoundingRect();
					return (
						objBounds.left >= bounds.left &&
						objBounds.top >= bounds.top &&
						objBounds.left + objBounds.width <= bounds.left + bounds.width &&
						objBounds.top + objBounds.height <= bounds.top + bounds.height
					);
				});

				canvas.remove(rect);
				selectionRect.current = null;

				if (objectsInSelection.length > 0) {
					canvas.discardActiveObject();
					const selection = new (canvas as any).ActiveSelection(
						objectsInSelection,
						{ canvas },
					);
					canvas.setActiveObject(selection);
					toast.success(`Selected ${objectsInSelection.length} objects`);
				}

				isDrawingShape.current = false;
				shapeStartPoint.current = null;
				canvas.renderAll();
				return;
			}

			// Finish lasso selection
			if (
				activeTool === "lasso" &&
				isDrawingShape.current &&
				selectionPath.current
			) {
				const path = selectionPath.current;
				const bounds = path.getBoundingRect();

				// Find objects within selection bounds
				const objectsInSelection = canvas.getObjects().filter((obj: any) => {
					if (obj === path) return false;
					const objBounds = obj.getBoundingRect();
					const objCenterX = objBounds.left + objBounds.width / 2;
					const objCenterY = objBounds.top + objBounds.height / 2;

					return (
						objCenterX >= bounds.left &&
						objCenterX <= bounds.left + bounds.width &&
						objCenterY >= bounds.top &&
						objCenterY <= bounds.top + bounds.height
					);
				});

				canvas.remove(path);
				selectionPath.current = null;
				selectionPoints.current = [];

				if (objectsInSelection.length > 0) {
					canvas.discardActiveObject();
					const selection = new (canvas as any).ActiveSelection(
						objectsInSelection,
						{ canvas },
					);
					canvas.setActiveObject(selection);
					toast.success(`Selected ${objectsInSelection.length} objects`);
				}

				isDrawingShape.current = false;
				canvas.renderAll();
				return;
			}

			// Finish clone/healing
			if (
				(activeTool === "clone" || activeTool === "healing") &&
				isCloning.current
			) {
				isCloning.current = false;
				saveCanvasState(
					activeTool === "clone" ? "Clone applied" : "Healing applied",
				);
				cloneSnapshot.current = null;
				return;
			}

			// Finish shape drawing
			if (isDrawingShape.current && currentShape.current) {
				currentShape.current.set({
					selectable: true,
					evented: true,
				});
				currentShape.current.setCoords();
				saveCanvasState(`${activeTool} created`);
			}
			isDrawingShape.current = false;
			shapeStartPoint.current = null;
			currentShape.current = null;

			// Finish panning
			if (isPanning.current) {
				isPanning.current = false;
				canvas.setCursor("grab");
			}

			canvas.renderAll();
		};

		canvas.on("mouse:down", handleMouseDown);
		canvas.on("mouse:move", handleMouseMove);
		canvas.on("mouse:up", handleMouseUp);

		return () => {
			canvas.off("mouse:down", handleMouseDown);
			canvas.off("mouse:move", handleMouseMove);
			canvas.off("mouse:up", handleMouseUp);
		};
	}, [
		activeTool,
		primaryColor,
		secondaryColor,
		brushSettings.size,
		isReady,
		saveCanvasState,
		zoom,
		setZoom,
		panOffset,
		setPanOffset,
		setPrimaryColor,
	]);

	// Restore canvas when history index changes
	useEffect(() => {
		if (!fabricRef.current || !isReady || historyIndex < 0) return;

		const entry = history[historyIndex];
		if (!entry) return;

		fabricRef.current.loadFromJSON(JSON.parse(entry.canvasData)).then(() => {
			fabricRef.current?.renderAll();
		});
	}, [historyIndex, isReady]);

	// Handle zoom with mouse wheel
	const handleWheel = useCallback(
		(e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				const delta = e.deltaY > 0 ? -10 : 10;
				setZoom(Math.max(10, Math.min(500, zoom + delta)));
			} else {
				setPanOffset({
					x: panOffset.x - e.deltaX,
					y: panOffset.y - e.deltaY,
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

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if typing in text
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			// Undo/Redo
			if ((e.ctrlKey || e.metaKey) && e.key === "z") {
				e.preventDefault();
				const store = useArtStudioStore.getState();

				if (e.shiftKey) {
					const entry = store.redo();
					if (entry && fabricRef.current) {
						fabricRef.current
							.loadFromJSON(JSON.parse(entry.canvasData))
							.then(() => {
								fabricRef.current?.renderAll();
							});
					}
				} else {
					const entry = store.undo();
					if (entry && fabricRef.current) {
						fabricRef.current
							.loadFromJSON(JSON.parse(entry.canvasData))
							.then(() => {
								fabricRef.current?.renderAll();
							});
					}
				}
				return;
			}

			// Delete selected object
			if (e.key === "Delete" || e.key === "Backspace") {
				if (fabricRef.current) {
					const activeObjects = fabricRef.current.getActiveObjects();
					if (activeObjects.length > 0) {
						activeObjects.forEach((obj: any) => fabricRef.current?.remove(obj));
						fabricRef.current.discardActiveObject();
						fabricRef.current.renderAll();
						saveCanvasState("Object deleted");
					}
				}
				return;
			}

			// Open file shortcut
			if ((e.ctrlKey || e.metaKey) && e.key === "o") {
				e.preventDefault();
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.onchange = (evt) => {
					const file = (evt.target as HTMLInputElement).files?.[0];
					if (file) {
						const reader = new FileReader();
						reader.onload = (event) => {
							const result = event.target?.result as string;
							const store = useArtStudioStore.getState();
							store.addLoadedImage({
								id: `img-${Date.now()}`,
								src: result,
								name: file.name,
							});
						};
						reader.readAsDataURL(file);
					}
				};
				input.click();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [saveCanvasState]);

	// Load images when added
	useEffect(() => {
		if (!fabricRef.current || !isReady || loadedImages.length === 0) return;

		const canvas = fabricRef.current;
		const latestImage = loadedImages[loadedImages.length - 1];

		const existingObjects = canvas.getObjects();
		const alreadyLoaded = existingObjects.some(
			(obj: any) => obj.imageId === latestImage.id,
		);
		if (alreadyLoaded) return;

		FabricImage.fromURL(latestImage.src)
			.then((img) => {
				const scale = Math.min(
					(canvas.width! * 0.8) / img.width!,
					(canvas.height! * 0.8) / img.height!,
					1,
				);

				img.scale(scale);
				img.set({
					left: (canvas.width! - img.width! * scale) / 2,
					top: (canvas.height! - img.height! * scale) / 2,
				});

				(img as any).imageId = latestImage.id;

				canvas.add(img);
				canvas.setActiveObject(img);
				canvas.renderAll();

				toast.success(`Image loaded: ${latestImage.name}`);
				saveCanvasState("Image added");
			})
			.catch(() => {
				toast.error("Failed to load image");
			});
	}, [loadedImages, isReady, saveCanvasState]);

	// Get cursor based on active tool
	const getCursor = () => {
		switch (activeTool) {
			case "brush":
			case "pencil":
			case "eraser":
			case "clone":
			case "healing":
			case "blur":
				return "crosshair";
			case "hand":
				return isPanning.current ? "grabbing" : "grab";
			case "eyedropper":
				return "crosshair";
			case "zoom":
				return "zoom-in";
			case "fill":
			case "gradient":
				return "cell";
			case "text":
				return "text";
			case "rectangle":
			case "ellipse":
			case "polygon":
			case "line":
			case "pen":
				return "crosshair";
			case "select":
			case "move":
			case "marquee":
			case "lasso":
			case "magicwand":
				return "default";
			default:
				return "default";
		}
	};

	return (
		<div
			ref={containerRef}
			className="flex-1 overflow-hidden bg-canvas relative flex items-center justify-center"
			style={{ cursor: getCursor() }}
		>
			{/* Checkered background pattern */}
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

			<div
				className="relative shadow-2xl rounded-sm overflow-hidden"
				style={{
					transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
					transformOrigin: "center center",
					transition: "transform 0.1s ease-out",
				}}
			>
				<canvas ref={canvasRef} className="block" />
			</div>
		</div>
	);
};
