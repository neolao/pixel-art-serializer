import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

export function loadPng(filePath) {
	const buffer = fs.readFileSync(filePath);
	const png = PNG.sync.read(buffer);
	return { width: png.width, height: png.height, data: png.data };
}

export function listSampleImages(dir) {
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".png"))
		.sort()
		.map((name) => path.join(dir, name));
}

export function pixelAt(image, x, y) {
	const i = (y * image.width + x) * 4;
	return [
		image.data[i],
		image.data[i + 1],
		image.data[i + 2],
		image.data[i + 3],
	];
}

export function colorsDiffer(a, b, tolerance) {
	return (
		Math.abs(a[0] - b[0]) > tolerance ||
		Math.abs(a[1] - b[1]) > tolerance ||
		Math.abs(a[2] - b[2]) > tolerance ||
		Math.abs(a[3] - b[3]) > tolerance
	);
}
