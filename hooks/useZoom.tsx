"use client";

import { useCallback, useRef } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { toast } from "sonner";

export interface ZoomOptions {
	min?: number;
	max?: number;
	step?: number;
	centerOnPoint?: { x: number; y: number };
}

export const useZoom = () => {
	const {
		zoom,
		setZoom,
		setPanOffset,
		panOffset,
		showLeftPanel,
		showRightPanel,
	} = useArtStudioStore();
	const zoomHistoryRef = useRef<number[]>([100]);

	// Get canvas dimensions
	const getCanvasDimensions = useCallback(() => {
		const canvas = window.fabricCanvas || window.konvaStage;
		if (canvas) {
			return {
				width: canvas.width || 1920,
				height: canvas.height || 1080,
			};
		}
		return { width: 1920, height: 1080 };
	}, []);

	// Get viewport dimensions
	const getViewportDimensions = useCallback(() => {
		const viewportWidth =
			window.innerWidth -
			(showLeftPanel ? 56 : 0) -
			(showRightPanel ? 320 : 0) -
			100;
		const viewportHeight = window.innerHeight - 80 - 40; // Top bar + status bar
		return { width: viewportWidth, height: viewportHeight };
	}, [showLeftPanel, showRightPanel]);

	// Zoom to specific level
	const zoomTo = useCallback(
		(targetZoom: number, options: ZoomOptions = {}) => {
			const { min = 10, max = 500, centerOnPoint } = options;
			const newZoom = Math.max(min, Math.min(max, targetZoom));

			if (centerOnPoint) {
				// Zoom to specific point (use provided point from click/wheel)
				const pointer = centerOnPoint;
				const oldScale = zoom / 100;
				const mousePointTo = {
					x: (pointer.x - panOffset.x) / oldScale,
					y: (pointer.y - panOffset.y) / oldScale,
				};

				const newPos = {
					x: pointer.x - mousePointTo.x * (newZoom / 100),
					y: pointer.y - mousePointTo.y * (newZoom / 100),
				};

				setZoom(newZoom);
				setPanOffset(newPos);
				zoomHistoryRef.current.push(newZoom);
				if (zoomHistoryRef.current.length > 10) {
					zoomHistoryRef.current.shift();
				}
				return;
			}

			setZoom(newZoom);
			zoomHistoryRef.current.push(newZoom);
			if (zoomHistoryRef.current.length > 10) {
				zoomHistoryRef.current.shift();
			}
		},
		[zoom, panOffset, setZoom, setPanOffset],
	);

	// Zoom in
	const zoomIn = useCallback(
		(step: number = 25, options: ZoomOptions = {}) => {
			const newZoom = Math.min(options.max || 500, zoom + step);
			zoomTo(newZoom, options);
			toast.info(`Zoom: ${Math.round(newZoom)}%`);
		},
		[zoom, zoomTo],
	);

	// Zoom out
	const zoomOut = useCallback(
		(step: number = 25, options: ZoomOptions = {}) => {
			const newZoom = Math.max(options.min || 10, zoom - step);
			zoomTo(newZoom, options);
			toast.info(`Zoom: ${Math.round(newZoom)}%`);
		},
		[zoom, zoomTo],
	);

	// Zoom to fit screen
	const zoomToFit = useCallback(
		(options: { maxZoom?: number } = {}) => {
			const canvas = getCanvasDimensions();
			const viewport = getViewportDimensions();

			const zoomX = (viewport.width / canvas.width) * 100;
			const zoomY = (viewport.height / canvas.height) * 100;
			const fitZoom = Math.min(zoomX, zoomY, options.maxZoom || 100);

			const newZoom = Math.max(10, Math.min(100, fitZoom));
			setZoom(newZoom);
			setPanOffset({ x: 0, y: 0 });
			zoomHistoryRef.current.push(newZoom);
			toast.success("Canvas fitted to screen");
		},
		[getCanvasDimensions, getViewportDimensions, setZoom, setPanOffset],
	);

	// Zoom to actual size (100%)
	const zoomToActualSize = useCallback(() => {
		setZoom(100);
		setPanOffset({ x: 0, y: 0 });
		zoomHistoryRef.current.push(100);
		toast.success("Zoom reset to 100%");
	}, [setZoom, setPanOffset]);

	// Zoom to selection (if available)
	const zoomToSelection = useCallback(() => {
		const canvas = window.fabricCanvas || window.konvaStage;
		if (!canvas) return;

		// Try to get selection bounds
		let bounds: { x: number; y: number; width: number; height: number } | null =
			null;

		if ("getActiveObject" in canvas) {
			// Fabric.js
			const activeObject = (canvas as any).getActiveObject();
			if (activeObject) {
				const objBounds = activeObject.getBoundingRect();
				bounds = {
					x: objBounds.left,
					y: objBounds.top,
					width: objBounds.width,
					height: objBounds.height,
				};
			}
		} else if ("getPointerPosition" in canvas) {
			// Konva.js - would need selection bounds from store
			const store = useArtStudioStore.getState();
			bounds = store.selectionBounds;
		}

		if (bounds && bounds.width > 0 && bounds.height > 0) {
			const viewport = getViewportDimensions();
			const padding = 50; // Padding around selection

			const zoomX = ((viewport.width - padding * 2) / bounds.width) * 100;
			const zoomY = ((viewport.height - padding * 2) / bounds.height) * 100;
			const fitZoom = Math.min(zoomX, zoomY, 500);

			const newZoom = Math.max(10, Math.min(500, fitZoom));
			const centerX = bounds.x + bounds.width / 2;
			const centerY = bounds.y + bounds.height / 2;

			// Center the selection
			const newPanX = viewport.width / 2 - centerX * (newZoom / 100);
			const newPanY = viewport.height / 2 - centerY * (newZoom / 100);

			setZoom(newZoom);
			setPanOffset({ x: newPanX, y: newPanY });
			zoomHistoryRef.current.push(newZoom);
			toast.success("Zoomed to selection");
		} else {
			toast.info("No selection to zoom to");
		}
	}, [getViewportDimensions, setZoom, setPanOffset]);

	// Zoom with mouse wheel
	const zoomWithWheel = useCallback(
		(
			delta: number,
			point: { x: number; y: number },
			options: ZoomOptions = {},
		) => {
			// Use exponential zoom for smoother experience
			const zoomSpeed = options.step || 0.1;
			const zoomFactor = delta > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
			const newZoom = Math.max(
				options.min || 10,
				Math.min(options.max || 500, zoom * zoomFactor),
			);

			// Zoom to mouse point (center zoom on cursor position)
			const canvas = window.fabricCanvas || window.konvaStage;
			if (canvas) {
				if ("getPointerPosition" in canvas) {
					// Konva.js - zoom to point
					const stage = canvas as any;
					const oldScale = zoom / 100;

					// Get current stage position
					const stageX = stage.x() || panOffset.x;
					const stageY = stage.y() || panOffset.y;

					// Convert screen point to canvas coordinates
					const mousePointTo = {
						x: (point.x - stageX) / oldScale,
						y: (point.y - stageY) / oldScale,
					};

					// Calculate new pan offset to keep point under cursor
					const newPos = {
						x: point.x - mousePointTo.x * (newZoom / 100),
						y: point.y - mousePointTo.y * (newZoom / 100),
					};

					setZoom(newZoom);
					setPanOffset(newPos);
				} else {
					// Fabric.js - simpler zoom (could be enhanced)
					setZoom(newZoom);
				}
			} else {
				setZoom(newZoom);
			}
		},
		[zoom, panOffset, setZoom, setPanOffset],
	);

	// Undo zoom (restore previous zoom level from history)
	const zoomBack = useCallback(() => {
		const history = zoomHistoryRef.current;
		if (history.length > 1) {
			history.pop();
			const previousZoom = history[history.length - 1];
			setZoom(previousZoom);
			toast.info(`Zoom: ${Math.round(previousZoom)}%`);
		} else {
			toast.info("No previous zoom level");
		}
	}, [setZoom]);

	// Reset zoom history
	const resetZoomHistory = useCallback(() => {
		zoomHistoryRef.current = [zoom];
	}, [zoom]);

	// Get zoom percentage
	const getZoomPercentage = useCallback(() => {
		return Math.round(zoom);
	}, [zoom]);

	// Check if zoom is at min/max
	const isAtMinZoom = useCallback(() => {
		return zoom <= 10;
	}, [zoom]);

	const isAtMaxZoom = useCallback(() => {
		return zoom >= 500;
	}, [zoom]);

	return {
		zoom,
		zoomPercentage: getZoomPercentage(),
		zoomTo,
		zoomIn,
		zoomOut,
		zoomBack,
		zoomToFit,
		zoomToActualSize,
		zoomToSelection,
		zoomWithWheel,
		resetZoomHistory,
		isAtMinZoom,
		isAtMaxZoom,
		getCanvasDimensions,
		getViewportDimensions,
	};
};
