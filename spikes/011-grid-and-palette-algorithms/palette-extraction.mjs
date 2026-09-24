import { labDistance, rgbToLab } from "./color.mjs";

export function collectDistinctColors(image) {
	const counts = new Map();
	const pixelCount = image.width * image.height;
	for (let i = 0; i < pixelCount; i++) {
		const o = i * 4;
		const key = `${image.data[o]},${image.data[o + 1]},${image.data[o + 2]},${image.data[o + 3]}`;
		const entry = counts.get(key);
		if (entry) {
			entry.count++;
		} else {
			counts.set(key, {
				rgba: [
					image.data[o],
					image.data[o + 1],
					image.data[o + 2],
					image.data[o + 3],
				],
				count: 1,
			});
		}
	}
	return [...counts.values()];
}

/**
 * Algorithm A — median cut to a fixed target size.
 * Source: Heckbert 1980, the classic color-quantization algorithm; still the
 * most widely used approach (Wikipedia "Color quantization").
 * Needs the target palette size decided up front — it cannot discover on its
 * own how many colors the artwork "really" uses.
 */
export function paletteByMedianCut(colors, targetSize) {
	const boxes = [colors];
	while (boxes.length < targetSize) {
		const splitIndex = boxes.findIndex((box) => box.length > 1);
		if (splitIndex === -1) break;
		const [a, b] = splitBox(boxes[splitIndex]);
		boxes.splice(splitIndex, 1, a, b);
	}
	return boxes.map(averageColor);
}

function splitBox(box) {
	const channel = widestChannel(box);
	const sorted = [...box].sort((a, b) => a.rgba[channel] - b.rgba[channel]);
	const mid = Math.ceil(sorted.length / 2);
	return [sorted.slice(0, mid), sorted.slice(mid)];
}

function widestChannel(box) {
	let widest = 0;
	let widestRange = -1;
	for (let channel = 0; channel < 3; channel++) {
		const values = box.map((c) => c.rgba[channel]);
		const range = Math.max(...values) - Math.min(...values);
		if (range > widestRange) {
			widestRange = range;
			widest = channel;
		}
	}
	return widest;
}

function averageColor(box) {
	const totalCount = box.reduce((sum, c) => sum + c.count, 0);
	const rgba = [0, 1, 2, 3].map((channel) =>
		Math.round(
			box.reduce((sum, c) => sum + c.rgba[channel] * c.count, 0) / totalCount,
		),
	);
	return { rgba, count: totalCount };
}

/**
 * Algorithm B — perceptual-distance agglomerative merge.
 * Source: palette-merging practice reported for LEGO/brick-mosaic tools and
 * K-means-in-Lab palette work — repeatedly merge the two closest colors
 * while they stay under a perceptual "just noticeable difference" threshold.
 * Discovers the resulting palette size instead of requiring it up front.
 */
// The pairwise merge below is O(n^2) per step, which is fine for a
// pixel-art image's small color count but explodes on a noisy/gradient
// image with tens of thousands of raw distinct colors (observed on one
// of the samples). Coarsely bucket first so the perceptual merge only
// ever runs on a manageable candidate set.
const PRE_BUCKET_TRIGGER = 500;
const PRE_BUCKET_STEP = 16;

export function paletteByPerceptualMerge(colors, thresholdDeltaE) {
	const source =
		colors.length > PRE_BUCKET_TRIGGER
			? preBucket(colors, PRE_BUCKET_STEP)
			: colors;
	let entries = source.map((c) => ({ ...c, lab: rgbToLab(c.rgba) }));

	for (;;) {
		let bestI = -1;
		let bestJ = -1;
		let bestDistance = Infinity;
		for (let i = 0; i < entries.length; i++) {
			for (let j = i + 1; j < entries.length; j++) {
				const d = labDistance(entries[i].lab, entries[j].lab);
				if (d < bestDistance) {
					bestDistance = d;
					bestI = i;
					bestJ = j;
				}
			}
		}
		if (bestDistance >= thresholdDeltaE || bestI === -1) break;

		const merged = averageColor([entries[bestI], entries[bestJ]]);
		merged.lab = rgbToLab(merged.rgba);
		entries = entries.filter((_, index) => index !== bestI && index !== bestJ);
		entries.push(merged);
	}

	return entries.map(({ rgba, count }) => ({ rgba, count }));
}

function preBucket(colors, step) {
	const buckets = new Map();
	for (const color of colors) {
		const key = color.rgba
			.slice(0, 3)
			.map((v) => Math.round(v / step) * step)
			.join(",");
		const entry = buckets.get(key);
		if (entry) {
			entry.push(color);
		} else {
			buckets.set(key, [color]);
		}
	}
	return [...buckets.values()].map(averageColor);
}
