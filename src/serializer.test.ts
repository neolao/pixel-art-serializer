import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv, { type ValidateFunction } from "ajv";
import { describe, expect, it } from "vitest";
import type { GridDetectionResult, PixelImageData } from "./grid-detection";
import { extractColorPalette } from "./palette-extraction";
import { serializePixelArt } from "./serializer";

function loadSerializationSchemaValidator(): ValidateFunction {
	const schemaPath = join(
		process.cwd(),
		"docs",
		"pixel-art-serialization.schema.json",
	);
	const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
	return new Ajv().compile(schema);
}

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
	it("serializes the format version, the grid size, the color palette as unified colors, and each pixel's palette index", () => {
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

		expect(result.formatVersion).toBe(1);
		expect(result.gridWidth).toBe(2);
		expect(result.gridHeight).toBe(2);
		// 4 opaque colors + the always-reserved transparent entry at index 0
		expect(result.palette).toHaveLength(5);
		const colors = result.palette.map((c) => c.color);
		expect(colors).toContain("#ff0000ff");
		expect(colors).toContain("#00ff00ff");
		expect(colors).toContain("#0000ffff");
		expect(colors).toContain("#ffff00ff");

		expect(result.pixels).toHaveLength(4);
		const colorAtPixelIndex = (pixelIndex: number) => {
			const entry = result.palette.find(
				(c) => c.index === result.pixels[pixelIndex],
			);
			return entry?.color;
		};
		expect(colorAtPixelIndex(0)).toBe("#ff0000ff"); // top-left cell
		expect(colorAtPixelIndex(1)).toBe("#00ff00ff"); // top-right cell
		expect(colorAtPixelIndex(2)).toBe("#0000ffff"); // bottom-left cell
		expect(colorAtPixelIndex(3)).toBe("#ffff00ff"); // bottom-right cell
	});

	it("assigns every pixel to the single opaque palette entry for a flat single-color image", () => {
		const image = makeImage(6, 6, () => [42, 200, 17, 255]);
		const grid: GridDetectionResult = {
			pixelSize: 2,
			gridWidth: 3,
			gridHeight: 3,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);

		const result = serializePixelArt(image, grid, palette);

		expect(result.palette).toEqual([
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#2ac811ff", reserved: false },
		]);
		expect(result.pixels).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1]);
	});

	it("marks only the reserved transparent entry as reserved, regardless of how many opaque colors surround it", () => {
		// 3x1 logical grid: two clearly separated opaque colors plus one
		// fully-transparent sample, so the palette has one reserved entry and
		// two ordinary ones.
		const image = makeImage(3, 1, (x) => {
			if (x === 0) return [0, 0, 0, 0];
			if (x === 1) return [255, 0, 0, 255];
			return [0, 0, 255, 255];
		});
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 3,
			gridHeight: 1,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);

		const result = serializePixelArt(image, grid, palette);

		const reservedEntries = result.palette.filter((c) => c.reserved);
		expect(reservedEntries).toEqual([
			{ index: 0, color: "#00000000", reserved: true },
		]);
		const ordinaryEntries = result.palette.filter((c) => !c.reserved);
		expect(ordinaryEntries).toHaveLength(2);
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

		// The reserved transparent entry + the single merged opaque color
		expect(result.palette).toHaveLength(2);
		expect(result.pixels).toEqual([1, 1]);
	});

	it("assigns a pixel sampled as fully transparent to the reserved index 0, never to the nearest-color opaque match", () => {
		// A fully-transparent pixel happens to carry pure-black RGB bytes,
		// which is also the exact RGB the reserved transparent entry stores.
		// Nearest-color matching (which only compares RGB) must not be
		// allowed to route it to an opaque black palette entry instead.
		const image = makeImage(2, 1, (x) =>
			x === 0 ? [0, 0, 0, 0] : [0, 0, 0, 255],
		);
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 2,
			gridHeight: 1,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);

		const result = serializePixelArt(image, grid, palette);

		expect(result.palette).toEqual([
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#000000ff", reserved: false },
		]);
		expect(result.pixels).toEqual([0, 1]);
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

describe("serializePixelArt output vs. its published JSON Schema", () => {
	it("validates real output — a multi-color image with a transparent pixel — against the schema", () => {
		const image = makeImage(3, 1, (x) => {
			if (x === 0) return [0, 0, 0, 0];
			if (x === 1) return [255, 0, 0, 255];
			return [0, 0, 255, 255];
		});
		const grid: GridDetectionResult = {
			pixelSize: 1,
			gridWidth: 3,
			gridHeight: 1,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);
		const result = serializePixelArt(image, grid, palette);
		const validate = loadSerializationSchemaValidator();

		const valid = validate(result);

		expect(valid, JSON.stringify(validate.errors)).toBe(true);
	});

	it("validates real output — a flat, fully-opaque single-color image — against the schema", () => {
		const image = makeImage(2, 2, () => [42, 200, 17, 255]);
		const grid: GridDetectionResult = {
			pixelSize: 2,
			gridWidth: 1,
			gridHeight: 1,
			gridRegularity: 1,
		};
		const palette = extractColorPalette(image, grid);
		const result = serializePixelArt(image, grid, palette);
		const validate = loadSerializationSchemaValidator();

		const valid = validate(result);

		expect(valid, JSON.stringify(validate.errors)).toBe(true);
	});

	it("rejects a document written in the old, superseded shape (separate hex/alpha fields, no formatVersion)", () => {
		const validate = loadSerializationSchemaValidator();

		const valid = validate({
			gridWidth: 1,
			gridHeight: 1,
			palette: [{ index: 0, hex: "#000000", alpha: 0 }],
			pixels: [0],
		});

		expect(valid).toBe(false);
	});

	it("rejects a palette entry whose color is not an 8-digit hex string", () => {
		const validate = loadSerializationSchemaValidator();

		const valid = validate({
			formatVersion: 1,
			gridWidth: 1,
			gridHeight: 1,
			palette: [{ index: 0, color: "#000000", reserved: true }],
			pixels: [0],
		});

		expect(valid).toBe(false);
	});
});
