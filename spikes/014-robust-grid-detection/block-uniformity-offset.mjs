import { colorsDiffer, pixelAt } from "./io.mjs";

/**
 * Candidate — block-uniformity with an explored offset.
 *
 * Rationale: decision-002 rejected block-uniformity because it assumes
 * blocks start exactly at pixel 0, which real, non-integer-scaled pixel
 * art rarely does. This variant searches candidate cell sizes *and*
 * candidate starting offsets, largest size first (matching the original
 * spike's block-uniformity algorithm), so a small, trivially-uniform
 * block can never win over a real, larger cell size the way an
 * average-uniformity score would.
 */
const COLOR_TOLERANCE = 3;
const MAX_SCAN_LINES = 24;
const MIN_SIZE = 4;
const MAX_SIZE = 90;
const REQUIRED_BLOCK_PASS_RATIO = 0.97;

export function detectGridSizeByBlockUniformityOffset(image) {
	const { width, height } = image;
	const horizontal = bestSize(image, "h", width, height);
	const vertical = bestSize(image, "v", width, height);
	return { size: Math.min(horizontal, vertical), horizontal, vertical };
}

function bestSize(image, axis, width, height) {
	const axisLength = axis === "h" ? width : height;
	const lineCount = Math.min(MAX_SCAN_LINES, axis === "h" ? height : width);
	const cap = Math.min(MAX_SIZE, Math.floor(axisLength / 2));

	for (let size = cap; size >= MIN_SIZE; size--) {
		for (let offset = 0; offset < size; offset++) {
			if (
				blockPassRatio(image, axis, axisLength, lineCount, size, offset) >=
				REQUIRED_BLOCK_PASS_RATIO
			) {
				return size;
			}
		}
	}
	return 1;
}

function blockPassRatio(image, axis, axisLength, lineCount, size, offset) {
	const { width, height } = image;
	let passing = 0;
	let total = 0;

	for (let i = 0; i < lineCount; i++) {
		const fixed =
			axis === "h"
				? Math.floor(((i + 0.5) * height) / lineCount)
				: Math.floor(((i + 0.5) * width) / lineCount);

		for (let start = offset; start + size <= axisLength; start += size) {
			total++;
			if (isBlockUniform(image, axis, fixed, start, size)) passing++;
		}
	}
	return total === 0 ? 0 : passing / total;
}

function isBlockUniform(image, axis, fixed, start, size) {
	const reference =
		axis === "h" ? pixelAt(image, start, fixed) : pixelAt(image, fixed, start);
	for (let p = start + 1; p < start + size; p++) {
		const current =
			axis === "h" ? pixelAt(image, p, fixed) : pixelAt(image, fixed, p);
		if (colorsDiffer(reference, current, COLOR_TOLERANCE)) return false;
	}
	return true;
}
