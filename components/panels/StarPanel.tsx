"use client";

import { useArtStudioStore } from "@/stores/artStudioStore";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, Minus, Plus, RotateCw } from "lucide-react";

export const StarPanel = () => {
  const { brushSettings, setBrushSettings, primaryColor, secondaryColor } = useArtStudioStore();

  const starSettings = {
    points: brushSettings.starPoints || 5,
    innerRadius: brushSettings.starInnerRadius || 30,
    outerRadius: brushSettings.starOuterRadius || 60,
    rotation: brushSettings.starRotation || 0,
    fillType: brushSettings.starFillType || "solid",
    strokeColor: brushSettings.starStrokeColor || secondaryColor,
    fillColor: brushSettings.starFillColor || primaryColor,
    cornerRadius: brushSettings.starCornerRadius || 0,
    strokeWidth: brushSettings.strokeWidth || 2,
  };

  const updateStarSetting = (key: string, value: any) => {
    setBrushSettings({ [`star${key.charAt(0).toUpperCase() + key.slice(1)}`]: value });
  };

  const increasePoints = () => {
    if (starSettings.points < 20) {
      updateStarSetting("points", starSettings.points + 1);
    }
  };

  const decreasePoints = () => {
    if (starSettings.points > 3) {
      updateStarSetting("points", starSettings.points - 1);
    }
  };

  const resetRotation = () => {
    updateStarSetting("rotation", 0);
  };

  const renderStarPreview = () => {
    const size = 80;
    const center = size / 2;
    const points = starSettings.points;
    const outerRadius = Math.min(center - 5, starSettings.outerRadius / 2);
    const innerRadius = Math.min(outerRadius - 5, starSettings.innerRadius / 2);
    const rotation = (starSettings.rotation * Math.PI) / 180;

    const path: string[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points + rotation;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      if (i === 0) {
        path.push(`M ${x} ${y}`);
      } else {
        path.push(`L ${x} ${y}`);
      }
    }
    path.push("Z");

    return (
      <svg width={size} height={size} className="mx-auto">
        <path
          d={path.join(" ")}
          fill={starSettings.fillType === "none" ? "transparent" : starSettings.fillColor}
          stroke={starSettings.strokeColor}
          strokeWidth={starSettings.strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Star Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Preview */}
        <div className="flex flex-col items-center mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="mb-3">{renderStarPreview()}</div>
          <div className="text-xs text-muted-foreground text-center">
            {starSettings.points}-point star
          </div>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 pt-4">
            {/* Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="star-points" className="text-xs">
                  Points
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={decreasePoints}
                    disabled={starSettings.points <= 3}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">
                    {starSettings.points}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={increasePoints}
                    disabled={starSettings.points >= 20}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                id="star-points"
                min={3}
                max={20}
                step={1}
                value={[starSettings.points]}
                onValueChange={([value]) => updateStarSetting("points", value)}
                className="w-full"
              />
            </div>

            {/* Outer Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="star-outer-radius" className="text-xs">
                  Outer Radius
                </Label>
                <span className="text-xs text-muted-foreground">
                  {starSettings.outerRadius}px
                </span>
              </div>
              <Slider
                id="star-outer-radius"
                min={10}
                max={200}
                step={5}
                value={[starSettings.outerRadius]}
                onValueChange={([value]) => updateStarSetting("outerRadius", value)}
                className="w-full"
              />
            </div>

            {/* Inner Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="star-inner-radius" className="text-xs">
                  Inner Radius
                </Label>
                <span className="text-xs text-muted-foreground">
                  {starSettings.innerRadius}px
                </span>
              </div>
              <Slider
                id="star-inner-radius"
                min={5}
                max={starSettings.outerRadius - 5}
                step={5}
                value={[starSettings.innerRadius]}
                onValueChange={([value]) => updateStarSetting("innerRadius", value)}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="star-rotation" className="text-xs">
                  Rotation
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {starSettings.rotation}°
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={resetRotation}
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                id="star-rotation"
                min={0}
                max={360}
                step={1}
                value={[starSettings.rotation]}
                onValueChange={([value]) => updateStarSetting("rotation", value)}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 pt-4">
            {/* Fill Type */}
            <div className="space-y-2">
              <Label htmlFor="star-fill-type" className="text-xs">
                Fill Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["solid", "gradient", "none"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={starSettings.fillType === type ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => updateStarSetting("fillType", type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="star-stroke-width" className="text-xs">
                  Stroke Width
                </Label>
                <span className="text-xs text-muted-foreground">
                  {starSettings.strokeWidth}px
                </span>
              </div>
              <Slider
                id="star-stroke-width"
                min={0}
                max={20}
                step={0.5}
                value={[starSettings.strokeWidth]}
                onValueChange={([value]) => setBrushSettings({ strokeWidth: value })}
                className="w-full"
              />
            </div>

            {/* Corner Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="star-corner-radius" className="text-xs">
                  Corner Radius
                </Label>
                <span className="text-xs text-muted-foreground">
                  {starSettings.cornerRadius}px
                </span>
              </div>
              <Slider
                id="star-corner-radius"
                min={0}
                max={50}
                step={1}
                value={[starSettings.cornerRadius]}
                onValueChange={([value]) => updateStarSetting("cornerRadius", value)}
                className="w-full"
              />
            </div>

            {/* Stroke Color Preview */}
            <div className="space-y-2">
              <Label className="text-xs">Stroke Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: starSettings.strokeColor }}
                />
                <Input
                  value={starSettings.strokeColor}
                  onChange={(e) => updateStarSetting("strokeColor", e.target.value)}
                  className="h-8 text-xs"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Fill Color Preview */}
            {starSettings.fillType === "solid" && (
              <div className="space-y-2">
                <Label className="text-xs">Fill Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: starSettings.fillColor }}
                  />
                  <Input
                    value={starSettings.fillColor}
                    onChange={(e) => updateStarSetting("fillColor", e.target.value)}
                    className="h-8 text-xs"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Presets */}
        <div className="pt-2 border-t">
          <Label className="text-xs mb-2 block">Quick Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                updateStarSetting("points", 5);
                updateStarSetting("innerRadius", 30);
                updateStarSetting("outerRadius", 60);
              }}
            >
              5-point
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                updateStarSetting("points", 6);
                updateStarSetting("innerRadius", 40);
                updateStarSetting("outerRadius", 80);
              }}
            >
              6-point
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                updateStarSetting("points", 8);
                updateStarSetting("innerRadius", 35);
                updateStarSetting("outerRadius", 70);
              }}
            >
              8-point
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};