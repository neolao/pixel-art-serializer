import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectGridSizeByAutocorrelation } from "./autocorrelation.mjs";
import { detectGridSizeBaseline } from "./baseline.mjs";
import { detectGridSizeByBlockUniformityOffset } from "./block-uniformity-offset.mjs";
import { listSampleImages, loadPng } from "./io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.join(
	__dirname,
	"..",
	"..",
	"fixtures",
	"candidate-images",
);

// Expectations confirmed by the Product Owner / prior decisions.
const EXPECTATIONS = {
	"icon-92db5f3c.png": "no grid (non-pixel-art icon)",
	"icon-cefb64d8.png": "no grid (non-pixel-art icon)",
	"icon-eb214736.png": "no grid (non-pixel-art icon)",
	"icon-f3d07bfd.png": "no grid (non-pixel-art icon)",
	"icon-fe334a9c.png": "no grid (non-pixel-art icon)",
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

	const fmt = (r) =>
		`size=${r.size} (h=${r.horizontal},v=${r.vertical}) grid=${Math.round(image.width / r.horizontal)}x${Math.round(image.height / r.vertical)}`;

	console.log(`\n${name} (${image.width}x${image.height})`);
	console.log(`  expected: ${expected}`);
	console.log(`  baseline:                 ${fmt(baseline)}  [${t1 - t0}ms]`);
	console.log(`  autocorrelation:          ${fmt(autocorr)}  [${t2 - t1}ms]`);
	console.log(
		`  block-uniformity+offset:  ${fmt(blockOffset)}  [${t3 - t2}ms]`,
	);
}
console.log(`\nTotal runtime: ${Date.now() - start}ms`);
