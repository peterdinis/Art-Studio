"use client";

import { ComponentType, FC, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArtStudioStore } from "@/stores/artStudioStore";
import { toast } from "sonner";
import {
	FileImage,
	Instagram,
	Youtube,
	Twitter,
	Smartphone,
	Monitor,
	Square,
	Printer,
	Palette,
	LayoutTemplate,
	Facebook,
	Linkedin,
	MessageSquare,
	Video,
	Image,
	PenTool,
} from "lucide-react";

interface Template {
	id: string;
	name: string;
	category: string;
	width: number;
	height: number;
	backgroundColor: string;
	icon: ComponentType<{ className?: string }>;
	description: string;
}

const templates: Template[] = [
	// Social Media
	{
		id: "instagram-post",
		name: "Instagram Post",
		category: "Social Media",
		width: 1080,
		height: 1080,
		backgroundColor: "#ffffff",
		icon: Instagram,
		description: "1080×1080 px",
	},
	{
		id: "instagram-story",
		name: "Instagram Story",
		category: "Social Media",
		width: 1080,
		height: 1920,
		backgroundColor: "#ffffff",
		icon: Instagram,
		description: "1080×1920 px",
	},
	{
		id: "instagram-reel",
		name: "Instagram Reel",
		category: "Social Media",
		width: 1080,
		height: 1920,
		backgroundColor: "#000000",
		icon: Video,
		description: "1080×1920 px",
	},
	{
		id: "youtube-thumbnail",
		name: "YouTube Thumbnail",
		category: "Social Media",
		width: 1280,
		height: 720,
		backgroundColor: "#ffffff",
		icon: Youtube,
		description: "1280×720 px",
	},
	{
		id: "youtube-banner",
		name: "YouTube Banner",
		category: "Social Media",
		width: 2560,
		height: 1440,
		backgroundColor: "#ffffff",
		icon: Youtube,
		description: "2560×1440 px",
	},
	{
		id: "twitter-post",
		name: "Twitter/X Post",
		category: "Social Media",
		width: 1200,
		height: 675,
		backgroundColor: "#ffffff",
		icon: Twitter,
		description: "1200×675 px",
	},
	{
		id: "twitter-header",
		name: "Twitter/X Header",
		category: "Social Media",
		width: 1500,
		height: 500,
		backgroundColor: "#ffffff",
		icon: Twitter,
		description: "1500×500 px",
	},
	{
		id: "facebook-post",
		name: "Facebook Post",
		category: "Social Media",
		width: 1200,
		height: 630,
		backgroundColor: "#ffffff",
		icon: Facebook,
		description: "1200×630 px",
	},
	{
		id: "facebook-cover",
		name: "Facebook Cover",
		category: "Social Media",
		width: 820,
		height: 312,
		backgroundColor: "#ffffff",
		icon: Facebook,
		description: "820×312 px",
	},
	{
		id: "linkedin-post",
		name: "LinkedIn Post",
		category: "Social Media",
		width: 1200,
		height: 627,
		backgroundColor: "#ffffff",
		icon: Linkedin,
		description: "1200×627 px",
	},
	{
		id: "tiktok-video",
		name: "TikTok Video",
		category: "Social Media",
		width: 1080,
		height: 1920,
		backgroundColor: "#000000",
		icon: Video,
		description: "1080×1920 px",
	},
	{
		id: "discord-banner",
		name: "Discord Banner",
		category: "Social Media",
		width: 960,
		height: 540,
		backgroundColor: "#5865F2",
		icon: MessageSquare,
		description: "960×540 px",
	},

	// Screen Sizes
	{
		id: "hd-landscape",
		name: "HD Landscape",
		category: "Screen",
		width: 1920,
		height: 1080,
		backgroundColor: "#2d3748",
		icon: Monitor,
		description: "1920×1080 px",
	},
	{
		id: "hd-portrait",
		name: "HD Portrait",
		category: "Screen",
		width: 1080,
		height: 1920,
		backgroundColor: "#2d3748",
		icon: Smartphone,
		description: "1080×1920 px",
	},
	{
		id: "4k-landscape",
		name: "4K Landscape",
		category: "Screen",
		width: 3840,
		height: 2160,
		backgroundColor: "#2d3748",
		icon: Monitor,
		description: "3840×2160 px",
	},
	{
		id: "4k-portrait",
		name: "4K Portrait",
		category: "Screen",
		width: 2160,
		height: 3840,
		backgroundColor: "#2d3748",
		icon: Smartphone,
		description: "2160×3840 px",
	},
	{
		id: "square-1k",
		name: "Square 1K",
		category: "Screen",
		width: 1024,
		height: 1024,
		backgroundColor: "#2d3748",
		icon: Square,
		description: "1024×1024 px",
	},
	{
		id: "square-2k",
		name: "Square 2K",
		category: "Screen",
		width: 2048,
		height: 2048,
		backgroundColor: "#2d3748",
		icon: Square,
		description: "2048×2048 px",
	},
	{
		id: "iphone-wallpaper",
		name: "iPhone Wallpaper",
		category: "Screen",
		width: 1170,
		height: 2532,
		backgroundColor: "#1a1a2e",
		icon: Smartphone,
		description: "1170×2532 px",
	},
	{
		id: "desktop-wallpaper",
		name: "Desktop Wallpaper",
		category: "Screen",
		width: 2560,
		height: 1440,
		backgroundColor: "#1a1a2e",
		icon: Monitor,
		description: "2560×1440 px",
	},

	// Print
	{
		id: "a4-portrait",
		name: "A4 Portrait",
		category: "Print",
		width: 2480,
		height: 3508,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "210×297 mm (300dpi)",
	},
	{
		id: "a4-landscape",
		name: "A4 Landscape",
		category: "Print",
		width: 3508,
		height: 2480,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "297×210 mm (300dpi)",
	},
	{
		id: "a3-portrait",
		name: "A3 Portrait",
		category: "Print",
		width: 3508,
		height: 4961,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "297×420 mm (300dpi)",
	},
	{
		id: "letter-portrait",
		name: "US Letter Portrait",
		category: "Print",
		width: 2550,
		height: 3300,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "8.5×11 in (300dpi)",
	},
	{
		id: "letter-landscape",
		name: "US Letter Landscape",
		category: "Print",
		width: 3300,
		height: 2550,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "11×8.5 in (300dpi)",
	},
	{
		id: "business-card",
		name: "Business Card",
		category: "Print",
		width: 1050,
		height: 600,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "3.5×2 in (300dpi)",
	},
	{
		id: "poster-18x24",
		name: "Poster 18×24",
		category: "Print",
		width: 5400,
		height: 7200,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "18×24 in (300dpi)",
	},

	// Art
	{
		id: "canvas-small",
		name: "Small Canvas",
		category: "Art",
		width: 800,
		height: 600,
		backgroundColor: "#f5f5dc",
		icon: Palette,
		description: "800×600 px",
	},
	{
		id: "canvas-medium",
		name: "Medium Canvas",
		category: "Art",
		width: 1600,
		height: 1200,
		backgroundColor: "#f5f5dc",
		icon: Palette,
		description: "1600×1200 px",
	},
	{
		id: "canvas-large",
		name: "Large Canvas",
		category: "Art",
		width: 2400,
		height: 1800,
		backgroundColor: "#f5f5dc",
		icon: Palette,
		description: "2400×1800 px",
	},
	{
		id: "canvas-xl",
		name: "Extra Large Canvas",
		category: "Art",
		width: 4000,
		height: 3000,
		backgroundColor: "#f5f5dc",
		icon: Palette,
		description: "4000×3000 px",
	},
	{
		id: "comic-panel",
		name: "Comic Panel",
		category: "Art",
		width: 800,
		height: 1200,
		backgroundColor: "#ffffff",
		icon: LayoutTemplate,
		description: "800×1200 px",
	},
	{
		id: "comic-page",
		name: "Comic Page",
		category: "Art",
		width: 1700,
		height: 2600,
		backgroundColor: "#ffffff",
		icon: LayoutTemplate,
		description: "1700×2600 px",
	},
	{
		id: "pixel-art-small",
		name: "Pixel Art (32×32)",
		category: "Art",
		width: 32,
		height: 32,
		backgroundColor: "#222222",
		icon: PenTool,
		description: "32×32 px",
	},
	{
		id: "pixel-art-medium",
		name: "Pixel Art (64×64)",
		category: "Art",
		width: 64,
		height: 64,
		backgroundColor: "#222222",
		icon: PenTool,
		description: "64×64 px",
	},
	{
		id: "pixel-art-large",
		name: "Pixel Art (128×128)",
		category: "Art",
		width: 128,
		height: 128,
		backgroundColor: "#222222",
		icon: PenTool,
		description: "128×128 px",
	},
	{
		id: "icon-design",
		name: "Icon Design",
		category: "Art",
		width: 512,
		height: 512,
		backgroundColor: "#ffffff",
		icon: Image,
		description: "512×512 px",
	},
];

interface TemplatesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const TemplatesDialog: FC<TemplatesDialogProps> = ({
	open,
	onOpenChange,
}) => {
	const { setCanvasSize, clearHistory } = useArtStudioStore();
	const [showCustom, setShowCustom] = useState(false);
	const [customWidth, setCustomWidth] = useState("1920");
	const [customHeight, setCustomHeight] = useState("1080");
	const [customBgColor, setCustomBgColor] = useState("#2d3748");

	const handleSelectTemplate = (template: Template) => {
		setCanvasSize({
			width: template.width,
			height: template.height,
			backgroundColor: template.backgroundColor,
		});
		clearHistory();
		toast.success(`Created new canvas: ${template.name}`);
		onOpenChange(false);
	};

	const handleCreateCustom = () => {
		const width = parseInt(customWidth) || 1920;
		const height = parseInt(customHeight) || 1080;

		if (width < 1 || height < 1) {
			toast.error("Dimensions must be at least 1 pixel");
			return;
		}

		if (width > 8000 || height > 8000) {
			toast.error("Maximum dimension is 8000 pixels");
			return;
		}

		setCanvasSize({
			width,
			height,
			backgroundColor: customBgColor,
		});
		clearHistory();
		toast.success(`Created custom canvas: ${width}×${height}`);
		onOpenChange(false);
		setShowCustom(false);
	};

	const categories = [...new Set(templates.map((t) => t.category))];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-card">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LayoutTemplate className="w-5 h-5 text-primary" />
						Choose a Template
					</DialogTitle>
					<DialogDescription>
						Select a preset canvas size or create a custom canvas
					</DialogDescription>
				</DialogHeader>

				{showCustom ? (
					<div className="flex-1 py-4 space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="width">Width (px)</Label>
								<Input
									id="width"
									type="number"
									value={customWidth}
									onChange={(e) => setCustomWidth(e.target.value)}
									min={1}
									max={8000}
									placeholder="1920"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="height">Height (px)</Label>
								<Input
									id="height"
									type="number"
									value={customHeight}
									onChange={(e) => setCustomHeight(e.target.value)}
									min={1}
									max={8000}
									placeholder="1080"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bgcolor">Background Color</Label>
							<div className="flex gap-2">
								<Input
									id="bgcolor"
									type="color"
									value={customBgColor}
									onChange={(e) => setCustomBgColor(e.target.value)}
									className="w-12 h-10 p-1 cursor-pointer"
								/>
								<Input
									type="text"
									value={customBgColor}
									onChange={(e) => setCustomBgColor(e.target.value)}
									placeholder="#2d3748"
									className="flex-1"
								/>
							</div>
						</div>

						<div className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">
								Preview:{" "}
								<strong>
									{customWidth}×{customHeight}
								</strong>{" "}
								pixels
							</p>
							<div
								className="mt-2 w-full h-8 rounded border border-border"
								style={{ backgroundColor: customBgColor }}
							/>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => setShowCustom(false)}
								className="flex-1"
							>
								Back to Templates
							</Button>
							<Button onClick={handleCreateCustom} className="flex-1">
								Create Canvas
							</Button>
						</div>
					</div>
				) : (
					<>
						<div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
							{categories.map((category) => (
								<div key={category}>
									<h3 className="text-sm font-semibold text-muted-foreground mb-3">
										{category}
									</h3>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
										{templates
											.filter((t) => t.category === category)
											.map((template) => (
												<button
													key={template.id}
													onClick={() => handleSelectTemplate(template)}
													className="group p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200 text-left"
												>
													<div className="flex items-center gap-3 mb-2">
														<div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
															<template.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
														</div>
													</div>
													<p className="font-medium text-sm text-foreground">
														{template.name}
													</p>
													<p className="text-xs text-muted-foreground mt-1">
														{template.description}
													</p>
													<div
														className="mt-2 w-full h-1 rounded-full"
														style={{
															backgroundColor: template.backgroundColor,
															border: "1px solid hsl(var(--border))",
														}}
													/>
												</button>
											))}
									</div>
								</div>
							))}

							{/* Custom Size Section */}
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-3">
									Custom
								</h3>
								<button
									onClick={() => setShowCustom(true)}
									className="group p-4 rounded-lg border border-dashed border-border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200 text-left"
								>
									<div className="flex items-center gap-3 mb-2">
										<div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
											<FileImage className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
										</div>
									</div>
									<p className="font-medium text-sm text-foreground">
										Custom Size
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Enter your own dimensions
									</p>
								</button>
							</div>
						</div>

						<div className="flex justify-end pt-4 border-t border-border">
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
