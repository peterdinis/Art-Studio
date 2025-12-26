import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	Keyboard,
	Mouse,
	Move,
	Paintbrush,
	Square,
	Layers,
	Eye,
	Palette,
	History,
	FileText,
} from "lucide-react";

interface ShortcutItem {
	keys: string[];
	description: string;
}

interface ShortcutCategory {
	name: string;
	icon: React.ReactNode;
	shortcuts: ShortcutItem[];
}

const shortcutCategories: ShortcutCategory[] = [
	{
		name: "Tools",
		icon: <Paintbrush className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["V"], description: "Move Tool" },
			{ keys: ["M"], description: "Marquee Selection Tool" },
			{ keys: ["L"], description: "Lasso Tool" },
			{ keys: ["W"], description: "Magic Wand Tool" },
			{ keys: ["C"], description: "Crop Tool" },
			{ keys: ["I"], description: "Eyedropper Tool" },
			{ keys: ["S"], description: "Clone Stamp Tool" },
			{ keys: ["J"], description: "Healing Brush Tool" },
			{ keys: ["B"], description: "Brush Tool" },
			{ keys: ["N"], description: "Pencil Tool" },
			{ keys: ["E"], description: "Eraser Tool" },
			{ keys: ["G"], description: "Paint Bucket Tool" },
			{ keys: ["R"], description: "Blur Tool" },
			{ keys: ["P"], description: "Pen Tool" },
			{ keys: ["T"], description: "Text Tool" },
			{ keys: ["A"], description: "Path Selection Tool" },
			{ keys: ["U"], description: "Rectangle Tool" },
			{ keys: ["H"], description: "Hand Tool" },
			{ keys: ["Z"], description: "Zoom Tool" },
		],
	},
	{
		name: "Color",
		icon: <Palette className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["X"], description: "Swap Foreground/Background Colors" },
			{ keys: ["D"], description: "Reset to Default Colors (Black/White)" },
		],
	},
	{
		name: "Selection",
		icon: <Square className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["Ctrl/⌘", "A"], description: "Select All" },
			{ keys: ["Ctrl/⌘", "D"], description: "Deselect" },
			{ keys: ["Ctrl/⌘", "Shift", "I"], description: "Inverse Selection" },
			{ keys: ["Delete"], description: "Delete Selected" },
			{ keys: ["Backspace"], description: "Delete Selected" },
		],
	},
	{
		name: "Edit",
		icon: <History className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["Ctrl/⌘", "Z"], description: "Undo" },
			{ keys: ["Ctrl/⌘", "Shift", "Z"], description: "Redo" },
			{ keys: ["Ctrl/⌘", "C"], description: "Copy" },
			{ keys: ["Ctrl/⌘", "V"], description: "Paste" },
			{ keys: ["Ctrl/⌘", "X"], description: "Cut" },
			{ keys: ["Ctrl/⌘", "Shift", "C"], description: "Copy Merged" },
		],
	},
	{
		name: "Transform",
		icon: <Move className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["Ctrl/⌘", "T"], description: "Free Transform" },
			{ keys: ["Enter"], description: "Apply Transform" },
			{ keys: ["Escape"], description: "Cancel Transform" },
			{
				keys: ["Shift"],
				description: "Constrain Proportions (while dragging)",
			},
			{
				keys: ["Alt/⌥"],
				description: "Transform from Center (while dragging)",
			},
		],
	},
	{
		name: "Layers",
		icon: <Layers className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["Ctrl/⌘", "Shift", "N"], description: "New Layer" },
			{ keys: ["Ctrl/⌘", "J"], description: "Duplicate Layer" },
			{ keys: ["Ctrl/⌘", "E"], description: "Merge Down" },
			{ keys: ["Ctrl/⌘", "Shift", "E"], description: "Merge Visible" },
			{ keys: ["Ctrl/⌘", "]"], description: "Bring Forward" },
			{ keys: ["Ctrl/⌘", "["], description: "Send Backward" },
			{ keys: ["Ctrl/⌘", "Shift", "]"], description: "Bring to Front" },
			{ keys: ["Ctrl/⌘", "Shift", "["], description: "Send to Back" },
		],
	},
	{
		name: "View",
		icon: <Eye className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["Ctrl/⌘", "+"], description: "Zoom In" },
			{ keys: ["Ctrl/⌘", "-"], description: "Zoom Out" },
			{ keys: ["Ctrl/⌘", "0"], description: "Fit on Screen" },
			{ keys: ["Ctrl/⌘", "1"], description: "Actual Pixels (100%)" },
			{ keys: ["Space"], description: "Temporarily Hand Tool (hold)" },
			{ keys: ["Tab"], description: "Toggle Panels" },
			{ keys: ["F"], description: "Cycle Screen Modes" },
		],
	},
	{
		name: "File",
		icon: <FileText className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["Ctrl/⌘", "N"], description: "New Document" },
			{ keys: ["Ctrl/⌘", "O"], description: "Open File" },
			{ keys: ["Ctrl/⌘", "S"], description: "Save" },
			{ keys: ["Ctrl/⌘", "Shift", "S"], description: "Save As" },
			{ keys: ["Ctrl/⌘", "Shift", "Alt", "S"], description: "Export for Web" },
			{ keys: ["Ctrl/⌘", "W"], description: "Close Document" },
		],
	},
	{
		name: "Brush",
		icon: <Paintbrush className="h-4 w-4" />,
		shortcuts: [
			{ keys: ["["], description: "Decrease Brush Size" },
			{ keys: ["]"], description: "Increase Brush Size" },
			{ keys: ["{"], description: "Decrease Brush Hardness" },
			{ keys: ["}"], description: "Increase Brush Hardness" },
			{ keys: ["1-9"], description: "Set Brush Opacity (10%-90%)" },
			{ keys: ["0"], description: "Set Brush Opacity to 100%" },
		],
	},
];

interface KeyboardShortcutsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog: React.FC<
	KeyboardShortcutsDialogProps
> = ({ open, onOpenChange }) => {
	// Global keyboard shortcut to open the dialog
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl/Cmd + / to open shortcuts
			if ((e.ctrlKey || e.metaKey) && e.key === "/") {
				e.preventDefault();
				onOpenChange(!open);
			}
			// Also support F1 or ?
			if (e.key === "F1" || (e.shiftKey && e.key === "?")) {
				e.preventDefault();
				onOpenChange(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0">
				<DialogHeader className="p-6 pb-4">
					<DialogTitle className="flex items-center gap-2 text-xl">
						<Keyboard className="h-5 w-5" />
						Keyboard Shortcuts
					</DialogTitle>
					<p className="text-sm text-muted-foreground mt-1">
						Press{" "}
						<Badge variant="outline" className="mx-1 font-mono text-xs">
							Ctrl/⌘ + /
						</Badge>
						or{" "}
						<Badge variant="outline" className="mx-1 font-mono text-xs">
							?
						</Badge>{" "}
						to toggle this panel
					</p>
				</DialogHeader>

				<Separator />

				<ScrollArea className="h-[60vh] px-6 py-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{shortcutCategories.map((category) => (
							<div key={category.name} className="space-y-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
									{category.icon}
									<span>{category.name}</span>
								</div>
								<div className="space-y-1.5">
									{category.shortcuts.map((shortcut, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
										>
											<span className="text-sm text-muted-foreground">
												{shortcut.description}
											</span>
											<div className="flex items-center gap-1">
												{shortcut.keys.map((key, keyIdx) => (
													<React.Fragment key={keyIdx}>
														<Badge
															variant="secondary"
															className="font-mono text-xs px-1.5 py-0.5 min-w-[24px] justify-center"
														>
															{key}
														</Badge>
														{keyIdx < shortcut.keys.length - 1 && (
															<span className="text-muted-foreground text-xs">
																+
															</span>
														)}
													</React.Fragment>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					<Separator className="my-6" />

					<div className="space-y-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
							<Mouse className="h-4 w-4" />
							<span>Mouse & Gestures</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
							{[
								{ action: "Left Click", description: "Select / Use Tool" },
								{ action: "Right Click", description: "Context Menu" },
								{ action: "Middle Click + Drag", description: "Pan Canvas" },
								{ action: "Scroll Wheel", description: "Zoom In/Out" },
								{ action: "Shift + Click", description: "Add to Selection" },
								{
									action: "Alt/⌥ + Click",
									description: "Subtract from Selection",
								},
								{
									action: "Double Click",
									description: "Edit Text / Open Settings",
								},
								{ action: "Ctrl/⌘ + Click", description: "Select Layer" },
							].map((item, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
								>
									<span className="text-sm text-muted-foreground">
										{item.description}
									</span>
									<Badge
										variant="secondary"
										className="font-mono text-xs px-1.5 py-0.5"
									>
										{item.action}
									</Badge>
								</div>
							))}
						</div>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};
