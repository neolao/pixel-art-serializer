import { detectPixelGridSize } from "./grid-detection";
import { extractColorPalette } from "./palette-extraction";
import { extractPixelData } from "./pixel-data";
import {
	type PixelArtSerialization,
	type SerializedPaletteColor,
	serializePixelArt,
} from "./serializer";

export interface ResultElements {
	reconstructionFigure: HTMLElement;
	reconstructionCanvas: HTMLCanvasElement;
	palette: HTMLElement;
}

export function resetResult(elements: ResultElements): void {
	elements.reconstructionFigure.hidden = true;
	elements.palette.hidden = true;
	elements.palette.innerHTML = "";
	const context = elements.reconstructionCanvas.getContext("2d");
	context?.clearRect(
		0,
		0,
		elements.reconstructionCanvas.width,
		elements.reconstructionCanvas.height,
	);
}

export function renderPalette(
	container: HTMLElement,
	palette: readonly SerializedPaletteColor[],
): void {
	container.innerHTML = "";
	for (const color of palette) {
		container.appendChild(makeSwatch(color));
	}
	container.hidden = palette.length === 0;
}

export function renderReconstruction(
	canvas: HTMLCanvasElement,
	serialization: PixelArtSerialization,
): void {
	canvas.width = serialization.gridWidth;
	canvas.height = serialization.gridHeight;
	canvas.style.aspectRatio = `${serialization.gridWidth} / ${serialization.gridHeight}`;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(
			"Could not get a 2D canvas context to draw the reconstruction.",
		);
	}

	for (let y = 0; y < serialization.gridHeight; y++) {
		for (let x = 0; x < serialization.gridWidth; x++) {
			const paletteIndex =
				serialization.pixels[y * serialization.gridWidth + x];
			const color = serialization.palette[paletteIndex];
			context.fillStyle = `${color.hex}${color.alpha.toString(16).padStart(2, "0")}`;
			context.fillRect(x, y, 1, 1);
		}
	}
}

export function displayResult(
	image: HTMLImageElement,
	elements: ResultElements,
): void {
	const pixelData = extractPixelData(image);
	const grid = detectPixelGridSize(pixelData);
	const palette = extractColorPalette(pixelData, grid);
	const serialization = serializePixelArt(pixelData, grid, palette);

	renderReconstruction(elements.reconstructionCanvas, serialization);
	renderPalette(elements.palette, serialization.palette);
	elements.reconstructionFigure.hidden = false;
}

function makeSwatch(color: SerializedPaletteColor): HTMLElement {
	const swatch = document.createElement("div");
	swatch.className = "swatch";

	const box = document.createElement("span");
	box.className = "swatch-box";

	const fill = document.createElement("span");
	fill.className = "swatch-fill";
	fill.style.backgroundColor = `${color.hex}${color.alpha.toString(16).padStart(2, "0")}`;
	box.appendChild(fill);

	const label = document.createElement("span");
	label.className = "swatch-hex";
	label.textContent = color.hex;

	swatch.append(box, label);
	return swatch;
}
