"use client";

import { TopMenuBar } from "@/components/layout/TopMenuBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { ToolSidebar } from "@/components/toolbar/ToolSidebar";
import { BrushPanel } from "@/components/panels/BrushPanel";
import { ColorPanel } from "@/components/panels/ColorPanel";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { StarPanel } from "@/components/panels/StarPanel";
import { LineOptionsPanel } from "@/components/panels/LineOptionsPanel";
import { PenOptionsPanel } from "@/components/panels/PenOptionsPanel";
import { PolygonOptionsPanel } from "@/components/panels/PolygonOptionsPanel";
import { ShapeOptionsPanel } from "@/components/panels/ShapeOptionsPanel";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEffect, useState } from "react";
import KonvaCanvas from "../canvas/KonvaCanvas";
import { GradientOptionsPanel } from "../panels/GradientOptionsPanel";
import { PaintBucketPanel } from "../panels/PaintBucketPanel";

const HomeWrapper = () => {
	const [isSessionInitialized, setIsSessionInitialized] = useState(false);
	const [isClient, setIsClient] = useState(false);

	const {
		showGrid,
		showRulers,
		showGuides,
		showLeftPanel,
		showRightPanel,
		showBrushesPanel,
		showColorsPanel,
		showLayersPanel,
		showStarPanel,
		showLinePanel,
		showGradientPanel,
		activeTool, // Pridané na sledovanie aktívneho nástroja
		initializeSession,
		sessionId,
	} = useArtStudioStore();

	useKeyboardShortcuts();

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		if (!isClient) return;

		const initSession = async () => {
			try {
				console.log("Initializing session...");
				await initializeSession();
				setIsSessionInitialized(true);
				console.log("Session initialized successfully");
			} catch (error) {
				console.error("Failed to initialize session:", error);
				setIsSessionInitialized(true);
			}
		};

		initSession();
	}, [initializeSession, isClient]);

	// Auto-save removed (IndexedDB removed)

	// Session expiry check removed (IndexedDB removed)

	// Loading stav - show minimal loading on server
	if (!isClient) {
		return (
			<div className="h-screen w-full flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading workspace...</p>
				</div>
			</div>
		);
	}

	// Loading stav - show proper loading after client init
	if (!isSessionInitialized) {
		return (
			<div className="h-screen w-full flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Initializing workspace...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen w-full flex flex-col overflow-hidden bg-background">
			{/* Top Menu Bar */}
			<TopMenuBar />

			{/* Main Content Area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Tool Sidebar */}
				{showLeftPanel && <ToolSidebar />}

				{/* Center Canvas Area */}
				<div className="flex-1 flex flex-col overflow-hidden bg-[#2a2a2a] relative">
					{/* Rulers */}
					{showRulers && (
						<>
							{/* Horizontal Ruler */}
							<div className="h-6 bg-[#3a3a3a] border-b border-border flex items-center px-12">
								{Array.from({ length: 50 }).map((_, i) => (
									<div
										key={i}
										className="flex-1 border-l border-border h-2 relative"
									>
										{i % 5 === 0 && (
											<span className="absolute -top-4 -left-2 text-[10px] text-muted-foreground">
												{i * 100}
											</span>
										)}
									</div>
								))}
							</div>
							{/* Vertical Ruler */}
							<div className="absolute left-0 top-6 w-6 h-full bg-[#3a3a3a] border-r border-border">
								{Array.from({ length: 50 }).map((_, i) => (
									<div
										key={i}
										className="h-8 border-t border-border w-2 relative"
									>
										{i % 5 === 0 && (
											<span className="absolute -left-8 -top-2 text-[10px] text-muted-foreground transform -rotate-90">
												{i * 100}
											</span>
										)}
									</div>
								))}
							</div>
						</>
					)}

					{/* Grid Overlay */}
					{showGrid && (
						<div
							className="absolute inset-0 pointer-events-none z-10"
							style={{
								backgroundImage:
									"linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
								backgroundSize: "20px 20px",
							}}
						/>
					)}

					{/* Guides Overlay */}
					{showGuides && (
						<div className="absolute inset-0 pointer-events-none z-20">
							{/* Horizontal guide at 50% */}
							<div
								className="absolute w-full border-t border-dashed border-blue-500 opacity-60"
								style={{ top: "50%" }}
							/>
							{/* Vertical guide at 50% */}
							<div
								className="absolute h-full border-l border-dashed border-blue-500 opacity-60"
								style={{ left: "50%" }}
							/>
						</div>
					)}

					{/* Canvas */}
					<div className="flex-1 overflow-auto p-4">
						<KonvaCanvas width={1920} height={1080} backgroundColor="#2d3748" />
					</div>
				</div>

				{/* Right Panel Group */}
				{showRightPanel && (
					<div className="w-80 bg-card border-l border-border overflow-y-auto overflow-x-hidden">
						<div className="flex flex-col gap-4 p-4">
							{/* Tool-specific panels - show automatically for each tool */}
							{[
								"text",
								"crop",
								"line",
								"move",
								"select",
								"gradient",
								"pen",
								"polygon",
								"rectangle",
								"ellipse",
								"brush",
								"pencil",
								"eraser",
								"clone",
								"healing",
								"blur",
								"dodge",
								"burn",
								"fill",
								"eyedropper",
								"hand",
								"zoom",
								"marquee",
								"lasso",
								"magicwand",
							].includes(activeTool) && <BrushPanel />}
							{activeTool === "star" && <StarPanel />}
							{/* General panels */}
							{showColorsPanel && <ColorPanel />}
							{showLayersPanel && <LayersPanel />}
						</div>
					</div>
				)}
			</div>

			{/* Status Bar */}
			<StatusBar />
		</div>
	);
};

export default HomeWrapper;