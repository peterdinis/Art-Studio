'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  TPointerEvent,
  TPointerEventInfo,
  BaseBrush,
  FabricImage as FabricImageType,
  ActiveSelection,
  Group,
  Path,
  TClassProperties,
  Pattern
} from 'fabric';
import { useArtStudioStore } from '@/stores/artStudioStore';
import { toast } from 'sonner';

// Extended type definitions for Fabric.js
type FabricObjectWithImageId = FabricObject & { imageId?: string };
type FabricBrush = BaseBrush & {
  color: string;
  width: number;
  strokeLineCap?: CanvasLineCap;
  strokeLineJoin?: CanvasLineJoin;
};

interface LoadedImage {
  id: string;
  src: string;
  name: string;
}

interface HistoryEntry {
  canvasData: string;
  thumbnail: string;
  action: string;
}

interface BrushSettings {
  size: number;
  opacity: number;
  hardness: number;
}

interface CanvasSize {
  width: number;
  height: number;
  backgroundColor: string;
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  width = 1920, 
  height = 1080,
  backgroundColor = '#2d3748'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Shape drawing state
  const isDrawingShape = useRef(false);
  const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);
  const currentShape = useRef<FabricObject | null>(null);
  
  // Panning state
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

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
    history,
    historyIndex,
    setPrimaryColor,
    undo,
    redo
  } = useArtStudioStore();

  const actualWidth = canvasSize?.width || width;
  const actualHeight = canvasSize?.height || height;
  const actualBackground = canvasSize?.backgroundColor || backgroundColor;

  // Save canvas state helper
  const saveCanvasState = useCallback((action: string) => {
    if (!fabricRef.current) return;
    try {
      const state = JSON.stringify(fabricRef.current.toJSON());
      const thumbnail = fabricRef.current.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
      addToHistory(state, thumbnail, action);
    } catch (err) {
      console.error('Failed to save canvas state:', err);
    }
  }, [addToHistory]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: actualWidth,
      height: actualHeight,
      backgroundColor: actualBackground,
      isDrawingMode: true,
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      stopContextMenu: true,
    });

    // Initialize brush
    const brush = new PencilBrush(canvas);
    brush.color = primaryColor;
    brush.width = brushSettings.size;
    canvas.freeDrawingBrush = brush;

    fabricRef.current = canvas;
    setIsReady(true);

    // Save initial state
    setTimeout(() => {
      try {
        const initialState = JSON.stringify(canvas.toJSON());
        const initialThumbnail = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
        addToHistory(initialState, initialThumbnail, 'Initial state');
      } catch (err) {
        console.error('Failed to save initial state:', err);
      }
    }, 100);

    // Save state after each drawing path
    const handlePathCreated = () => {
      try {
        const state = JSON.stringify(canvas.toJSON());
        const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
        addToHistory(state, thumbnail, 'Stroke added');
      } catch (err) {
        console.error('Failed to save path state:', err);
      }
    };
    
    // Save state after object modified
    const handleObjectModified = () => {
      try {
        const state = JSON.stringify(canvas.toJSON());
        const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
        addToHistory(state, thumbnail, 'Object modified');
      } catch (err) {
        console.error('Failed to save modified state:', err);
      }
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handleObjectModified);
      canvas.dispose();
      fabricRef.current = null;
      setIsReady(false);
    };
  }, [actualWidth, actualHeight, actualBackground, addToHistory, brushSettings.size, primaryColor]);

  // Handle tool mode changes
  useEffect(() => {
    if (!fabricRef.current || !isReady) return;

    const canvas = fabricRef.current;
    const drawingTools = ['brush', 'pencil', 'eraser'];
    const selectionTools = ['select', 'move'];
    const shapeTools = ['rectangle', 'ellipse', 'line', 'polygon', 'pen'];
    const clickTools = ['fill', 'gradient', 'eyedropper', 'text', 'zoom'];
    const panTools = ['hand'];
    
    // Reset all modes
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'default';
    
    if (drawingTools.includes(activeTool)) {
      // Drawing mode
      canvas.isDrawingMode = true;
      
      // Ensure we have a brush
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      
      // Configure brush with type safety
      const brush = canvas.freeDrawingBrush as FabricBrush;
      brush.color = activeTool === 'eraser' ? actualBackground : primaryColor;
      brush.width = brushSettings.size;
      
      if (activeTool === 'pencil') {
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
      } else if (activeTool === 'brush') {
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
      }
      
    } else if (selectionTools.includes(activeTool)) {
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
      
      if (activeTool === 'move') {
        canvas.defaultCursor = 'move';
      }
      
    } else if (shapeTools.includes(activeTool) || clickTools.includes(activeTool) || panTools.includes(activeTool)) {
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = clickTools.includes(activeTool) && activeTool !== 'fill' && activeTool !== 'gradient';
      });
    }
    
    canvas.renderAll();
  }, [activeTool, primaryColor, brushSettings.size, isReady, actualBackground]);

  // Unified mouse event handler
  useEffect(() => {
    if (!fabricRef.current || !isReady) return;
    
    const canvas = fabricRef.current;
    const shapeTools = ['rectangle', 'ellipse', 'line', 'polygon'];
    const selectionTools = ['select', 'move', 'marquee', 'lasso', 'magicwand'];
    const drawingTools = ['brush', 'pencil', 'eraser'];

    const handleMouseDown = (e: TPointerEventInfo<TPointerEvent>) => {
      if (selectionTools.includes(activeTool) || drawingTools.includes(activeTool)) {
        return;
      }
      
      const pointer = canvas.getPointer(e.e);
      if (!pointer) return;
      
      // Shape tools
      if (shapeTools.includes(activeTool)) {
        isDrawingShape.current = true;
        shapeStartPoint.current = { x: pointer.x, y: pointer.y };
        
        let shape: FabricObject | null = null;
        
        if (activeTool === 'rectangle') {
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: primaryColor,
            stroke: secondaryColor,
            strokeWidth: brushSettings.size,
            selectable: false,
            evented: false,
          });
        } else if (activeTool === 'ellipse') {
          shape = new Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: primaryColor,
            stroke: secondaryColor,
            strokeWidth: brushSettings.size,
            selectable: false,
            evented: false,
          });
        } else if (activeTool === 'line') {
          shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: primaryColor,
            strokeWidth: brushSettings.size,
            selectable: false,
            evented: false,
          });
        } else if (activeTool === 'polygon') {
          shape = new Polygon([
            { x: pointer.x, y: pointer.y },
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x + 25, y: pointer.y - 43.3 },
          ], {
            fill: primaryColor,
            stroke: secondaryColor,
            strokeWidth: brushSettings.size,
            selectable: false,
            evented: false,
          });
        }
        
        if (shape) {
          currentShape.current = shape;
          canvas.add(shape);
        }
        return;
      }
      
      // Text tool
      if (activeTool === 'text') {
        const existingText = canvas.getActiveObject();
        if (existingText instanceof IText) {
          existingText.exitEditing();
          canvas.discardActiveObject();
        }
        
        const text = new IText('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: Math.max(16, brushSettings.size * 2),
          fill: primaryColor,
          editable: true,
        });
        
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        saveCanvasState('Text added');
        return;
      }
      
      // Fill tool
      if (activeTool === 'fill') {
        const target = canvas.findTarget(e.e) as unknown as FabricObject | null;
        if (target && target.type !== 'image') {
          target.set({ fill: primaryColor });
          canvas.renderAll();
          saveCanvasState('Fill applied');
        } else {
          const bgRect = new Rect({
            left: 0,
            top: 0,
            width: actualWidth,
            height: actualHeight,
            fill: primaryColor,
            selectable: false,
            evented: false,
          });
          
          canvas.add(bgRect);
          bgRect.sendToBack();
          canvas.renderAll();
          saveCanvasState('Background filled');
        }
        return;
      }
      
      // Gradient tool
      if (activeTool === 'gradient') {
        const target = canvas.findTarget(e.e) as unknown as FabricObject | null;
        if (target) {
          const targetWidth = typeof target.width === 'number' ? target.width : 100;
          const targetHeight = typeof target.height === 'number' ? target.height : 100;
          
          const gradient = new Gradient({
            type: 'linear',
            coords: {
              x1: 0,
              y1: 0,
              x2: targetWidth,
              y2: targetHeight,
            },
            colorStops: [
              { offset: 0, color: primaryColor },
              { offset: 1, color: secondaryColor },
            ],
          });
          target.set({ fill: gradient });
          canvas.renderAll();
          saveCanvasState('Gradient applied');
        }
        return;
      }
      
      // Eyedropper tool
      if (activeTool === 'eyedropper') {
        const target = canvas.findTarget(e.e) as unknown as FabricObject | null;
        if (target) {
          let color = target.fill;
          if (typeof color === 'string') {
            setPrimaryColor(color);
            toast.success(`Color sampled: ${color}`);
          } else if (color && typeof color === 'object' && 'colorStops' in color) {
            const gradient = color as Gradient<'linear'>;
            if (gradient.colorStops && gradient.colorStops[0]) {
              setPrimaryColor(gradient.colorStops[0].color);
              toast.success(`Color sampled from gradient`);
            }
          }
        }
        return;
      }
      
      // Zoom tool
      if (activeTool === 'zoom') {
        if (e.e.altKey) {
          setZoom(Math.max(10, zoom - 25));
        } else {
          setZoom(Math.min(500, zoom + 25));
        }
        return;
      }
      
      // Hand tool (panning)
      if (activeTool === 'hand') {
        isPanning.current = true;
        const mouseEvent = e.e as MouseEvent;
        lastPanPos.current = { x: mouseEvent.clientX, y: mouseEvent.clientY };
        canvas.defaultCursor = 'grabbing';
        return;
      }
    };

    const handleMouseMove = (e: TPointerEventInfo<TPointerEvent>) => {
      if (selectionTools.includes(activeTool) || drawingTools.includes(activeTool)) {
        return;
      }
      
      const pointer = canvas.getPointer(e.e);
      if (!pointer) return;
      
      // Shape drawing
      if (isDrawingShape.current && shapeStartPoint.current && currentShape.current) {
        const startX = shapeStartPoint.current.x;
        const startY = shapeStartPoint.current.y;
        
        if (activeTool === 'rectangle') {
          const rect = currentShape.current as Rect;
          const width = pointer.x - startX;
          const height = pointer.y - startY;
          
          rect.set({
            left: width >= 0 ? startX : pointer.x,
            top: height >= 0 ? startY : pointer.y,
            width: Math.abs(width),
            height: Math.abs(height),
          });
        } else if (activeTool === 'ellipse') {
          const ellipse = currentShape.current as Ellipse;
          const rx = Math.abs(pointer.x - startX) / 2;
          const ry = Math.abs(pointer.y - startY) / 2;
          
          ellipse.set({
            rx: Math.max(1, rx),
            ry: Math.max(1, ry),
            left: startX - (rx * (pointer.x > startX ? 0 : 2)),
            top: startY - (ry * (pointer.y > startY ? 0 : 2)),
          });
        } else if (activeTool === 'line') {
          const line = currentShape.current as Line;
          line.set({ x2: pointer.x, y2: pointer.y });
        } else if (activeTool === 'polygon') {
          const polygon = currentShape.current as Polygon;
          const dx = pointer.x - startX;
          const dy = pointer.y - startY;
          const size = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          
          const points = [
            { x: startX, y: startY - size },
            { x: startX - size * 0.866, y: startY + size * 0.5 },
            { x: startX + size * 0.866, y: startY + size * 0.5 },
          ];
          polygon.set({ points });
        }
        
        canvas.requestRenderAll();
        return;
      }
      
      // Panning
      if (isPanning.current && activeTool === 'hand') {
        const mouseEvent = e.e as MouseEvent;
        const deltaX = mouseEvent.clientX - lastPanPos.current.x;
        const deltaY = mouseEvent.clientY - lastPanPos.current.y;
        
        setPanOffset({
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY,
        });
        
        lastPanPos.current = { x: mouseEvent.clientX, y: mouseEvent.clientY };
        return;
      }
    };

    const handleMouseUp = () => {
      if (selectionTools.includes(activeTool) || drawingTools.includes(activeTool)) {
        return;
      }
      
      if (isDrawingShape.current && currentShape.current) {
        const shape = currentShape.current;
        let shouldSave = true;
        
        if (shape instanceof Rect) {
          const rectWidth = shape.width || 0;
          const rectHeight = shape.height || 0;
          if (rectWidth === 0 || rectHeight === 0) {
            shouldSave = false;
            canvas.remove(shape);
          }
        } else if (shape instanceof Ellipse) {
          const ellipseRx = shape.rx || 0;
          const ellipseRy = shape.ry || 0;
          if (ellipseRx === 0 || ellipseRy === 0) {
            shouldSave = false;
            canvas.remove(shape);
          }
        } else if (shape instanceof Line) {
          const lineX1 = shape.x1 || 0;
          const lineY1 = shape.y1 || 0;
          const lineX2 = shape.x2 || 0;
          const lineY2 = shape.y2 || 0;
          if (lineX1 === lineX2 && lineY1 === lineY2) {
            shouldSave = false;
            canvas.remove(shape);
          }
        }
        
        if (shouldSave) {
          shape.set({ 
            selectable: true,
            evented: true,
          });
          shape.setCoords();
          saveCanvasState(`${activeTool} created`);
        }
      }
      
      isDrawingShape.current = false;
      shapeStartPoint.current = null;
      currentShape.current = null;
      
      if (isPanning.current) {
        isPanning.current = false;
        canvas.defaultCursor = 'grab';
      }
      
      canvas.requestRenderAll();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
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
    actualWidth, 
    actualHeight
  ]);

  // Restore canvas when history index changes
  useEffect(() => {
    if (!fabricRef.current || !isReady || historyIndex < 0) return;
    
    const entry = history[historyIndex];
    if (!entry) return;
    
    const currentState = JSON.stringify(fabricRef.current.toJSON());
    if (currentState === entry.canvasData) return;
    
    fabricRef.current.loadFromJSON(JSON.parse(entry.canvasData), () => {
      fabricRef.current?.renderAll();
    });
  }, [historyIndex, isReady, history]);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -10 : 10;
      const newZoom = Math.max(10, Math.min(500, zoom + delta));
      setZoom(newZoom);
    } else if (e.shiftKey) {
      setPanOffset({
        x: panOffset.x - e.deltaY,
        y: panOffset.y,
      });
    } else {
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY,
      });
    }
  }, [zoom, panOffset, setZoom, setPanOffset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          (fabricRef.current?.getActiveObject() instanceof IText)) {
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        
        if (e.shiftKey) {
          const entry = redo();
          if (entry && fabricRef.current) {
            fabricRef.current.loadFromJSON(JSON.parse(entry.canvasData), () => {
              fabricRef.current?.renderAll();
            });
          }
        } else {
          const entry = undo();
          if (entry && fabricRef.current) {
            fabricRef.current.loadFromJSON(JSON.parse(entry.canvasData), () => {
              fabricRef.current?.renderAll();
            });
          }
        }
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (fabricRef.current) {
          const activeObjects = fabricRef.current.getActiveObjects();
          if (activeObjects.length > 0) {
            fabricRef.current.remove(...activeObjects);
            fabricRef.current.discardActiveObject();
            fabricRef.current.requestRenderAll();
            saveCanvasState('Object deleted');
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCanvasState, undo, redo]);
  
  // Load images when added
  useEffect(() => {
    if (!fabricRef.current || !isReady || loadedImages.length === 0) return;
    
    const canvas = fabricRef.current;
    
    loadedImages.forEach(async (imageData) => {
      const existingObjects = canvas.getObjects();
      const alreadyLoaded = existingObjects.some((obj) => 
        (obj as FabricObjectWithImageId).imageId === imageData.id
      );
      if (alreadyLoaded) return;
      
      try {
        const img = await FabricImage.fromURL(imageData.src);
        
        const canvasWidth = canvas.getWidth() || 800;
        const canvasHeight = canvas.getHeight() || 600;
        const imgWidth = img.width || 100;
        const imgHeight = img.height || 100;
        
        const scale = Math.min(
          (canvasWidth * 0.8) / imgWidth,
          (canvasHeight * 0.8) / imgHeight,
          1
        );
        
        img.scale(scale);
        img.set({
          left: (canvasWidth - imgWidth * scale) / 2,
          top: (canvasHeight - imgHeight * scale) / 2,
          selectable: true,
          evented: true,
        });
        
        (img as FabricObjectWithImageId).imageId = imageData.id;
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        
        toast.success(`Image loaded: ${imageData.name}`);
        saveCanvasState('Image added');
      } catch (error) {
        console.error('Failed to load image:', error);
        toast.error(`Failed to load image: ${imageData.name}`);
      }
    });
  }, [loadedImages, isReady, saveCanvasState]);

  const getCursor = () => {
    switch (activeTool) {
      case 'brush':
      case 'pencil':
      case 'eraser':
      case 'clone':
      case 'healing':
      case 'blur':
        return 'crosshair';
      case 'hand':
        return isPanning.current ? 'grabbing' : 'grab';
      case 'eyedropper':
        return 'crosshair';
      case 'zoom':
        return 'zoom-in';
      case 'fill':
      case 'gradient':
        return 'cell';
      case 'text':
        return 'text';
      case 'rectangle':
      case 'ellipse':
      case 'polygon':
      case 'line':
      case 'pen':
        return 'crosshair';
      case 'select':
        return 'default';
      case 'move':
        return 'move';
      case 'marquee':
        return 'crosshair';
      case 'lasso':
      case 'magicwand':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ 
        flex: 1, 
        overflow: 'hidden', 
        backgroundColor: '#1a1a2e',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        cursor: getCursor()
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          backgroundImage: `
            linear-gradient(45deg, #374151 25%, transparent 25%),
            linear-gradient(-45deg, #374151 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #374151 75%),
            linear-gradient(-45deg, transparent 75%, #374151 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />
      
      <div
        style={{
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          borderRadius: '2px',
          overflow: 'hidden',
          transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
          transition: isPanning.current ? 'none' : 'transform 0.1s ease-out',
          width: actualWidth,
          height: actualHeight,
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ display: 'block' }}
          width={actualWidth}
          height={actualHeight}
        />
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        {Math.round(zoom)}%
      </div>
    </div>
  );
};