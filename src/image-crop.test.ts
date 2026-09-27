import { describe, expect, it } from "vitest";
import type { PixelImageData } from "./grid-detection";
import { cropPixelData } from "./image-crop";

/** Builds an image where each pixel's channels encode its own (x, y), so a crop's correctness can be checked against the source directly. */
function makePositionEncodedImage(
	width: number,
	height: number,
): PixelImageData {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			data[i] = x;
			data[i + 1] = y;
			data[i + 2] = 0;
			data[i + 3] = 255;
		}
	}
	return { width, height, data };
}

function pixelAt(image: PixelImageData, x: number, y: number): number[] {
	const data = image.data as Uint8ClampedArray;
	const i = (y * image.width + x) * 4;
	return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

describe("cropPixelData", () => {
	it("extracts exactly the pixels within the given rectangle, at the right offset", () => {
		const source = makePositionEncodedImage(10, 8);

		const cropped = cropPixelData(source, { x: 3, y: 2, width: 4, height: 3 });

		expect(cropped.width).toBe(4);
		expect(cropped.height).toBe(3);
		for (let y = 0; y < 3; y++) {
			for (let x = 0; x < 4; x++) {
				expect(pixelAt(cropped, x, y)).toEqual(pixelAt(source, x + 3, y + 2));
			}
		}
	});

	it("returns an identical copy when the rectangle covers the whole image", () => {
		const source = makePositionEncodedImage(5, 5);

		const cropped = cropPixelData(source, { x: 0, y: 0, width: 5, height: 5 });

		expect(cropped.width).toBe(5);
		expect(cropped.height).toBe(5);
		expect([...(cropped.data as Uint8ClampedArray)]).toEqual([
			...(source.data as Uint8ClampedArray),
		]);
	});

	it("extracts a single pixel for a 1x1 rectangle", () => {
		const source = makePositionEncodedImage(10, 10);

		const cropped = cropPixelData(source, { x: 6, y: 4, width: 1, height: 1 });

		expect(cropped.width).toBe(1);
		expect(cropped.height).toBe(1);
		expect(pixelAt(cropped, 0, 0)).toEqual(pixelAt(source, 6, 4));
	});

	it("rounds fractional rectangle coordinates to the nearest whole pixel", () => {
		const source = makePositionEncodedImage(10, 10);

		const cropped = cropPixelData(source, {
			x: 2.4,
			y: 1.6,
			width: 3.6,
			height: 2.4,
		});

		// x rounds to 2, y rounds to 2, width rounds to 4, height rounds to 2
		expect(cropped.width).toBe(4);
		expect(cropped.height).toBe(2);
		expect(pixelAt(cropped, 0, 0)).toEqual(pixelAt(source, 2, 2));
	});

	it("throws when the rectangle extends beyond the image bounds", () => {
		const source = makePositionEncodedImage(10, 10);

		expect(() =>
			cropPixelData(source, { x: 8, y: 0, width: 5, height: 3 }),
		).toThrow();
	});

	it("throws when the rectangle has no area", () => {
		const source = makePositionEncodedImage(10, 10);

		expect(() =>
			cropPixelData(source, { x: 0, y: 0, width: 0, height: 3 }),
		).toThrow();
	});
});
