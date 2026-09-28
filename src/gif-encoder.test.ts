import { GifReader } from "omggif";
import { describe, expect, it } from "vitest";
import { encodeGif, MAX_GIF_COLORS } from "./gif-encoder";
import type {
	PixelArtSerialization,
	SerializedPaletteColor,
} from "./serializer";

function decodeRgba(bytes: Uint8Array): {
	width: number;
	height: number;
	pixels: Uint8ClampedArray;
} {
	const reader = new GifReader(bytes);
	const pixels = new Uint8ClampedArray(reader.width * reader.height * 4);
	reader.decodeAndBlitFrameRGBA(0, pixels);
	return { width: reader.width, height: reader.height, pixels };
}

describe("encodeGif", () => {
	it("round-trips a small reconstruction's grid size, opaque colors, and transparent pixels", () => {
		const serialization: PixelArtSerialization = {
			formatVersion: 1,
			gridWidth: 2,
			gridHeight: 2,
			palette: [
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#ff0000ff", reserved: false },
				{ index: 2, color: "#00ff00ff", reserved: false },
			],
			pixels: [1, 2, 0, 1],
		};

		const { bytes, hasFlattenedColor } = encodeGif(serialization);
		const decoded = decodeRgba(bytes);

		expect(decoded.width).toBe(2);
		expect(decoded.height).toBe(2);
		expect([...decoded.pixels]).toEqual([
			255,
			0,
			0,
			255, // pixel 0: red, opaque
			0,
			255,
			0,
			255, // pixel 1: green, opaque
			0,
			0,
			0,
			0, // pixel 2: transparent
			255,
			0,
			0,
			255, // pixel 3: red, opaque
		]);
		expect(hasFlattenedColor).toBe(false);
	});

	it("remaps palette entries whose stable index no longer matches its array position (a color was removed)", () => {
		// Mirrors what palette-editor.ts's removePaletteColor leaves behind: a
		// gap in `index`, since indices are stable identifiers, not array
		// positions (.vibe/decisions and result.ts's renderReconstruction rely
		// on the same lookup-by-index behavior).
		const serialization: PixelArtSerialization = {
			formatVersion: 1,
			gridWidth: 1,
			gridHeight: 2,
			palette: [
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 3, color: "#0000ffff", reserved: false },
			],
			pixels: [3, 0],
		};

		const { bytes } = encodeGif(serialization);
		const decoded = decodeRgba(bytes);

		expect([...decoded.pixels]).toEqual([
			0,
			0,
			255,
			255, // pixel 0: blue, opaque
			0,
			0,
			0,
			0, // pixel 1: transparent
		]);
	});

	it("flattens a semi-transparent non-reserved color to fully opaque and reports it", () => {
		const serialization: PixelArtSerialization = {
			formatVersion: 1,
			gridWidth: 1,
			gridHeight: 1,
			palette: [
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#00ff0080", reserved: false },
			],
			pixels: [1],
		};

		const { bytes, hasFlattenedColor } = encodeGif(serialization);
		const decoded = decodeRgba(bytes);

		expect([...decoded.pixels]).toEqual([0, 255, 0, 255]);
		expect(hasFlattenedColor).toBe(true);
	});

	it("encodes a palette of exactly 256 colors (the GIF format's limit)", () => {
		const serialization = makeSerializationWithColorCount(MAX_GIF_COLORS);

		const { bytes, hasFlattenedColor } = encodeGif(serialization);
		const decoded = decodeRgba(bytes);

		expect(decoded.width).toBe(16);
		expect(decoded.height).toBe(16);
		// First pixel is the reserved transparent color; the rest are opaque.
		expect([...decoded.pixels.slice(0, 4)]).toEqual([0, 0, 0, 0]);
		expect([...decoded.pixels.slice(4, 8)]).toEqual([1, 0, 0, 255]);
		expect(hasFlattenedColor).toBe(false);
	});

	it("throws when the palette has more colors than GIF's 256-color limit", () => {
		const serialization = makeSerializationWithColorCount(MAX_GIF_COLORS + 1);

		expect(() => encodeGif(serialization)).toThrow(/256/);
	});
});

function makeSerializationWithColorCount(
	colorCount: number,
): PixelArtSerialization {
	const palette: SerializedPaletteColor[] = [
		{ index: 0, color: "#00000000", reserved: true },
	];
	for (let i = 1; i < colorCount; i++) {
		palette.push({
			index: i,
			color: `#${(i % 256).toString(16).padStart(2, "0")}0000ff`,
			reserved: false,
		});
	}
	const gridWidth = 16;
	const gridHeight = Math.ceil(colorCount / gridWidth);
	const pixels: number[] = [];
	for (let i = 0; i < gridWidth * gridHeight; i++) {
		pixels.push(i < colorCount ? i : 0);
	}
	return {
		formatVersion: 1,
		gridWidth,
		gridHeight,
		palette,
		pixels,
	};
}
