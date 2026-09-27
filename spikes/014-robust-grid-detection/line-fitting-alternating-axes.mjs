/**
 * Prototype v2 — alternating coordinate-descent refinement between axes,
 * instead of a single one-way pass (seed from joint sweep, refine vertical
 * once, refine horizontal once). The one-way version regressed a real
 * confirmed image (pixel-art-cat.png, 602x559, confirmed 15x14) that the
 * simpler joint (shared-cell) version got exactly right, revealing that a
 * single pass can cascade a mediocre seed into a wrong vertical result.
 * Alternating several rounds lets each axis's refinement correct the other's
 * earlier estimate instead of being permanently downstream of it.
 */

const LINE_TOLERANCE = 0.25;
const SPACING_PENALTY = 0.5;
const MIN_CELL_SIZE = 2;
const PLATEAU_MAX = 0.2;
const PLATEAU_MIN_RUN = 2;
const REFIT_ROUNDS = 4;
const ALTERNATE_ROUNDS = 4;

export function detectGridSizeAlternating(image) {
	const { width, height } = image;
	const cols = edgeSignal(image, "h");
	const rows = edgeSignal(image, "v");
	const integrals = buildColorIntegrals(image);
	const total = boxVariance(integrals, 0, 0, width, height);
	if (total <= 1e-6) return { horizontal: 1, vertical: 1, size: 1 };

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
		const jointU = [];
		const jointFits = [];
		for (let c = MIN_CELL_SIZE; c <= maxCell; c++) {
			const xb = fitLines(cols, width, c);
			const yb = fitLines(rows, height, c);
			jointFits[c] = { xb, yb };
			jointU[c] = gridVariance(integrals, xb, yb) / total;
		}
		const seedCell = findKnee(jointU, MIN_CELL_SIZE, maxCell);
		if (seedCell !== null) {
			bestXb = jointFits[seedCell].xb;
			bestYb = jointFits[seedCell].yb;
		}
	}

	let horizontal = null;
	let vertical = null;
	let previousHorizontal = null;
	let previousVertical = null;
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

	const h = horizontal ?? 1;
	const v = vertical ?? 1;
	return { horizontal: h, vertical: v, size: Math.min(h, v) };
}

function sweepAxis(signal, length, maxCell, scoreFor) {
	const u = [];
	for (let c = MIN_CELL_SIZE; c <= maxCell; c++) u[c] = scoreFor(c);
	const knee = findKnee(u, MIN_CELL_SIZE, maxCell);
	if (knee === null) return null;
	return settle(signal, length, knee);
}

/**
 * The plateau's end: the last candidate still at or below PLATEAU_MAX,
 * provided it belongs to a run of at least PLATEAU_MIN_RUN consecutive
 * qualifying candidates (a lone dip is noise, not a real repeating cell —
 * see decision 019). A relative-jump trigger was tried first but locked
 * onto a transient dip that later recovered, rather than the true,
 * sustained plateau right before variance rises for good.
 */
function findKnee(u, minC, maxC) {
	let runStart = null;
	let best = null;
	for (let c = minC; c < maxC; c++) {
		const qualifies = u[c] <= PLATEAU_MAX;
		if (qualifies) {
			if (runStart === null) runStart = c;
			if (c - runStart + 1 >= PLATEAU_MIN_RUN) best = c;
		} else {
			runStart = null;
		}
	}
	return best;
}

function settle(signal, length, startCell) {
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
