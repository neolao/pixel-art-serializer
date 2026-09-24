import { colorsDiffer, pixelAt } from "./io.mjs";

const COLOR_TOLERANCE = 3; // matches the ~3-per-channel tolerance reported by production pixel-art unscalers

/**
 * Algorithm A — sample-point run-length detection.
 * Source: sprite-ai.art pixel art resizer / Pixelera "How to Scale Down Pixel Art".
 * Samples a 4x4 grid of points away from the edges, walks right/down from each,
 * and takes the most frequent run length between color changes as the cell size.
 */
export function detectGridSizeBySamplePoints(image) {
	const { width, height } = image;
	const SAMPLE_COLS = 4;
	const SAMPLE_ROWS = 4;
	const perPointHorizontal = [];
	const perPointVertical = [];

	for (let row = 0; row < SAMPLE_ROWS; row++) {
		for (let col = 0; col < SAMPLE_COLS; col++) {
			const x = Math.floor(((col + 0.5) * width) / SAMPLE_COLS);
			const y = Math.floor(((row + 0.5) * height) / SAMPLE_ROWS);
			const h = mode(runLengthsFrom(image, x, y, 1, 0, width - x));
			const v = mode(runLengthsFrom(image, x, y, 0, 1, height - y));
			if (h !== null) perPointHorizontal.push(h);
			if (v !== null) perPointVertical.push(v);
		}
	}

	// Median of per-point estimates, rather than pooling every run length
	// globally, so a few sample points landing on noisy/textured regions
	// cannot outvote the points that land on genuine flat pixel-art cells.
	const horizontal = median(perPointHorizontal);
	const vertical = median(perPointVertical);
	if (horizontal === null || vertical === null) {
		return { size: 1, horizontal: 1, vertical: 1 };
	}
	return { size: Math.min(horizontal, vertical), horizontal, vertical };
}

function runLengthsFrom(image, startX, startY, dx, dy, maxSteps) {
	const runs = [];
	let runStart = 0;
	let previous = pixelAt(image, startX, startY);
	for (let step = 1; step < maxSteps; step++) {
		const current = pixelAt(image, startX + dx * step, startY + dy * step);
		if (colorsDiffer(previous, current, COLOR_TOLERANCE)) {
			runs.push(step - runStart);
			runStart = step;
			previous = current;
		}
	}
	return runs;
}

function mode(values) {
	if (values.length === 0) return null;
	const counts = new Map();
	for (const value of values) {
		counts.set(value, (counts.get(value) || 0) + 1);
	}
	let best = null;
	let bestCount = 0;
	for (const [value, count] of counts) {
		if (count > bestCount) {
			best = value;
			bestCount = count;
		}
	}
	return best;
}

function median(values) {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
		: sorted[mid];
}

/**
 * Algorithm B — block-uniformity (structure) detection.
 * Source: "Structure-Aware Pixel Art Scaling via Block Size Detection" (Seo, Lee, Kim, Jung, 2026).
 * Tests candidate block sizes from largest to smallest and picks the largest size for
 * which almost every block is a uniform color across the whole image.
 */
export function detectGridSizeByBlockUniformity(image) {
	const { width, height } = image;
	const cap = Math.min(Math.floor(Math.min(width, height) / 2), 128);
	const UNIFORMITY_THRESHOLD = 0.98;

	for (let n = cap; n >= 2; n--) {
		if (isConsistentlyUniform(image, n, UNIFORMITY_THRESHOLD)) {
			return { size: n };
		}
	}
	return { size: 1 };
}

function isConsistentlyUniform(image, n, requiredRatio) {
	const { width, height } = image;
	const colsBlocks = Math.floor(width / n);
	const rowsBlocks = Math.floor(height / n);
	const totalBlocks = colsBlocks * rowsBlocks;
	if (totalBlocks === 0) return false;

	let uniformBlocks = 0;
	for (let by = 0; by < rowsBlocks; by++) {
		for (let bx = 0; bx < colsBlocks; bx++) {
			if (isBlockUniform(image, bx * n, by * n, n)) {
				uniformBlocks++;
			}
		}
	}
	return uniformBlocks / totalBlocks >= requiredRatio;
}

function isBlockUniform(image, startX, startY, n) {
	const reference = pixelAt(image, startX, startY);
	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			if (
				colorsDiffer(
					reference,
					pixelAt(image, startX + x, startY + y),
					COLOR_TOLERANCE,
				)
			) {
				return false;
			}
		}
	}
	return true;
}
