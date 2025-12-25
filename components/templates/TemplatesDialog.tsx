import React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface Template {
	id: string;
	name: string;
	category: string;
	width: number;
	height: number;
	backgroundColor: string;
	icon: React.ComponentType<{ className?: string }>;
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
		id: "twitter-post",
		name: "Twitter/X Post",
		category: "Social Media",
		width: 1200,
		height: 675,
		backgroundColor: "#ffffff",
		icon: Twitter,
		description: "1200×675 px",
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
		id: "square-1k",
		name: "Square 1K",
		category: "Screen",
		width: 1024,
		height: 1024,
		backgroundColor: "#2d3748",
		icon: Square,
		description: "1024×1024 px",
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
		id: "letter-portrait",
		name: "US Letter Portrait",
		category: "Print",
		width: 2550,
		height: 3300,
		backgroundColor: "#ffffff",
		icon: Printer,
		description: "8.5×11 in (300dpi)",
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
		id: "comic-panel",
		name: "Comic Panel",
		category: "Art",
		width: 800,
		height: 1200,
		backgroundColor: "#ffffff",
		icon: LayoutTemplate,
		description: "800×1200 px",
	},
];

interface TemplatesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const TemplatesDialog: React.FC<TemplatesDialogProps> = ({
	open,
	onOpenChange,
}) => {
	const { setCanvasSize } = useArtStudioStore();

	const handleSelectTemplate = (template: Template) => {
		setCanvasSize({
			width: template.width,
			height: template.height,
			backgroundColor: template.backgroundColor,
		});
		toast.success(`Created new canvas: ${template.name}`);
		onOpenChange(false);
	};

	const categories = [...new Set(templates.map((t) => t.category))];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LayoutTemplate className="w-5 h-5 text-primary" />
						Choose a Template
					</DialogTitle>
					<DialogDescription>
						Select a preset canvas size or create a custom canvas
					</DialogDescription>
				</DialogHeader>

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
							onClick={() => {
								setCanvasSize({
									width: 1920,
									height: 1080,
									backgroundColor: "#2d3748",
								});
								toast.success("Created custom canvas");
								onOpenChange(false);
							}}
							className="group p-4 rounded-lg border border-dashed border-border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200 text-left"
						>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
									<FileImage className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
								</div>
							</div>
							<p className="font-medium text-sm text-foreground">Custom Size</p>
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
			</DialogContent>
		</Dialog>
	);
};
