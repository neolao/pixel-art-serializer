import { describe, expect, it } from "vitest";
import { fromHex8, labDistance, rgbToLab, toHex8 } from "./color";

describe("toHex8 / fromHex8", () => {
	it("combines a 6-digit hex color and a decimal alpha into one 8-digit hex string", () => {
		expect(toHex8("#ff0000", 255)).toBe("#ff0000ff");
		expect(toHex8("#000000", 0)).toBe("#00000000");
	});

	it("zero-pads a low alpha value to two hex digits", () => {
		expect(toHex8("#336699", 5)).toBe("#33669905");
	});

	it("splits an 8-digit hex string back into its 6-digit hex and decimal alpha", () => {
		expect(fromHex8("#ff0000ff")).toEqual({ hex: "#ff0000", alpha: 255 });
		expect(fromHex8("#33669905")).toEqual({ hex: "#336699", alpha: 5 });
	});

	it("round-trips through toHex8 then fromHex8 without losing precision", () => {
		expect(fromHex8(toHex8("#123456", 142))).toEqual({
			hex: "#123456",
			alpha: 142,
		});
	});
});

describe("rgbToLab / labDistance", () => {
	it("treats two near-black colors as perceptually close, like it already does for near-white and near-red colors", () => {
		// Independently derived via the standard CIE Lab formula (kappa*t + 16,
		// the whole sum divided by 116): rgbToLab([0,0,0]) is exactly [0,0,0],
		// and rgbToLab([1,1,1]) comes out to L≈0.27 (a,b≈0), for a distance of
		// ~0.27 — far under the merge threshold of 10 used by palette
		// extraction, and in the same ballpark as the near-white/near-red
		// distances below.
		const black = rgbToLab([0, 0, 0]);
		const almostBlack = rgbToLab([1, 1, 1]);
		const darkDistance = labDistance(black, almostBlack);

		expect(black).toEqual([0, 0, 0]);
		expect(darkDistance).toBeCloseTo(0.27, 1);
		expect(darkDistance).toBeLessThan(10);
	});
});
