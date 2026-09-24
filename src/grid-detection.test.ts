import { describe, expect, it } from "vitest";
import { detectPixelGridSize, type PixelImageData } from "./grid-detection";

/** Builds a synthetic image made of a checkerboard of solid-color blocks. */
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

describe("detectPixelGridSize", () => {
	it("detects the block size and grid dimensions of an upscaled uniform grid", () => {
		const image = makeBlockGridImage(4, 3, 10, 10);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({ pixelSize: 10, gridWidth: 4, gridHeight: 3 });
	});

	it("detects independent horizontal and vertical cell sizes for a non-square grid", () => {
		const image = makeBlockGridImage(3, 2, 8, 5);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({ pixelSize: 5, gridWidth: 3, gridHeight: 2 });
	});

	it("detects a pixel size of 1 for a photo-like image with no consistent grid", () => {
		const image = makeNoisyImage(50, 50);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({ pixelSize: 1, gridWidth: 50, gridHeight: 50 });
	});

	it("detects a pixel size of 1 for a small image already at native resolution", () => {
		const image = makeBlockGridImage(2, 2, 1, 1);

		const result = detectPixelGridSize(image);

		expect(result).toEqual({ pixelSize: 1, gridWidth: 2, gridHeight: 2 });
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
