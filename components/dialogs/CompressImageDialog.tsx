"use client";

import { Download, HardDrive } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface CompressImageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type CompressFormat = "jpeg" | "webp";

type KonvaStageHandle = {
	width: () => number;
	height: () => number;
	toDataURL: (config?: { pixelRatio?: number; mimeType?: string }) => string;
};

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export const CompressImageDialog: React.FC<CompressImageDialogProps> = ({
	open,
	onOpenChange,
}) => {
	const [format, setFormat] = useState<CompressFormat>("jpeg");
	const [quality, setQuality] = useState(78);
	const [scalePct, setScalePct] = useState(100);
	const [maxDimension, setMaxDimension] = useState(4096);
	const [isBusy, setIsBusy] = useState(false);
	const [estimate, setEstimate] = useState<number | null>(null);
	const [fileName, setFileName] = useState("compressed");

	useEffect(() => {
		if (!open) return;

		const stage = (window as unknown as { konvaStage?: KonvaStageHandle })
			.konvaStage;
		if (!stage) {
			setEstimate(null);
			return;
		}

		let cancelled = false;
		const mime = format === "jpeg" ? "image/jpeg" : "image/webp";

		const run = async () => {
			const sw = stage.width();
			const sh = stage.height();
			let tw = Math.round((sw * scalePct) / 100);
			let th = Math.round((sh * scalePct) / 100);
			const maxSide = Math.max(tw, th);
			if (maxSide > maxDimension) {
				const r = maxDimension / maxSide;
				tw = Math.round(tw * r);
				th = Math.round(th * r);
			}

			try {
				const stageDataUrl = stage.toDataURL({ pixelRatio: 1 });
				const img = new Image();
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error("decode"));
					img.src = stageDataUrl;
				});

				const c = document.createElement("canvas");
				c.width = tw;
				c.height = th;
				const ctx = c.getContext("2d");
				if (!ctx) {
					setEstimate(null);
					return;
				}
				if (format === "jpeg") {
					ctx.fillStyle = "#ffffff";
					ctx.fillRect(0, 0, tw, th);
				}
				ctx.drawImage(img, 0, 0, tw, th);

				await new Promise<void>((resolve) => {
					c.toBlob(
						(blob) => {
							if (!cancelled && blob) setEstimate(blob.size);
							else if (!cancelled) setEstimate(null);
							resolve();
						},
						mime,
						quality / 100,
					);
				});
			} catch {
				if (!cancelled) setEstimate(null);
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [open, format, quality, scalePct, maxDimension]);

	const handleDownload = async () => {
		const stage = (window as unknown as { konvaStage?: KonvaStageHandle })
			.konvaStage;
		if (!stage) {
			toast.error("Canvas not found — wait for the editor to load.");
			return;
		}

		setIsBusy(true);
		try {
			const mime = format === "jpeg" ? "image/jpeg" : "image/webp";
			const ext = format === "jpeg" ? "jpg" : "webp";

			const sw = stage.width();
			const sh = stage.height();
			let tw = Math.round((sw * scalePct) / 100);
			let th = Math.round((sh * scalePct) / 100);
			const maxSide = Math.max(tw, th);
			if (maxSide > maxDimension) {
				const r = maxDimension / maxSide;
				tw = Math.round(tw * r);
				th = Math.round(th * r);
			}

			const stageDataUrl = stage.toDataURL({ pixelRatio: 1 });
			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error("decode"));
				img.src = stageDataUrl;
			});

			const c = document.createElement("canvas");
			c.width = tw;
			c.height = th;
			const ctx = c.getContext("2d");
			if (!ctx) throw new Error("ctx");
			if (format === "jpeg") {
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, tw, th);
			}
			ctx.drawImage(img, 0, 0, tw, th);

			const blob = await new Promise<Blob | null>((resolve) =>
				c.toBlob((b) => resolve(b), mime, quality / 100),
			);
			if (!blob) throw new Error("blob");

			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `${fileName || "compressed"}.${ext}`;
			a.click();
			URL.revokeObjectURL(a.href);

			toast.success(
				`Saved ${format.toUpperCase()} — ${formatBytes(blob.size)} (${tw}×${th}px)`,
			);
			onOpenChange(false);
		} catch {
			toast.error("Compression export failed.");
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<HardDrive className="w-5 h-5" />
						Compress image
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 py-2">
					<p className="text-xs text-muted-foreground">
						Export a smaller file using lossy quality and optional resizing.
						Does not change your working document — only downloads a copy.
					</p>

					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">File name</Label>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={fileName}
								onChange={(e) => setFileName(e.target.value)}
								className="flex-1 h-9 px-3 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
								placeholder="compressed"
							/>
							<span className="text-sm text-muted-foreground font-mono">
								.{format === "jpeg" ? "jpg" : "webp"}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Format</Label>
						<div className="grid grid-cols-2 gap-2">
							{[
								{ id: "jpeg" as const, label: "JPEG (smallest)" },
								{ id: "webp" as const, label: "WebP (quality + alpha)" },
							].map((opt) => (
								<button
									key={opt.id}
									type="button"
									onClick={() => setFormat(opt.id)}
									className={`px-3 py-2 rounded-lg border text-xs transition-all ${
										format === opt.id
											? "border-primary bg-primary/10 text-primary"
											: "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label className="text-xs text-muted-foreground">Quality</Label>
							<span className="text-xs font-mono">{quality}%</span>
						</div>
						<Slider
							value={[quality]}
							onValueChange={([v]) => setQuality(v)}
							min={20}
							max={95}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label className="text-xs text-muted-foreground">
								Scale (longer side)
							</Label>
							<span className="text-xs font-mono">{scalePct}%</span>
						</div>
						<Slider
							value={[scalePct]}
							onValueChange={([v]) => setScalePct(v)}
							min={25}
							max={100}
							step={5}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label className="text-xs text-muted-foreground">
								Max edge length
							</Label>
							<span className="text-xs font-mono">{maxDimension}px</span>
						</div>
						<Slider
							value={[maxDimension]}
							onValueChange={([v]) => setMaxDimension(v)}
							min={512}
							max={8192}
							step={256}
						/>
					</div>

					<div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 border border-border/50 flex items-center gap-2">
						<HardDrive className="w-4 h-4 shrink-0" />
						<span>
							Estimated size:{" "}
							<strong className="text-foreground font-mono">
								{estimate != null ? formatBytes(estimate) : "—"}
							</strong>
						</span>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={() => void handleDownload()}
						disabled={isBusy}
						className="gap-2"
					>
						<Download className="w-4 h-4" />
						{isBusy ? "Saving…" : "Download compressed"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
