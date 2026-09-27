import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { detectPixelGridSize, type PixelImageData } from "./grid-detection";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads a real fixture image via pngjs, bypassing the DOM canvas dependency
 * (see decisions/003-canvas-pixel-extraction-verified-at-runtime.md) so its
 * already-decoded pixels can feed `detectPixelGridSize` directly in a
 * regular Vitest/jsdom run.
 */
function loadFixture(name: string): PixelImageData {
	const filePath = path.join(
		dirname,
		"..",
		"fixtures",
		"candidate-images",
		name,
	);
	const png = PNG.sync.read(fs.readFileSync(filePath));
	return { width: png.width, height: png.height, data: png.data };
}

/**
 * Builds a synthetic image made of a checkerboard of solid-color blocks.
 * Uses enough repeated cells (at least ~8 per axis) for the line-fitting
 * detector to see a clear jump past the true cell size — a too-small image
 * gives it no room to distinguish the true size from a smaller one.
 */
function makeBlockGridImage(
	gridCols: number,
	gridRows: number,
	cellWidth: number,
	cellHeight: number,
): PixelImageData {
	const width = gridCols * cellWidth;
	const height = gridRows * cellHeight;
	const data = new Uint8ClampedArray(width * height * 4);
	const colorA = [255, 255, 255, 255];
	const colorB = [20, 20, 20, 255];

	for (let y = 0; y < height; y++) {
		const blockRow = Math.floor(y / cellHeight);
		for (let x = 0; x < width; x++) {
			const blockCol = Math.floor(x / cellWidth);
			const color = (blockRow + blockCol) % 2 === 0 ? colorA : colorB;
			const i = (y * width + x) * 4;
			data[i] = color[0];
			data[i + 1] = color[1];
			data[i + 2] = color[2];
			data[i + 3] = color[3];
		}
	}

	return { width, height, data };
}

/** Flips one pixel to the opposite of the checkerboard's two colors. */
function flipPixel(image: PixelImageData, x: number, y: number): void {
	const i = (y * image.width + x) * 4;
	const data = image.data as Uint8ClampedArray;
	const isWhite = data[i] > 128;
	const flipped = isWhite ? [20, 20, 20, 255] : [255, 255, 255, 255];
	data[i] = flipped[0];
	data[i + 1] = flipped[1];
	data[i + 2] = flipped[2];
	data[i + 3] = flipped[3];
}

/** Builds a synthetic image where every pixel differs sharply from its neighbours. */
function makeNoisyImage(width: number, height: number): PixelImageData {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			data[i] = (x * 97) % 256;
			data[i + 1] = (y * 61) % 256;
			data[i + 2] = (x * 37 + y * 53) % 256;
			data[i + 3] = 255;
		}
	}
	return { width, height, data };
}

/**
 * Softens every cell boundary of a checkerboard image with a small box blur,
 * simulating a real, re-compressed/anti-aliased pixel-art image whose
 * logical-pixel edges are gradients rather than hard steps.
 */
function blur(image: PixelImageData, radius: number): PixelImageData {
	const { width, height } = image;
	const src = image.data as Uint8ClampedArray;
	const out = new Uint8ClampedArray(src.length);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			for (let c = 0; c < 4; c++) {
				let sum = 0;
				let count = 0;
				for (let dy = -radius; dy <= radius; dy++) {
					for (let dx = -radius; dx <= radius; dx++) {
						const sx = x + dx;
						const sy = y + dy;
						if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
						sum += src[(sy * width + sx) * 4 + c];
						count++;
					}
				}
				out[(y * width + x) * 4 + c] = Math.round(sum / count);
			}
		}
	}
	return { width, height, data: out };
}

describe("detectPixelGridSize", () => {
	it("detects the block size and grid dimensions of an upscaled uniform grid", () => {
		const image = makeBlockGridImage(8, 8, 10, 10);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({
			pixelSize: 10,
			gridWidth: 8,
			gridHeight: 8,
			gridRegularity: 1,
		});
	});

	it("detects independent horizontal and vertical cell sizes for a non-square grid", () => {
		const image = makeBlockGridImage(8, 8, 8, 5);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({
			pixelSize: 5,
			gridWidth: 8,
			gridHeight: 8,
			gridRegularity: 1,
		});
	});

	it("detects a pixel size of 1 for a photo-like image with no consistent grid", () => {
		const image = makeNoisyImage(50, 50);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({
			pixelSize: 1,
			gridWidth: 50,
			gridHeight: 50,
			gridRegularity: 0,
		});
	});

	it("detects a pixel size of 1 for a small image already at native resolution", () => {
		const image = makeBlockGridImage(2, 2, 1, 1);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({
			pixelSize: 1,
			gridWidth: 2,
			gridHeight: 2,
			gridRegularity: 0,
		});
	});

	it("reports a lower grid regularity when some scanned lines break the otherwise-consistent block size", () => {
		const image = makeBlockGridImage(8, 8, 10, 10);
		// Flip a single pixel deep inside a block, splitting that one run in
		// two without changing which block size is most common overall.
		flipPixel(image, 15, 5);

		const result = detectPixelGridSize(image);

		expect(result.pixelSize).toBe(10);
		expect(result.gridWidth).toBe(8);
		expect(result.gridHeight).toBe(8);
		expect(result.gridRegularity).toBeGreaterThan(0.8);
		expect(result.gridRegularity).toBeLessThan(1);
	});

	it("still detects the true cell size when every cell boundary is blurred rather than a hard edge", () => {
		const sharp = makeBlockGridImage(8, 8, 32, 32);
		const image = blur(sharp, 2);

		const result = detectPixelGridSize(image);

		expect(result.pixelSize).toBe(32);
		expect(result.gridWidth).toBe(8);
		expect(result.gridHeight).toBe(8);
		expect(result.gridRegularity).toBeGreaterThanOrEqual(0);
		expect(result.gridRegularity).toBeLessThanOrEqual(1);
	});

	describe("against real images with a Product-Owner-confirmed grid size", () => {
		it("detects the confirmed grid on a native-resolution icon", () => {
			const image = loadFixture("pixel-art-icon-92db5f3c-native.png");

			const result = detectPixelGridSize(image);

			expect(result.gridWidth).toBe(15);
			expect(result.gridHeight).toBe(15);
		});

		it("detects the confirmed grid on a second native-resolution icon", () => {
			const image = loadFixture("pixel-art-icon-eb214736-native.png");

			const result = detectPixelGridSize(image);

			expect(result.gridWidth).toBe(15);
			expect(result.gridHeight).toBe(15);
		});

		it("detects the confirmed grid on a third native-resolution icon", () => {
			const image = loadFixture("pixel-art-icon-f3d07bfd-native.png");

			const result = detectPixelGridSize(image);

			expect(result.gridWidth).toBe(16);
			expect(result.gridHeight).toBe(16);
		});

		it("detects the confirmed grid on a clean upscaled sprite", () => {
			const image = loadFixture("pixel-art-cat-sitting.png");

			const result = detectPixelGridSize(image);

			expect(result.gridWidth).toBe(15);
			expect(result.gridHeight).toBe(14);
		});

		it("detects a grid within one cell of the confirmed 16x16 on the reported blurred-edge bug's image", () => {
			// The image behind the bug this feature fixes: a real pixel-art
			// sprite whose logical-pixel edges are soft/anti-aliased. The
			// previous algorithm found no grid at all on it (pixelSize 1); a
			// small remaining imprecision here is an accepted, documented
			// trade-off (decision 019), not a regression to watch for.
			const image = loadFixture("pixel-art-mario-sprite-blurred-border.png");

			const result = detectPixelGridSize(image);

			expect(Math.abs(result.gridWidth - 16)).toBeLessThanOrEqual(1);
			expect(Math.abs(result.gridHeight - 16)).toBeLessThanOrEqual(1);
		});
	});

	it("throws when the pixel data does not match the declared dimensions", () => {
		const image: PixelImageData = {
			width: 10,
			height: 10,
			data: new Uint8ClampedArray(4),
		};

		expect(() => detectPixelGridSize(image)).toThrow();
	});

	it("throws when the image has no dimensions", () => {
		const image: PixelImageData = {
			width: 0,
			height: 0,
			data: new Uint8ClampedArray(0),
		};

		expect(() => detectPixelGridSize(image)).toThrow();
	});
});
