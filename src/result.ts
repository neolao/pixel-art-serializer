import type { ConfidenceResult } from "./confidence";
import {
	detectPixelGridSize,
	type GridDetectionResult,
} from "./grid-detection";
import { TRANSPARENT_INDEX } from "./palette-editor";
import {
	extractColorPalette,
	type PaletteExtractionResult,
} from "./palette-extraction";
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
	downloadLink: HTMLAnchorElement;
	confidence: HTMLElement;
}

const DEFAULT_DOWNLOAD_FILENAME = "pixel-art.json";

export function resetResult(elements: ResultElements): void {
	elements.reconstructionFigure.hidden = true;
	elements.palette.hidden = true;
	elements.palette.innerHTML = "";
	elements.downloadLink.hidden = true;
	elements.downloadLink.removeAttribute("href");
	elements.confidence.hidden = true;
	elements.confidence.textContent = "";
	const context = elements.reconstructionCanvas.getContext("2d");
	context?.clearRect(
		0,
		0,
		elements.reconstructionCanvas.width,
		elements.reconstructionCanvas.height,
	);
}

export interface PaletteCallbacks {
	onSelect: (index: number) => void;
	onRemove: (index: number) => void;
	onModify: (index: number, hex: string) => void;
}

export function renderPalette(
	container: HTMLElement,
	palette: readonly SerializedPaletteColor[],
	activeIndex: number | null,
	callbacks: PaletteCallbacks,
): void {
	container.innerHTML = "";
	for (const color of palette) {
		container.appendChild(
			makeSwatch(color, color.index === activeIndex, callbacks),
		);
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

	// Palette indices are stable identifiers, not array positions — a color
	// removed by the manual editor leaves a gap rather than compacting the
	// array (see .vibe/decisions/012-remove-palette-color-erases-to-transparent.md).
	const colorsByIndex = new Map(
		serialization.palette.map((color) => [color.index, color]),
	);

	for (let y = 0; y < serialization.gridHeight; y++) {
		for (let x = 0; x < serialization.gridWidth; x++) {
			const paletteIndex =
				serialization.pixels[y * serialization.gridWidth + x];
			const color = colorsByIndex.get(paletteIndex);
			if (!color) continue;
			context.fillStyle = `${color.hex}${color.alpha.toString(16).padStart(2, "0")}`;
			context.fillRect(x, y, 1, 1);
		}
	}
}

export interface DetectionResult {
	grid: GridDetectionResult;
	palette: PaletteExtractionResult;
	serialization: PixelArtSerialization;
}

export function computeDetection(image: HTMLImageElement): DetectionResult {
	const pixelData = extractPixelData(image);
	const grid = detectPixelGridSize(pixelData);
	const palette = extractColorPalette(pixelData, grid);
	const serialization = serializePixelArt(pixelData, grid, palette);
	return { grid, palette, serialization };
}

export function renderConfidence(
	element: HTMLElement,
	confidence: ConfidenceResult,
): void {
	const percent = Math.round(confidence.score * 100);
	element.textContent = `${confidence.verdict} (${percent}%) — ${confidence.explanation}.`;
	element.hidden = false;
}

export function renderDownloadLink(
	link: HTMLAnchorElement,
	serialization: PixelArtSerialization,
	sourceFileName: string | undefined,
): void {
	const json = JSON.stringify(serialization);
	link.setAttribute(
		"href",
		`data:application/json;charset=utf-8,${encodeURIComponent(json)}`,
	);
	link.download = toJsonFilename(sourceFileName);
	link.hidden = false;
}

export function toJsonFilename(sourceFileName: string | undefined): string {
	if (!sourceFileName) {
		return DEFAULT_DOWNLOAD_FILENAME;
	}
	const dotIndex = sourceFileName.lastIndexOf(".");
	const base =
		dotIndex > 0 ? sourceFileName.slice(0, dotIndex) : sourceFileName;
	return `${base}.json`;
}

function makeSwatch(
	color: SerializedPaletteColor,
	isActive: boolean,
	callbacks: PaletteCallbacks,
): HTMLElement {
	const swatch = document.createElement("div");
	swatch.className = isActive ? "swatch active" : "swatch";

	const box = document.createElement("span");
	box.className = "swatch-box";
	box.addEventListener("click", () => callbacks.onSelect(color.index));

	const fill = document.createElement("span");
	fill.className = "swatch-fill";
	fill.style.backgroundColor = `${color.hex}${color.alpha.toString(16).padStart(2, "0")}`;
	box.appendChild(fill);

	const label = document.createElement("span");
	label.className = "swatch-hex";
	label.textContent = color.hex;

	swatch.append(box, label);

	if (color.index !== TRANSPARENT_INDEX) {
		const modify = document.createElement("input");
		modify.type = "color";
		modify.className = "swatch-modify";
		modify.value = color.hex;
		modify.addEventListener("input", () =>
			callbacks.onModify(color.index, modify.value),
		);

		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "swatch-remove";
		remove.setAttribute("aria-label", `Remove color ${color.hex}`);
		remove.textContent = "×";
		remove.addEventListener("click", () => callbacks.onRemove(color.index));

		swatch.append(modify, remove);
	}

	return swatch;
}
