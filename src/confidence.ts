import type { GridDetectionResult } from "./grid-detection";
import type { PaletteExtractionResult } from "./palette-extraction";

export interface ConfidenceResult {
	score: number;
	verdict: string;
	explanation: string;
}

const CONFIDENCE_THRESHOLD = 0.5;

/**
 * A palette this small or smaller scores full confidence; one this large or
 * larger scores none, sliding linearly in between. Pixel art conventionally
 * uses a small, fixed set of colors (see .vibe/glossary.md), while even a
 * modest photo routinely produces far more after palette extraction.
 */
const PALETTE_FULL_CONFIDENCE_MAX_COLORS = 16;
const PALETTE_ZERO_CONFIDENCE_MIN_COLORS = 256;

export function computeConfidence(
	grid: GridDetectionResult,
	palette: PaletteExtractionResult,
): ConfidenceResult {
	const paletteScore = computePaletteScore(palette.colorCount);
	const score = (grid.gridRegularity + paletteScore) / 2;

	return {
		score,
		verdict:
			score >= CONFIDENCE_THRESHOLD
				? "Looks like pixel art"
				: "Doesn't look like pixel art",
		explanation: explain(grid.gridRegularity, paletteScore),
	};
}

function computePaletteScore(colorCount: number): number {
	if (colorCount <= PALETTE_FULL_CONFIDENCE_MAX_COLORS) return 1;
	if (colorCount >= PALETTE_ZERO_CONFIDENCE_MIN_COLORS) return 0;
	return (
		1 -
		(colorCount - PALETTE_FULL_CONFIDENCE_MAX_COLORS) /
			(PALETTE_ZERO_CONFIDENCE_MIN_COLORS - PALETTE_FULL_CONFIDENCE_MAX_COLORS)
	);
}

function explain(gridRegularity: number, paletteScore: number): string {
	const gridGood = gridRegularity >= CONFIDENCE_THRESHOLD;
	const paletteGood = paletteScore >= CONFIDENCE_THRESHOLD;
	const gridPhrase = gridGood
		? "a regular pixel grid"
		: "an irregular pixel grid";
	const palettePhrase = paletteGood
		? "a small color palette"
		: "a large color palette";

	if (gridGood === paletteGood) {
		return `${gridPhrase} and ${palettePhrase}`;
	}
	const [good, bad] = gridGood
		? [gridPhrase, palettePhrase]
		: [palettePhrase, gridPhrase];
	return `${good}, but ${bad}`;
}
