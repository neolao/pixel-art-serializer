import { describe, expect, it } from "vitest";
import { computeConfidence } from "./confidence";
import type { GridDetectionResult } from "./grid-detection";
import type { PaletteExtractionResult } from "./palette-extraction";

function makeGrid(gridRegularity: number): GridDetectionResult {
	return { pixelSize: 4, gridWidth: 8, gridHeight: 8, gridRegularity };
}

function makePalette(colorCount: number): PaletteExtractionResult {
	return {
		colorCount,
		colors: Array.from({ length: colorCount }, (_, index) => ({
			index,
			r: 0,
			g: 0,
			b: 0,
			a: 255,
		})),
	};
}

describe("computeConfidence", () => {
	it("scores a regular grid with a small palette as high confidence, looking like pixel art", () => {
		const result = computeConfidence(makeGrid(1), makePalette(8));

		expect(result.score).toBe(1);
		expect(result.verdict).toBe("Looks like pixel art");
		expect(result.explanation).toBe(
			"a regular pixel grid and a small color palette",
		);
	});

	it("scores an irregular grid with a large palette as low confidence, not looking like pixel art", () => {
		const result = computeConfidence(makeGrid(0), makePalette(256));

		expect(result.score).toBe(0);
		expect(result.verdict).toBe("Doesn't look like pixel art");
		expect(result.explanation).toBe(
			"an irregular pixel grid and a large color palette",
		);
	});

	it("explains a disagreement between the two signals instead of blending it away silently", () => {
		const result = computeConfidence(makeGrid(1), makePalette(256));

		expect(result.explanation).toBe(
			"a regular pixel grid, but a large color palette",
		);
	});

	it("scores a mid-sized palette between the two thresholds proportionally", () => {
		const result = computeConfidence(makeGrid(1), makePalette(136));

		expect(result.score).toBeCloseTo(0.75, 5);
	});

	it("still returns a coherent, non-NaN result for a degenerate zero-color palette", () => {
		const result = computeConfidence(makeGrid(0.5), makePalette(0));

		expect(Number.isNaN(result.score)).toBe(false);
		expect(result.verdict.length).toBeGreaterThan(0);
		expect(result.explanation.length).toBeGreaterThan(0);
	});
});
