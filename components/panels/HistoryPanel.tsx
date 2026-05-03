"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { History, RotateCcw, Trash2 } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
	canvasHistoryCollection,
	replaceCanvasHistoryFrames,
	type CanvasHistoryFrame,
} from "@/lib/canvasHistoryCollection";

export const HistoryPanel: React.FC = () => {
	const historyIndex = useArtStudioStore((s) => s.historyIndex);
	const storeHistory = useArtStudioStore((s) => s.history);
	const { restoreToHistoryIndex, clearSessionHistory } = useArtStudioStore();

	const { data: liveFrames = [] } = useLiveQuery(
		(q) =>
			q
				.from({ frame: canvasHistoryCollection })
				.orderBy(({ frame }) => frame.timestamp, "asc")
				.select(({ frame }) => ({
					id: frame.id,
					canvasData: frame.canvasData,
					thumbnail: frame.thumbnail,
					timestamp: frame.timestamp,
					action: frame.action,
				})),
		[],
	);

	// Tests / dev: Zustand may be set without going through addToHistory — mirror into TanStack DB
	useEffect(() => {
		const dbSize = canvasHistoryCollection.size;
		if (storeHistory.length !== dbSize) {
			replaceCanvasHistoryFrames(storeHistory);
		}
	}, [storeHistory]);

	const frames: CanvasHistoryFrame[] =
		liveFrames.length > 0
			? liveFrames.map((f) => ({
					id: f.id,
					canvasData: f.canvasData,
					thumbnail: f.thumbnail,
					timestamp: f.timestamp,
					action: f.action,
				}))
			: storeHistory.map((e, i) => ({
					id: e.id ?? `legacy-${i}-${e.timestamp}`,
					canvasData: e.canvasData,
					thumbnail: e.thumbnail,
					timestamp: e.timestamp,
					action: e.action,
				}));

	const frameCount = frames.length;
	const maxIdx = Math.max(0, frameCount - 1);

	const [scrubIndex, setScrubIndex] = useState(historyIndex);
	useEffect(() => {
		setScrubIndex(historyIndex);
	}, [historyIndex]);

	const handleRestore = (index: number) => {
		if (index === historyIndex) return;
		restoreToHistoryIndex(index);
		toast.success(`Restored to frame ${index + 1} / ${frameCount}`);
	};

	const handleClearHistory = async () => {
		if (frameCount === 0) return;

		if (
			window.confirm(
				"Are you sure you want to clear all history? This cannot be undone.",
			)
		) {
			try {
				await clearSessionHistory();
				toast.success("History cleared");
			} catch (error) {
				console.error("Failed to clear history:", error);
				toast.error("Failed to clear history");
			}
		}
	};

	return (
		<div className="panel-glass p-4 w-full flex flex-col animate-fade-in">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<History className="w-4 h-4 text-muted-foreground" />
					<h3 className="text-sm font-medium text-foreground">History</h3>
					<span className="text-xs text-muted-foreground">({frameCount})</span>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => void handleClearHistory()}
							className="tool-button w-7 h-7"
							disabled={frameCount === 0}
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Clear All History</TooltipContent>
				</Tooltip>
			</div>

			{frameCount > 0 && (
				<div className="space-y-2 mb-4">
					<div className="flex justify-between items-center text-xs text-muted-foreground">
						<span>Timeline</span>
						<span className="font-mono text-foreground">
							Frame {historyIndex + 1} / {frameCount}
						</span>
					</div>
					<Slider
						value={[scrubIndex]}
						min={0}
						max={maxIdx}
						step={1}
						onValueChange={([v]) => setScrubIndex(v)}
						onValueCommit={([v]) => handleRestore(v)}
						disabled={frameCount <= 1}
					/>
				</div>
			)}

			<ScrollArea className="flex-1 max-h-100">
				<div className="space-y-2 pr-2">
					{frameCount === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<History className="w-12 h-12 mx-auto mb-2 opacity-30" />
							<p className="text-sm">No history yet</p>
							<p className="text-xs mt-1">
								Start drawing to create history states
							</p>
						</div>
					) : (
						frames.map((entry, index) => (
							<button
								type="button"
								key={entry.id}
								onClick={() => handleRestore(index)}
								className={`w-full group relative rounded-lg border transition-all overflow-hidden ${
									index === historyIndex
										? "border-primary bg-primary/10 ring-1 ring-primary/50"
										: "border-border hover:border-primary/50 bg-card"
								}`}
							>
								<div className="aspect-video w-full bg-muted relative overflow-hidden">
									{entry.thumbnail ? (
										<img
											src={entry.thumbnail}
											alt={`Frame ${index + 1}`}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-muted-foreground">
											<History className="w-6 h-6 opacity-50" />
										</div>
									)}

									{index !== historyIndex && (
										<div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<div className="flex items-center gap-1 text-xs text-foreground">
												<RotateCcw className="w-3.5 h-3.5" />
												<span>Restore</span>
											</div>
										</div>
									)}

									{index === historyIndex && (
										<div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
											Current
										</div>
									)}
								</div>

								<div className="p-2">
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium text-foreground">
											Frame {index + 1}
										</span>
										<span className="text-[10px] text-muted-foreground">
											{formatDistanceToNow(entry.timestamp, {
												addSuffix: true,
											})}
										</span>
									</div>
									{entry.action && (
										<p className="text-[10px] text-muted-foreground truncate mt-0.5">
											{entry.action}
										</p>
									)}
								</div>
							</button>
						))
					)}
				</div>
			</ScrollArea>

			{frameCount > 0 && (
				<div className="pt-3 mt-3 border-t border-border">
					<p className="text-xs text-muted-foreground text-center">
						Drag the timeline or click a frame to restore. Max 50 frames.
					</p>
				</div>
			)}
		</div>
	);
};
