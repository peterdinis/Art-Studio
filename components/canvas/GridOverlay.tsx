"use client";

import React, { useMemo } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";

interface GridOverlayProps {
	width: number;
	height: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ width, height }) => {
	const { showGrid } = useArtStudioStore();
	const gridSize = 40; // px per grid cell

	const lines = useMemo(() => {
		if (!showGrid) return null;

		const cols = Math.ceil(width / gridSize);
		const rows = Math.ceil(height / gridSize);
		const verticals: React.ReactElement[] = [];
		const horizontals: React.ReactElement[] = [];

		for (let i = 0; i <= cols; i++) {
			const x = i * gridSize;
			const isMajor = i % 5 === 0;
			verticals.push(
				<line
					key={`v-${i}`}
					x1={x}
					y1={0}
					x2={x}
					y2={height}
					stroke={isMajor ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.12)"}
					strokeWidth={isMajor ? 1 : 0.5}
				/>,
			);
		}

		for (let i = 0; i <= rows; i++) {
			const y = i * gridSize;
			const isMajor = i % 5 === 0;
			horizontals.push(
				<line
					key={`h-${i}`}
					x1={0}
					y1={y}
					x2={width}
					y2={y}
					stroke={isMajor ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.12)"}
					strokeWidth={isMajor ? 1 : 0.5}
				/>,
			);
		}

		return { verticals, horizontals };
	}, [showGrid, width, height]);

	if (!showGrid || !lines) return null;

	return (
		<svg
			className="absolute inset-0 pointer-events-none z-10"
			width={width}
			height={height}
			xmlns="http://www.w3.org/2000/svg"
		>
			{lines.verticals}
			{lines.horizontals}
		</svg>
	);
};
