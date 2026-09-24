import type { PixelImageData } from "./grid-detection";

export function extractPixelData(image: HTMLImageElement): PixelImageData {
	const canvas = document.createElement("canvas");
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(
			"Could not get a 2D canvas context to read the image's pixels.",
		);
	}

	context.drawImage(image, 0, 0);
	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	return {
		width: imageData.width,
		height: imageData.height,
		data: imageData.data,
	};
}
