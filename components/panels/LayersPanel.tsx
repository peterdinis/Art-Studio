"use client";

import React, { useState } from "react";
import { useArtStudioStore } from "@/stores/artStudioStore";
import {
	Eye,
	EyeOff,
	Lock,
	Unlock,
	Plus,
	Trash2,
	GripVertical,
	Layers,
	MoreHorizontal,
	Copy,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const LayersPanel: React.FC = () => {
	const {
		layers,
		activeLayerId,
		addLayer,
		removeLayer,
		setActiveLayer,
		toggleLayerVisibility,
		toggleLayerLock,
		setLayerOpacity,
		renameLayer,
		duplicateLayer,
		reorderLayers,
	} = useArtStudioStore();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");

	const handleStartRename = (id: string, currentName: string) => {
		setEditingId(id);
		setEditName(currentName);
	};

	const handleFinishRename = () => {
		if (editingId && editName.trim()) {
			renameLayer(editingId, editName.trim());
		}
		setEditingId(null);
		setEditName("");
	};

	const handleDeleteLayer = (id: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (layers.length <= 1) {
			toast.error("Cannot delete the last layer");
			return;
		}
		removeLayer(id);
		toast.success("Layer deleted");
	};

	const handleDuplicateLayer = (id: string) => {
		duplicateLayer(id);
		toast.success("Layer duplicated");
	};

	const handleMoveUp = (index: number) => {
		if (index > 0) {
			reorderLayers(index, index - 1);
		}
	};

	const handleMoveDown = (index: number) => {
		if (index < layers.length - 1) {
			reorderLayers(index, index + 1);
		}
	};

	const activeLayer = layers.find((l) => l.id === activeLayerId);

	return (
		<div className="panel-glass p-4 w-full flex flex-col animate-fade-in">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<Layers className="w-4 h-4 text-muted-foreground" />
					<h3 className="text-sm font-medium text-foreground">Layers</h3>
					<span className="text-xs text-muted-foreground">
						({layers.length})
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<button onClick={addLayer} className="tool-button w-7 h-7">
								<Plus className="w-4 h-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							<div className="flex items-center gap-2">
								<span>New Layer</span>
								<kbd className="px-1 py-0.5 text-xs bg-white text-black rounded">
									⇧⌘N
								</kbd>
							</div>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={() =>
									activeLayerId && handleDeleteLayer(activeLayerId)
								}
								className="tool-button w-7 h-7"
								disabled={layers.length <= 1}
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							<div className="flex items-center gap-2">
								<span>Delete Layer</span>
								<kbd className="px-1 py-0.5 text-xs bg-white text-black rounded">
									Del
								</kbd>
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Layer List or Empty State */}
			{layers.length === 0 ? (
				<div className="flex-1 flex items-center justify-center py-12">
					<div className="text-center text-muted-foreground">
						<Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
						<p className="text-sm mb-1">No layers yet</p>
						<p className="text-xs mb-4">Click the + button to create a layer</p>
						<button
							onClick={addLayer}
							className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
						>
							Create First Layer
						</button>
					</div>
				</div>
			) : (
				<div className="flex-1 space-y-1 max-h-75 overflow-y-auto scrollbar-thin">
					{layers.map((layer, index) => (
						<div
							key={layer.id}
							onClick={() => setActiveLayer(layer.id)}
							className={`layer-item group ${activeLayerId === layer.id ? "selected" : ""}`}
						>
							{/* Drag Handle */}
							<GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

							{/* Visibility Toggle */}
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={(e) => {
											e.stopPropagation();
											toggleLayerVisibility(layer.id);
										}}
										className={`shrink-0 transition-colors ${layer.visible ? "text-foreground" : "text-muted-foreground/50"}`}
									>
										{layer.visible ? (
											<Eye className="w-4 h-4" />
										) : (
											<EyeOff className="w-4 h-4" />
										)}
									</button>
								</TooltipTrigger>
								<TooltipContent side="top">
									{layer.visible ? "Hide Layer" : "Show Layer"}
								</TooltipContent>
							</Tooltip>

							{/* Lock Toggle */}
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={(e) => {
											e.stopPropagation();
											toggleLayerLock(layer.id);
										}}
										className={`shrink-0 transition-colors ${layer.locked ? "text-yellow-500" : "text-muted-foreground/50 opacity-0 group-hover:opacity-100"}`}
									>
										{layer.locked ? (
											<Lock className="w-3.5 h-3.5" />
										) : (
											<Unlock className="w-3.5 h-3.5" />
										)}
									</button>
								</TooltipTrigger>
								<TooltipContent side="top">
									{layer.locked ? "Unlock Layer" : "Lock Layer"}
								</TooltipContent>
							</Tooltip>

							{/* Layer Name */}
							<div className="flex-1 min-w-0">
								{editingId === layer.id ? (
									<input
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										onBlur={handleFinishRename}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleFinishRename();
											if (e.key === "Escape") setEditingId(null);
										}}
										onClick={(e) => e.stopPropagation()}
										className="w-full bg-background px-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
										autoFocus
									/>
								) : (
									<span
										onDoubleClick={(e) => {
											e.stopPropagation();
											handleStartRename(layer.id, layer.name);
										}}
										className={`text-sm truncate block cursor-text ${!layer.visible ? "text-muted-foreground/50 italic" : ""}`}
									>
										{layer.name}
									</span>
								)}
							</div>

							{/* Opacity Badge */}
							<span className="text-xs font-mono text-muted-foreground shrink-0">
								{layer.opacity}%
							</span>

							{/* Layer Menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
									<button className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 shrink-0">
										<MoreHorizontal className="w-4 h-4" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem
										onClick={() => handleDuplicateLayer(layer.id)}
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate Layer
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleStartRename(layer.id, layer.name)}
									>
										Rename Layer
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleMoveUp(index)}
										disabled={index === 0}
									>
										<ArrowUp className="w-4 h-4 mr-2" />
										Move Up
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleMoveDown(index)}
										disabled={index === layers.length - 1}
									>
										<ArrowDown className="w-4 h-4 mr-2" />
										Move Down
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => toggleLayerVisibility(layer.id)}
									>
										{layer.visible ? (
											<EyeOff className="w-4 h-4 mr-2" />
										) : (
											<Eye className="w-4 h-4 mr-2" />
										)}
										{layer.visible ? "Hide Layer" : "Show Layer"}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => toggleLayerLock(layer.id)}>
										{layer.locked ? (
											<Unlock className="w-4 h-4 mr-2" />
										) : (
											<Lock className="w-4 h-4 mr-2" />
										)}
										{layer.locked ? "Unlock Layer" : "Lock Layer"}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleDeleteLayer(layer.id)}
										disabled={layers.length <= 1}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete Layer
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					))}
				</div>
			)}

			{/* Layer Opacity Slider */}
			{activeLayer && (
				<div className="pt-3 mt-3 border-t border-border space-y-3">
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground">Layer Opacity</span>
						<span className="text-xs font-mono text-foreground">
							{activeLayer.opacity}%
						</span>
					</div>
					<Slider
						value={[activeLayer.opacity]}
						onValueChange={([value]) => setLayerOpacity(activeLayerId!, value)}
						min={0}
						max={100}
						step={1}
					/>
				</div>
			)}
		</div>
	);
};