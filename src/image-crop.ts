import type { PixelImageData } from "./grid-detection";

export interface CropRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Extracts a sub-region of raw pixel data as its own standalone image, so
 * the rest of the pipeline (palette extraction, serialization) can run on it
 * exactly as it already runs on a full image — see
 * .vibe/decisions/020-manual-grid-adjustment-as-crop.md.
 */
export function cropPixelData(
	image: PixelImageData,
	rect: CropRect,
): PixelImageData {
	const x = Math.round(rect.x);
	const y = Math.round(rect.y);
	const width = Math.round(rect.width);
	const height = Math.round(rect.height);

	if (width <= 0 || height <= 0) {
		throw new Error(
			`Cannot crop a rectangle with no area (width=${width}, height=${height}).`,
		);
	}
	if (x < 0 || y < 0 || x + width > image.width || y + height > image.height) {
		throw new Error(
			`Crop rectangle (x=${x}, y=${y}, width=${width}, height=${height}) extends beyond the image bounds (${image.width}x${image.height}).`,
		);
	}

	const source = image.data;
	const data = new Uint8ClampedArray(width * height * 4);
	for (let row = 0; row < height; row++) {
		const sourceRowStart = ((y + row) * image.width + x) * 4;
		const destRowStart = row * width * 4;
		for (let i = 0; i < width * 4; i++) {
			data[destRowStart + i] = source[sourceRowStart + i];
		}
	}

	return { width, height, data };
}
