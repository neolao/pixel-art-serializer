import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSampleImages, loadPng } from "./io.mjs";
import {
	collectDistinctColors,
	paletteByMedianCut,
	paletteByPerceptualMerge,
} from "./palette-extraction.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.join(
	__dirname,
	"..",
	"..",
	"fixtures",
	"candidate-images",
);

const KNOWN_PIXEL_ART = new Set([
	"pixel-art-cat.png",
	"pixel-art-cat-grid-drawing.png",
	"pixel-art-mario-sprite.png",
]);

const DELTA_E_THRESHOLD = 10; // "just noticeable difference" ballpark reported in palette-merging literature
const MEDIAN_CUT_TARGET = 16; // arbitrary fixed target, chosen without knowing the true palette size

console.log(
	"image, expected, raw distinct, medianCut(K=16), perceptualMerge(deltaE<10)",
);
console.log("-".repeat(80));

for (const filePath of listSampleImages(samplesDir)) {
	const name = path.basename(filePath);
	const image = loadPng(filePath);
	const expected = KNOWN_PIXEL_ART.has(name) ? "pixel-art" : "non-pixel-art";

	const colors = collectDistinctColors(image);
	const medianCut = paletteByMedianCut(
		colors,
		Math.min(MEDIAN_CUT_TARGET, colors.length),
	);
	const perceptualMerge = paletteByPerceptualMerge(colors, DELTA_E_THRESHOLD);

	console.log(
		`${name}, expected=${expected}, raw=${colors.length}, medianCut=${medianCut.length}, perceptualMerge=${perceptualMerge.length}`,
	);
}
