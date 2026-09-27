import { describe, expect, it } from "vitest";
import type { GridDetectionResult, PixelImageData } from "./grid-detection";
import { extractColorPalette } from "./palette-extraction";

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

describe("extractColorPalette", () => {
	it("always reserves index 0 for full transparency, even for a fully-opaque image", () => {
		const image = makeImage(2, 1, (x) =>
			x === 0 ? [255, 0, 0, 255] : [0, 255, 0, 255],
		);
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 2,
			gridHeight: 1,
			gridRegularity: 1,
		};

		const result = extractColorPalette(image, grid);

		expect(result.colors[0]).toEqual({ index: 0, r: 0, g: 0, b: 0, a: 0 });
	});

	it("collapses every fully-transparent sample into the single reserved index 0, regardless of its underlying RGB", () => {
		// Two cells that are both fully transparent but carry different
		// leftover RGB bytes (as a real decoder might), plus one opaque cell.
		const image = makeImage(3, 1, (x) => {
			if (x === 0) return [255, 0, 0, 0];
			if (x === 1) return [0, 255, 0, 0];
			return [10, 20, 30, 255];
		});
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 3,
			gridHeight: 1,
			gridRegularity: 1,
		};

		const result = extractColorPalette(image, grid);

		const transparentEntries = result.colors.filter((c) => c.a === 0);
		expect(transparentEntries).toHaveLength(1);
		expect(transparentEntries[0]).toEqual({ index: 0, r: 0, g: 0, b: 0, a: 0 });
		expect(result.colorCount).toBe(2);
	});

	it("returns each distinct opaque color with the correct total count for an image with clearly separated colors", () => {
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

		const result = extractColorPalette(image, grid);

		// 4 opaque colors + the always-reserved transparent entry at index 0
		expect(result.colorCount).toBe(5);
		expect(result.colors).toHaveLength(5);
		const rgbs = result.colors.map(({ r, g, b, a }) => [r, g, b, a]);
		expect(rgbs).toContainEqual([255, 0, 0, 255]);
		expect(rgbs).toContainEqual([0, 255, 0, 255]);
		expect(rgbs).toContainEqual([0, 0, 255, 255]);
		expect(rgbs).toContainEqual([255, 255, 0, 255]);
	});

	it("folds near-identical colors caused by compression artifacts into a single palette entry", () => {
		// 2x1 logical grid: two cells whose colors are one RGB nudge apart
		// (perceptual distance ~1.2, well under the merge threshold of 10).
		const image = makeImage(2, 1, (x) =>
			x === 0 ? [120, 120, 120, 255] : [123, 120, 120, 255],
		);
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 2,
			gridHeight: 1,
			gridRegularity: 1,
		};

		const result = extractColorPalette(image, grid);

		// The 2 near-identical opaque samples fold into 1, plus the
		// always-reserved transparent entry at index 0.
		expect(result.colorCount).toBe(2);
		expect(result.colors).toHaveLength(2);
	});

	it("folds near-identical dark colors caused by compression artifacts into a single palette entry, the same way it already does for light colors", () => {
		// 2x1 logical grid: two near-black cells one RGB nudge apart (mirrors
		// anti-aliasing noise on a black outline, as opposed to the
		// near-midtone-gray case above).
		const image = makeImage(2, 1, (x) =>
			x === 0 ? [0, 0, 0, 255] : [1, 1, 1, 255],
		);
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 2,
			gridHeight: 1,
			gridRegularity: 1,
		};

		const result = extractColorPalette(image, grid);

		// The 2 near-identical opaque samples fold into 1, plus the
		// always-reserved transparent entry at index 0.
		expect(result.colorCount).toBe(2);
		expect(result.colors).toHaveLength(2);
	});

	it("returns a palette of the reserved transparent entry plus exactly one opaque color for a flat single-color image", () => {
		const image = makeImage(6, 6, () => [42, 200, 17, 255]);
		const grid: GridDetectionResult = {
			pixelSize: 2,
			gridWidth: 3,
			gridHeight: 3,
			gridRegularity: 1,
		};

		const result = extractColorPalette(image, grid);

		expect(result.colorCount).toBe(2);
		expect(result.colors).toEqual([
			{ index: 0, r: 0, g: 0, b: 0, a: 0 },
			{ index: 1, r: 42, g: 200, b: 17, a: 255 },
		]);
	});

	it("completes quickly and returns a bounded palette when grid detection fails and every raw pixel becomes its own cell", () => {
		// Simulates the documented grid-detection failure mode (see
		// .vibe/decisions/004-grid-detection-pooled-line-scanning.md): a noisy
		// image with no consistent grid reports pixelSize 1, so gridWidth /
		// gridHeight equal the raw pixel dimensions and every pixel is its own
		// "cell". A pairwise perceptual merge over thousands of near-random
		// colors must not become computationally infeasible.
		const width = 3000;
		const height = 1;
		const image = makeImage(width, height, (x) => {
			// Multiplicative hash spreads colors across the full 24-bit space
			// (unlike a small-period formula) so almost every sample is a
			// genuinely distinct raw color, as a noisy real photo would be.
			const hash = (x * 2654435761) >>> 0;
			return [(hash >>> 16) & 0xff, (hash >>> 8) & 0xff, hash & 0xff, 255];
		});
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: width,
			gridHeight: height,
			gridRegularity: 1,
		};

		const start = Date.now();
		const result = extractColorPalette(image, grid);
		const elapsedMs = Date.now() - start;

		expect(elapsedMs).toBeLessThan(5000);
		expect(result.colorCount).toBeGreaterThan(0);
		expect(result.colorCount).toBeLessThan(width);
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

		expect(() => extractColorPalette(image, grid)).toThrow(
			/does not match the image dimensions/,
		);
	});
});
