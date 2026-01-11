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

// Healing brush data structure
interface HealingData {
  sourceX: number;
  sourceY: number;
  isActive: boolean;
  brushSize: number;
}

// Blur tool data structure
interface BlurData {
  isActive: boolean;
  brushSize: number;
  intensity: number;
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

  // Shape drawing state
  const [currentShape, setCurrentShape] = useState<ShapeObject | null>(null);
  const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);

  // Panning state
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  // Clone tool state
  const cloneSourcePoint = useRef<{ x: number; y: number } | null>(null);

  // Healing brush state
  const [healingData, setHealingData] = useState<HealingData>({
    sourceX: 0,
    sourceY: 0,
    isActive: false,
    brushSize: 20,
  });
  const [isHealing, setIsHealing] = useState(false);
  const healingCanvas = useRef<HTMLCanvasElement | null>(null);
  const healingContext = useRef<CanvasRenderingContext2D | null>(null);

  // Blur tool state
  const [blurData, setBlurData] = useState<BlurData>({
    isActive: false,
    brushSize: 20,
    intensity: 10,
  });
  const [isBlurring, setIsBlurring] = useState(false);
  const blurCanvas = useRef<HTMLCanvasElement | null>(null);
  const blurContext = useRef<CanvasRenderingContext2D | null>(null);

  // Flood fill state
  const floodFillImageData = useRef<ImageData | null>(null);
  const floodFillCanvas = useRef<HTMLCanvasElement | null>(null);
  const floodFillContext = useRef<CanvasRenderingContext2D | null>(null);

  // Eyedropper state
  const eyedropperCanvas = useRef<HTMLCanvasElement | null>(null);
  const eyedropperContext = useRef<CanvasRenderingContext2D | null>(null);

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
    healingSource,
    setHealingSource,
  } = useArtStudioStore();

  const actualWidth = canvasSize?.width || width;
  const actualHeight = canvasSize?.height || height;
  const actualBackground = canvasSize?.backgroundColor || backgroundColor;

  // Expose stage to window for menu bar access
  useEffect(() => {
    if (stageRef.current) {
      (window as any).konvaStage = stageRef.current;
    }
    return () => {
      delete (window as any).konvaStage;
    };
  }, []);

  // Initialize flood fill canvas
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

  // Initialize eyedropper canvas
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

  // Initialize healing canvas
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

  // Initialize blur canvas
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

  // Update canvas data for eyedropper
  const updateEyedropperData = useCallback(() => {
    if (!stageRef.current || !eyedropperContext.current) return;

    const stage = stageRef.current;
    const tempCanvas = stage.toCanvas();
    const ctx = eyedropperContext.current;
    ctx.clearRect(0, 0, actualWidth, actualHeight);

    // Fill with background first
    ctx.fillStyle = actualBackground;
    ctx.fillRect(0, 0, actualWidth, actualHeight);

    // Draw the stage
    ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
  }, [actualWidth, actualHeight, actualBackground]);

  // Update flood fill image data when canvas changes
  const updateFloodFillData = useCallback(() => {
    if (!stageRef.current || !floodFillContext.current) return;

    const stage = stageRef.current;
    const tempCanvas = stage.toCanvas();
    const ctx = floodFillContext.current;
    ctx.clearRect(0, 0, actualWidth, actualHeight);

    // Fill with background first
    ctx.fillStyle = actualBackground;
    ctx.fillRect(0, 0, actualWidth, actualHeight);

    // Draw the stage
    ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);

    // Get image data for flood fill
    floodFillImageData.current = ctx.getImageData(
      0,
      0,
      actualWidth,
      actualHeight,
    );
  }, [actualWidth, actualHeight, actualBackground]);

  // Update healing canvas data
  const updateHealingData = useCallback(() => {
    if (!stageRef.current || !healingContext.current) return;

    const stage = stageRef.current;
    const tempCanvas = stage.toCanvas();
    const ctx = healingContext.current;
    
    // Fill with background first
    ctx.fillStyle = actualBackground;
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    
    // Draw the stage
    ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
  }, [actualWidth, actualHeight, actualBackground]);

  // Update blur canvas data
  const updateBlurData = useCallback(() => {
    if (!stageRef.current || !blurContext.current) return;

    const stage = stageRef.current;
    const tempCanvas = stage.toCanvas();
    const ctx = blurContext.current;
    
    // Fill with background first
    ctx.fillStyle = actualBackground;
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    
    // Draw the stage
    ctx.drawImage(tempCanvas, 0, 0, actualWidth, actualHeight);
  }, [actualWidth, actualHeight, actualBackground]);

  // Save canvas state
  const saveCanvasState = useCallback(
    (action: string) => {
      if (!stageRef.current) return;
      try {
        const state = JSON.stringify({
          lines,
          shapes,
          images: images.map((img) => ({ ...img })),
          gradients,
          healingData,
          blurData,
        });
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 0.2 });
        addToHistory(state, dataURL, action);
      } catch (err) {
        console.error("Failed to save canvas state:", err);
      }
    },
    [lines, shapes, images, gradients, healingData, blurData, addToHistory],
  );

  // Handle transformer updates
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

  // Handle stage click for selection
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.name() === "background";

    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Funkce pro konverzi různých formátů barev na RGB
  const parseColorToRgb = (color: string) => {
    // Pokud je to HEX (#ffffff nebo #fff)
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

    // Pokud je to rgb(r, g, b)
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

    // Pokud je to rgba(r, g, b, a)
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

    // Fallback - černá barva
    return { r: 0, g: 0, b: 0 };
  };

  // Funkce pro získání barvy z pixelu na canvasu
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
        // Pokud je pixel transparentní, vrátíme background barvu
        return actualBackground;
      }

      // Konvertuj RGB na HEX
      const r = pixelData[0].toString(16).padStart(2, "0");
      const g = pixelData[1].toString(16).padStart(2, "0");
      const b = pixelData[2].toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    },
    [actualBackground],
  );

  // Eyedropper funkce
  const handleEyedropper = useCallback(
    (x: number, y: number, isCtrlPressed: boolean = false) => {
      // Aktualizuj data pro eyedropper
      updateEyedropperData();

      const color = getColorFromCanvas(x, y);
      if (color) {
        if (isCtrlPressed || activeTool === "eyedropper") {
          // Ctrl+click nebo kliknutí při aktivním eyedropper toolu nastaví secondary color
          setSecondaryColor(color);
          toast.success(`Secondary color set to ${color}`);
        } else {
          // Normální kliknutí při aktivním eyedropper toolu nastaví primary color
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

  // Flood fill function (queue-based algorithm)
  const floodFill = useCallback(
    (
      startX: number,
      startY: number,
      targetColor: string, // rgb(r, g, b) formát
      replacementColor: string, // HEX formát
      tolerance: number = brushSettings.tolerance,
    ) => {
      if (!floodFillImageData.current || !floodFillContext.current) {
        console.error("Flood fill data not initialized");
        return false;
      }

      const imageData = floodFillImageData.current;
      const width = imageData.width;
      const height = imageData.height;

      // Konvertuj barvy na RGB
      const targetRgb = parseColorToRgb(targetColor);
      const replacementRgb = parseColorToRgb(replacementColor);

      // Clamp coordinates
      const x = Math.floor(Math.max(0, Math.min(width - 1, startX)));
      const y = Math.floor(Math.max(0, Math.min(height - 1, startY)));

      // Get starting pixel index
      const startIndex = (y * width + x) * 4;

      // Get starting color z imageData
      const startR = imageData.data[startIndex];
      const startG = imageData.data[startIndex + 1];
      const startB = imageData.data[startIndex + 2];
      const startA = imageData.data[startIndex + 3];

      // Check if we're trying to fill with the same color
      const colorDistance = Math.sqrt(
        Math.pow(startR - replacementRgb.r, 2) +
          Math.pow(startG - replacementRgb.g, 2) +
          Math.pow(startB - replacementRgb.b, 2),
      );

      if (colorDistance <= tolerance) {
        console.log("Same color, no fill needed");
        return false;
      }

      // Create visited array
      const visited = new Uint8Array(width * height);

      // Initialize queue
      const queue: FloodFillPoint[] = [];
      queue.push({ x, y });
      visited[y * width + x] = 1;

      // Process queue
      const processedPixels: FloodFillPoint[] = [];

      while (queue.length > 0) {
        const point = queue.shift()!;
        const px = point.x;
        const py = point.y;

        // Add to processed pixels
        processedPixels.push({ x: px, y: py });

        // Check 4 directions
        const directions = [
          { dx: 1, dy: 0 }, // right
          { dx: -1, dy: 0 }, // left
          { dx: 0, dy: 1 }, // down
          { dx: 0, dy: -1 }, // up
        ];

        for (const dir of directions) {
          const nx = px + dir.dx;
          const ny = py + dir.dy;

          // Check bounds
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            continue;
          }

          // Check if visited
          if (visited[ny * width + nx]) {
            continue;
          }

          // Get pixel color
          const index = (ny * width + nx) * 4;
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          const a = imageData.data[index + 3];

          // Check if pixel matches target color within tolerance
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

      // If no pixels to fill, return
      if (processedPixels.length === 0) {
        return false;
      }

      // Apply fill to image data
      for (const pixel of processedPixels) {
        const index = (pixel.y * width + pixel.x) * 4;
        imageData.data[index] = replacementRgb.r;
        imageData.data[index + 1] = replacementRgb.g;
        imageData.data[index + 2] = replacementRgb.b;
        // Keep alpha as is
      }

      // Update canvas
      if (floodFillContext.current) {
        floodFillContext.current.putImageData(imageData, 0, 0);

        // Create a new Konva image from the filled area
        const tempCanvas = floodFillCanvas.current;
        if (tempCanvas) {
          // Vytvoř nový tvar pro vyplněnou oblast
          // Calculate bounds of filled area
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

          // Přidej rectangle pro vyplněnou oblast
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

  // Healing brush function
  const applyHealingBrush = useCallback(
    (targetX: number, targetY: number) => {
      if (!healingContext.current || !healingData.isActive) {
        toast.error("Set healing source first (Alt+click)");
        return;
      }

      const brushSize = brushSettings.size;
      const halfSize = Math.floor(brushSize / 2);

      // Get source area coordinates
      const sourceX = healingData.sourceX;
      const sourceY = healingData.sourceY;

      // Get source area image data
      const sourceImageData = healingContext.current.getImageData(
        Math.max(0, sourceX - halfSize),
        Math.max(0, sourceY - halfSize),
        brushSize,
        brushSize
      );

      // Get target area image data
      const targetImageData = healingContext.current.getImageData(
        Math.max(0, targetX - halfSize),
        Math.max(0, targetY - halfSize),
        brushSize,
        brushSize
      );

      // Simple healing algorithm - blend source into target
      for (let i = 0; i < targetImageData.data.length; i += 4) {
        const sourceIdx = i;
        
        // Get source pixel values
        const sr = sourceImageData.data[sourceIdx];
        const sg = sourceImageData.data[sourceIdx + 1];
        const sb = sourceImageData.data[sourceIdx + 2];
        const sa = sourceImageData.data[sourceIdx + 3];
        
        // Get target pixel values
        const tr = targetImageData.data[i];
        const tg = targetImageData.data[i + 1];
        const tb = targetImageData.data[i + 2];
        const ta = targetImageData.data[i + 3];

        // Simple blending - average of source and target
        if (sa > 0 && ta > 0) {
          const blendFactor = 0.7; // How much to use from source
          
          targetImageData.data[i] = Math.round(
            tr * (1 - blendFactor) + sr * blendFactor
          );
          targetImageData.data[i + 1] = Math.round(
            tg * (1 - blendFactor) + sg * blendFactor
          );
          targetImageData.data[i + 2] = Math.round(
            tb * (1 - blendFactor) + sb * blendFactor
          );
          // Alpha remains from target
        } else if (sa > 0) {
          // If target is transparent, use source
          targetImageData.data[i] = sr;
          targetImageData.data[i + 1] = sg;
          targetImageData.data[i + 2] = sb;
          targetImageData.data[i + 3] = sa;
        }
      }

      // Apply the healed pixels back to canvas
      healingContext.current.putImageData(
        targetImageData,
        Math.max(0, targetX - halfSize),
        Math.max(0, targetY - halfSize)
      );

      // Create a shape for the healed area
      const healedShape: ShapeObject = {
        id: `healed-${Date.now()}`,
        type: "rect",
        x: Math.max(0, targetX - halfSize),
        y: Math.max(0, targetY - halfSize),
        width: brushSize,
        height: brushSize,
        fill: `rgba(255, 255, 255, 0.3)`, // Semi-transparent
        stroke: "none",
        strokeWidth: 0,
        layerId: activeLayerId || undefined,
      };

      setShapes((prev) => [...prev, healedShape]);
      saveCanvasState("Healing applied");
      toast.success("Area healed");
    },
    [healingData, brushSettings.size, activeLayerId, saveCanvasState]
  );

  // Blur tool function (Gaussian blur)
  const applyBlurBrush = useCallback(
    (targetX: number, targetY: number) => {
      if (!blurContext.current) {
        toast.error("Blur context not available");
        return;
      }

      const brushSize = brushSettings.size;
      const intensity = brushSettings.blurIntensity;
      const halfSize = Math.floor(brushSize / 2);

      // Get target area image data
      const targetImageData = blurContext.current.getImageData(
        Math.max(0, targetX - halfSize),
        Math.max(0, targetY - halfSize),
        brushSize,
        brushSize
      );

      // Create a copy for blurred result
      const blurredData = new ImageData(
        new Uint8ClampedArray(targetImageData.data),
        targetImageData.width,
        targetImageData.height
      );

      // Simple box blur algorithm
      const radius = Math.floor(intensity / 2);
      const diameter = radius * 2 + 1;
      const weight = 1.0 / (diameter * diameter);

      // Apply blur in two passes (horizontal and vertical)
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < brushSize; y++) {
          for (let x = 0; x < brushSize; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;

            // Apply box blur kernel
            for (let ky = -radius; ky <= radius; ky++) {
              const ny = y + ky;
              if (ny < 0 || ny >= brushSize) continue;

              for (let kx = -radius; kx <= radius; kx++) {
                const nx = x + kx;
                if (nx < 0 || nx >= brushSize) continue;

                const idx = (ny * brushSize + nx) * 4;
                
                if (pass === 0) {
                  // First pass - use original data
                  r += targetImageData.data[idx];
                  g += targetImageData.data[idx + 1];
                  b += targetImageData.data[idx + 2];
                  a += targetImageData.data[idx + 3];
                } else {
                  // Second pass - use blurred data from first pass
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

      // Apply the blurred pixels back to canvas
      blurContext.current.putImageData(
        blurredData,
        Math.max(0, targetX - halfSize),
        Math.max(0, targetY - halfSize)
      );

      // Create a shape for the blurred area
      const blurredShape: ShapeObject = {
        id: `blurred-${Date.now()}`,
        type: "rect",
        x: Math.max(0, targetX - halfSize),
        y: Math.max(0, targetY - halfSize),
        width: brushSize,
        height: brushSize,
        fill: `rgba(128, 128, 128, 0.1)`, // Very transparent gray for visual feedback
        stroke: "none",
        strokeWidth: 0,
        layerId: activeLayerId || undefined,
      };

      setShapes((prev) => [...prev, blurredShape]);
      saveCanvasState("Blur applied");
      toast.success(`Area blurred (intensity: ${intensity})`);
    },
    [brushSettings.size, brushSettings.blurIntensity, activeLayerId, saveCanvasState]
  );

  // Handle mouse down
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Transform pointer based on zoom
    const transformedPos = {
      x: pos.x / (zoom / 100) - panOffset.x,
      y: pos.y / (zoom / 100) - panOffset.y,
    };

    const drawingTools = ["brush", "pencil", "eraser", "healing", "blur"];
    const selectionTools = ["select", "move"];
    const shapeTools = ["rectangle", "ellipse", "line"];

    // Eyedropper tool - priorita
    if (activeTool === "eyedropper" || e.evt.ctrlKey) {
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      handleEyedropper(transformedPos.x, transformedPos.y, isCtrlPressed);

      // Pokud je aktivní eyedropper tool, nechceme dělat nic jiného
      if (activeTool === "eyedropper") return;
    }

    // Drawing tools
    if (drawingTools.includes(activeTool)) {
      setIsDrawing(true);
      
      if (activeTool === "healing") {
        // Healing brush logic
        updateHealingData();
        
        if (e.evt.altKey) {
          // Set healing source
          setHealingData(prev => ({
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
          // Apply healing
          if (!healingData.isActive) {
            toast.error("Alt+click to set healing source first");
            return;
          }
          applyHealingBrush(transformedPos.x, transformedPos.y);
          return;
        }
      }

      if (activeTool === "blur") {
        // Blur tool logic
        updateBlurData();
        
        // Apply blur
        applyBlurBrush(transformedPos.x, transformedPos.y);
        return;
      }
      
      // Regular drawing tools
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

    // Selection tools - handled by Konva's built-in selection
    if (selectionTools.includes(activeTool)) {
      return;
    }

    // Shape tools
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

    // Text tool
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

    // Fill tool
    if (activeTool === "fill") {
      setIsFilling(true);

      // First, update the flood fill data from current canvas
      updateFloodFillData();

      // Get color at clicked position
      if (floodFillContext.current) {
        try {
          const pixelData = floodFillContext.current.getImageData(
            Math.floor(transformedPos.x),
            Math.floor(transformedPos.y),
            1,
            1,
          ).data;

          const targetColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

          // Perform flood fill
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

    // Gradient tool
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

    // Zoom tool
    if (activeTool === "zoom") {
      if (e.evt.altKey) {
        setZoom(Math.max(10, zoom - 25));
      } else {
        setZoom(Math.min(500, zoom + 25));
      }
      return;
    }

    // Hand tool
    if (activeTool === "hand") {
      isPanning.current = true;
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    // Clone tool
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

  // Handle mouse move
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const transformedPos = {
      x: pos.x / (zoom / 100) - panOffset.x,
      y: pos.y / (zoom / 100) - panOffset.y,
    };

    // Drawing
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

    // Shape drawing
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

    // Gradient drawing
    if (isDrawingGradient && currentGradient && gradientStartPoint.current) {
      setCurrentGradient({
        ...currentGradient,
        x1: transformedPos.x,
        y1: transformedPos.y,
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

  // Handle mouse up
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
      // Flood fill already saved in the floodFill function
    }

    if (isPanning.current) {
      isPanning.current = false;
    }
  };

  // Handle wheel for zoom
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

  // Funkce pro vymazání všeho na plátně
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

  // Handle keyboard shortcuts and global actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // Delete selected
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteSelected();
      }

      // Reset healing source
      if (e.key === "Escape" && activeTool === "healing") {
        setHealingData(prev => ({ ...prev, isActive: false }));
        setHealingSource(null);
        toast.info("Healing source cleared");
      }

      // Adjust blur intensity with [ and ]
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

    // Restore history from undo/redo
    const handleRestoreHistory = (e: CustomEvent) => {
      if (e.detail?.canvasData) {
        try {
          const state = JSON.parse(e.detail.canvasData);
          if (state.lines) setLines(state.lines);
          if (state.shapes) setShapes(state.shapes);
          if (state.images) setImages(state.images);
          if (state.healingData) setHealingData(state.healingData);
          if (state.blurData) setBlurData(state.blurData);
          // Gradients are stored in currentGradient, not a separate array
          toast.success("History restored");
        } catch (error) {
          console.error("Failed to restore history:", error);
          toast.error("Failed to restore history");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("artstudio:delete-selection", deleteSelected);
    window.addEventListener("artstudio:clear-canvas", clearAll);
    window.addEventListener(
      "artstudio:restore-history",
      handleRestoreHistory as EventListener,
    );
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("artstudio:delete-selection", deleteSelected);
      window.removeEventListener("artstudio:clear-canvas", clearAll);
      window.removeEventListener(
        "artstudio:restore-history",
        handleRestoreHistory as EventListener,
      );
    };
  }, [selectedId, shapes, lines, images, saveCanvasState, clearAll, activeTool, setHealingSource, brushSettings.blurIntensity]);

  // Load images when added
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

  // Update canvas data when needed
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
  }, [activeTool, updateFloodFillData, updateEyedropperData, updateHealingData, updateBlurData]);

  // Get cursor based on active tool
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

  // Render loaded images as Konva Images
  const ImageNode: React.FC<{ image: ImageObject }> = ({ image }) => {
    const [img, setImg] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
      const loadedImg = new window.Image();
      loadedImg.src = image.src;
      loadedImg.onload = () => setImg(loadedImg);
    }, [image.src]);

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
        onClick={() => setSelectedId(image.id)}
        onTap={() => setSelectedId(image.id)}
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

  // Helper to check if a layer is visible
  const isLayerVisible = useCallback(
    (layerId?: string) => {
      if (!layerId) return true;
      return layers.find((l) => l.id === layerId)?.visible ?? true;
    },
    [layers],
  );

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
        <Stage
          ref={stageRef}
          width={actualWidth}
          height={actualHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleStageClick}
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
            {/* Background */}
            <Rect
              name="background"
              x={0}
              y={0}
              width={actualWidth}
              height={actualHeight}
              fill={actualBackground}
            />

            {/* Drawing lines */}
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
                />
              ))}

            {/* Images */}
            {images
              .filter((img) => isLayerVisible(img.layerId))
              .map((image) => (
                <ImageNode key={image.id} image={image} />
              ))}

            {/* Gradients */}
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
                    onClick={() => setSelectedId(gradient.id)}
                    onTap={() => setSelectedId(gradient.id)}
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

            {/* Shapes */}
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
                      onClick={() => setSelectedId(shape.id)}
                      onTap={() => setSelectedId(shape.id)}
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
                      onClick={() => setSelectedId(shape.id)}
                      onTap={() => setSelectedId(shape.id)}
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
                      onClick={() => setSelectedId(shape.id)}
                      onTap={() => setSelectedId(shape.id)}
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
                      onClick={() => setSelectedId(shape.id)}
                      onTap={() => setSelectedId(shape.id)}
                      onDblClick={(e) => {
                        // Enable text editing
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

            {/* Current gradient being drawn */}
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
              />
            )}

            {/* Current shape being drawn */}
            {currentShape && currentShape.type === "rect" && (
              <Rect
                x={currentShape.x}
                y={currentShape.y}
                width={currentShape.width}
                height={currentShape.height}
                fill={currentShape.fill}
                stroke={currentShape.stroke}
                strokeWidth={currentShape.strokeWidth}
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
              />
            )}

            {currentShape && currentShape.type === "line" && (
              <Line
                points={currentShape.points || [0, 0, 0, 0]}
                stroke={currentShape.fill}
                strokeWidth={currentShape.strokeWidth}
                lineCap="round"
              />
            )}

            {/* Transformer for selection */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
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

      {/* Blur tool info */}
      {activeTool === "blur" && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none z-10">
          <div>Blur Tool</div>
          <div className="text-gray-300">
            Size: {brushSettings.size}px | Intensity: {brushSettings.blurIntensity}
          </div>
          <div className="text-gray-400 text-[10px] mt-1">
            Use [ and ] to adjust intensity
          </div>
        </div>
      )}

      {/* Hidden canvas for flood fill operations */}
      <canvas
        ref={(el) => {
          if (el) floodFillCanvas.current = el;
        }}
        width={actualWidth}
        height={actualHeight}
        style={{ display: "none" }}
      />

      {/* Hidden canvas for eyedropper operations */}
      <canvas
        ref={(el) => {
          if (el) eyedropperCanvas.current = el;
        }}
        width={actualWidth}
        height={actualHeight}
        style={{ display: "none" }}
      />

      {/* Hidden canvas for healing brush operations */}
      <canvas
        ref={(el) => {
          if (el) healingCanvas.current = el;
        }}
        width={actualWidth}
        height={actualHeight}
        style={{ display: "none" }}
      />

      {/* Hidden canvas for blur tool operations */}
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