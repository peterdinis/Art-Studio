"use client";

import { ComponentType, FC, useState } from "react";
import {
	File,
	FolderOpen,
	Save,
	Download,
	Settings,
	HelpCircle,
	Palette,
	Grid3X3,
	Plus,
	Trash2,
	Copy,
	Clipboard,
	Scissors,
	RotateCcw,
	RotateCw,
	ZoomIn,
	ZoomOut,
	Maximize,
	FlipHorizontal,
	FlipVertical,
	Image,
	Layers,
	Sliders,
	Wand2,
	Sparkles,
	Sun,
	Contrast,
	Droplets,
	Focus,
	SlidersHorizontal,
	PanelLeft,
	PanelRight,
	Keyboard,
	Info,
	BookOpen,
	MessageCircle,
	Crop,
	Move,
	Scale,
	Replace,
	Eraser,
	PaintBucket,
	Blend,
	Lock,
	Unlock,
	EyeOff,
	Eye,
	Merge,
	ArrowUp,
	ArrowDown,
	Share2,
	FileImage,
	FileJson,
	Printer,
	LayoutTemplate,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
	DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useArtStudioStore, Tool } from "@/stores/artStudioStore";
import { toast } from "sonner";
import { TemplatesDialog } from "../templates/TemplatesDialog";
import { ModeToggle } from "../shared/ModeToggle";

interface MenuItemConfig {
	label: string;
	icon?: ComponentType<{ className?: string }>;
	shortcut?: string;
	action?: () => void;
	disabled?: boolean;
	submenu?: MenuItemConfig[];
	separator?: boolean;
}

// Get canvas reference from window for direct manipulation
declare global {
	interface Window {
		fabricCanvas?: any;
		copiedObject?: any;
	}
}

export const TopMenuBar: FC = () => {
	const [showTemplates, setShowTemplates] = useState(false);

	const {
		undo,
		redo,
		canUndo,
		canRedo,
		setZoom,
		zoom,
		layers,
		activeLayerId,
		removeLayer,
		addLayer,
		toggleLayerVisibility,
		setCanvasSize,
		setActiveTool,
		primaryColor,
		secondaryColor,
		clearHistory,
		duplicateLayer,
	} = useArtStudioStore();

	const getCanvas = () => window.fabricCanvas;

	const handleNewCanvas = () => {
		setShowTemplates(true);
	};

	const handleOpenFile = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*,.psd,.json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					const result = event.target?.result as string;
					const store = useArtStudioStore.getState();
					store.addLoadedImage({
						id: `img-${Date.now()}`,
						src: result,
						name: file.name,
					});
					toast.success(`Opened: ${file.name}`);
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	};

	const handleSave = () => {
		const canvas = getCanvas();
		if (canvas) {
			const json = JSON.stringify(canvas.toJSON());
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "artwork.json";
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Project saved");
		} else {
			toast.success("Project saved");
		}
	};

	const handleExport = (format: string) => {
		const canvas = getCanvas();
		if (canvas) {
			const dataURL = canvas.toDataURL({
				format: format.toLowerCase() === "jpeg" ? "jpeg" : "png",
				quality: 0.9,
				multiplier: 1,
			});
			const a = document.createElement("a");
			a.href = dataURL;
			a.download = `artwork.${format.toLowerCase()}`;
			a.click();
			toast.success(`Exported as ${format}`);
		} else {
			toast.success(`Exporting as ${format}...`);
		}
	};

	const handleGlobalDelete = () => {
		const canvas = getCanvas();
		if (canvas) {
			canvas.clear();
			canvas.backgroundColor = "#2d3748";
			canvas.renderAll();
			clearHistory();
		}
		toast.warning("All canvas content deleted");
	};

	const handleClearCanvas = () => {
		const canvas = getCanvas();
		if (canvas) {
			canvas.clear();
			canvas.backgroundColor = "#2d3748";
			canvas.renderAll();
		}
		toast.success("Canvas cleared");
	};

	const handleDeleteSelection = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObjects = canvas.getActiveObjects();
			if (activeObjects.length > 0) {
				activeObjects.forEach((obj: any) => canvas.remove(obj));
				canvas.discardActiveObject();
				canvas.renderAll();
				toast.success("Selection deleted");
			} else {
				toast.info("No selection to delete");
			}
		}
	};

	const handleCopy = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.clone().then((cloned: any) => {
					window.copiedObject = cloned;
					toast.success("Copied");
				});
			} else {
				toast.info("Nothing to copy");
			}
		}
	};

	const handlePaste = () => {
		const canvas = getCanvas();
		if (canvas && (window as any).copiedObject) {
			(window as any).copiedObject.clone().then((cloned: any) => {
				cloned.set({
					left: (cloned.left || 0) + 20,
					top: (cloned.top || 0) + 20,
				});
				canvas.add(cloned);
				canvas.setActiveObject(cloned);
				canvas.renderAll();
				toast.success("Pasted");
			});
		}
	};

	const handleCut = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.clone().then((cloned: any) => {
					(window as any).copiedObject = cloned;
					canvas.remove(activeObject);
					canvas.renderAll();
					toast.success("Cut");
				});
			}
		}
	};

	const handleFlipHorizontal = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set("flipX", !activeObject.flipX);
				canvas.renderAll();
				toast.success("Flipped horizontal");
			}
		}
	};

	const handleFlipVertical = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set("flipY", !activeObject.flipY);
				canvas.renderAll();
				toast.success("Flipped vertical");
			}
		}
	};

	const handleRotate = (angle: number) => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.rotate((activeObject.angle || 0) + angle);
				canvas.renderAll();
				toast.success(`Rotated ${angle}°`);
			}
		}
	};

	const handleFillWithColor = (color: string) => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				activeObject.set("fill", color);
				canvas.renderAll();
				toast.success("Fill applied");
			} else {
				canvas.backgroundColor = color;
				canvas.renderAll();
				toast.success("Background filled");
			}
		}
	};

	const handleBringForward = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.bringObjectForward(activeObject);
				canvas.renderAll();
				toast.success("Brought forward");
			}
		}
	};

	const handleSendBackward = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.sendObjectBackwards(activeObject);
				canvas.renderAll();
				toast.success("Sent backward");
			}
		}
	};

	const handleBringToFront = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.bringObjectToFront(activeObject);
				canvas.renderAll();
				toast.success("Brought to front");
			}
		}
	};

	const handleSendToBack = () => {
		const canvas = getCanvas();
		if (canvas) {
			const activeObject = canvas.getActiveObject();
			if (activeObject) {
				canvas.sendObjectToBack(activeObject);
				canvas.renderAll();
				toast.success("Sent to back");
			}
		}
	};

	const handleSelectTool = (tool: Tool) => {
		setActiveTool(tool);
		toast.info(`${tool} tool selected`);
	};

	const handleApplyFilter = (filter: string) => {
		toast.info(`Applied ${filter} filter`);
	};

	const fileMenu: MenuItemConfig[] = [
		{
			label: "New Canvas",
			icon: Plus,
			shortcut: "⌘N",
			action: handleNewCanvas,
		},
		{
			label: "New from Template...",
			icon: LayoutTemplate,
			action: () => setShowTemplates(true),
		},
		{
			label: "Open...",
			icon: FolderOpen,
			shortcut: "⌘O",
			action: handleOpenFile,
		},
		{ separator: true, label: "" },
		{ label: "Save", icon: Save, shortcut: "⌘S", action: handleSave },
		{
			label: "Save As...",
			icon: Save,
			shortcut: "⇧⌘S",
			action: () => toast.info("Save As..."),
		},
		{ separator: true, label: "" },
		{
			label: "Export",
			icon: Download,
			submenu: [
				{ label: "PNG", icon: FileImage, action: () => handleExport("PNG") },
				{ label: "JPEG", icon: FileImage, action: () => handleExport("JPEG") },
				{ label: "WebP", icon: FileImage, action: () => handleExport("WebP") },
				{ label: "SVG", icon: FileImage, action: () => handleExport("SVG") },
				{ separator: true, label: "" },
				{
					label: "PSD (Photoshop)",
					icon: FileImage,
					action: () => handleExport("PSD"),
				},
				{
					label: "Project JSON",
					icon: FileJson,
					action: () => handleExport("JSON"),
				},
			],
		},
		{
			label: "Share...",
			icon: Share2,
			action: () => toast.info("Share dialog"),
		},
		{ separator: true, label: "" },
		{
			label: "Print...",
			icon: Printer,
			shortcut: "⌘P",
			action: () => toast.info("Print dialog"),
		},
	];

	const editMenu: MenuItemConfig[] = [
		{
			label: "Undo",
			icon: RotateCcw,
			shortcut: "⌘Z",
			action: () => undo(),
			disabled: !canUndo(),
		},
		{
			label: "Redo",
			icon: RotateCw,
			shortcut: "⇧⌘Z",
			action: () => redo(),
			disabled: !canRedo(),
		},
		{ separator: true, label: "" },
		{ label: "Cut", icon: Scissors, shortcut: "⌘X", action: handleCut },
		{ label: "Copy", icon: Copy, shortcut: "⌘C", action: handleCopy },
		{ label: "Paste", icon: Clipboard, shortcut: "⌘V", action: handlePaste },
		{
			label: "Paste in Place",
			icon: Clipboard,
			shortcut: "⇧⌘V",
			action: handlePaste,
		},
		{ separator: true, label: "" },
		{
			label: "Delete Selection",
			icon: Trash2,
			shortcut: "Del",
			action: handleDeleteSelection,
		},
		{
			label: "Global Delete All",
			icon: Trash2,
			shortcut: "⇧⌘⌫",
			action: handleGlobalDelete,
		},
		{ label: "Clear Canvas", icon: Eraser, action: handleClearCanvas },
		{ separator: true, label: "" },
		{
			label: "Transform",
			icon: Move,
			submenu: [
				{
					label: "Free Transform",
					icon: Scale,
					shortcut: "⌘T",
					action: () => handleSelectTool("select"),
				},
				{
					label: "Flip Horizontal",
					icon: FlipHorizontal,
					action: handleFlipHorizontal,
				},
				{
					label: "Flip Vertical",
					icon: FlipVertical,
					action: handleFlipVertical,
				},
				{ separator: true, label: "" },
				{
					label: "Rotate 90° CW",
					icon: RotateCw,
					action: () => handleRotate(90),
				},
				{
					label: "Rotate 90° CCW",
					icon: RotateCcw,
					action: () => handleRotate(-90),
				},
				{
					label: "Rotate 180°",
					icon: RotateCw,
					action: () => handleRotate(180),
				},
			],
		},
		{
			label: "Fill",
			icon: PaintBucket,
			submenu: [
				{
					label: "Fill with Primary Color",
					action: () => handleFillWithColor(primaryColor),
				},
				{
					label: "Fill with Secondary Color",
					action: () => handleFillWithColor(secondaryColor),
				},
				{
					label: "Content-Aware Fill",
					icon: Wand2,
					action: () => toast.info("Content-aware fill"),
				},
			],
		},
	];

	const viewMenu: MenuItemConfig[] = [
		{
			label: "Zoom In",
			icon: ZoomIn,
			shortcut: "⌘+",
			action: () => setZoom(zoom + 25),
		},
		{
			label: "Zoom Out",
			icon: ZoomOut,
			shortcut: "⌘-",
			action: () => setZoom(zoom - 25),
		},
		{
			label: "Fit to Screen",
			icon: Maximize,
			shortcut: "⌘0",
			action: () => setZoom(100),
		},
		{ label: "Actual Size", shortcut: "⌘1", action: () => setZoom(100) },
		{ separator: true, label: "" },
		{
			label: "Toggle Grid",
			icon: Grid3X3,
			shortcut: "⌘'",
			action: () => toast.info("Grid toggled"),
		},
		{
			label: "Toggle Rulers",
			shortcut: "⌘R",
			action: () => toast.info("Rulers toggled"),
		},
		{
			label: "Toggle Guides",
			shortcut: "⌘;",
			action: () => toast.info("Guides toggled"),
		},
		{ separator: true, label: "" },
		{
			label: "Show Left Panel",
			icon: PanelLeft,
			action: () => toast.info("Left panel toggled"),
		},
		{
			label: "Show Right Panel",
			icon: PanelRight,
			action: () => toast.info("Right panel toggled"),
		},
	];

	const imageMenu: MenuItemConfig[] = [
		{
			label: "Adjustments",
			icon: Sliders,
			submenu: [
				{
					label: "Brightness/Contrast",
					icon: Sun,
					action: () => handleApplyFilter("Brightness/Contrast"),
				},
				{
					label: "Hue/Saturation",
					icon: Palette,
					action: () => handleApplyFilter("Hue/Saturation"),
				},
				{
					label: "Color Balance",
					icon: Droplets,
					action: () => handleApplyFilter("Color Balance"),
				},
				{
					label: "Levels",
					icon: SlidersHorizontal,
					action: () => handleApplyFilter("Levels"),
				},
				{
					label: "Curves",
					icon: SlidersHorizontal,
					action: () => handleApplyFilter("Curves"),
				},
				{ separator: true, label: "" },
				{ label: "Invert Colors", action: () => handleApplyFilter("Invert") },
				{ label: "Desaturate", action: () => handleApplyFilter("Desaturate") },
				{
					label: "Auto Tone",
					icon: Wand2,
					action: () => handleApplyFilter("Auto Tone"),
				},
				{
					label: "Auto Contrast",
					icon: Contrast,
					action: () => handleApplyFilter("Auto Contrast"),
				},
			],
		},
		{ separator: true, label: "" },
		{
			label: "Crop",
			icon: Crop,
			shortcut: "C",
			action: () => toast.info("Crop tool activated"),
		},
		{
			label: "Resize Canvas...",
			icon: Scale,
			action: () => toast.info("Resize canvas dialog"),
		},
		{
			label: "Resize Image...",
			icon: Image,
			action: () => toast.info("Resize image dialog"),
		},
		{ separator: true, label: "" },
		{
			label: "Rotate Canvas 90° CW",
			icon: RotateCw,
			action: () => toast.info("Canvas rotated"),
		},
		{
			label: "Rotate Canvas 90° CCW",
			icon: RotateCcw,
			action: () => toast.info("Canvas rotated"),
		},
		{
			label: "Flip Canvas Horizontal",
			icon: FlipHorizontal,
			action: () => toast.info("Canvas flipped"),
		},
		{
			label: "Flip Canvas Vertical",
			icon: FlipVertical,
			action: () => toast.info("Canvas flipped"),
		},
	];

	const layerMenu: MenuItemConfig[] = [
		{ label: "New Layer", icon: Plus, shortcut: "⇧⌘N", action: addLayer },
		{
			label: "Duplicate Layer",
			icon: Copy,
			shortcut: "⌘J",
			action: () => activeLayerId && duplicateLayer(activeLayerId),
		},
		{
			label: "Delete Layer",
			icon: Trash2,
			action: () => activeLayerId && removeLayer(activeLayerId),
			disabled: layers.length <= 1,
		},
		{ separator: true, label: "" },
		{
			label: "Merge Down",
			icon: Merge,
			shortcut: "⌘E",
			action: () => toast.info("Layers merged"),
		},
		{
			label: "Merge Visible",
			icon: Merge,
			shortcut: "⇧⌘E",
			action: () => toast.info("Visible layers merged"),
		},
		{
			label: "Flatten Image",
			icon: Layers,
			action: () => toast.info("Image flattened"),
		},
		{ separator: true, label: "" },
		{
			label: "Show/Hide Layer",
			icon: Eye,
			action: () => activeLayerId && toggleLayerVisibility(activeLayerId),
		},
		{
			label: "Lock Layer",
			icon: Lock,
			action: () => toast.info("Layer locked"),
		},
		{ separator: true, label: "" },
		{
			label: "Bring Forward",
			icon: ArrowUp,
			shortcut: "⌘]",
			action: handleBringForward,
		},
		{
			label: "Send Backward",
			icon: ArrowDown,
			shortcut: "⌘[",
			action: handleSendBackward,
		},
		{ label: "Bring to Front", shortcut: "⇧⌘]", action: handleBringToFront },
		{ label: "Send to Back", shortcut: "⇧⌘[", action: handleSendToBack },
	];

	const filterMenu: MenuItemConfig[] = [
		{
			label: "Blur",
			icon: Focus,
			submenu: [
				{
					label: "Gaussian Blur...",
					action: () => handleApplyFilter("Gaussian Blur"),
				},
				{
					label: "Motion Blur...",
					action: () => handleApplyFilter("Motion Blur"),
				},
				{
					label: "Radial Blur...",
					action: () => handleApplyFilter("Radial Blur"),
				},
				{
					label: "Surface Blur...",
					action: () => handleApplyFilter("Surface Blur"),
				},
			],
		},
		{
			label: "Sharpen",
			icon: Sparkles,
			submenu: [
				{ label: "Sharpen", action: () => handleApplyFilter("Sharpen") },
				{
					label: "Unsharp Mask...",
					action: () => handleApplyFilter("Unsharp Mask"),
				},
				{
					label: "Smart Sharpen...",
					action: () => handleApplyFilter("Smart Sharpen"),
				},
			],
		},
		{
			label: "Distort",
			icon: Blend,
			submenu: [
				{ label: "Liquify...", action: () => handleApplyFilter("Liquify") },
				{ label: "Twirl...", action: () => handleApplyFilter("Twirl") },
				{ label: "Spherize...", action: () => handleApplyFilter("Spherize") },
				{ label: "Wave...", action: () => handleApplyFilter("Wave") },
			],
		},
		{
			label: "Noise",
			submenu: [
				{ label: "Add Noise...", action: () => handleApplyFilter("Add Noise") },
				{
					label: "Reduce Noise...",
					action: () => handleApplyFilter("Reduce Noise"),
				},
				{ label: "Median...", action: () => handleApplyFilter("Median") },
			],
		},
		{ separator: true, label: "" },
		{
			label: "Stylize",
			icon: Wand2,
			submenu: [
				{ label: "Oil Paint...", action: () => handleApplyFilter("Oil Paint") },
				{ label: "Emboss...", action: () => handleApplyFilter("Emboss") },
				{ label: "Find Edges", action: () => handleApplyFilter("Find Edges") },
				{ label: "Solarize", action: () => handleApplyFilter("Solarize") },
			],
		},
		{ separator: true, label: "" },
		{
			label: "AI Enhance",
			icon: Sparkles,
			action: () => handleApplyFilter("AI Enhance"),
		},
		{
			label: "AI Remove Background",
			icon: Wand2,
			action: () => handleApplyFilter("Remove Background"),
		},
		{
			label: "AI Upscale 2x",
			icon: Scale,
			action: () => handleApplyFilter("Upscale 2x"),
		},
	];

	const windowMenu: MenuItemConfig[] = [
		{
			label: "Brushes Panel",
			icon: Palette,
			action: () => toast.info("Brushes panel toggled"),
		},
		{
			label: "Colors Panel",
			icon: Droplets,
			action: () => toast.info("Colors panel toggled"),
		},
		{
			label: "Layers Panel",
			icon: Layers,
			action: () => toast.info("Layers panel toggled"),
		},
		{
			label: "History Panel",
			icon: RotateCcw,
			action: () => toast.info("History panel toggled"),
		},
		{ separator: true, label: "" },
		{
			label: "Navigator",
			icon: ZoomIn,
			action: () => toast.info("Navigator toggled"),
		},
		{
			label: "Info Panel",
			icon: Info,
			action: () => toast.info("Info panel toggled"),
		},
		{ separator: true, label: "" },
		{ label: "Reset Workspace", action: () => toast.info("Workspace reset") },
	];

	const menus = [
		{ label: "File", items: fileMenu },
		{ label: "Edit", items: editMenu },
		{ label: "View", items: viewMenu },
		{ label: "Image", items: imageMenu },
		{ label: "Layer", items: layerMenu },
		{ label: "Filter", items: filterMenu },
		{ label: "Window", items: windowMenu },
	];

	const renderMenuItems = (items: MenuItemConfig[]) => {
		return items.map((item, index) => {
			if (item.separator) {
				return <DropdownMenuSeparator key={`sep-${index}`} />;
			}

			if (item.submenu) {
				return (
					<DropdownMenuSub key={item.label}>
						<DropdownMenuSubTrigger className="flex items-center gap-2">
							{item.icon && (
								<item.icon className="w-4 h-4 text-muted-foreground" />
							)}
							<span>{item.label}</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="min-w-50">
							{renderMenuItems(item.submenu)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				);
			}

			return (
				<DropdownMenuItem
					key={item.label}
					onClick={item.action}
					disabled={item.disabled}
					className="flex items-center gap-2"
				>
					{item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
					<span className="flex-1">{item.label}</span>
					{item.shortcut && (
						<DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
					)}
				</DropdownMenuItem>
			);
		});
	};

	return (
		<div className="h-10 bg-card border-b border-border flex items-center justify-between px-2 animate-fade-in">
			{/* Left: Logo & Menu */}
			<div className="flex items-center gap-1">
				{/* Logo */}
				<div className="flex items-center gap-2 px-3">
					<div className="w-6 h-6 rounded-md bg-linear-to-br from-primary to-primary/50 flex items-center justify-center">
						<Palette className="w-4 h-4 text-primary-foreground" />
					</div>
					<span className="font-semibold text-sm text-foreground">
						ArtStudio
					</span>
				</div>

				<div className="w-px h-5 bg-border mx-2" />

				{/* Menu Items */}
				{menus.map((menu) => (
					<DropdownMenu key={menu.label}>
						<DropdownMenuTrigger asChild>
							<button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors outline-none">
								{menu.label}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="min-w-55">
							{renderMenuItems(menu.items)}
						</DropdownMenuContent>
					</DropdownMenu>
				))}
			</div>

			{/* Right: Quick Actions */}
			<div className="flex items-center gap-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<button onClick={handleNewCanvas} className="tool-button w-8 h-8">
							<File className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>New Canvas</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button onClick={handleOpenFile} className="tool-button w-8 h-8">
							<FolderOpen className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Open File (⌘O)</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button onClick={handleSave} className="tool-button w-8 h-8">
							<Save className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Save</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => handleExport("PNG")}
							className="tool-button w-8 h-8"
						>
							<Download className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Export</TooltipContent>
				</Tooltip>

				<div className="w-px h-5 bg-border mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<button className="tool-button w-8 h-8">
							<Grid3X3 className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Toggle Grid</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button className="tool-button w-8 h-8">
							<Settings className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Settings</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button className="tool-button w-8 h-8">
							<HelpCircle className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Help</TooltipContent>
				</Tooltip>

				<ModeToggle />
			</div>

			{/* Templates Dialog */}
			<TemplatesDialog open={showTemplates} onOpenChange={setShowTemplates} />
		</div>
	);
};
