"use client";

import React, { useRef, useCallback } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";

interface RulerOverlayProps {
	width: number;
	height: number;
	zoom: number;
	panOffset: { x: number; y: number };
}

const RULER_SIZE = 24;

export const RulerOverlay: React.FC<RulerOverlayProps> = ({
	width,
	height,
	zoom,
	panOffset,
}) => {
	const { showRulers } = useArtStudioStore();

	const scale = zoom / 100;
	// Tick intervals: always show nice round numbers
	const rawInterval = 100 / scale;
	const niceIntervals = [10, 25, 50, 100, 200, 250, 500, 1000];
	const tickInterval =
		niceIntervals.find((n) => n >= rawInterval * 0.6) || 1000;

	const buildHorizontalTicks = useCallback(() => {
		const ticks: React.ReactElement[] = [];
		const startPx = -panOffset.x / scale;
		const endPx = startPx + width / scale;

		const first = Math.ceil(startPx / tickInterval) * tickInterval;
		for (let val = first; val <= endPx; val += tickInterval) {
			const x = (val - startPx) * scale;
			const isMajor = val % (tickInterval * 5) === 0;
			ticks.push(
				<g key={`hx-${val}`}>
					<line
						x1={x + RULER_SIZE}
						y1={isMajor ? 0 : RULER_SIZE / 2}
						x2={x + RULER_SIZE}
						y2={RULER_SIZE}
						stroke="currentColor"
						strokeWidth={0.7}
						className="text-muted-foreground"
					/>
					{isMajor && (
						<text
							x={x + RULER_SIZE + 2}
							y={RULER_SIZE - 5}
							fontSize={8}
							fill="currentColor"
							className="text-muted-foreground"
						>
							{val}
						</text>
					)}
				</g>,
			);
		}
		return ticks;
	}, [width, scale, panOffset.x, tickInterval]);

	const buildVerticalTicks = useCallback(() => {
		const ticks: React.ReactElement[] = [];
		const startPy = -panOffset.y / scale;
		const endPy = startPy + height / scale;

		const first = Math.ceil(startPy / tickInterval) * tickInterval;
		for (let val = first; val <= endPy; val += tickInterval) {
			const y = (val - startPy) * scale;
			const isMajor = val % (tickInterval * 5) === 0;
			ticks.push(
				<g key={`vy-${val}`}>
					<line
						x1={isMajor ? 0 : RULER_SIZE / 2}
						y1={y + RULER_SIZE}
						x2={RULER_SIZE}
						y2={y + RULER_SIZE}
						stroke="currentColor"
						strokeWidth={0.7}
						className="text-muted-foreground"
					/>
					{isMajor && (
						<text
							x={2}
							y={y + RULER_SIZE + 10}
							fontSize={8}
							fill="currentColor"
							className="text-muted-foreground"
							transform={`rotate(-90, 10, ${y + RULER_SIZE + 2})`}
						>
							{val}
						</text>
					)}
				</g>,
			);
		}
		return ticks;
	}, [height, scale, panOffset.y, tickInterval]);

	if (!showRulers) return null;

	const hTicks = buildHorizontalTicks();
	const vTicks = buildVerticalTicks();

	return (
		<>
			{/* Horizontal Ruler (top) */}
			<svg
				className="absolute top-0 left-0 pointer-events-none z-30 text-muted-foreground"
				width={width + RULER_SIZE}
				height={RULER_SIZE}
				style={{ userSelect: "none" }}
			>
				<rect
					x={0}
					y={0}
					width={width + RULER_SIZE}
					height={RULER_SIZE}
					className="fill-card"
					opacity={0.9}
				/>
				{hTicks}
			</svg>

			{/* Vertical Ruler (left) */}
			<svg
				className="absolute top-0 left-0 pointer-events-none z-30 text-muted-foreground"
				width={RULER_SIZE}
				height={height + RULER_SIZE}
				style={{ userSelect: "none" }}
			>
				<rect
					x={0}
					y={0}
					width={RULER_SIZE}
					height={height + RULER_SIZE}
					className="fill-card"
					opacity={0.9}
				/>
				{vTicks}
				{/* Corner square */}
				<rect
					x={0}
					y={0}
					width={RULER_SIZE}
					height={RULER_SIZE}
					className="fill-muted"
				/>
			</svg>
		</>
	);
};
