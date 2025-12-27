import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { useArtStudioStore } from '@/stores/artStudioStore';
import { toast } from 'sonner';

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
  tool: 'brush' | 'pencil' | 'eraser';
}

interface ShapeObject {
  id: string;
  type: 'rect' | 'ellipse' | 'circle' | 'line' | 'text';
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
}

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width = 1920,
  height = 1080,
  backgroundColor = '#2d3748'
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
  
  // Shape drawing state
  const [currentShape, setCurrentShape] = useState<ShapeObject | null>(null);
  const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);
  
  // Panning state
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  
  // Clone tool state
  const cloneSourcePoint = useRef<{ x: number; y: number } | null>(null);
  
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

  // Save canvas state
  const saveCanvasState = useCallback((action: string) => {
    if (!stageRef.current) return;
    try {
      const state = JSON.stringify({
        lines,
        shapes,
        images: images.map(img => ({ ...img })),
      });
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 0.2 });
      addToHistory(state, dataURL, action);
    } catch (err) {
      console.error('Failed to save canvas state:', err);
    }
  }, [lines, shapes, images, addToHistory]);

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
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

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

    const drawingTools = ['brush', 'pencil', 'eraser'];
    const selectionTools = ['select', 'move'];
    const shapeTools = ['rectangle', 'ellipse', 'line'];
    
    // Drawing tools
    if (drawingTools.includes(activeTool)) {
      setIsDrawing(true);
      const newLine: DrawingLine = {
        id: `line-${Date.now()}`,
        points: [transformedPos.x, transformedPos.y],
        stroke: activeTool === 'eraser' ? actualBackground : primaryColor,
        strokeWidth: brushSettings.size,
        tool: activeTool as 'brush' | 'pencil' | 'eraser',
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
        type: activeTool === 'rectangle' ? 'rect' : activeTool === 'ellipse' ? 'ellipse' : 'line',
        x: transformedPos.x,
        y: transformedPos.y,
        width: 1,
        height: 1,
        fill: primaryColor,
        stroke: secondaryColor,
        strokeWidth: 2,
        points: activeTool === 'line' ? [transformedPos.x, transformedPos.y, transformedPos.x, transformedPos.y] : undefined,
      };
      setCurrentShape(newShape);
      return;
    }
    
    // Text tool
    if (activeTool === 'text') {
      const newText: ShapeObject = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: transformedPos.x,
        y: transformedPos.y,
        text: 'Type here',
        fontSize: Math.max(16, brushSettings.size * 2),
        fill: primaryColor,
      };
      setShapes([...shapes, newText]);
      setSelectedId(newText.id);
      saveCanvasState('Text added');
      return;
    }
    
    // Fill tool
    if (activeTool === 'fill') {
      const target = e.target;
      if (target && target !== stage && target.name() !== 'background') {
        if ('fill' in target && typeof target.fill === 'function') {
          target.fill(primaryColor);
          target.getLayer()?.batchDraw();
          saveCanvasState('Fill applied');
        }
      }
      return;
    }
    
    // Eyedropper tool
    if (activeTool === 'eyedropper') {
      const target = e.target;
      if (target && target !== stage) {
        if ('fill' in target && typeof target.fill === 'function') {
          const color = target.fill() as string;
          if (color) {
            setPrimaryColor(color);
            toast.success(`Color sampled: ${color}`);
          }
        }
      }
      return;
    }
    
    // Zoom tool
    if (activeTool === 'zoom') {
      if (e.evt.altKey) {
        setZoom(Math.max(10, zoom - 25));
      } else {
        setZoom(Math.min(500, zoom + 25));
      }
      return;
    }
    
    // Hand tool
    if (activeTool === 'hand') {
      isPanning.current = true;
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }
    
    // Clone tool
    if (activeTool === 'clone') {
      if (e.evt.altKey) {
        cloneSourcePoint.current = transformedPos;
        toast.success('Clone source set');
        return;
      }
      
      if (!cloneSourcePoint.current) {
        toast.error('Alt+click to set clone source first');
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
      const newPoints = [...lastLine.points, transformedPos.x, transformedPos.y];
      
      setLines(lines.map((line, i) => 
        i === lines.length - 1 ? { ...line, points: newPoints } : line
      ));
      return;
    }
    
    // Shape drawing
    if (currentShape && shapeStartPoint.current) {
      const startX = shapeStartPoint.current.x;
      const startY = shapeStartPoint.current.y;
      
      if (currentShape.type === 'rect') {
        const width = transformedPos.x - startX;
        const height = transformedPos.y - startY;
        
        setCurrentShape({
          ...currentShape,
          x: width > 0 ? startX : transformedPos.x,
          y: height > 0 ? startY : transformedPos.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
      } else if (currentShape.type === 'ellipse') {
        const radiusX = Math.abs(transformedPos.x - startX) / 2;
        const radiusY = Math.abs(transformedPos.y - startY) / 2;
        
        setCurrentShape({
          ...currentShape,
          x: (startX + transformedPos.x) / 2,
          y: (startY + transformedPos.y) / 2,
          radiusX,
          radiusY,
        });
      } else if (currentShape.type === 'line') {
        setCurrentShape({
          ...currentShape,
          points: [startX, startY, transformedPos.x, transformedPos.y],
        });
      }
      return;
    }
    
    // Panning
    if (isPanning.current && activeTool === 'hand') {
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
      saveCanvasState('Stroke added');
      return;
    }
    
    if (currentShape) {
      setShapes([...shapes, currentShape]);
      setCurrentShape(null);
      shapeStartPoint.current = null;
      saveCanvasState(`${currentShape.type} created`);
      return;
    }
    
    if (isPanning.current) {
      isPanning.current = false;
    }
  };

  // Handle wheel for zoom
  const handleWheel = useCallback((e: WheelEvent) => {
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setShapes(shapes.filter(s => s.id !== selectedId));
        setLines(lines.filter(l => l.id !== selectedId));
        setImages(images.filter(i => i.id !== selectedId));
        setSelectedId(null);
        saveCanvasState('Object deleted');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, lines, images, saveCanvasState]);

  // Load images when added
  useEffect(() => {
    if (loadedImages.length === 0) return;
    
    const latestImage = loadedImages[loadedImages.length - 1];
    const alreadyLoaded = images.some(img => img.id === latestImage.id);
    if (alreadyLoaded) return;
    
    const img = new window.Image();
    img.src = latestImage.src;
    img.onload = () => {
      const scale = Math.min(
        (actualWidth * 0.8) / img.width,
        (actualHeight * 0.8) / img.height,
        1
      );
      
      const newImage: ImageObject = {
        id: latestImage.id,
        src: latestImage.src,
        x: (actualWidth - img.width * scale) / 2,
        y: (actualHeight - img.height * scale) / 2,
        width: img.width * scale,
        height: img.height * scale,
      };
      
      setImages([...images, newImage]);
      setSelectedId(newImage.id);
      toast.success(`Image loaded: ${latestImage.name}`);
      saveCanvasState('Image added');
    };
  }, [loadedImages, images, actualWidth, actualHeight, saveCanvasState]);

  // Get cursor based on active tool
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
      default:
        return 'default';
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
        draggable={activeTool === 'select' || activeTool === 'move'}
        onClick={() => setSelectedId(image.id)}
        onTap={() => setSelectedId(image.id)}
        onDragEnd={(e) => {
          setImages(images.map(i => 
            i.id === image.id 
              ? { ...i, x: e.target.x(), y: e.target.y() } 
              : i
          ));
          saveCanvasState('Image moved');
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          setImages(images.map(i =>
            i.id === image.id
              ? {
                  ...i,
                  x: node.x(),
                  y: node.y(),
                  width: node.width() * node.scaleX(),
                  height: node.height() * node.scaleY(),
                  rotation: node.rotation(),
                }
              : i
          ));
          node.scaleX(1);
          node.scaleY(1);
          saveCanvasState('Image transformed');
        }}
      />
    );
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
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />
      
      <div
        className="relative shadow-2xl rounded-sm overflow-hidden"
        style={{
          transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
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
            {lines.map((line) => (
              <Line
                key={line.id}
                id={line.id}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={line.tool === 'brush' ? 0.5 : 0}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
            
            {/* Images */}
            {images.map((image) => (
              <ImageNode key={image.id} image={image} />
            ))}
            
            {/* Shapes */}
            {shapes.map((shape) => {
              if (shape.type === 'rect') {
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
                    draggable={activeTool === 'select' || activeTool === 'move'}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                    onDragEnd={(e) => {
                      setShapes(shapes.map(s =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      ));
                      saveCanvasState('Shape moved');
                    }}
                  />
                );
              }
              
              if (shape.type === 'ellipse') {
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
                    draggable={activeTool === 'select' || activeTool === 'move'}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                    onDragEnd={(e) => {
                      setShapes(shapes.map(s =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      ));
                      saveCanvasState('Shape moved');
                    }}
                  />
                );
              }
              
              if (shape.type === 'line') {
                return (
                  <Line
                    key={shape.id}
                    id={shape.id}
                    points={shape.points || [0, 0, 100, 100]}
                    stroke={shape.fill}
                    strokeWidth={shape.strokeWidth}
                    lineCap="round"
                    draggable={activeTool === 'select' || activeTool === 'move'}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                  />
                );
              }
              
              if (shape.type === 'text') {
                return (
                  <Text
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text}
                    fontSize={shape.fontSize}
                    fill={shape.fill}
                    draggable={activeTool === 'select' || activeTool === 'move'}
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
                      
                      const textarea = document.createElement('textarea');
                      document.body.appendChild(textarea);
                      
                      textarea.value = textNode.text();
                      textarea.style.position = 'absolute';
                      textarea.style.top = areaPosition.y + 'px';
                      textarea.style.left = areaPosition.x + 'px';
                      textarea.style.width = textNode.width() + 'px';
                      textarea.style.fontSize = textNode.fontSize() + 'px';
                      textarea.style.border = 'none';
                      textarea.style.padding = '0px';
                      textarea.style.margin = '0px';
                      textarea.style.overflow = 'hidden';
                      textarea.style.background = 'none';
                      textarea.style.outline = 'none';
                      textarea.style.resize = 'none';
                      textarea.style.color = textNode.fill() as string;
                      textarea.style.fontFamily = 'Arial';
                      textarea.style.zIndex = '1000';
                      
                      textarea.focus();
                      
                      textarea.addEventListener('blur', () => {
                        setShapes(shapes.map(s =>
                          s.id === shape.id
                            ? { ...s, text: textarea.value }
                            : s
                        ));
                        document.body.removeChild(textarea);
                        saveCanvasState('Text edited');
                      });
                    }}
                    onDragEnd={(e) => {
                      setShapes(shapes.map(s =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      ));
                      saveCanvasState('Text moved');
                    }}
                  />
                );
              }
              
              return null;
            })}
            
            {/* Current shape being drawn */}
            {currentShape && currentShape.type === 'rect' && (
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
            
            {currentShape && currentShape.type === 'ellipse' && (
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
            
            {currentShape && currentShape.type === 'line' && (
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
    </div>
  );
};