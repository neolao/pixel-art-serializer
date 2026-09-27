import { describe, expect, it } from "vitest";
import {
	addPaletteColor,
	mergePaletteColors,
	modifyPaletteColor,
	recolorPixel,
	removePaletteColor,
} from "./palette-editor";
import type { PixelArtSerialization } from "./serializer";

function makeSerialization(): PixelArtSerialization {
	return {
		formatVersion: 1,
		gridWidth: 2,
		gridHeight: 1,
		palette: [
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#ff0000ff", reserved: false },
			{ index: 2, color: "#00ff00ff", reserved: false },
		],
		pixels: [1, 2],
	};
}

function makeThreeColorSerialization(): PixelArtSerialization {
	return {
		formatVersion: 1,
		gridWidth: 3,
		gridHeight: 1,
		palette: [
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#ff0000ff", reserved: false },
			{ index: 2, color: "#00ff00ff", reserved: false },
			{ index: 3, color: "#0000ffff", reserved: false },
		],
		pixels: [1, 2, 3],
	};
}

describe("addPaletteColor", () => {
	it("appends a new opaque color at an index higher than any existing one", () => {
		const result = addPaletteColor(makeSerialization(), {
			hex: "#0000ff",
			alpha: 255,
		});

		expect(result.palette).toHaveLength(4);
		expect(result.palette[3]).toEqual({
			index: 3,
			color: "#0000ffff",
			reserved: false,
		});
		// Existing pixels are untouched by simply adding a color.
		expect(result.pixels).toEqual([1, 2]);
	});

	it("allocates an index above any surviving color, not array length, after a prior removal", () => {
		const afterRemoval = removePaletteColor(makeSerialization(), 1);

		const result = addPaletteColor(afterRemoval, {
			hex: "#abcdef",
			alpha: 255,
		});

		// Palette still only has indices 0 and 2 (1 was removed), so the new
		// color must not collide with either — array length (2) would.
		expect(result.palette.map((c) => c.index)).toEqual([0, 2, 3]);
	});
});

describe("removePaletteColor", () => {
	it("removes the color and erases its pixels to transparency (index 0)", () => {
		const result = removePaletteColor(makeSerialization(), 2);

		expect(result.palette.map((c) => c.index)).toEqual([0, 1]);
		expect(result.pixels).toEqual([1, 0]);
	});

	it("keeps surviving colors' indices stable, without compacting the palette array", () => {
		const result = removePaletteColor(makeSerialization(), 1);

		const survivor = result.palette.find((c) => c.color === "#00ff00ff");
		expect(survivor?.index).toBe(2);
	});

	it("refuses to remove the reserved transparent color at index 0", () => {
		const original = makeSerialization();

		const result = removePaletteColor(original, 0);

		expect(result.palette).toEqual(original.palette);
		expect(result.pixels).toEqual(original.pixels);
	});

	it("does nothing when asked to remove an index that is not in the palette", () => {
		const original = makeSerialization();

		const result = removePaletteColor(original, 99);

		expect(result.palette).toEqual(original.palette);
		expect(result.pixels).toEqual(original.pixels);
	});
});

describe("modifyPaletteColor", () => {
	it("changes an existing color's value in place, keeping its index and every pixel pointing to it", () => {
		const result = modifyPaletteColor(makeSerialization(), 1, {
			hex: "#123456",
			alpha: 200,
		});

		expect(result.palette[1]).toEqual({
			index: 1,
			color: "#123456c8",
			reserved: false,
		});
		expect(result.pixels).toEqual([1, 2]);
	});

	it("refuses to modify the reserved transparent color at index 0", () => {
		const original = makeSerialization();

		const result = modifyPaletteColor(original, 0, {
			hex: "#ffffff",
			alpha: 255,
		});

		expect(result.palette).toEqual(original.palette);
	});
});

describe("mergePaletteColors", () => {
	it("merges two selected colors into one, reassigning every pixel pointing at the discarded color", () => {
		const result = mergePaletteColors(makeSerialization(), [1, 2], 1);

		expect(result.palette.map((c) => c.index)).toEqual([0, 1]);
		expect(result.pixels).toEqual([1, 1]);
	});

	it("keeps the survivor's own color, not a computed blend of the merged colors", () => {
		const result = mergePaletteColors(makeSerialization(), [1, 2], 2);

		expect(result.palette.find((c) => c.index === 2)).toEqual({
			index: 2,
			color: "#00ff00ff",
			reserved: false,
		});
	});

	it("merges three or more colors at once into the chosen survivor", () => {
		const result = mergePaletteColors(
			makeThreeColorSerialization(),
			[1, 2, 3],
			3,
		);

		expect(result.palette.map((c) => c.index)).toEqual([0, 3]);
		expect(result.pixels).toEqual([3, 3, 3]);
	});

	it("does nothing when fewer than two colors are selected", () => {
		const original = makeSerialization();

		const result = mergePaletteColors(original, [1], 1);

		expect(result).toEqual(original);
	});

	it("refuses to merge when the reserved transparent color is part of the selection", () => {
		const original = makeSerialization();

		const result = mergePaletteColors(original, [0, 1], 0);

		expect(result).toEqual(original);
	});

	it("does nothing when the chosen survivor is not part of the selection", () => {
		const original = makeSerialization();

		const result = mergePaletteColors(original, [1, 2], 99);

		expect(result).toEqual(original);
	});

	it("does nothing when the selection includes an index absent from the palette", () => {
		const original = makeSerialization();

		const result = mergePaletteColors(original, [1, 99], 1);

		expect(result).toEqual(original);
	});
});

describe("recolorPixel", () => {
	it("reassigns one pixel to an existing palette index, including the transparent index", () => {
		const result = recolorPixel(makeSerialization(), 0, 0);

		expect(result.pixels).toEqual([0, 2]);
	});

	it("rejects a palette index that does not exist in the palette, leaving the pixel unchanged", () => {
		const original = makeSerialization();

		const result = recolorPixel(original, 0, 99);

		expect(result.pixels).toEqual(original.pixels);
	});

	it("rejects an out-of-range pixel position, leaving the serialization unchanged", () => {
		const original = makeSerialization();

		const result = recolorPixel(original, 99, 1);

		expect(result.pixels).toEqual(original.pixels);
	});
});
