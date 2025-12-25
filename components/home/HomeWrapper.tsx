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

const HomeWrapper: FC = () => {
	return (
		<TooltipProvider delayDuration={200}>
			<div className="h-screen w-full flex flex-col overflow-hidden bg-background">
				{/* Top Menu Bar - Photoshop style */}
				<Suspense
					fallback={
						<div className="h-12 bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] border-b border-[#404040] flex items-center px-4 animate-pulse">
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
				<div className="flex-1 flex overflow-hidden">
					{/* Left Tool Sidebar - Photoshop style */}
					<Suspense
						fallback={
							<div className="w-16 bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] border-r border-[#404040] flex flex-col items-center py-4 gap-3">
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

					{/* Canvas Area - Photoshop style */}
					<Suspense
						fallback={
							<div className="flex-1 bg-gradient-to-br from-[#252525] to-[#1a1a1a] flex items-center justify-center relative">
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
										{/* Photoshop logo style loading */}
										<div className="w-24 h-24 border-4 border-[#404040] rounded-lg relative overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-br from-[#31a8ff] to-[#1473e6] opacity-20" />
											<div className="absolute top-2 left-2 w-8 h-8 bg-[#31a8ff]/30 rounded" />
											<div className="absolute bottom-2 right-2 w-6 h-6 bg-[#1473e6]/30 rounded" />

											{/* Animated bar */}
											<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#31a8ff] via-[#1473e6] to-[#31a8ff] animate-progress" />
										</div>

										{/* Ps letters */}
										<div className="absolute inset-0 flex items-center justify-center">
											<span className="text-2xl font-bold text-white/50">
												Ps
											</span>
										</div>
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
						}
					>
						<DrawingCanvas />
					</Suspense>

					{/* Right Panels - Photoshop style */}
					<div className="w-72 flex flex-col gap-4 p-5 overflow-y-auto scrollbar-thin bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] border-l border-[#404040]">
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
										<div className="w-16 h-16 rounded bg-gradient-to-br from-[#31a8ff] to-[#1473e6] border border-[#404040]" />
										<div className="w-16 h-16 rounded bg-gradient-to-br from-[#ff3131] to-[#e61414] border border-[#404040]" />
									</div>
									<div className="grid grid-cols-4 gap-2">
										{[...Array(8)].map((_, i) => (
											<div
												key={i}
												className="aspect-square rounded bg-[#404040] border border-[#505050]"
											/>
										))}
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
				</div>

				{/* Status Bar - Photoshop style */}
				<Suspense
					fallback={
						<div className="h-8 bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] border-t border-[#404040] flex items-center px-4 text-xs text-[#b0b0b0]">
							<div className="flex items-center gap-4">
								<div className="h-3 w-16 bg-[#404040] rounded" />
								<div className="h-3 w-20 bg-[#404040] rounded" />
								<div className="h-3 w-24 bg-[#404040] rounded" />
							</div>
							<div className="ml-auto flex items-center gap-2">
								<div className="h-3 w-12 bg-[#404040] rounded" />
								<div className="h-3 w-8 bg-[#404040] rounded" />
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
