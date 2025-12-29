"use client";

import { TopMenuBar } from "@/components/layout/TopMenuBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { ToolSidebar } from "@/components/toolbar/ToolSidebar";
import { BrushPanel } from "@/components/panels/BrushPanel";
import { ColorPanel } from "@/components/panels/ColorPanel";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { HistoryPanel } from "@/components/panels/HistoryPanel";
import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { KonvaCanvas } from "@/components/canvas/KonvaCanvas";
import { useArtStudioStore } from "@/stores/artStudioStore";

const HomeWrapper = () => {
	const { renderingEngine, showGrid, showRulers } = useArtStudioStore();

	return (
		<div className="h-screen w-full flex flex-col overflow-hidden bg-background">
			{/* Top Menu Bar */}
			<TopMenuBar />

			{/* Main Content Area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Tool Sidebar */}
				<ToolSidebar />

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
							className="absolute inset-0 pointer-events-none"
							style={{
								backgroundImage:
									"linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
								backgroundSize: "20px 20px",
							}}
						/>
					)}

					{/* Canvas */}
					<div className="flex-1 overflow-auto p-4">
						{renderingEngine === "fabric" ? <DrawingCanvas /> : <KonvaCanvas />}
					</div>
				</div>

				{/* Right Panel Group */}
				<div className="w-80 bg-card border-l border-border flex flex-col overflow-hidden">
					<BrushPanel />
					<ColorPanel />
					<LayersPanel />
					<HistoryPanel />
				</div>
			</div>

			{/* Status Bar */}
			<StatusBar />
		</div>
	);
};

export default HomeWrapper;
