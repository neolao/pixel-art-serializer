import { describe, expect, it } from "vitest";
import { labDistance, rgbToLab } from "./color";

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
