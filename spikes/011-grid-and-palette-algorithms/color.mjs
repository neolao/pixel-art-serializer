// sRGB -> CIE Lab conversion, used to measure perceptual color distance
// (CIE76: Euclidean distance in Lab) rather than raw RGB Euclidean distance,
// which mis-ranks blues/greens and near-greys per the palette-merging literature.

function srgbToLinear(c) {
	const v = c / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

const D65 = { x: 95.047, y: 100.0, z: 108.883 };

export function rgbToLab([r, g, b]) {
	const rl = srgbToLinear(r);
	const gl = srgbToLinear(g);
	const bl = srgbToLinear(b);

	const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) * 100;
	const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) * 100;
	const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) * 100;

	const fx = labF(x / D65.x);
	const fy = labF(y / D65.y);
	const fz = labF(z / D65.z);

	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labF(t) {
	return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27) * t + 16 / 116;
}

export function labDistance(a, b) {
	const dl = a[0] - b[0];
	const da = a[1] - b[1];
	const db = a[2] - b[2];
	return Math.sqrt(dl * dl + da * da + db * db);
}
