"use client";

import React, { useState, useEffect } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { 
  Ruler, 
  ArrowRight, 
  Zap,
  Minus,
  Square,
  Circle,
  ChevronRight,
  ArrowRightCircle,
  CornerUpRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface LineOptionsPanelProps {
  className?: string;
}

type LineType = "solid" | "dashed" | "dotted" | "dash-dot";
type ArrowType = "none" | "start" | "end" | "both";
type CapType = "butt" | "round" | "square";
type JoinType = "miter" | "round" | "bevel";
type LineStyle = "straight" | "curved" | "freehand";

interface LineOptionsState {
  strokeWidth: number;
  lineType: LineType;
  arrowType: ArrowType;
  dashPattern: string;
  capType: CapType;
  joinType: JoinType;
  cornerRadius: number;
  isPerfect: boolean;
  startCap: string;
  endCap: string;
  lineStyle: LineStyle;
  tension: number;
  precision: number;
  arrowSize: number;
}

export const LineOptionsPanel: React.FC<LineOptionsPanelProps> = ({ className }) => {
  const { 
    brushSettings, 
    setBrushSettings, 
    primaryColor,
    activeTool 
  } = useArtStudioStore();

  const [lineOptions, setLineOptions] = useState<LineOptionsState>({
    strokeWidth: brushSettings.strokeWidth || 2,
    lineType: (brushSettings.lineSettings?.type as LineType) || "solid",
    arrowType: (brushSettings.lineSettings?.arrowType as ArrowType) || "none",
    dashPattern: brushSettings.lineSettings?.dashPattern || "5,5",
    capType: (brushSettings.lineSettings?.capType as CapType) || "round",
    joinType: (brushSettings.lineSettings?.joinType as JoinType) || "round",
    cornerRadius: brushSettings.cornerRadius || 0,
    isPerfect: brushSettings.lineSettings?.isPerfect || false,
    startCap: brushSettings.lineSettings?.startCap || "none",
    endCap: brushSettings.lineSettings?.endCap || "none",
    lineStyle: (brushSettings.lineSettings?.lineStyle as LineStyle) || "straight",
    tension: brushSettings.lineSettings?.tension || 0.5,
    precision: brushSettings.lineSettings?.precision || 10,
    arrowSize: brushSettings.lineSettings?.arrowSize || 10,
  });

  // Update line options when brush settings change
  useEffect(() => {
    setLineOptions({
      strokeWidth: brushSettings.strokeWidth || 2,
      lineType: (brushSettings.lineSettings?.type as LineType) || "solid",
      arrowType: (brushSettings.lineSettings?.arrowType as ArrowType) || "none",
      dashPattern: brushSettings.lineSettings?.dashPattern || "5,5",
      capType: (brushSettings.lineSettings?.capType as CapType) || "round",
      joinType: (brushSettings.lineSettings?.joinType as JoinType) || "round",
      cornerRadius: brushSettings.cornerRadius || 0,
      isPerfect: brushSettings.lineSettings?.isPerfect || false,
      startCap: brushSettings.lineSettings?.startCap || "none",
      endCap: brushSettings.lineSettings?.endCap || "none",
      lineStyle: (brushSettings.lineSettings?.lineStyle as LineStyle) || "straight",
      tension: brushSettings.lineSettings?.tension || 0.5,
      precision: brushSettings.lineSettings?.precision || 10,
      arrowSize: brushSettings.lineSettings?.arrowSize || 10,
    });
  }, [brushSettings]);

  // Apply line options to brush settings
  const applyLineOptions = (options: Partial<LineOptionsState>) => {
    const newOptions = { ...lineOptions, ...options };
    setLineOptions(newOptions);
    
    // Update brush settings in store
    setBrushSettings({
      strokeWidth: newOptions.strokeWidth,
      cornerRadius: newOptions.cornerRadius,
      lineSettings: {
        type: newOptions.lineType,
        arrowType: newOptions.arrowType,
        dashPattern: newOptions.dashPattern,
        capType: newOptions.capType,
        joinType: newOptions.joinType,
        isPerfect: newOptions.isPerfect,
        startCap: newOptions.startCap,
        endCap: newOptions.endCap,
        lineStyle: newOptions.lineStyle,
        tension: newOptions.tension,
        precision: newOptions.precision,
        arrowSize: newOptions.arrowSize,
      }
    });
  };

  const lineTypes: Array<{id: LineType, label: string, icon: React.ReactNode}> = [
    { id: "solid", label: "Solid", icon: <Minus className="w-4 h-4" /> },
    { id: "dashed", label: "Dashed", icon: <ChevronRight className="w-4 h-4" /> },
    { id: "dotted", label: "Dotted", icon: <Circle className="w-3 h-3" /> },
    { id: "dash-dot", label: "Dash-Dot", icon: <Square className="w-4 h-4" /> },
  ];

  const arrowTypes: Array<{id: ArrowType, label: string, icon: React.ReactNode}> = [
    { id: "none", label: "None", icon: <Minus className="w-4 h-4" /> },
    { id: "start", label: "Start", icon: <ArrowRight className="w-4 h-4 rotate-180" /> },
    { id: "end", label: "End", icon: <ArrowRight className="w-4 h-4" /> },
    { id: "both", label: "Both", icon: <ArrowRightCircle className="w-4 h-4" /> },
  ];

  const capTypes: Array<{id: CapType, label: string, description: string}> = [
    { id: "butt", label: "Butt", description: "Flat ends" },
    { id: "round", label: "Round", description: "Rounded ends" },
    { id: "square", label: "Square", description: "Squared ends" },
  ];

  const joinTypes: Array<{id: JoinType, label: string, description: string}> = [
    { id: "miter", label: "Miter", description: "Sharp corners" },
    { id: "round", label: "Round", description: "Rounded corners" },
    { id: "bevel", label: "Bevel", description: "Beveled corners" },
  ];

  const lineStyles: Array<{id: LineStyle, label: string, icon: React.ReactNode}> = [
    { id: "straight", label: "Straight", icon: <Minus className="w-4 h-4" /> },
    { id: "curved", label: "Curved", icon: <CornerUpRight className="w-4 h-4" /> },
    { id: "freehand", label: "Freehand", icon: <Ruler className="w-4 h-4" /> },
  ];

  const dashPatterns = [
    { id: "5,5", label: "Short dash" },
    { id: "10,5", label: "Medium dash" },
    { id: "20,5", label: "Long dash" },
    { id: "5,10", label: "Dash-gap" },
    { id: "2,2", label: "Fine dots" },
    { id: "5,2,2,2", label: "Dash-dot" },
  ];

  const arrowSizes = [5, 8, 10, 12, 15, 20];

  if (activeTool !== "line") {
    return null;
  }

  return (
    <div className={`space-y-4 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Ruler className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Line Tool Options</h3>
      </div>

      {/* Line Style Selection */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Line Style</Label>
        <div className="grid grid-cols-3 gap-2">
          {lineStyles.map(style => (
            <button
              key={style.id}
              onClick={() => applyLineOptions({ lineStyle: style.id })}
              className={`flex flex-col items-center justify-center p-2 rounded-md border ${
                lineOptions.lineStyle === style.id 
                  ? "bg-primary/10 border-primary" 
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="mb-1">{style.icon}</div>
              <span className="text-xs">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Line Type Selection */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Line Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {lineTypes.map(type => (
            <button
              key={type.id}
              onClick={() => applyLineOptions({ lineType: type.id })}
              className={`flex items-center gap-2 p-2 rounded-md border ${
                lineOptions.lineType === type.id 
                  ? "bg-primary/10 border-primary" 
                  : "border-border hover:bg-accent"
              }`}
            >
              {type.icon}
              <span className="text-xs">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Stroke Width</Label>
          <span className="text-xs text-muted-foreground">{lineOptions.strokeWidth}px</span>
        </div>
        <Slider
          value={[lineOptions.strokeWidth]}
          onValueChange={(value) => applyLineOptions({ strokeWidth: value[0] })}
          min={1}
          max={50}
          step={1}
          className="w-full"
        />
        <div className="flex gap-2">
          {[1, 2, 3, 5, 10].map(width => (
            <button
              key={width}
              onClick={() => applyLineOptions({ strokeWidth: width })}
              className={`flex-1 py-1 text-xs rounded border ${
                lineOptions.strokeWidth === width 
                  ? "bg-primary text-primary-foreground" 
                  : "border-border hover:bg-accent"
              }`}
            >
              {width}px
            </button>
          ))}
        </div>
      </div>

      {/* Arrow Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Arrow Type</Label>
          <span className="text-xs text-muted-foreground">Size: {lineOptions.arrowSize}px</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {arrowTypes.map(arrow => (
            <button
              key={arrow.id}
              onClick={() => applyLineOptions({ arrowType: arrow.id })}
              className={`flex flex-col items-center justify-center p-2 rounded-md border ${
                lineOptions.arrowType === arrow.id 
                  ? "bg-primary/10 border-primary" 
                  : "border-border hover:bg-accent"
              }`}
            >
              {arrow.icon}
              <span className="text-xs mt-1">{arrow.label}</span>
            </button>
          ))}
        </div>
        
        {lineOptions.arrowType !== "none" && (
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-medium">Arrow Size</Label>
            <Slider
              value={[lineOptions.arrowSize]}
              onValueChange={(value) => applyLineOptions({ arrowSize: value[0] })}
              min={5}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex gap-2 flex-wrap">
              {arrowSizes.map(size => (
                <button
                  key={size}
                  onClick={() => applyLineOptions({ arrowSize: size })}
                  className={`px-2 py-1 text-xs rounded border ${
                    lineOptions.arrowSize === size 
                      ? "bg-primary text-primary-foreground" 
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dash Pattern (for dashed/dotted lines) */}
      {(lineOptions.lineType === "dashed" || lineOptions.lineType === "dotted" || lineOptions.lineType === "dash-dot") && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Dash Pattern</Label>
          <Select 
            value={lineOptions.dashPattern}
            onValueChange={(value) => applyLineOptions({ dashPattern: value })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Select pattern" />
            </SelectTrigger>
            <SelectContent>
              {dashPatterns.map(pattern => (
                <SelectItem key={pattern.id} value={pattern.id}>
                  {pattern.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cap & Join Types */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Line Cap</Label>
          <Select 
            value={lineOptions.capType}
            onValueChange={(value: CapType) => applyLineOptions({ capType: value })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {capTypes.map(cap => (
                <SelectItem key={cap.id} value={cap.id}>
                  <div className="flex items-center gap-2">
                    <span>{cap.label}</span>
                    <span className="text-xs text-muted-foreground">({cap.description})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Line Join</Label>
          <Select 
            value={lineOptions.joinType}
            onValueChange={(value: JoinType) => applyLineOptions({ joinType: value })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {joinTypes.map(join => (
                <SelectItem key={join.id} value={join.id}>
                  <div className="flex items-center gap-2">
                    <span>{join.label}</span>
                    <span className="text-xs text-muted-foreground">({join.description})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Options */}
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <Label className="text-xs font-medium">Perfect Lines (45°)</Label>
              </div>
              <Switch
                checked={lineOptions.isPerfect}
                onCheckedChange={(checked) => applyLineOptions({ isPerfect: checked })}
              />
            </div>

            {lineOptions.lineStyle === "curved" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Curve Tension</Label>
                  <span className="text-xs text-muted-foreground">{lineOptions.tension.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lineOptions.tension]}
                  onValueChange={(value) => applyLineOptions({ tension: value[0] })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Snap Precision</Label>
                <span className="text-xs text-muted-foreground">{lineOptions.precision}px</span>
              </div>
              <Slider
                value={[lineOptions.precision]}
                onValueChange={(value) => applyLineOptions({ precision: value[0] })}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyLineOptions({
              strokeWidth: 2,
              lineType: "solid",
              arrowType: "none",
              capType: "round",
              joinType: "round"
            })}
            className="text-xs"
          >
            Basic Line
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyLineOptions({
              strokeWidth: 3,
              lineType: "dashed",
              arrowType: "both",
              arrowSize: 12,
              dashPattern: "10,5"
            })}
            className="text-xs"
          >
            Dashed Arrow
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyLineOptions({
              strokeWidth: 1,
              lineType: "dotted",
              arrowType: "end",
              dashPattern: "2,2"
            })}
            className="text-xs"
          >
            Dotted Arrow
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyLineOptions({
              strokeWidth: 4,
              lineType: "solid",
              arrowType: "none",
              isPerfect: true
            })}
            className="text-xs"
          >
            Perfect Line
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-2">
        <Label className="text-xs font-medium mb-2 block">Preview</Label>
        <div className="h-20 border border-dashed border-border rounded-md flex items-center justify-center bg-muted/20">
          <div className="relative w-32">
            {/* Line preview based on settings */}
            <div 
              className={`absolute top-1/2 left-0 right-0 transform -translate-y-1/2 ${
                lineOptions.lineType === "dashed" ? "border-dashed" : 
                lineOptions.lineType === "dotted" ? "border-dotted" : 
                lineOptions.lineType === "dash-dot" ? "border-dashed" : ""
              }`}
              style={{
                height: `${lineOptions.strokeWidth}px`,
                borderTopWidth: `${lineOptions.strokeWidth}px`,
                borderTopStyle: lineOptions.lineType === "dashed" ? "dashed" : 
                             lineOptions.lineType === "dotted" ? "dotted" : 
                             lineOptions.lineType === "dash-dot" ? "dashed" : "solid",
                borderTopColor: primaryColor,
              }}
            />
            
            {/* Arrow preview */}
            {lineOptions.arrowType === "start" || lineOptions.arrowType === "both" ? (
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: `${lineOptions.arrowSize/2}px solid transparent`,
                  borderBottom: `${lineOptions.arrowSize/2}px solid transparent`,
                  borderRight: `${lineOptions.arrowSize}px solid ${primaryColor}`,
                }}
              />
            ) : null}
            {lineOptions.arrowType === "end" || lineOptions.arrowType === "both" ? (
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: `${lineOptions.arrowSize/2}px solid transparent`,
                  borderBottom: `${lineOptions.arrowSize/2}px solid transparent`,
                  borderLeft: `${lineOptions.arrowSize}px solid ${primaryColor}`,
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};