export interface PixelImageData {
	width: number;
	height: number;
	data: ArrayLike<number>;
}

export interface GridDetectionResult {
	pixelSize: number;
	gridWidth: number;
	gridHeight: number;
	gridRegularity: number;
}

const COLOR_TOLERANCE = 3;
const MAX_SCAN_LINES = 24;

// Grid-line fitting + within-cell-variance-knee detection (see
// .vibe/decisions/018-line-fitting-variance-knee-grid-detection.md and
// .vibe/decisions/019-independent-axis-refinement-plateau-guard.md).
const LINE_TOLERANCE = 0.25;
const SPACING_PENALTY = 0.5;
const MIN_CELL_SIZE = 2;
const PLATEAU_MAX = 0.2;
const PLATEAU_MIN_RUN = 2;
const FLAT_RUN_TOLERANCE = 1e-9;
const FLAT_RUN_MIN_LEN = 5;
const REFIT_ROUNDS = 4;
const ALTERNATE_ROUNDS = 4;

interface ColorIntegrals {
	r: Float64Array;
	g: Float64Array;
	b: Float64Array;
	q: Float64Array;
	w1: number;
}

export function detectPixelGridSize(
	image: PixelImageData,
): GridDetectionResult {
	validate(image);
	const { width, height } = image;

	const { horizontal, vertical } = detectCellSize(image);
	const pixelSize = Math.min(horizontal, vertical);

	return {
		pixelSize,
		gridWidth: Math.round(width / horizontal),
		gridHeight: Math.round(height / vertical),
		gridRegularity:
			pixelSize <= 1 ? 0 : computeRegularity(image, horizontal, vertical),
	};
}

/**
 * Detects each axis's logical-pixel cell size independently: fits grid
 * lines on the strongest local color-change edges for a shared candidate
 * size (an initial guess), then alternates refining one axis while holding
 * the other's fitted lines fixed, so the two can correct each other rather
 * than one being permanently downstream of a mediocre shared guess.
 */
function detectCellSize(image: PixelImageData): {
	horizontal: number;
	vertical: number;
} {
	const { width, height } = image;
	const cols = edgeSignal(image, "h");
	const rows = edgeSignal(image, "v");
	const integrals = buildColorIntegrals(image);
	const total = boxVariance(integrals, 0, 0, width, height);
	if (total <= 1e-6) return { horizontal: 1, vertical: 1 };

	const maxCellX = Math.max(MIN_CELL_SIZE + 1, Math.floor(width / 3));
	const maxCellY = Math.max(MIN_CELL_SIZE + 1, Math.floor(height / 3));
	const maxCell = Math.max(
		MIN_CELL_SIZE + 1,
		Math.floor(Math.min(width, height) / 3),
	);

	// Seed: joint (shared-candidate) sweep.
	let bestXb = [0, width];
	let bestYb = [0, height];
	{
		const jointU: number[] = [];
		const jointFits: { xb: number[]; yb: number[] }[] = [];
		for (let c = MIN_CELL_SIZE; c <= maxCell; c++) {
			const xb = fitLines(cols, width, c);
			const yb = fitLines(rows, height, c);
			jointFits[c] = { xb, yb };
			jointU[c] = gridVariance(integrals, xb, yb) / total;
		}
		const seedCell = findPlateauEnd(jointU, MIN_CELL_SIZE, maxCell);
		if (seedCell !== null) {
			bestXb = jointFits[seedCell].xb;
			bestYb = jointFits[seedCell].yb;
		}
	}

	let horizontal: number | null = null;
	let vertical: number | null = null;
	let previousHorizontal: number | null = null;
	let previousVertical: number | null = null;
	for (let round = 0; round < ALTERNATE_ROUNDS; round++) {
		const fixedYb = bestYb;
		const hCell = sweepAxis(cols, width, maxCellX, (cx) => {
			const xb = fitLines(cols, width, cx);
			return gridVariance(integrals, xb, fixedYb) / total;
		});
		if (hCell !== null) {
			horizontal = hCell;
			bestXb = fitLines(cols, width, hCell);
		}

		const fixedXb = bestXb;
		const vCell = sweepAxis(rows, height, maxCellY, (cy) => {
			const yb = fitLines(rows, height, cy);
			return gridVariance(integrals, fixedXb, yb) / total;
		});
		if (vCell !== null) {
			vertical = vCell;
			bestYb = fitLines(rows, height, vCell);
		}

		if (
			round > 0 &&
			horizontal === previousHorizontal &&
			vertical === previousVertical
		) {
			break;
		}
		previousHorizontal = horizontal;
		previousVertical = vertical;
	}

	return { horizontal: horizontal ?? 1, vertical: vertical ?? 1 };
}

function sweepAxis(
	signal: Float64Array,
	length: number,
	maxCell: number,
	scoreFor: (candidate: number) => number,
): number | null {
	const u: number[] = [];
	for (let c = MIN_CELL_SIZE; c <= maxCell; c++) u[c] = scoreFor(c);
	const knee = findPlateauEnd(u, MIN_CELL_SIZE, maxCell);
	if (knee === null) return null;
	return settle(signal, length, knee);
}

/**
 * The plateau's end: the last candidate still at or below PLATEAU_MAX,
 * provided it belongs to a run of at least PLATEAU_MIN_RUN consecutive
 * qualifying candidates — a lone dip is noise (a coincidentally uniform
 * small slice), not a real repeating cell. A relative-jump trigger was
 * tried first but locked onto a transient dip that later recovered, rather
 * than the true, sustained plateau right before variance rises for good
 * (see decision 019 and the item-015 implementation notes).
 *
 * Falls back to the first sufficiently long run of near-identical values in
 * the curve when nothing qualifies against the absolute threshold: on busy,
 * high-contrast source art (e.g. a hand-drawn grid chart with shading
 * inside every cell), the true cell size can settle onto the same fitted
 * lines across a whole range of candidates — a genuine plateau — while
 * sitting well above PLATEAU_MAX the whole time (see decision 021).
 */
function findPlateauEnd(
	u: readonly number[],
	minCandidate: number,
	maxCandidate: number,
): number | null {
	let runStart: number | null = null;
	let best: number | null = null;
	for (let c = minCandidate; c < maxCandidate; c++) {
		const qualifies = u[c] <= PLATEAU_MAX;
		if (qualifies) {
			if (runStart === null) runStart = c;
			if (c - runStart + 1 >= PLATEAU_MIN_RUN) best = c;
		} else {
			runStart = null;
		}
	}
	return best ?? findFlatRunEnd(u, minCandidate, maxCandidate);
}

/**
 * The end of the *first* run of consecutive near-equal values that reaches
 * FLAT_RUN_MIN_LEN, or null if none does. Larger candidates give the DP
 * fewer real degrees of freedom, so coincidental ties get longer and longer
 * simply by drifting up the curve — picking the widest run anywhere latches
 * onto those coarse, meaningless plateaus instead of the true grid, which
 * shows up as the first one encountered right after the curve's initial,
 * choppy rise (see decision 021).
 */
function findFlatRunEnd(
	u: readonly number[],
	minCandidate: number,
	maxCandidate: number,
): number | null {
	let runStart = minCandidate;
	for (let c = minCandidate + 1; c <= maxCandidate; c++) {
		// A tie at the degenerate "no partition at all" value (grid variance
		// equal to the whole image's, i.e. a single box) is not a real
		// plateau — it's the trivial upper bound every failed fit ties at.
		const degenerate = u[c] >= 1 - FLAT_RUN_TOLERANCE;
		const flat =
			!degenerate &&
			Math.abs(u[c] - u[c - 1]) <= FLAT_RUN_TOLERANCE * Math.max(1, u[c - 1]);
		if (!flat) {
			runStart = c;
		} else if (c - runStart + 1 >= FLAT_RUN_MIN_LEN) {
			return c;
		}
	}
	return null;
}

/** Refits at the spacing between edge-backed lines until it stops moving (usually 1-2 rounds). */
function settle(
	signal: Float64Array,
	length: number,
	startCell: number,
): number {
	let cell = startCell;
	let bounds = fitLines(signal, length, cell);
	for (let round = 0; round < REFIT_ROUNDS; round++) {
		const spacing = edgeSpacing(signal, bounds);
		if (Number.isNaN(spacing) || Math.abs(spacing - cell) < 0.05) break;
		cell = spacing;
		bounds = fitLines(signal, length, cell);
	}
	return Math.round(cell);
}

/**
 * Per-position summed color-change magnitude (RGB premultiplied by alpha,
 * so garbage color in fully transparent pixels creates no edge), summed
 * over the full perpendicular dimension.
 */
function edgeSignal(image: PixelImageData, axis: "h" | "v"): Float64Array {
	const { width, height, data } = image;
	const length = axis === "h" ? width : height;
	const signal = new Float64Array(length);
	const diff = (o: number, p: number): number => {
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

/**
 * Dynamic programming: place lines on strong edges, with spacing free to
 * drift within ±LINE_TOLERANCE of `cell` (a small penalty discourages
 * deviating) so lines follow jitter and blur instead of a rigid lattice.
 */
function fitLines(
	signal: Float64Array,
	length: number,
	cell: number,
): number[] {
	const dmin = Math.max(1, Math.floor(cell * (1 - LINE_TOLERANCE)));
	const dmax = Math.max(dmin + 1, Math.ceil(cell * (1 + LINE_TOLERANCE)));
	if (length <= dmax) return [0, length];

	let mean = 0;
	for (let i = 1; i < length; i++) mean += signal[i];
	mean = mean / (length - 1) || 1;
	const spread = cell * LINE_TOLERANCE;

	const score = new Float64Array(length).fill(Number.NEGATIVE_INFINITY);
	const prev = new Int32Array(length).fill(0);
	for (let i = 1; i <= Math.min(dmax, length - 1); i++)
		score[i] = signal[i] / mean;
	for (let i = 1; i < length; i++) {
		if (score[i] === Number.NEGATIVE_INFINITY) continue;
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
	let best = Number.NEGATIVE_INFINITY;
	for (let i = Math.max(1, length - dmax); i < length; i++) {
		if (score[i] > best) {
			best = score[i];
			end = i;
		}
	}
	const lines: number[] = [];
	for (let i = end; i > 0; i = prev[i]) lines.push(i);
	lines.reverse();
	if (lines.length && lines[0] < cell / 2) lines.shift();
	if (lines.length && length - lines[lines.length - 1] < cell / 2) lines.pop();
	return [0, ...lines, length];
}

/** 2D integral images (premultiplied R, G, B and squared norm) for O(1) box color variance. */
function buildColorIntegrals(image: PixelImageData): ColorIntegrals {
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

function boxVariance(
	integrals: ColorIntegrals,
	ax: number,
	ay: number,
	bx: number,
	by: number,
): number {
	const n = (bx - ax) * (by - ay);
	if (n <= 0) return 0;
	const { w1 } = integrals;
	const sum = (a: Float64Array) =>
		a[by * w1 + bx] - a[ay * w1 + bx] - a[by * w1 + ax] + a[ay * w1 + ax];
	const mr = sum(integrals.r) / n;
	const mg = sum(integrals.g) / n;
	const mb = sum(integrals.b) / n;
	return Math.max(0, sum(integrals.q) / n - (mr * mr + mg * mg + mb * mb));
}

/** Mean within-cell color variance of the grid given by boundary lists, as a fraction of `total`. */
function gridVariance(
	integrals: ColorIntegrals,
	xb: readonly number[],
	yb: readonly number[],
): number {
	let total = 0;
	for (let j = 0; j < yb.length - 1; j++) {
		for (let i = 0; i < xb.length - 1; i++) {
			total += boxVariance(integrals, xb[i], yb[j], xb[i + 1], yb[j + 1]);
		}
	}
	return total / ((xb.length - 1) * (yb.length - 1));
}

/**
 * Typical spacing between consecutive *edge-backed* lines (both above the
 * axis's mean edge strength) — the cell size the art actually shows, robust
 * to the odd merged or split cell via an interquartile mean. NaN if too few.
 */
function edgeSpacing(signal: Float64Array, bounds: readonly number[]): number {
	let mean = 0;
	for (let i = 1; i < signal.length; i++) mean += signal[i];
	mean /= Math.max(1, signal.length - 1);
	const gaps: number[] = [];
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

/**
 * How consistently the detected cell size actually recurs, independent of
 * the line-fitting detection above: the share of same-color run lengths
 * (pooled across many full scan lines, see decisions 002/004) that match
 * the detected size exactly, averaged across both axes.
 */
function computeRegularity(
	image: PixelImageData,
	horizontal: number,
	vertical: number,
): number {
	const { width, height } = image;
	const rowCount = Math.min(MAX_SCAN_LINES, height);
	const hRuns: number[] = [];
	for (let i = 0; i < rowCount; i++) {
		const y = Math.floor(((i + 0.5) * height) / rowCount);
		hRuns.push(...runLengthsAlongLine(image, 0, y, 1, 0, width));
	}

	const colCount = Math.min(MAX_SCAN_LINES, width);
	const vRuns: number[] = [];
	for (let i = 0; i < colCount; i++) {
		const x = Math.floor(((i + 0.5) * width) / colCount);
		vRuns.push(...runLengthsAlongLine(image, x, 0, 0, 1, height));
	}

	return (matchRatio(hRuns, horizontal) + matchRatio(vRuns, vertical)) / 2;
}

/** Share of scanned runs that match the detected cell size for one axis. */
function matchRatio(runs: number[], value: number): number {
	if (runs.length === 0) return 0;
	return runs.filter((run) => run === value).length / runs.length;
}

function runLengthsAlongLine(
	image: PixelImageData,
	startX: number,
	startY: number,
	dx: number,
	dy: number,
	steps: number,
): number[] {
	const runs: number[] = [];
	let runLength = 1;
	let previous = pixelAt(image, startX, startY);
	for (let step = 1; step < steps; step++) {
		const current = pixelAt(image, startX + dx * step, startY + dy * step);
		if (colorsDiffer(previous, current)) {
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

function validate(image: PixelImageData): void {
	if (image.width <= 0 || image.height <= 0) {
		throw new Error(
			"Cannot detect a pixel grid on an image with no dimensions.",
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

function colorsDiffer(a: readonly number[], b: readonly number[]): boolean {
	return (
		Math.abs(a[0] - b[0]) > COLOR_TOLERANCE ||
		Math.abs(a[1] - b[1]) > COLOR_TOLERANCE ||
		Math.abs(a[2] - b[2]) > COLOR_TOLERANCE ||
		Math.abs(a[3] - b[3]) > COLOR_TOLERANCE
	);
}
