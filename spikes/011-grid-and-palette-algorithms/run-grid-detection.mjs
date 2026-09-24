import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	detectGridSizeByBlockUniformity,
	detectGridSizeBySamplePoints,
} from "./grid-detection.mjs";
import { listSampleImages, loadPng } from "./io.mjs";

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

console.log("image, expected, samplePoints size, blockUniformity size");
console.log("-".repeat(70));

for (const filePath of listSampleImages(samplesDir)) {
	const name = path.basename(filePath);
	const image = loadPng(filePath);
	const expected = KNOWN_PIXEL_ART.has(name) ? "pixel-art" : "non-pixel-art";

	const bySamplePoints = detectGridSizeBySamplePoints(image);
	const byBlockUniformity = detectGridSizeByBlockUniformity(image);

	console.log(
		`${name} (${image.width}x${image.height}), expected=${expected}, samplePoints=${bySamplePoints.size} (h=${bySamplePoints.horizontal},v=${bySamplePoints.vertical}), blockUniformity=${byBlockUniformity.size}`,
	);
}
