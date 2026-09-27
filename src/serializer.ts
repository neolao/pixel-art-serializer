import { type Lab, labDistance, rgbToHex, rgbToLab } from "./color";
import type { GridDetectionResult, PixelImageData } from "./grid-detection";
import {
	type PaletteExtractionResult,
	sampleGridCellColor,
} from "./palette-extraction";

export interface SerializedPaletteColor {
	index: number;
	hex: string;
	alpha: number;
}

export interface PixelArtSerialization {
	gridWidth: number;
	gridHeight: number;
	palette: SerializedPaletteColor[];
	pixels: number[];
}

export function serializePixelArt(
	image: PixelImageData,
	grid: GridDetectionResult,
	palette: PaletteExtractionResult,
): PixelArtSerialization {
	validate(image);

	const paletteLabs: Lab[] = palette.colors.map((color) =>
		rgbToLab([color.r, color.g, color.b]),
	);

	const pixels: number[] = [];
	for (let cy = 0; cy < grid.gridHeight; cy++) {
		for (let cx = 0; cx < grid.gridWidth; cx++) {
			const [r, g, b] = sampleGridCellColor(image, grid, cx, cy);
			const nearest = nearestPaletteIndex(rgbToLab([r, g, b]), paletteLabs);
			pixels.push(palette.colors[nearest].index);
		}
	}

	return {
		gridWidth: grid.gridWidth,
		gridHeight: grid.gridHeight,
		palette: palette.colors.map((color) => ({
			index: color.index,
			hex: rgbToHex(color.r, color.g, color.b),
			alpha: color.a,
		})),
		pixels,
	};
}

function nearestPaletteIndex(cellLab: Lab, paletteLabs: Lab[]): number {
	let bestIndex = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let i = 0; i < paletteLabs.length; i++) {
		const distance = labDistance(cellLab, paletteLabs[i]);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestIndex = i;
		}
	}
	return bestIndex;
}

function validate(image: PixelImageData): void {
	if (image.width <= 0 || image.height <= 0) {
		throw new Error("Cannot serialize an image with no dimensions.");
	}
	const expectedLength = image.width * image.height * 4;
	if (image.data.length !== expectedLength) {
		throw new Error(
			`Pixel data length (${image.data.length}) does not match the image dimensions (expected ${expectedLength}).`,
		);
	}
}
