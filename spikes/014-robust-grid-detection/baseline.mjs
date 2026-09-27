import { colorsDiffer, pixelAt } from "./io.mjs";

/**
 * Reference — the current production algorithm (`src/grid-detection.ts`),
 * ported verbatim: pool same-color run lengths across up to 24 full scan
 * lines per axis, take the plain frequency mode. See
 * .vibe/decisions/004-grid-detection-pooled-line-scanning.md.
 */
const COLOR_TOLERANCE = 3;
const MAX_SCAN_LINES = 24;

export function detectGridSizeBaseline(image) {
	const { width, height } = image;

	const rowCount = Math.min(MAX_SCAN_LINES, height);
	const hRuns = [];
	for (let i = 0; i < rowCount; i++) {
		const y = Math.floor(((i + 0.5) * height) / rowCount);
		hRuns.push(...runLengthsAlongLine(image, 0, y, 1, 0, width));
	}

	const colCount = Math.min(MAX_SCAN_LINES, width);
	const vRuns = [];
	for (let i = 0; i < colCount; i++) {
		const x = Math.floor(((i + 0.5) * width) / colCount);
		vRuns.push(...runLengthsAlongLine(image, x, 0, 0, 1, height));
	}

	const horizontal = mode(hRuns) ?? 1;
	const vertical = mode(vRuns) ?? 1;
	return { size: Math.min(horizontal, vertical), horizontal, vertical };
}

function runLengthsAlongLine(image, startX, startY, dx, dy, steps) {
	const runs = [];
	let runLength = 1;
	let previous = pixelAt(image, startX, startY);
	for (let step = 1; step < steps; step++) {
		const current = pixelAt(image, startX + dx * step, startY + dy * step);
		if (colorsDiffer(previous, current, COLOR_TOLERANCE)) {
			runs.push(runLength);
			runLength = 1;
			previous = current;
		} else {
			runLength++;
		}
	}
	runs.push(runLength);
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
