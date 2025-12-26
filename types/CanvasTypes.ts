import { BaseBrush, FabricObject, Canvas as FabricCanvas } from "fabric";

export type FabricObjectWithImageId = FabricObject & { imageId?: string };
export type FabricBrush = BaseBrush & {
	color: string;
	width: number;
	strokeLineCap?: CanvasLineCap;
	strokeLineJoin?: CanvasLineJoin;
};

export interface LoadedImage {
	id: string;
	src: string;
	name: string;
}

export interface HistoryEntry {
	canvasData: string;
	thumbnail: string;
	action: string;
}

export interface BrushSettings {
	size: number;
	opacity: number;
	hardness: number;
}

export interface CanvasSize {
	width: number;
	height: number;
	backgroundColor: string;
}

export interface DrawingCanvasProps {
	width?: number;
	height?: number;
	backgroundColor?: string;
}

export type CustomFabricCanvas = {
	getPoiner: (...args: unknown[]) => void;
} & FabricCanvas;
