"use client";

import React, { useState, useRef } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { ArrowLeftRight } from "lucide-react";

export const ColorPanel: React.FC = () => {
	const {
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
		swapColors,
		recentColors,
	} = useArtStudioStore();

	const primaryInputRef = useRef<HTMLInputElement>(null);
	const secondaryInputRef = useRef<HTMLInputElement>(null);
	const [isHovering, setIsHovering] = useState(false);

	const [primaryHex, setPrimaryHex] = useState(primaryColor.toUpperCase());
	const [secondaryHex, setSecondaryHex] = useState(
		secondaryColor.toUpperCase(),
	);
	const colorWheelRef = useRef<HTMLDivElement>(null);

	// Sync local state with store changes (e.g. from eyedropper)
	React.useEffect(() => {
		setPrimaryHex(primaryColor.toUpperCase());
	}, [primaryColor]);

	React.useEffect(() => {
		setSecondaryHex(secondaryColor.toUpperCase());
	}, [secondaryColor]);

	const handleColorWheelClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		// Calculate angle and distance from center
		const dx = x - centerX;
		const dy = y - centerY;
		const angle = Math.atan2(dy, dx) * (180 / Math.PI);
		const hue = (angle + 90 + 360) % 360;

		// Calculate distance for saturation
		const distance = Math.sqrt(dx * dx + dy * dy);
		const maxDistance = Math.min(centerX, centerY);
		const saturation = Math.min((distance / maxDistance) * 100, 100);

		// Convert HSL to HEX
		const hslToHex = (h: number, s: number, l: number) => {
			l /= 100;
			const a = (s * Math.min(l, 1 - l)) / 100;
			const f = (n: number) => {
				const k = (n + h / 30) % 12;
				const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
				return Math.round(255 * color)
					.toString(16)
					.padStart(2, "0");
			};
			return `#${f(0)}${f(8)}${f(4)}`;
		};

		const hexColor = hslToHex(hue, saturation, 50);

		// Left click = primary, right click = secondary
		if (e.button === 0) {
			setPrimaryColor(hexColor);
		}
	};

	const handleColorWheelRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		const dx = x - centerX;
		const dy = y - centerY;
		const angle = Math.atan2(dy, dx) * (180 / Math.PI);
		const hue = (angle + 90 + 360) % 360;

		const distance = Math.sqrt(dx * dx + dy * dy);
		const maxDistance = Math.min(centerX, centerY);
		const saturation = Math.min((distance / maxDistance) * 100, 100);

		const hslToHex = (h: number, s: number, l: number) => {
			l /= 100;
			const a = (s * Math.min(l, 1 - l)) / 100;
			const f = (n: number) => {
				const k = (n + h / 30) % 12;
				const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
				return Math.round(255 * color)
					.toString(16)
					.padStart(2, "0");
			};
			return `#${f(0)}${f(8)}${f(4)}`;
		};

		const hexColor = hslToHex(hue, saturation, 50);
		setSecondaryColor(hexColor);
	};

	return (
		<div className="panel-glass p-4 w-full space-y-4 animate-fade-in">
			<h3 className="text-sm font-medium text-foreground">Colors</h3>

			{/* Primary/Secondary Color Display */}
			<div className="flex items-center gap-4">
				<div className="relative">
					{/* Primary Color */}
					<button
						onClick={() => primaryInputRef.current?.click()}
						className="color-swatch w-12 h-12 rounded-lg relative z-10 ring-2 ring-primary/50"
						style={{ backgroundColor: primaryColor }}
					>
						<span className="sr-only">Primary Color</span>
					</button>
					<input
						ref={primaryInputRef}
						type="color"
						value={primaryColor}
						onChange={(e) => setPrimaryColor(e.target.value)}
						className="absolute inset-0 opacity-0 cursor-pointer"
					/>

					{/* Secondary Color (offset behind) */}
					<button
						onClick={() => secondaryInputRef.current?.click()}
						className="color-swatch w-10 h-10 rounded-lg absolute -bottom-2 -right-2 z-0 border-2 border-background"
						style={{ backgroundColor: secondaryColor }}
					>
						<span className="sr-only">Secondary Color</span>
					</button>
					<input
						ref={secondaryInputRef}
						type="color"
						value={secondaryColor}
						onChange={(e) => setSecondaryColor(e.target.value)}
						className="absolute -bottom-2 -right-2 w-10 h-10 opacity-0 cursor-pointer"
					/>
				</div>

				{/* Swap Button */}
				<button
					onClick={swapColors}
					onMouseEnter={() => setIsHovering(true)}
					onMouseLeave={() => setIsHovering(false)}
					className="tool-button"
				>
					<ArrowLeftRight
						className={`w-4 h-4 transition-transform duration-200 ${isHovering ? "rotate-180" : ""}`}
					/>
				</button>

				{/* Hex Values */}
				<div className="flex-1 space-y-1">
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">Pri:</span>
						<input
							type="text"
							value={primaryHex}
							onChange={(e) => {
								const val = e.target.value;
								setPrimaryHex(val);
								if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
									setPrimaryColor(val);
								}
							}}
							onBlur={() => {
								setPrimaryHex(primaryColor.toUpperCase());
							}}
							className="bg-muted/50 px-2 py-0.5 rounded text-xs font-mono w-20 focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">Sec:</span>
						<input
							type="text"
							value={secondaryHex}
							onChange={(e) => {
								const val = e.target.value;
								setSecondaryHex(val);
								if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
									setSecondaryColor(val);
								}
							}}
							onBlur={() => {
								setSecondaryHex(secondaryColor.toUpperCase());
							}}
							className="bg-muted/50 px-2 py-0.5 rounded text-xs font-mono w-20 focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>
			</div>

			{/* Recent Colors */}
			<div>
				<h4 className="text-xs text-muted-foreground mb-2">Recent Colors</h4>
				<div className="grid grid-cols-8 gap-1">
					{recentColors.map((color, index) => (
						<button
							key={`${color}-${index}`}
							onClick={() => setPrimaryColor(color)}
							onContextMenu={(e) => {
								e.preventDefault();
								setSecondaryColor(color);
							}}
							className="color-swatch w-6 h-6"
							style={{ backgroundColor: color }}
							title={color}
						/>
					))}
				</div>
			</div>

			{/* Color Wheel Preview */}
			<div className="pt-2">
				<h4 className="text-xs text-muted-foreground mb-2">Color Picker</h4>
				<div
					ref={colorWheelRef}
					onClick={handleColorWheelClick}
					onContextMenu={handleColorWheelRightClick}
					className="h-24 rounded-lg overflow-hidden cursor-crosshair relative"
					style={{
						background: `
              radial-gradient(circle, white 0%, transparent 50%),
              conic-gradient(
                from 0deg,
                hsl(0, 100%, 50%),
                hsl(60, 100%, 50%),
                hsl(120, 100%, 50%),
                hsl(180, 100%, 50%),
                hsl(240, 100%, 50%),
                hsl(300, 100%, 50%),
                hsl(360, 100%, 50%)
              )
            `,
					}}
					title="Left click for primary, right click for secondary"
				/>
			</div>
		</div>
	);
};
