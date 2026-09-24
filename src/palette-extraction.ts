import { labDistance, rgbToLab } from "./color";
import type { GridDetectionResult, PixelImageData } from "./grid-detection";

export interface PaletteColor {
	index: number;
	r: number;
	g: number;
	b: number;
	a: number;
}

export interface PaletteExtractionResult {
	colors: PaletteColor[];
	colorCount: number;
}

/**
 * "Just noticeable difference" ballpark for CIE76 Lab distance; colors
 * closer than this are folded together as compression-artifact noise
 * rather than counted as separate palette entries. See
 * .vibe/decisions/002-grid-and-palette-algorithms.md.
 */
const MERGE_THRESHOLD_DELTA_E = 10;

interface ColorCount {
	r: number;
	g: number;
	b: number;
	a: number;
	count: number;
}

export function extractColorPalette(
	image: PixelImageData,
	grid: GridDetectionResult,
): PaletteExtractionResult {
	validate(image);
	const samples = sampleGridCells(image, grid);
	const merged = mergePerceptuallyCloseColors(samples, MERGE_THRESHOLD_DELTA_E);
	const colors = merged.map(({ r, g, b, a }, index) => ({ index, r, g, b, a }));
	return { colors, colorCount: colors.length };
}

/**
 * One representative color per logical grid cell, sampled at the raw pixel
 * nearest each cell's center. Center-sampling (rather than averaging the
 * whole cell) avoids blending the cell's less certain edge/anti-aliased
 * pixels into a synthetic color that may not exist in the source artwork.
 * See .vibe/decisions/005-palette-extraction-cell-sampling.md.
 */
function sampleGridCells(
	image: PixelImageData,
	grid: GridDetectionResult,
): ColorCount[] {
	const cellWidth = image.width / grid.gridWidth;
	const cellHeight = image.height / grid.gridHeight;
	const counts = new Map<string, ColorCount>();

	for (let cy = 0; cy < grid.gridHeight; cy++) {
		const y = clamp(Math.floor((cy + 0.5) * cellHeight), 0, image.height - 1);
		for (let cx = 0; cx < grid.gridWidth; cx++) {
			const x = clamp(Math.floor((cx + 0.5) * cellWidth), 0, image.width - 1);
			const [r, g, b, a] = pixelAt(image, x, y);
			const key = `${r},${g},${b},${a}`;
			const existing = counts.get(key);
			if (existing) {
				existing.count++;
			} else {
				counts.set(key, { r, g, b, a, count: 1 });
			}
		}
	}

	return [...counts.values()];
}

/**
 * Above this many samples, the pairwise merge below (O(n^2) per merge step,
 * repeated once per merge) becomes computationally infeasible — observed in
 * practice when grid detection fails to find a grid (a documented
 * limitation, see .vibe/decisions/004-grid-detection-pooled-line-scanning.md)
 * and every raw pixel of a large, noisy image becomes its own "cell".
 * Coarsely bucketing first, and re-bucketing at a wider step until the
 * candidate count is bounded, keeps the merge itself bounded regardless of
 * input size — real pixel art never has enough distinct colors to trigger
 * this, so it does not affect normal results.
 */
const PRE_BUCKET_TRIGGER = 500;
const PRE_BUCKET_STEP = 16;
const MAX_MERGE_CANDIDATES = 300;

function mergePerceptuallyCloseColors(
	samples: ColorCount[],
	thresholdDeltaE: number,
): ColorCount[] {
	const source = boundMergeCandidates(samples);
	let entries = source.map((sample) => ({
		color: sample,
		lab: rgbToLab([sample.r, sample.g, sample.b]),
	}));

	for (;;) {
		let bestI = -1;
		let bestJ = -1;
		let bestDistance = Number.POSITIVE_INFINITY;
		for (let i = 0; i < entries.length; i++) {
			for (let j = i + 1; j < entries.length; j++) {
				const distance = labDistance(entries[i].lab, entries[j].lab);
				if (distance < bestDistance) {
					bestDistance = distance;
					bestI = i;
					bestJ = j;
				}
			}
		}
		if (bestI === -1 || bestDistance >= thresholdDeltaE) break;

		const color = averageColor(entries[bestI].color, entries[bestJ].color);
		entries = entries.filter((_, index) => index !== bestI && index !== bestJ);
		entries.push({ color, lab: rgbToLab([color.r, color.g, color.b]) });
	}

	return entries.map(({ color }) => color);
}

function boundMergeCandidates(samples: ColorCount[]): ColorCount[] {
	if (samples.length <= PRE_BUCKET_TRIGGER) return samples;

	let step = PRE_BUCKET_STEP;
	let bucketed = preBucket(samples, step);
	while (bucketed.length > MAX_MERGE_CANDIDATES && step < 256) {
		step *= 2;
		bucketed = preBucket(samples, step);
	}
	return bucketed;
}

function preBucket(samples: ColorCount[], step: number): ColorCount[] {
	const buckets = new Map<string, ColorCount>();
	for (const sample of samples) {
		const key = [sample.r, sample.g, sample.b]
			.map((channel) => Math.round(channel / step) * step)
			.join(",");
		const existing = buckets.get(key);
		buckets.set(key, existing ? averageColor(existing, sample) : sample);
	}
	return [...buckets.values()];
}

function averageColor(a: ColorCount, b: ColorCount): ColorCount {
	const totalCount = a.count + b.count;
	return {
		r: Math.round((a.r * a.count + b.r * b.count) / totalCount),
		g: Math.round((a.g * a.count + b.g * b.count) / totalCount),
		b: Math.round((a.b * a.count + b.b * b.count) / totalCount),
		a: Math.round((a.a * a.count + b.a * b.count) / totalCount),
		count: totalCount,
	};
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function validate(image: PixelImageData): void {
	if (image.width <= 0 || image.height <= 0) {
		throw new Error(
			"Cannot extract a color palette from an image with no dimensions.",
		);
	}
	const expectedLength = image.width * image.height * 4;
	if (image.data.length !== expectedLength) {
		throw new Error(
			`Pixel data length (${image.data.length}) does not match the image dimensions (expected ${expectedLength}).`,
		);
	}
}

function pixelAt(
	image: PixelImageData,
	x: number,
	y: number,
): [number, number, number, number] {
	const i = (y * image.width + x) * 4;
	return [
		image.data[i],
		image.data[i + 1],
		image.data[i + 2],
		image.data[i + 3],
	];
}
