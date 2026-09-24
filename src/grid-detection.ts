export interface PixelImageData {
	width: number;
	height: number;
	data: ArrayLike<number>;
}

export interface GridDetectionResult {
	pixelSize: number;
	gridWidth: number;
	gridHeight: number;
}

const COLOR_TOLERANCE = 3;
const MAX_SCAN_LINES = 24;

export function detectPixelGridSize(
	image: PixelImageData,
): GridDetectionResult {
	validate(image);
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

	const horizontal = mode(hRuns) ?? 1;
	const vertical = mode(vRuns) ?? 1;

	return {
		pixelSize: Math.min(horizontal, vertical),
		gridWidth: Math.round(width / horizontal),
		gridHeight: Math.round(height / vertical),
	};
}

/**
 * Every same-color segment length along one full row or column. Pooling
 * these across many lines and taking the most frequent length (see `mode`)
 * finds the recurring cell size even when a few lines cross a large
 * background region or a noisy area — those contribute rare or scattered
 * lengths that don't compete with a size repeating consistently line after line.
 */
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

function mode(values: number[]): number | null {
	if (values.length === 0) return null;
	const counts = new Map<number, number>();
	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	let best: number | null = null;
	let bestCount = 0;
	for (const [value, count] of counts) {
		if (count > bestCount) {
			best = value;
			bestCount = count;
		}
	}
	return best;
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
