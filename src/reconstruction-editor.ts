import {
	addPaletteColor,
	modifyPaletteColor,
	recolorPixel,
	removePaletteColor,
} from "./palette-editor";
import {
	renderDownloadLink,
	renderPalette,
	renderReconstruction,
} from "./result";
import type { PixelArtSerialization } from "./serializer";

export interface EditorElements {
	reconstructionCanvas: HTMLCanvasElement;
	palette: HTMLElement;
	downloadLink: HTMLAnchorElement;
	addColorInput: HTMLInputElement;
	addColorButton: HTMLButtonElement;
}

export interface ReconstructionEditor {
	load(
		serialization: PixelArtSerialization,
		sourceFileName: string | undefined,
	): void;
	/** Clears any loaded serialization, so a stale in-flight edit (e.g. a
	 * click on "add color" while a newly-selected image is still decoding)
	 * cannot silently repaint the previous image's result. */
	reset(): void;
}

interface Rect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Maps a click's viewport coordinates to a logical-pixel index in the
 * reconstruction, accounting for the canvas being drawn at one unit per
 * logical pixel but displayed scaled up via CSS (see
 * .vibe/decisions/007-reconstruction-rendered-to-live-canvas.md).
 */
export function pixelIndexAt(
	rect: Rect,
	gridWidth: number,
	gridHeight: number,
	clientX: number,
	clientY: number,
): number | null {
	if (rect.width <= 0 || rect.height <= 0) return null;
	const x = Math.floor(((clientX - rect.left) / rect.width) * gridWidth);
	const y = Math.floor(((clientY - rect.top) / rect.height) * gridHeight);
	if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return null;
	return y * gridWidth + x;
}

export function attachPixelPainter(
	canvas: HTMLCanvasElement,
	getSerialization: () => PixelArtSerialization | null,
	onPaint: (pixelPosition: number) => void,
): void {
	canvas.addEventListener("click", (event) => {
		const serialization = getSerialization();
		if (!serialization) return;
		const rect = canvas.getBoundingClientRect();
		const index = pixelIndexAt(
			rect,
			serialization.gridWidth,
			serialization.gridHeight,
			event.clientX,
			event.clientY,
		);
		if (index !== null) onPaint(index);
	});
}

export function createReconstructionEditor(
	elements: EditorElements,
): ReconstructionEditor {
	let serialization: PixelArtSerialization | null = null;
	let sourceFileName: string | undefined;
	let activeColorIndex: number | null = null;

	function rerender(): void {
		if (!serialization) return;
		renderReconstruction(elements.reconstructionCanvas, serialization);
		elements.reconstructionCanvas.classList.toggle(
			"painting",
			activeColorIndex !== null,
		);
		renderPalette(elements.palette, serialization.palette, activeColorIndex, {
			onSelect: (index) => {
				activeColorIndex = activeColorIndex === index ? null : index;
				rerender();
			},
			onRemove: (index) => {
				if (!serialization) return;
				serialization = removePaletteColor(serialization, index);
				if (activeColorIndex === index) activeColorIndex = null;
				rerender();
			},
			onModify: (index, hex) => {
				if (!serialization) return;
				const existingAlpha =
					serialization.palette.find((c) => c.index === index)?.alpha ?? 255;
				serialization = modifyPaletteColor(serialization, index, {
					hex,
					alpha: existingAlpha,
				});
				rerender();
			},
		});
		renderDownloadLink(elements.downloadLink, serialization, sourceFileName);
	}

	attachPixelPainter(
		elements.reconstructionCanvas,
		() => serialization,
		(pixelPosition) => {
			if (!serialization || activeColorIndex === null) return;
			serialization = recolorPixel(
				serialization,
				pixelPosition,
				activeColorIndex,
			);
			rerender();
		},
	);

	elements.addColorButton.addEventListener("click", () => {
		if (!serialization) return;
		serialization = addPaletteColor(serialization, {
			hex: elements.addColorInput.value,
			alpha: 255,
		});
		rerender();
	});

	return {
		load(newSerialization, newSourceFileName) {
			serialization = newSerialization;
			sourceFileName = newSourceFileName;
			activeColorIndex = null;
			rerender();
		},
		reset() {
			serialization = null;
			sourceFileName = undefined;
			activeColorIndex = null;
		},
	};
}
