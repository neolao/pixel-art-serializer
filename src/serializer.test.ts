import { describe, expect, it } from "vitest";
import type { GridDetectionResult, PixelImageData } from "./grid-detection";
import { extractColorPalette } from "./palette-extraction";
import { serializePixelArt } from "./serializer";

function makeImage(
	width: number,
	height: number,
	colorAt: (x: number, y: number) => readonly [number, number, number, number],
): PixelImageData {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const [r, g, b, a] = colorAt(x, y);
			const i = (y * width + x) * 4;
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
			data[i + 3] = a;
		}
	}
	return { width, height, data };
}

describe("serializePixelArt", () => {
	it("serializes the grid size, the color palette as hex codes, and each pixel's palette index", () => {
		// 4x4 image, 2x2 logical grid: red / green top row, blue / yellow bottom row
		const image = makeImage(4, 4, (x, y) => {
			const left = x < 2;
			const top = y < 2;
			if (top && left) return [255, 0, 0, 255];
			if (top && !left) return [0, 255, 0, 255];
			if (!top && left) return [0, 0, 255, 255];
			return [255, 255, 0, 255];
		});
		const grid: GridDetectionResult = {
			pixelSize: 2,
			gridWidth: 2,
			gridHeight: 2,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);

		const result = serializePixelArt(image, grid, palette);

		expect(result.gridWidth).toBe(2);
		expect(result.gridHeight).toBe(2);
		expect(result.palette).toHaveLength(4);
		const hexes = result.palette.map((c) => c.hex);
		expect(hexes).toContain("#ff0000");
		expect(hexes).toContain("#00ff00");
		expect(hexes).toContain("#0000ff");
		expect(hexes).toContain("#ffff00");

		expect(result.pixels).toHaveLength(4);
		const colorAtPixelIndex = (pixelIndex: number) => {
			const entry = result.palette.find(
				(c) => c.index === result.pixels[pixelIndex],
			);
			return entry?.hex;
		};
		expect(colorAtPixelIndex(0)).toBe("#ff0000"); // top-left cell
		expect(colorAtPixelIndex(1)).toBe("#00ff00"); // top-right cell
		expect(colorAtPixelIndex(2)).toBe("#0000ff"); // bottom-left cell
		expect(colorAtPixelIndex(3)).toBe("#ffff00"); // bottom-right cell
	});

	it("assigns every pixel to the single palette entry for a flat single-color image", () => {
		const image = makeImage(6, 6, () => [42, 200, 17, 255]);
		const grid: GridDetectionResult = {
			pixelSize: 2,
			gridWidth: 3,
			gridHeight: 3,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);

		const result = serializePixelArt(image, grid, palette);

		expect(result.palette).toEqual([{ index: 0, hex: "#2ac811", alpha: 255 }]);
		expect(result.pixels).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
	});

	it("reassigns every pixel to the merged palette entry when its original shade was folded away", () => {
		// 2x1 logical grid: two cells whose colors are one RGB nudge apart
		// (perceptual distance well under the merge threshold), so extraction
		// folds them into a single palette entry with no color left behind.
		const image = makeImage(2, 1, (x) =>
			x === 0 ? [120, 120, 120, 255] : [123, 120, 120, 255],
		);
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 2,
			gridHeight: 1,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);

		const result = serializePixelArt(image, grid, palette);

		expect(result.palette).toHaveLength(1);
		expect(result.pixels).toEqual([0, 0]);
	});

	it("throws when the pixel data length does not match the image dimensions", () => {
		const image: PixelImageData = {
			width: 4,
			height: 4,
			data: new Uint8ClampedArray(4), // way too short for a 4x4 RGBA image
		};
		const grid: GridDetectionResult = {
			pixelSize: 2,
			gridWidth: 2,
			gridHeight: 2,
			gridRegularity: 1,
		};

		expect(() =>
			serializePixelArt(image, grid, { colors: [], colorCount: 0 }),
		).toThrow(/does not match the image dimensions/);
	});
});
