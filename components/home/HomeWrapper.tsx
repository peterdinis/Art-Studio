"use client";

import { FC, Suspense } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { TopMenuBar } from "../layout/TopMenuBar";
import { ToolSidebar } from "../toolbar/ToolSidebar";
import { BrushPanel } from "../panels/BrushPanel";
import { ColorPanel } from "../panels/ColorPanel";
import { HistoryPanel } from "../panels/HistoryPanel";
import { LayersPanel } from "../panels/LayersPanel";
import { StatusBar } from "../layout/StatusBar";
import { DrawingCanvas } from "../canvas/DrawingCanvas";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { KonvaCanvas } from "../canvas/KonvaCanvas";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../ui/resizable";

const HomeWrapper: FC = () => {
	const { renderingEngine, showGrid, showRulers } = useArtStudioStore();

	return (
		<TooltipProvider delayDuration={200}>
			<div className="h-screen w-full flex flex-col overflow-hidden bg-background">
				{/* Top Menu Bar - Photoshop style */}
				<Suspense
					fallback={
						<div className="h-12 bg-linear-to-b from-[#2a2a2a] to-[#1e1e1e] border-b border-[#404040] flex items-center px-4 animate-pulse">
							<div className="flex items-center gap-6">
								<div className="h-4 w-16 bg-[#404040] rounded" />
								<div className="h-4 w-20 bg-[#404040] rounded" />
								<div className="h-4 w-24 bg-[#404040] rounded" />
								<div className="h-4 w-20 bg-[#404040] rounded" />
								<div className="h-4 w-28 bg-[#404040] rounded" />
								<div className="h-4 w-16 bg-[#404040] rounded" />
							</div>
						</div>
					}
				>
					<TopMenuBar />
				</Suspense>

				{/* Main Content Area */}
				<ResizablePanelGroup
					orientation="horizontal"
					className="flex-1 overflow-hidden"
				>
					{/* Left Tool Sidebar - Photoshop style */}
					<ResizablePanel
						defaultSize={4}
						minSize={2}
						maxSize={10}
						className="min-w-[56px] overflow-hidden"
					>
						<Suspense
							fallback={
								<div className="w-full h-full bg-linear-to-b from-[#2a2a2a] to-[#1e1e1e] border-r border-[#404040] flex flex-col items-center py-4 gap-3">
									{[...Array(12)].map((_, i) => (
										<div
											key={i}
											className="w-10 h-10 rounded bg-[#404040] border border-[#505050]"
										/>
									))}
								</div>
							}
						>
							<ToolSidebar />
						</Suspense>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Canvas Area - Photoshop style */}
					<ResizablePanel defaultSize={76} className="relative">
						{showRulers && (
							<>
								<div className="absolute top-0 left-0 right-0 h-5 bg-muted border-b border-border z-10 flex items-center">
									{Array.from({ length: 40 }).map((_, i) => (
										<div
											key={i}
											className="flex-shrink-0 w-20 text-[10px] text-muted-foreground border-r border-border/50 pl-1"
										>
											{i * 100}
										</div>
									))}
								</div>
								<div className="absolute top-5 left-0 bottom-0 w-5 bg-muted border-r border-border z-10 flex flex-col items-center">
									{Array.from({ length: 30 }).map((_, i) => (
										<div
											key={i}
											className="flex-shrink-0 h-20 text-[10px] text-muted-foreground border-b border-border/50 pt-1 writing-mode-vertical"
										>
											{i * 100}
										</div>
									))}
								</div>
							</>
						)}

						{/* Grid overlay */}
						{showGrid && (
							<div
								className="absolute inset-0 pointer-events-none z-20"
								style={{
									backgroundImage:
										"linear-gradient(to right, hsl(var(--border)/0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.3) 1px, transparent 1px)",
									backgroundSize: "20px 20px",
								}}
							/>
						)}

						<Suspense
							fallback={
								<div className="flex-1 h-full bg-linear-to-br from-[#252525] to-[#1a1a1a] flex items-center justify-center relative">
									{/* Photoshop grid pattern */}
									<div
										className="absolute inset-0 opacity-10"
										style={{
											backgroundImage: `
										linear-gradient(#404040 1px, transparent 1px),
										linear-gradient(90deg, #404040 1px, transparent 1px)
									`,
											backgroundSize: "20px 20px",
										}}
									/>

									{/* Loading indicator */}
									<div className="relative z-10 flex flex-col items-center gap-6">
										<div className="relative">
											<div className="w-24 h-24 border-4 border-[#404040] rounded-lg relative overflow-hidden">
												<div className="absolute inset-0 bg-linear-to-br from-[#31a8ff] to-[#1473e6] opacity-20" />
												<div className="absolute top-2 left-2 w-8 h-8 bg-[#31a8ff]/30 rounded" />
												<div className="absolute bottom-2 right-2 w-6 h-6 bg-[#1473e6]/30 rounded" />
												<div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-[#31a8ff] via-[#1473e6] to-[#31a8ff] animate-progress" />
											</div>

											<div className="text-center">
												<p className="text-sm text-[#b0b0b0] mb-2">
													Opening canvas...
												</p>
												<div className="flex gap-1 justify-center">
													{[...Array(3)].map((_, i) => (
														<div
															key={i}
															className="w-1.5 h-1.5 bg-[#31a8ff] rounded-full animate-pulse"
															style={{ animationDelay: `${i * 0.2}s` }}
														/>
													))}
												</div>
											</div>
										</div>
									</div>
								</div>
							}
						>
							<div className={`${showRulers ? "pt-5 pl-5" : ""} h-full w-full`}>
								{renderingEngine === "fabric" ? (
									<DrawingCanvas />
								) : (
									<KonvaCanvas />
								)}
							</div>
						</Suspense>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Right Panels - Photoshop style */}
					<ResizablePanel
						defaultSize={20}
						minSize={15}
						maxSize={30}
						className="min-w-[280px]"
					>
						<div className="h-full flex flex-col gap-4 p-5 overflow-y-auto scrollbar-thin bg-linear-to-b from-[#2a2a2a] to-[#1e1e1e] border-l border-[#404040]">
							{/* Brush Panel */}
							<Suspense
								fallback={
									<div className="rounded bg-[#2a2a2a] border border-[#404040] p-3">
										<div className="h-5 w-20 bg-[#404040] rounded mb-3" />
										<div className="space-y-3">
											{[...Array(4)].map((_, i) => (
												<div
													key={i}
													className="flex items-center justify-between"
												>
													<div className="h-3 w-16 bg-[#404040] rounded" />
													<div className="h-3 w-24 bg-[#505050] rounded" />
												</div>
											))}
											<div className="mt-4 pt-3 border-t border-[#404040]">
												<div className="h-24 bg-[#1e1e1e] rounded border border-[#404040]" />
											</div>
										</div>
									</div>
								}
							>
								<BrushPanel />
							</Suspense>

							{/* Color Panel */}
							<Suspense
								fallback={
									<div className="rounded bg-[#2a2a2a] border border-[#404040] p-3">
										<div className="h-5 w-16 bg-[#404040] rounded mb-3" />
										<div className="flex gap-3 mb-3">
											<div className="w-16 h-16 rounded bg-linear-to-br from-[#31a8ff] to-[#1473e6] border border-[#404040]" />
											<div className="w-16 h-16 rounded bg-linear-to-br from-[#ff3131] to-[#e61414] border border-[#404040]" />
										</div>
									</div>
								}
							>
								<ColorPanel />
							</Suspense>

							{/* History Panel */}
							<Suspense
								fallback={
									<div className="rounded bg-[#2a2a2a] border border-[#404040] p-3">
										<div className="h-5 w-24 bg-[#404040] rounded mb-3" />
										<div className="space-y-2">
											{[...Array(5)].map((_, i) => (
												<div key={i} className="flex items-center gap-2">
													<div
														className={`w-3 h-3 rounded ${i === 0 ? "bg-[#31a8ff]" : "bg-[#404040]"}`}
													/>
													<div className="h-3 flex-1 bg-[#404040] rounded" />
												</div>
											))}
										</div>
									</div>
								}
							>
								<HistoryPanel />
							</Suspense>

							{/* Layers Panel */}
							<Suspense
								fallback={
									<div className="rounded bg-[#2a2a2a] border border-[#404040] p-3">
										<div className="h-5 w-20 bg-[#404040] rounded mb-3" />
										<div className="space-y-2">
											{[...Array(4)].map((_, i) => (
												<div
													key={i}
													className="flex items-center gap-2 p-2 rounded border border-[#404040] bg-[#1e1e1e]"
												>
													<div className="w-4 h-4 rounded border border-[#505050]" />
													<div className="w-6 h-6 rounded bg-[#404040]" />
													<div className="h-3 flex-1 bg-[#404040] rounded" />
												</div>
											))}
										</div>
									</div>
								}
							>
								<LayersPanel />
							</Suspense>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>

				{/* Status Bar - Photoshop style */}
				<Suspense
					fallback={
						<div className="h-8 bg-linear-to-b from-[#2a2a2a] to-[#1e1e1e] border-t border-[#404040] flex items-center px-4 text-xs text-[#b0b0b0]">
							<div className="flex items-center gap-4">
								<div className="h-3 w-16 bg-[#404040] rounded" />
								<div className="h-3 w-20 bg-[#404040] rounded" />
								<div className="h-3 w-24 bg-[#404040] rounded" />
							</div>
						</div>
					}
				>
					<StatusBar />
				</Suspense>
			</div>
		</TooltipProvider>
	);
};

export default HomeWrapper;
