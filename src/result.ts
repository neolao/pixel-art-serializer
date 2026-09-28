import { fromHex8 } from "./color";
import type { ConfidenceResult } from "./confidence";
import { encodeGif, MAX_GIF_COLORS } from "./gif-encoder";
import {
	detectPixelGridSize,
	type GridDetectionResult,
} from "./grid-detection";
import type { CropRect } from "./image-crop";
import { cropPixelData } from "./image-crop";
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
	gifDownloadLink: HTMLAnchorElement;
	gifNote: HTMLElement;
	confidence: HTMLElement;
	gridSize: HTMLElement;
}

const DEFAULT_DOWNLOAD_FILENAME = "pixel-art.json";
const DEFAULT_DOWNLOAD_FILENAME_GIF = "pixel-art.gif";

export function resetResult(elements: ResultElements): void {
	elements.reconstructionFigure.hidden = true;
	elements.palette.hidden = true;
	elements.palette.innerHTML = "";
	elements.downloadLink.hidden = true;
	elements.downloadLink.removeAttribute("href");
	elements.gifDownloadLink.hidden = true;
	elements.gifDownloadLink.removeAttribute("href");
	elements.gifDownloadLink.removeAttribute("aria-disabled");
	elements.gifNote.hidden = true;
	elements.gifNote.textContent = "";
	elements.confidence.hidden = true;
	elements.confidence.textContent = "";
	elements.gridSize.hidden = true;
	elements.gridSize.textContent = "";
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
	onToggleMerge?: (index: number) => void;
	onMergeInto?: (index: number) => void;
}

export function renderPalette(
	container: HTMLElement,
	palette: readonly SerializedPaletteColor[],
	activeIndex: number | null,
	callbacks: PaletteCallbacks,
	mergeSelection?: ReadonlySet<number>,
): void {
	container.innerHTML = "";
	for (const color of palette) {
		container.appendChild(
			makeSwatch(color, color.index === activeIndex, callbacks, mergeSelection),
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
			context.fillStyle = color.color;
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

/**
 * Runs the same pipeline as `computeDetection`, but on a user-confirmed crop
 * and grid size instead of running automatic detection — see
 * .vibe/decisions/020-manual-grid-adjustment-as-crop.md. The manually
 * confirmed grid is treated as fully regular (`gridRegularity: 1`): it's a
 * factual statement of what the user picked, not a judgment of quality.
 */
export function computeManualDetection(
	image: HTMLImageElement,
	crop: CropRect,
	gridWidth: number,
	gridHeight: number,
): DetectionResult {
	const pixelData = extractPixelData(image);
	const cropped = cropPixelData(pixelData, crop);
	const grid: GridDetectionResult = {
		pixelSize: Math.min(cropped.width / gridWidth, cropped.height / gridHeight),
		gridWidth,
		gridHeight,
		gridRegularity: 1,
	};
	const palette = extractColorPalette(cropped, grid);
	const serialization = serializePixelArt(cropped, grid, palette);
	return { grid, palette, serialization };
}

export function renderGridSize(
	element: HTMLElement,
	serialization: PixelArtSerialization,
): void {
	element.textContent = `${serialization.gridWidth} × ${serialization.gridHeight} pixels`;
	element.hidden = false;
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

/**
 * Mirrors `renderDownloadLink` for a GIF built from the same reconstruction
 * (see `.vibe/decisions/022-gif-export-via-omggif.md`), plus two states GIF
 * needs and JSON doesn't: the palette may exceed GIF's 256-color limit (the
 * link stays visible but disabled, with an explanation — JSON is unaffected),
 * and a non-reserved semi-transparent color is always flattened to opaque
 * for the GIF only (a standing, non-blocking note — see
 * `.vibe/decisions/023-gif-export-flattens-non-reserved-alpha.md`).
 */
export function renderGifDownloadLink(
	link: HTMLAnchorElement,
	note: HTMLElement,
	serialization: PixelArtSerialization,
	sourceFileName: string | undefined,
): void {
	link.hidden = false;

	if (serialization.palette.length > MAX_GIF_COLORS) {
		link.removeAttribute("href");
		link.removeAttribute("download");
		link.setAttribute("aria-disabled", "true");
		note.textContent = `This image's palette has ${serialization.palette.length} colors — GIF only supports up to ${MAX_GIF_COLORS}, so it can't be downloaded as a GIF here. The JSON download is unaffected.`;
		note.hidden = false;
		return;
	}

	const { bytes, hasFlattenedColor } = encodeGif(serialization);
	link.removeAttribute("aria-disabled");
	link.setAttribute("href", `data:image/gif;base64,${bytesToBase64(bytes)}`);
	link.download = toGifFilename(sourceFileName);

	if (hasFlattenedColor) {
		note.textContent =
			"A palette color isn't fully opaque; GIF can't represent that, so it's shown as a solid color here (the JSON download keeps its exact transparency).";
		note.hidden = false;
	} else {
		note.textContent = "";
		note.hidden = true;
	}
}

export function toGifFilename(sourceFileName: string | undefined): string {
	if (!sourceFileName) {
		return DEFAULT_DOWNLOAD_FILENAME_GIF;
	}
	const dotIndex = sourceFileName.lastIndexOf(".");
	const base =
		dotIndex > 0 ? sourceFileName.slice(0, dotIndex) : sourceFileName;
	return `${base}.gif`;
}

const BASE64_CHUNK_SIZE = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
		binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_SIZE));
	}
	return btoa(binary);
}

function makeSwatch(
	color: SerializedPaletteColor,
	isActive: boolean,
	callbacks: PaletteCallbacks,
	mergeSelection: ReadonlySet<number> | undefined,
): HTMLElement {
	const swatch = document.createElement("div");
	swatch.className = isActive ? "swatch active" : "swatch";

	const box = document.createElement("span");
	box.className = "swatch-box";
	if (!mergeSelection) {
		box.addEventListener("click", () => callbacks.onSelect(color.index));
	}

	const fill = document.createElement("span");
	fill.className = "swatch-fill";
	fill.style.backgroundColor = color.color;
	box.appendChild(fill);

	const hex = fromHex8(color.color).hex;

	const label = document.createElement("span");
	label.className = "swatch-hex";
	label.textContent = hex;

	swatch.append(box, label);

	if (color.index === TRANSPARENT_INDEX) {
		return swatch;
	}

	if (mergeSelection) {
		const isSelected = mergeSelection.has(color.index);

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "swatch-merge-select";
		checkbox.checked = isSelected;
		checkbox.setAttribute("aria-label", `Select color ${hex} to merge`);
		checkbox.addEventListener("change", () =>
			callbacks.onToggleMerge?.(color.index),
		);
		swatch.append(checkbox);

		if (isSelected && mergeSelection.size >= 2) {
			const mergeInto = document.createElement("button");
			mergeInto.type = "button";
			mergeInto.className = "swatch-merge-into";
			mergeInto.setAttribute("aria-label", `Merge selected colors into ${hex}`);
			mergeInto.textContent = "Merge here";
			mergeInto.addEventListener("click", () =>
				callbacks.onMergeInto?.(color.index),
			);
			swatch.append(mergeInto);
		}

		return swatch;
	}

	const modify = document.createElement("input");
	modify.type = "color";
	modify.className = "swatch-modify";
	modify.value = hex;
	modify.addEventListener("input", () =>
		callbacks.onModify(color.index, modify.value),
	);

	const remove = document.createElement("button");
	remove.type = "button";
	remove.className = "swatch-remove";
	remove.setAttribute("aria-label", `Remove color ${hex}`);
	remove.textContent = "×";
	remove.addEventListener("click", () => callbacks.onRemove(color.index));

	swatch.append(modify, remove);

	return swatch;
}
