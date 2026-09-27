import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectGridSizeByAutocorrelation } from "./autocorrelation.mjs";
import { detectGridSizeBaseline } from "./baseline.mjs";
import { detectGridSizeByBlockUniformityOffset } from "./block-uniformity-offset.mjs";
import { listSampleImages, loadPng } from "./io.mjs";
import { detectGridSizeByLineFitting } from "./line-fitting-variance-knee.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.join(
	__dirname,
	"..",
	"..",
	"fixtures",
	"candidate-images",
);

// Expectations confirmed by the Product Owner / prior decisions. The 5
// "icon-*" samples were reclassified during this spike from "non-pixel-art"
// (decision-002) to confirmed pixel art at native resolution, true grid size
// unknown — same status as pixel-art-mario-sprite.png below.
const EXPECTATIONS = {
	"pixel-art-icon-92db5f3c-native.png":
		"pixel art, native resolution — true grid size unknown",
	"pixel-art-icon-cefb64d8-native.png":
		"pixel art, native resolution — true grid size unknown",
	"pixel-art-icon-eb214736-native.png":
		"pixel art, native resolution — true grid size unknown",
	"pixel-art-icon-f3d07bfd-native.png":
		"pixel art, native resolution — true grid size unknown",
	"pixel-art-icon-fe334a9c-native.png":
		"pixel art, native resolution — true grid size unknown",
	"pixel-art-cat.png": "~38-39px cell (already correctly detected today)",
	"pixel-art-cat-grid-drawing.png":
		"~64px cell (already correctly detected today)",
	"pixel-art-mario-sprite.png":
		"unknown true size — already known-broken (reports no grid today)",
	"pixel-art-mario-sprite-blurred-border.png":
		"16x16 grid confirmed by the Product Owner (~42px cell)",
};

console.log(
	"image (dims) | expected | baseline | autocorrelation | block-uniformity+offset",
);
console.log("-".repeat(120));

const start = Date.now();
for (const filePath of listSampleImages(samplesDir)) {
	const name = path.basename(filePath);
	const image = loadPng(filePath);
	const expected = EXPECTATIONS[name] ?? "(no prior expectation on file)";

	const t0 = Date.now();
	const baseline = detectGridSizeBaseline(image);
	const t1 = Date.now();
	const autocorr = detectGridSizeByAutocorrelation(image);
	const t2 = Date.now();
	const blockOffset = detectGridSizeByBlockUniformityOffset(image);
	const t3 = Date.now();
	const lineFitting = detectGridSizeByLineFitting(image);
	const t4 = Date.now();

	const fmt = (r) =>
		`size=${r.size} (h=${r.horizontal},v=${r.vertical}) grid=${Math.round(image.width / r.horizontal)}x${Math.round(image.height / r.vertical)}`;

	console.log(`\n${name} (${image.width}x${image.height})`);
	console.log(`  expected: ${expected}`);
	console.log(`  baseline:                 ${fmt(baseline)}  [${t1 - t0}ms]`);
	console.log(`  autocorrelation:          ${fmt(autocorr)}  [${t2 - t1}ms]`);
	console.log(
		`  block-uniformity+offset:  ${fmt(blockOffset)}  [${t3 - t2}ms]`,
	);
	console.log(
		`  line-fitting+knee:        ${fmt(lineFitting)} conf=${lineFitting.confidence}  [${t4 - t3}ms]`,
	);
}
console.log(`\nTotal runtime: ${Date.now() - start}ms`);
