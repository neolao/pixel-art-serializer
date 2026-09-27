import { colorsDiffer, pixelAt } from "./io.mjs";

/**
 * Candidate — autocorrelation of an edge-density profile.
 *
 * Rationale: pooling raw run lengths (the baseline) treats a blurred cell
 * boundary's several short transition pixels as competing "cell size"
 * candidates in their own right, which can outvote the true, larger cell
 * size when the blur is heavy (see the spike's written recommendation).
 * Instead, this candidate only asks "how often does *some* color change
 * happen at each position", pools that per-position count across scan
 * lines into one density profile, and finds the profile's own period via
 * autocorrelation — a color-change cluster of any width still contributes
 * to one shared peak in the profile, rather than several separate,
 * differently-sized "runs".
 */
const COLOR_TOLERANCE = 3;
const MAX_SCAN_LINES = 24;
const MIN_LAG = 4; // guards against a change-cluster trivially autocorrelating with itself at near-zero shift

export function detectGridSizeByAutocorrelation(image) {
	const { width, height } = image;

	const horizontal = dominantPeriod(
		edgeDensityProfile(image, "h"),
		Math.floor(width / 2),
	);
	const vertical = dominantPeriod(
		edgeDensityProfile(image, "v"),
		Math.floor(height / 2),
	);
	return { size: Math.min(horizontal, vertical), horizontal, vertical };
}

function edgeDensityProfile(image, axis) {
	const { width, height } = image;
	const length = axis === "h" ? width - 1 : height - 1;
	const profile = new Array(length).fill(0);
	const lineCount = Math.min(MAX_SCAN_LINES, axis === "h" ? height : width);

	for (let i = 0; i < lineCount; i++) {
		if (axis === "h") {
			const y = Math.floor(((i + 0.5) * height) / lineCount);
			for (let x = 0; x < length; x++) {
				if (
					colorsDiffer(
						pixelAt(image, x, y),
						pixelAt(image, x + 1, y),
						COLOR_TOLERANCE,
					)
				) {
					profile[x]++;
				}
			}
		} else {
			const x = Math.floor(((i + 0.5) * width) / lineCount);
			for (let y = 0; y < length; y++) {
				if (
					colorsDiffer(
						pixelAt(image, x, y),
						pixelAt(image, x, y + 1),
						COLOR_TOLERANCE,
					)
				) {
					profile[y]++;
				}
			}
		}
	}
	return profile;
}

function dominantPeriod(profile, maxLag) {
	let bestLag = 1;
	let bestScore = -Infinity;
	for (let lag = MIN_LAG; lag <= maxLag; lag++) {
		let sum = 0;
		const terms = profile.length - lag;
		if (terms <= 0) break;
		for (let x = 0; x < terms; x++) {
			sum += profile[x] * profile[x + lag];
		}
		const normalized = sum / terms;
		if (normalized > bestScore) {
			bestScore = normalized;
			bestLag = lag;
		}
	}
	return bestLag;
}
