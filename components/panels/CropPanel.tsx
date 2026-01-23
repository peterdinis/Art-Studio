"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

export const CropPanel = () => {
    const { selectionBounds, setSelectionBounds } = useArtStudioStore();

    const aspectRatios = [
        { label: "Free", value: null },
        { label: "1:1", value: 1 },
        { label: "16:9", value: 16 / 9 },
        { label: "4:3", value: 4 / 3 },
        { label: "3:2", value: 3 / 2 },
    ];

    const [selectedRatio, setSelectedRatio] = React.useState<number | null>(null);

    const handleApplyCrop = () => {
        // Dispatch custom event to apply crop
        window.dispatchEvent(new CustomEvent("artstudio:apply-crop"));
    };

    const handleCancelCrop = () => {
        setSelectionBounds(null);
    };

    return (
        <div className="space-y-4 p-4 bg-card rounded-lg border">
            <h3 className="font-semibold text-sm">Crop Options</h3>

            {/* Aspect Ratio */}
            <div className="space-y-2">
                <Label className="text-xs">Aspect Ratio</Label>
                <RadioGroup
                    value={selectedRatio?.toString() || "free"}
                    onValueChange={(value) => {
                        const ratio = value === "free" ? null : parseFloat(value);
                        setSelectedRatio(ratio);
                    }}
                >
                    {aspectRatios.map((ratio) => (
                        <div key={ratio.label} className="flex items-center space-x-2">
                            <RadioGroupItem
                                value={ratio.value?.toString() || "free"}
                                id={`ratio-${ratio.label}`}
                            />
                            <Label htmlFor={`ratio-${ratio.label}`} className="text-xs cursor-pointer">
                                {ratio.label}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {/* Dimensions */}
            {selectionBounds && (
                <div className="space-y-2">
                    <Label className="text-xs">Dimensions</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Width</Label>
                            <Input
                                type="number"
                                value={Math.round(selectionBounds.width)}
                                readOnly
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Height</Label>
                            <Input
                                type="number"
                                value={Math.round(selectionBounds.height)}
                                readOnly
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleApplyCrop}
                    disabled={!selectionBounds}
                    className="flex-1 h-9"
                    size="sm"
                >
                    <Check className="w-4 h-4 mr-1" />
                    Apply
                </Button>
                <Button
                    onClick={handleCancelCrop}
                    variant="outline"
                    disabled={!selectionBounds}
                    className="flex-1 h-9"
                    size="sm"
                >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                </Button>
            </div>

            <p className="text-xs text-muted-foreground">
                Select an area on the canvas, then press Enter or click Apply to crop.
            </p>
        </div>
    );
};
