"use client";

import React from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { History, RotateCcw, Trash2 } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const HistoryPanel: React.FC = () => {
	const { history, historyIndex, restoreToHistoryIndex, clearHistory } =
		useArtStudioStore();

	const handleRestore = (index: number) => {
		if (index === historyIndex) return;
		restoreToHistoryIndex(index);
		toast.success(`Restored to state ${index + 1}`);
	};

	const handleClearHistory = () => {
		if (history.length <= 1) return;
		clearHistory();
		toast.success("History cleared");
	};

	return (
		<div className="panel-glass p-4 w-64 flex flex-col animate-fade-in">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<History className="w-4 h-4 text-muted-foreground" />
					<h3 className="text-sm font-medium text-foreground">History</h3>
					<span className="text-xs text-muted-foreground">
						({history.length})
					</span>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleClearHistory}
							className="tool-button w-7 h-7"
							disabled={history.length <= 1}
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Clear History</TooltipContent>
				</Tooltip>
			</div>

			{/* History List */}
			<ScrollArea className="flex-1 max-h-[250px]">
				<div className="space-y-2 pr-2">
					{history.map((entry, index) => (
						<button
							key={entry.timestamp}
							onClick={() => handleRestore(index)}
							className={`w-full group relative rounded-lg border transition-all overflow-hidden ${
								index === historyIndex
									? "border-primary bg-primary/10 ring-1 ring-primary/50"
									: "border-border hover:border-primary/50 bg-card"
							}`}
						>
							{/* Thumbnail */}
							<div className="aspect-video w-full bg-muted relative overflow-hidden">
								{entry.thumbnail ? (
									<img
										src={entry.thumbnail}
										alt={`State ${index + 1}`}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-muted-foreground">
										<History className="w-6 h-6 opacity-50" />
									</div>
								)}

								{/* Hover overlay */}
								{index !== historyIndex && (
									<div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										<div className="flex items-center gap-1 text-xs text-foreground">
											<RotateCcw className="w-3.5 h-3.5" />
											<span>Restore</span>
										</div>
									</div>
								)}

								{/* Current indicator */}
								{index === historyIndex && (
									<div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
										Current
									</div>
								)}
							</div>

							{/* Info */}
							<div className="p-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-foreground">
										State {index + 1}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{formatDistanceToNow(entry.timestamp, { addSuffix: true })}
									</span>
								</div>
								{entry.action && (
									<p className="text-[10px] text-muted-foreground truncate mt-0.5">
										{entry.action}
									</p>
								)}
							</div>
						</button>
					))}
				</div>
			</ScrollArea>

			{/* Footer info */}
			{history.length > 0 && (
				<div className="pt-3 mt-3 border-t border-border">
					<p className="text-xs text-muted-foreground text-center">
						Click any state to restore. Max 50 states stored.
					</p>
				</div>
			)}
		</div>
	);
};
