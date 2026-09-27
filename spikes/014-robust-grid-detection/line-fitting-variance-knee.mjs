/**
 * Candidate — grid-line fitting + within-cell variance knee.
 *
 * Adapted from the grid-detection technique in the open-source `sindri-pixel`
 * project (https://github.com/vardirhq/sindri-pixel/pull/13, "Downscaler: fit
 * grid lines to the art (drift, phase, color-aware, fully automatic)"),
 * reimplemented from its public description/diff rather than copied (that
 * repository declares no license). Kept faithful to the source's design of
 * one candidate cell size shared by both axes (real square-ish logical
 * pixels) — extending it to fully independent horizontal/vertical sizes
 * would need a full 2D (cx, cy) sweep instead of this 1D one; left for a
 * follow-up if this candidate proves worth adopting.
 *
 * Idea: for each candidate cell size, use dynamic programming to place grid
 * lines on the strongest local color-change edges on each axis, letting
 * spacing drift within a tolerance instead of assuming a rigid, unshifted
 * lattice — this folds offset search and jitter tolerance into one step.
 * Score each candidate by the within-2D-cell color variance of its fitted
 * grid: that variance stays low for every candidate at or below the true
 * cell size (a smaller cell nested inside a real one is trivially uniform
 * too) and jumps sharply once a candidate must straddle two real logical
 * pixels. The true size is read off that jump ("knee"), not a raw frequency
 * count, which is what let noise dominate the two earlier candidates in
 * this spike.
 */

const LINE_TOLERANCE = 0.25;
const SPACING_PENALTY = 0.5;
const MIN_CELL_SIZE = 8;
const PLATEAU_MAX = 0.2;
const KNEE_EPS = 0.005;
const KNEE_MEDIUM = 1.8;
const REFIT_ROUNDS = 4;

export function detectGridSizeByLineFitting(image) {
	const { width, height } = image;
	const cols = edgeSignal(image, "h");
	const rows = edgeSignal(image, "v");
	const integrals = buildColorIntegrals(image);
	const total = boxVariance(integrals, 0, 0, width, height);
	if (total <= 1e-6) {
		return { size: 1, horizontal: 1, vertical: 1, confidence: "low" };
	}

	const maxCell = Math.max(
		MIN_CELL_SIZE + 1,
		Math.floor(Math.min(width, height) / 3),
	);
	const fits = [];
	const u = [];
	for (let c = MIN_CELL_SIZE; c <= maxCell; c++) {
		const xb = fitLines(cols, width, c);
		const yb = fitLines(rows, height, c);
		fits[c] = { xb, yb };
		u[c] = gridVariance(integrals, xb, yb) / total;
	}

	const kneeAt = (c) =>
		(Math.max(u[c + 1] ?? 0, u[c + 2] ?? 0) + KNEE_EPS) / (u[c] + KNEE_EPS);
	let plateauEnd = 0;
	for (let c = MIN_CELL_SIZE; c < maxCell; c++) {
		if (kneeAt(c) >= KNEE_MEDIUM && u[c] <= PLATEAU_MAX) plateauEnd = c;
	}
	if (!plateauEnd) {
		return { size: 1, horizontal: 1, vertical: 1, confidence: "low" };
	}

	let cell = plateauEnd;
	let { xb, yb } = fits[plateauEnd];
	for (let round = 0; round < REFIT_ROUNDS; round++) {
		const spacings = [edgeSpacing(cols, xb), edgeSpacing(rows, yb)].filter(
			(s) => !Number.isNaN(s),
		);
		if (spacings.length === 0) break;
		const next = spacings.reduce((s, v) => s + v, 0) / spacings.length;
		if (Math.abs(next - cell) < 0.05) break;
		cell = next;
		xb = fitLines(cols, width, cell);
		yb = fitLines(rows, height, cell);
	}
	const knee = kneeAt(plateauEnd);
	const rounded = Math.round(cell);
	return {
		size: rounded,
		horizontal: rounded,
		vertical: rounded,
		confidence: knee >= 4 ? "high" : "medium",
	};
}

/** Per-position summed color-change magnitude (premultiplied by alpha), summed over the full perpendicular dimension. */
function edgeSignal(image, axis) {
	const { width, height, data } = image;
	const length = axis === "h" ? width : height;
	const signal = new Float64Array(length);
	const diff = (o, p) => {
		const a = data[o + 3];
		const b = data[p + 3];
		return (
			Math.abs(data[o] * a - data[p] * b) / 255 +
			Math.abs(data[o + 1] * a - data[p + 1] * b) / 255 +
			Math.abs(data[o + 2] * a - data[p + 2] * b) / 255 +
			Math.abs(a - b)
		);
	};
	if (axis === "h") {
		for (let y = 0; y < height; y++) {
			for (let x = 1; x < width; x++) {
				const o = (y * width + x) * 4;
				signal[x] += diff(o, o - 4);
			}
		}
	} else {
		for (let y = 1; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const o = (y * width + x) * 4;
				signal[y] += diff(o, o - width * 4);
			}
		}
	}
	return signal;
}

/** DP: place lines on strong edges, spacing free to drift within ±LINE_TOLERANCE of `cell`. */
function fitLines(signal, length, cell) {
	const dmin = Math.max(1, Math.floor(cell * (1 - LINE_TOLERANCE)));
	const dmax = Math.max(dmin + 1, Math.ceil(cell * (1 + LINE_TOLERANCE)));
	if (length <= dmax) return [0, length];

	let mean = 0;
	for (let i = 1; i < length; i++) mean += signal[i];
	mean = mean / (length - 1) || 1;
	const spread = cell * LINE_TOLERANCE;

	const score = new Float64Array(length).fill(-Infinity);
	const prev = new Int32Array(length).fill(0);
	for (let i = 1; i <= Math.min(dmax, length - 1); i++)
		score[i] = signal[i] / mean;
	for (let i = 1; i < length; i++) {
		if (score[i] === -Infinity) continue;
		for (let d = dmin; d <= dmax && i + d < length; d++) {
			const v =
				score[i] +
				signal[i + d] / mean -
				SPACING_PENALTY * ((d - cell) / spread) ** 2;
			if (v > score[i + d]) {
				score[i + d] = v;
				prev[i + d] = i;
			}
		}
	}
	let end = 0;
	let best = -Infinity;
	for (let i = Math.max(1, length - dmax); i < length; i++) {
		if (score[i] > best) {
			best = score[i];
			end = i;
		}
	}
	const lines = [];
	for (let i = end; i > 0; i = prev[i]) lines.push(i);
	lines.reverse();
	if (lines.length && lines[0] < cell / 2) lines.shift();
	if (lines.length && length - lines[lines.length - 1] < cell / 2) lines.pop();
	return [0, ...lines, length];
}

/** 2D integral images (premultiplied R, G, B and squared norm) for O(1) box color variance. */
function buildColorIntegrals(image) {
	const { width, height, data } = image;
	const w1 = width + 1;
	const size = w1 * (height + 1);
	const r = new Float64Array(size);
	const g = new Float64Array(size);
	const b = new Float64Array(size);
	const q = new Float64Array(size);
	for (let y = 0; y < height; y++) {
		let sr = 0;
		let sg = 0;
		let sb = 0;
		let sq = 0;
		for (let x = 0, o = y * width * 4; x < width; x++, o += 4) {
			const a = data[o + 3] / 255;
			const R = data[o] * a;
			const G = data[o + 1] * a;
			const B = data[o + 2] * a;
			sr += R;
			sg += G;
			sb += B;
			sq += R * R + G * G + B * B;
			const i = (y + 1) * w1 + x + 1;
			const up = i - w1;
			r[i] = r[up] + sr;
			g[i] = g[up] + sg;
			b[i] = b[up] + sb;
			q[i] = q[up] + sq;
		}
	}
	return { r, g, b, q, w1 };
}

function boxVariance(I, ax, ay, bx, by) {
	const n = (bx - ax) * (by - ay);
	if (n <= 0) return 0;
	const { w1 } = I;
	const sum = (A) =>
		A[by * w1 + bx] - A[ay * w1 + bx] - A[by * w1 + ax] + A[ay * w1 + ax];
	const mr = sum(I.r) / n;
	const mg = sum(I.g) / n;
	const mb = sum(I.b) / n;
	return Math.max(0, sum(I.q) / n - (mr * mr + mg * mg + mb * mb));
}

function gridVariance(I, xb, yb) {
	let total = 0;
	for (let j = 0; j < yb.length - 1; j++) {
		for (let i = 0; i < xb.length - 1; i++) {
			total += boxVariance(I, xb[i], yb[j], xb[i + 1], yb[j + 1]);
		}
	}
	return total / ((xb.length - 1) * (yb.length - 1));
}

/** Interquartile-mean spacing between consecutive edge-backed fitted lines. */
function edgeSpacing(signal, bounds) {
	let mean = 0;
	for (let i = 1; i < signal.length; i++) mean += signal[i];
	mean /= Math.max(1, signal.length - 1);
	const gaps = [];
	for (let i = 2; i < bounds.length - 1; i++) {
		if (signal[bounds[i]] > mean && signal[bounds[i - 1]] > mean) {
			gaps.push(bounds[i] - bounds[i - 1]);
		}
	}
	if (gaps.length < 3) return Number.NaN;
	gaps.sort((a, b) => a - b);
	const mid = gaps.slice(
		Math.floor(gaps.length / 4),
		Math.ceil((gaps.length * 3) / 4),
	);
	return mid.reduce((s, v) => s + v, 0) / mid.length;
}
