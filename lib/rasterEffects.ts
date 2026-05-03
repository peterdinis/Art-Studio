/**
 * Pixel-level image ops for rasterized canvas snapshots (Konva layer → ImageData).
 */

export type RasterEffectName =
	| "invert"
	| "grayscale"
	| "sepia"
	| "removeBackground"
	| "autoLevels"
	| "autoContrast"
	| "brightnessContrast"
	| "posterize"
	| "sharpen"
	| "gaussianBlur"
	| "hueSaturation";

export interface RasterEffectOptions {
	tolerance?: number;
	backgroundRgb?: { r: number; g: number; b: number };
	brightness?: number;
	contrast?: number;
	posterizeLevels?: number;
	blurRadius?: number;
	hue?: number;
	saturation?: number;
}

function clamp(v: number, min = 0, max = 255): number {
	return Math.max(min, Math.min(max, Math.round(v)));
}

function colorDistance(
	r1: number,
	g1: number,
	b1: number,
	r2: number,
	g2: number,
	b2: number,
): number {
	return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

export function sampleEdgeBackgroundColor(
	data: Uint8ClampedArray,
	width: number,
	height: number,
): { r: number; g: number; b: number } {
	let r = 0;
	let g = 0;
	let b = 0;
	let n = 0;

	const add = (x: number, y: number) => {
		const i = (y * width + x) * 4;
		r += data[i];
		g += data[i + 1];
		b += data[i + 2];
		n++;
	};

	for (let x = 0; x < width; x++) {
		add(x, 0);
		add(x, height - 1);
	}
	for (let y = 0; y < height; y++) {
		add(0, y);
		add(width - 1, y);
	}

	if (n === 0) return { r: 255, g: 255, b: 255 };
	return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			default:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(
	h: number,
	s: number,
	l: number,
): { r: number; g: number; b: number } {
	h /= 360;
	s /= 100;
	l /= 100;
	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return { r: clamp(r * 255), g: clamp(g * 255), b: clamp(b * 255) };
}

function applyBrightnessContrast(
	data: Uint8ClampedArray,
	brightness: number,
	contrast: number,
): void {
	const c = (contrast + 100) / 100;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] === 0) continue;
		for (let j = 0; j < 3; j++) {
			let v = data[i + j] + (brightness * 255) / 100;
			v = (v - 128) * c + 128;
			data[i + j] = clamp(v);
		}
	}
}

function applyAutoLevels(data: Uint8ClampedArray, perChannel: boolean): void {
	if (perChannel) {
		for (const ch of [0, 1, 2]) {
			let minV = 255;
			let maxV = 0;
			for (let i = 0; i < data.length; i += 4) {
				if (data[i + 3] < 10) continue;
				minV = Math.min(minV, data[i + ch]);
				maxV = Math.max(maxV, data[i + ch]);
			}
			if (maxV <= minV) continue;
			const scale = 255 / (maxV - minV);
			for (let i = 0; i < data.length; i += 4) {
				if (data[i + 3] < 10) continue;
				data[i + ch] = clamp((data[i + ch] - minV) * scale);
			}
		}
	} else {
		let minL = 255;
		let maxL = 0;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] < 10) continue;
			const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
			minL = Math.min(minL, lum);
			maxL = Math.max(maxL, lum);
		}
		if (maxL <= minL) return;
		const scale = 255 / (maxL - minL);
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] < 10) continue;
			for (let j = 0; j < 3; j++) {
				data[i + j] = clamp((data[i + j] - minL) * scale);
			}
		}
	}
}

function boxBlurPass(
	src: Uint8ClampedArray,
	dst: Uint8ClampedArray,
	width: number,
	height: number,
	radius: number,
	horizontal: boolean,
): void {
	const r = Math.max(1, Math.min(radius, 12));

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let tr = 0;
			let tg = 0;
			let tb = 0;
			let ta = 0;
			let count = 0;
			for (let d = -r; d <= r; d++) {
				const u = horizontal ? x + d : x;
				const v = horizontal ? y : y + d;
				if (u < 0 || u >= width || v < 0 || v >= height) continue;
				const idx = (v * width + u) * 4;
				tr += src[idx];
				tg += src[idx + 1];
				tb += src[idx + 2];
				ta += src[idx + 3];
				count++;
			}
			const oi = (y * width + x) * 4;
			dst[oi] = tr / count;
			dst[oi + 1] = tg / count;
			dst[oi + 2] = tb / count;
			dst[oi + 3] = ta / count;
		}
	}
}

function sharpen3x3(imageData: ImageData): void {
	const w = imageData.width;
	const h = imageData.height;
	const src = new Uint8ClampedArray(imageData.data);
	const dst = imageData.data;
	const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];

	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			for (let c = 0; c < 3; c++) {
				let sum = 0;
				let ki = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = ((y + ky) * w + (x + kx)) * 4 + c;
						sum += src[idx] * k[ki];
						ki++;
					}
				}
				dst[(y * w + x) * 4 + c] = clamp(sum);
			}
		}
	}
}

export function applyRasterEffect(
	imageData: ImageData,
	effect: RasterEffectName,
	options: RasterEffectOptions = {},
): void {
	const d = imageData.data;
	const w = imageData.width;
	const h = imageData.height;

	switch (effect) {
		case "invert":
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				d[i] = 255 - d[i];
				d[i + 1] = 255 - d[i + 1];
				d[i + 2] = 255 - d[i + 2];
			}
			break;

		case "grayscale":
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
				d[i] = d[i + 1] = d[i + 2] = clamp(y);
			}
			break;

		case "sepia":
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				const r = d[i];
				const g = d[i + 1];
				const b = d[i + 2];
				d[i] = clamp(r * 0.393 + g * 0.769 + b * 0.189);
				d[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
				d[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
			}
			break;

		case "removeBackground": {
			const tolerance = options.tolerance ?? 45;
			const bg = options.backgroundRgb ?? sampleEdgeBackgroundColor(d, w, h);
			for (let i = 0; i < d.length; i += 4) {
				if (
					colorDistance(d[i], d[i + 1], d[i + 2], bg.r, bg.g, bg.b) <= tolerance
				) {
					d[i + 3] = 0;
				}
			}
			break;
		}

		case "autoLevels":
			applyAutoLevels(d, true);
			break;

		case "autoContrast":
			applyAutoLevels(d, false);
			break;

		case "brightnessContrast":
			applyBrightnessContrast(
				d,
				options.brightness ?? 0,
				options.contrast ?? 0,
			);
			break;

		case "posterize": {
			const levels = Math.max(2, Math.min(64, options.posterizeLevels ?? 6));
			const step = 256 / levels;
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				for (let j = 0; j < 3; j++) {
					d[i + j] = clamp(Math.floor(d[i + j] / step) * step);
				}
			}
			break;
		}

		case "hueSaturation": {
			const hueShift = options.hue ?? 0;
			const satShift = (options.saturation ?? 0) / 100;
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				const { h: H, s: S, l: L } = rgbToHsl(d[i], d[i + 1], d[i + 2]);
				const newH = (H + hueShift + 360) % 360;
				const newS = clamp(S * (1 + satShift), 0, 100);
				const rgb = hslToRgb(newH, newS, L);
				d[i] = rgb.r;
				d[i + 1] = rgb.g;
				d[i + 2] = rgb.b;
			}
			break;
		}

		case "sharpen":
			sharpen3x3(imageData);
			break;

		case "gaussianBlur": {
			const radius = Math.max(1, Math.min(8, options.blurRadius ?? 2));
			const copy = new Uint8ClampedArray(d);
			const tmp = new Uint8ClampedArray(d.length);
			boxBlurPass(copy, tmp, w, h, radius, true);
			boxBlurPass(tmp, copy, w, h, radius, false);
			boxBlurPass(copy, tmp, w, h, radius, true);
			boxBlurPass(tmp, d, w, h, radius, false);
			break;
		}

		default:
			break;
	}
}
