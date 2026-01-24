"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FlipHorizontal, FlipVertical } from "lucide-react";

export const TransformPanel = () => {
	const { selectedId } = useArtStudioStore();

	const [position, setPosition] = React.useState({ x: 0, y: 0 });
	const [size, setSize] = React.useState({ width: 100, height: 100 });
	const [rotation, setRotation] = React.useState(0);
	const [scale, setScale] = React.useState({ x: 1, y: 1 });

	const handleFlipHorizontal = () => {
		window.dispatchEvent(
			new CustomEvent("artstudio:flip-selection", {
				detail: { direction: "horizontal" },
			}),
		);
	};

	const handleFlipVertical = () => {
		window.dispatchEvent(
			new CustomEvent("artstudio:flip-selection", {
				detail: { direction: "vertical" },
			}),
		);
	};

	if (!selectedId) {
		return (
			<div className="space-y-4 p-4 bg-card rounded-lg border">
				<h3 className="font-semibold text-sm">Transform</h3>
				<p className="text-xs text-muted-foreground">
					Select an object to transform it
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4 bg-card rounded-lg border">
			<h3 className="font-semibold text-sm">Transform</h3>

			{/* Position */}
			<div className="space-y-2">
				<Label className="text-xs">Position</Label>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label className="text-xs text-muted-foreground">X</Label>
						<Input
							type="number"
							value={position.x}
							onChange={(e) =>
								setPosition({ ...position, x: parseFloat(e.target.value) })
							}
							className="h-8 text-xs"
						/>
					</div>
					<div>
						<Label className="text-xs text-muted-foreground">Y</Label>
						<Input
							type="number"
							value={position.y}
							onChange={(e) =>
								setPosition({ ...position, y: parseFloat(e.target.value) })
							}
							className="h-8 text-xs"
						/>
					</div>
				</div>
			</div>

			{/* Size */}
			<div className="space-y-2">
				<Label className="text-xs">Size</Label>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label className="text-xs text-muted-foreground">Width</Label>
						<Input
							type="number"
							value={size.width}
							onChange={(e) =>
								setSize({ ...size, width: parseFloat(e.target.value) })
							}
							className="h-8 text-xs"
						/>
					</div>
					<div>
						<Label className="text-xs text-muted-foreground">Height</Label>
						<Input
							type="number"
							value={size.height}
							onChange={(e) =>
								setSize({ ...size, height: parseFloat(e.target.value) })
							}
							className="h-8 text-xs"
						/>
					</div>
				</div>
			</div>

			{/* Rotation */}
			<div className="space-y-2">
				<Label className="text-xs">Rotation: {rotation}°</Label>
				<Slider
					value={[rotation]}
					onValueChange={([value]) => setRotation(value)}
					min={0}
					max={360}
					step={1}
				/>
			</div>

			{/* Scale */}
			<div className="space-y-2">
				<Label className="text-xs">Scale</Label>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label className="text-xs text-muted-foreground">X</Label>
						<Input
							type="number"
							value={scale.x}
							onChange={(e) =>
								setScale({ ...scale, x: parseFloat(e.target.value) })
							}
							step={0.1}
							className="h-8 text-xs"
						/>
					</div>
					<div>
						<Label className="text-xs text-muted-foreground">Y</Label>
						<Input
							type="number"
							value={scale.y}
							onChange={(e) =>
								setScale({ ...scale, y: parseFloat(e.target.value) })
							}
							step={0.1}
							className="h-8 text-xs"
						/>
					</div>
				</div>
			</div>

			{/* Flip Buttons */}
			<div className="space-y-2">
				<Label className="text-xs">Flip</Label>
				<div className="flex gap-2">
					<Button
						onClick={handleFlipHorizontal}
						variant="outline"
						className="flex-1 h-9"
						size="sm"
					>
						<FlipHorizontal className="w-4 h-4 mr-1" />
						Horizontal
					</Button>
					<Button
						onClick={handleFlipVertical}
						variant="outline"
						className="flex-1 h-9"
						size="sm"
					>
						<FlipVertical className="w-4 h-4 mr-1" />
						Vertical
					</Button>
				</div>
			</div>
		</div>
	);
};
