"use client";

import React from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubTrigger,
	ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { useZoom } from "@/hooks/useZoom";
import { useArtStudioStore } from "@/stores/artStudioStore";
import {
	ZoomIn,
	ZoomOut,
	Maximize,
	Minimize,
	Undo2,
	Redo2,
	Trash2,
	MousePointer2,
	Eye,
	EyeOff,
	Lock,
	Unlock,
	Copy,
	Layers,
} from "lucide-react";

interface CanvasContextMenuProps {
	children: React.ReactNode;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
	children,
}) => {
	const {
		zoomIn,
		zoomOut,
		zoomToFit,
		zoomToActualSize,
		zoomToSelection,
		zoomPercentage,
	} = useZoom();

	const {
		undo,
		redo,
		canUndo,
		canRedo,
		selectedId,
		setSelectedId,
		activeLayerId,
		layers,
		toggleLayerVisibility,
		toggleLayerLock,
		duplicateLayer,
		removeLayer,
	} = useArtStudioStore();

	const activeLayer = layers.find((l) => l.id === activeLayerId);

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<ZoomIn className="mr-2 h-4 w-4" />
						<span>Zoom</span>
						<span className="ml-auto text-xs text-muted-foreground">
							{zoomPercentage}%
						</span>
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem onClick={() => zoomIn()}>
							<ZoomIn className="mr-2 h-4 w-4" />
							<span>Zoom In</span>
							<ContextMenuShortcut>⌘+</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem onClick={() => zoomOut()}>
							<ZoomOut className="mr-2 h-4 w-4" />
							<span>Zoom Out</span>
							<ContextMenuShortcut>⌘-</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={() => zoomToActualSize()}>
							<MousePointer2 className="mr-2 h-4 w-4" />
							<span>Actual Size (100%)</span>
							<ContextMenuShortcut>⌘0</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem onClick={() => zoomToFit()}>
							<Maximize className="mr-2 h-4 w-4" />
							<span>Fit to Screen</span>
							<ContextMenuShortcut>⌘1</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => zoomToSelection()}
							disabled={!selectedId}
						>
							<Minimize className="mr-2 h-4 w-4" />
							<span>Zoom to Selection</span>
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={() => undo()} disabled={!canUndo()}>
					<Undo2 className="mr-2 h-4 w-4" />
					<span>Undo</span>
					<ContextMenuShortcut>⌘Z</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem onClick={() => redo()} disabled={!canRedo()}>
					<Redo2 className="mr-2 h-4 w-4" />
					<span>Redo</span>
					<ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Layers className="mr-2 h-4 w-4" />
						<span>Layer Actions</span>
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						{activeLayer && (
							<>
								<ContextMenuItem
									onClick={() => toggleLayerVisibility(activeLayer.id)}
								>
									{activeLayer.visible ? (
										<EyeOff className="mr-2 h-4 w-4" />
									) : (
										<Eye className="mr-2 h-4 w-4" />
									)}
									<span>
										{activeLayer.visible ? "Hide Layer" : "Show Layer"}
									</span>
								</ContextMenuItem>
								<ContextMenuItem
									onClick={() => toggleLayerLock(activeLayer.id)}
								>
									{activeLayer.locked ? (
										<Unlock className="mr-2 h-4 w-4" />
									) : (
										<Lock className="mr-2 h-4 w-4" />
									)}
									<span>
										{activeLayer.locked ? "Unlock Layer" : "Lock Layer"}
									</span>
								</ContextMenuItem>
								<ContextMenuItem onClick={() => duplicateLayer(activeLayer.id)}>
									<Copy className="mr-2 h-4 w-4" />
									<span>Duplicate Layer</span>
								</ContextMenuItem>
								<ContextMenuSeparator />
								<ContextMenuItem
									variant="destructive"
									onClick={() => removeLayer(activeLayer.id)}
									disabled={layers.length <= 1}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									<span>Delete Layer</span>
								</ContextMenuItem>
							</>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{selectedId && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem
							variant="destructive"
							onClick={() => {
								// We need a deleteSelectedObject in the store or handle it here
								window.dispatchEvent(
									new CustomEvent("artstudio:delete-selected"),
								);
							}}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							<span>Delete Selected</span>
							<ContextMenuShortcut>⌫</ContextMenuShortcut>
						</ContextMenuItem>
					</>
				)}

				<ContextMenuSeparator />
				<ContextMenuItem
					onClick={() => setSelectedId(null)}
					disabled={!selectedId}
				>
					<span>Deselect All</span>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
