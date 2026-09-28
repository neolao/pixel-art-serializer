import { GifReader } from "omggif";
import { describe, expect, it, vi } from "vitest";
import type { ConfidenceResult } from "./confidence";
import { MAX_GIF_COLORS } from "./gif-encoder";
import {
	type PaletteCallbacks,
	type ResultElements,
	renderConfidence,
	renderDownloadLink,
	renderGifDownloadLink,
	renderGridSize,
	renderPalette,
	resetResult,
	toGifFilename,
	toJsonFilename,
} from "./result";
import type {
	PixelArtSerialization,
	SerializedPaletteColor,
} from "./serializer";

function makeResultElements(): ResultElements {
	const reconstructionFigure = document.createElement("figure");
	const reconstructionCanvas = document.createElement("canvas");
	const palette = document.createElement("div");
	const downloadLink = document.createElement("a");
	const gifDownloadLink = document.createElement("a");
	const gifNote = document.createElement("p");
	const confidence = document.createElement("p");
	const gridSize = document.createElement("p");
	reconstructionFigure.appendChild(reconstructionCanvas);
	return {
		reconstructionFigure,
		reconstructionCanvas,
		palette,
		downloadLink,
		gifDownloadLink,
		gifNote,
		confidence,
		gridSize,
	};
}

function readDownloadedGif(link: HTMLAnchorElement): {
	width: number;
	height: number;
	pixels: Uint8ClampedArray;
} {
	const href = link.getAttribute("href") ?? "";
	const prefix = "data:image/gif;base64,";
	if (!href.startsWith(prefix)) {
		throw new Error(`unexpected href: ${href}`);
	}
	const binary = atob(href.slice(prefix.length));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const reader = new GifReader(bytes);
	const pixels = new Uint8ClampedArray(reader.width * reader.height * 4);
	reader.decodeAndBlitFrameRGBA(0, pixels);
	return { width: reader.width, height: reader.height, pixels };
}

function makeSerializationWithColorCount(
	colorCount: number,
): PixelArtSerialization {
	const palette: SerializedPaletteColor[] = [
		{ index: 0, color: "#00000000", reserved: true },
	];
	for (let i = 1; i < colorCount; i++) {
		const channel = (i % 256).toString(16).padStart(2, "0");
		palette.push({ index: i, color: `#${channel}0000ff`, reserved: false });
	}
	const gridWidth = 16;
	const gridHeight = Math.ceil(colorCount / gridWidth);
	const pixels: number[] = [];
	for (let i = 0; i < gridWidth * gridHeight; i++) {
		pixels.push(i < colorCount ? i : 0);
	}
	return { formatVersion: 1, gridWidth, gridHeight, palette, pixels };
}

function makeSerialization(
	gridWidth: number,
	gridHeight: number,
): PixelArtSerialization {
	return {
		formatVersion: 1,
		gridWidth,
		gridHeight,
		palette: [{ index: 0, color: "#ff0000ff", reserved: false }],
		pixels: new Array(gridWidth * gridHeight).fill(0),
	};
}

function readDownloadedJson(link: HTMLAnchorElement): unknown {
	const href = link.getAttribute("href") ?? "";
	const prefix = "data:application/json;charset=utf-8,";
	if (!href.startsWith(prefix)) {
		throw new Error(`unexpected href: ${href}`);
	}
	return JSON.parse(decodeURIComponent(href.slice(prefix.length)));
}

function noopCallbacks(): PaletteCallbacks {
	return {
		onSelect: vi.fn(),
		onRemove: vi.fn(),
		onModify: vi.fn(),
		onToggleMerge: vi.fn(),
		onMergeInto: vi.fn(),
	};
}

describe("renderPalette", () => {
	it("renders one visible swatch per palette color, in index order, with its hex code as text", () => {
		const colors: SerializedPaletteColor[] = [
			{ index: 0, color: "#ff0000ff", reserved: false },
			{ index: 1, color: "#00ff00ff", reserved: false },
			{ index: 2, color: "#0000ffff", reserved: false },
		];
		const container = document.createElement("div");

		renderPalette(container, colors, null, noopCallbacks());

		const swatches = container.querySelectorAll(".swatch");
		expect(swatches).toHaveLength(3);
		const hexTexts = [...swatches].map(
			(s) => s.querySelector(".swatch-hex")?.textContent,
		);
		expect(hexTexts).toEqual(["#ff0000", "#00ff00", "#0000ff"]);
		expect(container.hidden).toBe(false);
	});

	it("renders exactly one swatch for a single-color palette", () => {
		const container = document.createElement("div");

		renderPalette(
			container,
			[{ index: 0, color: "#2ac811ff", reserved: false }],
			null,
			noopCallbacks(),
		);

		expect(container.querySelectorAll(".swatch")).toHaveLength(1);
	});

	it("makes a partially transparent color visually distinct from an opaque one", () => {
		const container = document.createElement("div");

		renderPalette(
			container,
			[
				{ index: 0, color: "#336699ff", reserved: false },
				{ index: 1, color: "#33669980", reserved: false },
			],
			null,
			noopCallbacks(),
		);

		const fills = container.querySelectorAll(".swatch-fill");
		const opaqueColor = (fills[0] as HTMLElement).style.backgroundColor;
		const transparentColor = (fills[1] as HTMLElement).style.backgroundColor;
		expect(opaqueColor).not.toBe(transparentColor);
	});

	it("hides the container when given an empty palette", () => {
		const container = document.createElement("div");

		renderPalette(container, [], null, noopCallbacks());

		expect(container.querySelectorAll(".swatch")).toHaveLength(0);
		expect(container.hidden).toBe(true);
	});

	it("marks the swatch matching the active index, and no other, as active", () => {
		const container = document.createElement("div");
		const colors: SerializedPaletteColor[] = [
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#ff0000ff", reserved: false },
		];

		renderPalette(container, colors, 1, noopCallbacks());

		const swatches = [...container.querySelectorAll(".swatch")];
		expect(swatches[0].classList.contains("active")).toBe(false);
		expect(swatches[1].classList.contains("active")).toBe(true);
	});

	it("calls onSelect with a swatch's index when its color box is clicked", () => {
		const container = document.createElement("div");
		const callbacks = noopCallbacks();
		renderPalette(
			container,
			[
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#ff0000ff", reserved: false },
			],
			null,
			callbacks,
		);

		const box = container.querySelectorAll(".swatch-box")[1] as HTMLElement;
		box.click();

		expect(callbacks.onSelect).toHaveBeenCalledWith(1);
	});

	it("renders no remove or modify control on the reserved transparent swatch", () => {
		const container = document.createElement("div");

		renderPalette(
			container,
			[{ index: 0, color: "#00000000", reserved: true }],
			null,
			noopCallbacks(),
		);

		const swatch = container.querySelector(".swatch");
		expect(swatch?.querySelector(".swatch-remove")).toBeNull();
		expect(swatch?.querySelector(".swatch-modify")).toBeNull();
	});

	it("calls onRemove, not onSelect, when a non-transparent swatch's remove button is clicked", () => {
		const container = document.createElement("div");
		const callbacks = noopCallbacks();
		renderPalette(
			container,
			[
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#ff0000ff", reserved: false },
			],
			null,
			callbacks,
		);

		const removeButton = container.querySelector(
			".swatch-remove",
		) as HTMLButtonElement;
		removeButton.click();

		expect(callbacks.onRemove).toHaveBeenCalledWith(1);
		expect(callbacks.onSelect).not.toHaveBeenCalled();
	});

	it("calls onModify, not onSelect, when a non-transparent swatch's color input changes", () => {
		const container = document.createElement("div");
		const callbacks = noopCallbacks();
		renderPalette(
			container,
			[
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#ff0000ff", reserved: false },
			],
			null,
			callbacks,
		);

		const modifyInput = container.querySelector(
			".swatch-modify",
		) as HTMLInputElement;
		modifyInput.value = "#123456";
		modifyInput.dispatchEvent(new Event("input", { bubbles: true }));

		expect(callbacks.onModify).toHaveBeenCalledWith(1, "#123456");
		expect(callbacks.onSelect).not.toHaveBeenCalled();
	});

	describe("merge selection mode", () => {
		const colors: SerializedPaletteColor[] = [
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#ff0000ff", reserved: false },
			{ index: 2, color: "#00ff00ff", reserved: false },
		];

		it("renders a checkbox instead of modify/remove controls on non-transparent swatches", () => {
			const container = document.createElement("div");

			renderPalette(container, colors, null, noopCallbacks(), new Set());

			const swatches = [...container.querySelectorAll(".swatch")];
			expect(swatches[1].querySelector(".swatch-merge-select")).not.toBeNull();
			expect(swatches[1].querySelector(".swatch-modify")).toBeNull();
			expect(swatches[1].querySelector(".swatch-remove")).toBeNull();
		});

		it("renders no checkbox on the reserved transparent swatch", () => {
			const container = document.createElement("div");

			renderPalette(container, colors, null, noopCallbacks(), new Set());

			const swatches = [...container.querySelectorAll(".swatch")];
			expect(swatches[0].querySelector(".swatch-merge-select")).toBeNull();
		});

		it("reflects the given merge selection as checked checkboxes", () => {
			const container = document.createElement("div");

			renderPalette(container, colors, null, noopCallbacks(), new Set([1, 2]));

			const checkboxes = [
				...container.querySelectorAll<HTMLInputElement>(".swatch-merge-select"),
			];
			expect(checkboxes.map((c) => c.checked)).toEqual([true, true]);
		});

		it("calls onToggleMerge with a swatch's index when its checkbox changes", () => {
			const container = document.createElement("div");
			const callbacks = noopCallbacks();

			renderPalette(container, colors, null, callbacks, new Set());

			const checkbox = container.querySelectorAll<HTMLInputElement>(
				".swatch-merge-select",
			)[0];
			checkbox.checked = true;
			checkbox.dispatchEvent(new Event("change", { bubbles: true }));

			expect(callbacks.onToggleMerge).toHaveBeenCalledWith(1);
		});

		it("offers no merge-into action when fewer than two colors are selected", () => {
			const container = document.createElement("div");

			renderPalette(container, colors, null, noopCallbacks(), new Set([1]));

			expect(container.querySelectorAll(".swatch-merge-into")).toHaveLength(0);
		});

		it("offers a merge-into action only on the selected swatches once two or more are selected", () => {
			const container = document.createElement("div");

			renderPalette(container, colors, null, noopCallbacks(), new Set([1, 2]));

			expect(container.querySelectorAll(".swatch-merge-into")).toHaveLength(2);
		});

		it("calls onMergeInto with the swatch's index when its merge-into action is used", () => {
			const container = document.createElement("div");
			const callbacks = noopCallbacks();

			renderPalette(container, colors, null, callbacks, new Set([1, 2]));

			const button =
				container.querySelectorAll<HTMLButtonElement>(".swatch-merge-into")[1];
			button.click();

			expect(callbacks.onMergeInto).toHaveBeenCalledWith(2);
		});

		it("leaves normal single-swatch behavior unchanged when no merge selection is given", () => {
			const container = document.createElement("div");

			renderPalette(container, colors, null, noopCallbacks());

			expect(container.querySelectorAll(".swatch-merge-select")).toHaveLength(
				0,
			);
			expect(
				container.querySelectorAll(".swatch-modify").length,
			).toBeGreaterThan(0);
		});
	});
});

describe("resetResult", () => {
	it("hides the reconstruction figure and the palette, and clears previous swatches", () => {
		const elements = makeResultElements();
		renderPalette(
			elements.palette,
			[{ index: 0, color: "#ff0000ff", reserved: false }],
			null,
			{ onSelect: vi.fn(), onRemove: vi.fn(), onModify: vi.fn() },
		);
		elements.reconstructionFigure.hidden = false;

		resetResult(elements);

		expect(elements.reconstructionFigure.hidden).toBe(true);
		expect(elements.palette.hidden).toBe(true);
		expect(elements.palette.querySelectorAll(".swatch")).toHaveLength(0);
	});

	it("does nothing harmful when called on an already-empty, never-shown result", () => {
		const elements = makeResultElements();

		expect(() => resetResult(elements)).not.toThrow();
		expect(elements.reconstructionFigure.hidden).toBe(true);
	});

	it("hides the download link and removes its previous data, so a stale download can't linger", () => {
		const elements = makeResultElements();
		const serialization: PixelArtSerialization = {
			formatVersion: 1,
			gridWidth: 1,
			gridHeight: 1,
			palette: [{ index: 0, color: "#ff0000ff", reserved: false }],
			pixels: [0],
		};
		renderDownloadLink(elements.downloadLink, serialization, "cat.png");

		resetResult(elements);

		expect(elements.downloadLink.hidden).toBe(true);
		expect(elements.downloadLink.getAttribute("href")).toBeNull();
	});

	it("hides the GIF download link and its note, and removes previous data", () => {
		const elements = makeResultElements();
		const serialization: PixelArtSerialization = {
			formatVersion: 1,
			gridWidth: 1,
			gridHeight: 1,
			palette: [
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#00ff0080", reserved: false },
			],
			pixels: [1],
		};
		renderGifDownloadLink(
			elements.gifDownloadLink,
			elements.gifNote,
			serialization,
			"cat.png",
		);

		resetResult(elements);

		expect(elements.gifDownloadLink.hidden).toBe(true);
		expect(elements.gifDownloadLink.getAttribute("href")).toBeNull();
		expect(elements.gifNote.hidden).toBe(true);
		expect(elements.gifNote.textContent).toBe("");
	});

	it("hides the confidence verdict and clears its previous text", () => {
		const elements = makeResultElements();
		renderConfidence(elements.confidence, {
			score: 1,
			verdict: "Looks like pixel art",
			explanation: "a regular pixel grid and a small color palette",
		});

		resetResult(elements);

		expect(elements.confidence.hidden).toBe(true);
		expect(elements.confidence.textContent).toBe("");
	});

	it("hides the grid size and clears its previous text, so a stale size can't linger", () => {
		const elements = makeResultElements();
		renderGridSize(elements.gridSize, makeSerialization(16, 16));

		resetResult(elements);

		expect(elements.gridSize.hidden).toBe(true);
		expect(elements.gridSize.textContent).toBe("");
	});
});

describe("renderGridSize", () => {
	it("shows the detected grid's width and height, in that order, as a plain-word size", () => {
		const element = document.createElement("p");

		renderGridSize(element, makeSerialization(16, 16));

		expect(element.hidden).toBe(false);
		expect(element.textContent).toBe("16 × 16 pixels");
	});

	it("keeps width before height for a non-square grid, never swapped", () => {
		const element = document.createElement("p");

		renderGridSize(element, makeSerialization(32, 8));

		expect(element.textContent).toBe("32 × 8 pixels");
	});

	it("renders a single-logical-pixel grid the same way as any other size", () => {
		const element = document.createElement("p");

		renderGridSize(element, makeSerialization(1, 1));

		expect(element.textContent).toBe("1 × 1 pixels");
	});
});

describe("renderConfidence", () => {
	it("shows the verdict, the score as a rounded percentage, and the explanation", () => {
		const element = document.createElement("p");
		const confidence: ConfidenceResult = {
			score: 0.8675,
			verdict: "Looks like pixel art",
			explanation: "a regular pixel grid and a small color palette",
		};

		renderConfidence(element, confidence);

		expect(element.hidden).toBe(false);
		expect(element.textContent).toBe(
			"Looks like pixel art (87%) — a regular pixel grid and a small color palette.",
		);
	});

	it("rounds a low score down to a whole percentage instead of showing decimals", () => {
		const element = document.createElement("p");

		renderConfidence(element, {
			score: 0.124,
			verdict: "Doesn't look like pixel art",
			explanation: "an irregular pixel grid and a large color palette",
		});

		expect(element.textContent).toContain("(12%)");
	});
});

describe("renderDownloadLink", () => {
	const serialization: PixelArtSerialization = {
		formatVersion: 1,
		gridWidth: 2,
		gridHeight: 1,
		palette: [
			{ index: 0, color: "#ff0000ff", reserved: false },
			{ index: 1, color: "#00ff0080", reserved: false },
		],
		pixels: [0, 1],
	};

	it("makes the link downloadable with content matching exactly the current result", () => {
		const link = document.createElement("a");

		renderDownloadLink(link, serialization, "cat.png");

		expect(link.hidden).toBe(false);
		expect(readDownloadedJson(link)).toEqual(serialization);
	});

	it("names the downloaded file after the source image, with a .json extension", () => {
		const link = document.createElement("a");

		renderDownloadLink(link, serialization, "cat.png");

		expect(link.download).toBe("cat.json");
	});

	it("falls back to a sensible default name when no source file name is available", () => {
		const link = document.createElement("a");

		renderDownloadLink(link, serialization, undefined);

		expect(link.download).toBe("pixel-art.json");
	});
});

describe("renderGifDownloadLink", () => {
	const serialization: PixelArtSerialization = {
		formatVersion: 1,
		gridWidth: 2,
		gridHeight: 1,
		palette: [
			{ index: 0, color: "#00000000", reserved: true },
			{ index: 1, color: "#00ff0080", reserved: false },
		],
		pixels: [1, 0],
	};

	it("makes the link downloadable with a GIF matching the current reconstruction", () => {
		const link = document.createElement("a");
		const note = document.createElement("p");

		renderGifDownloadLink(link, note, serialization, "cat.png");

		expect(link.hidden).toBe(false);
		const decoded = readDownloadedGif(link);
		expect(decoded.width).toBe(2);
		expect(decoded.height).toBe(1);
		expect([...decoded.pixels]).toEqual([
			0,
			255,
			0,
			255, // pixel 0: the semi-transparent green, flattened to opaque
			0,
			0,
			0,
			0, // pixel 1: the reserved transparent color
		]);
	});

	it("names the downloaded file after the source image, with a .gif extension", () => {
		const link = document.createElement("a");
		const note = document.createElement("p");

		renderGifDownloadLink(link, note, serialization, "cat.png");

		expect(link.download).toBe("cat.gif");
	});

	it("falls back to a sensible default name when no source file name is available", () => {
		const link = document.createElement("a");
		const note = document.createElement("p");

		renderGifDownloadLink(link, note, serialization, undefined);

		expect(link.download).toBe("pixel-art.gif");
	});

	it("shows a standing, non-blocking note when a color had to be flattened to opaque for the GIF only", () => {
		const link = document.createElement("a");
		const note = document.createElement("p");

		renderGifDownloadLink(link, note, serialization, "cat.png");

		expect(note.hidden).toBe(false);
		expect(note.textContent).not.toBe("");
		expect(link.getAttribute("href")).not.toBeNull();
	});

	it("keeps the note hidden when every color is fully opaque", () => {
		const link = document.createElement("a");
		const note = document.createElement("p");
		const opaqueSerialization: PixelArtSerialization = {
			...serialization,
			palette: [
				{ index: 0, color: "#00000000", reserved: true },
				{ index: 1, color: "#00ff00ff", reserved: false },
			],
		};

		renderGifDownloadLink(link, note, opaqueSerialization, "cat.png");

		expect(note.hidden).toBe(true);
		expect(note.textContent).toBe("");
	});

	it("keeps the link visible but disabled, with an explanation, when the palette exceeds GIF's color limit", () => {
		const link = document.createElement("a");
		const note = document.createElement("p");
		const tooManyColors = makeSerializationWithColorCount(MAX_GIF_COLORS + 1);

		renderGifDownloadLink(link, note, tooManyColors, "cat.png");

		expect(link.hidden).toBe(false);
		expect(link.getAttribute("href")).toBeNull();
		expect(link.getAttribute("aria-disabled")).toBe("true");
		expect(note.hidden).toBe(false);
		expect(note.textContent).toContain("256");
	});
});

describe("toGifFilename", () => {
	it("replaces the source file's extension with .gif", () => {
		expect(toGifFilename("cat.png")).toBe("cat.gif");
	});

	it("only replaces the last extension when the name has several dots", () => {
		expect(toGifFilename("archive.tar.gz")).toBe("archive.tar.gif");
	});

	it("appends .gif when the source file has no extension", () => {
		expect(toGifFilename("cat")).toBe("cat.gif");
	});

	it("falls back to a default name when no source file name is available", () => {
		expect(toGifFilename(undefined)).toBe("pixel-art.gif");
	});
});

describe("toJsonFilename", () => {
	it("replaces the source file's extension with .json", () => {
		expect(toJsonFilename("cat.png")).toBe("cat.json");
	});

	it("only replaces the last extension when the name has several dots", () => {
		expect(toJsonFilename("archive.tar.gz")).toBe("archive.tar.json");
	});

	it("appends .json when the source file has no extension", () => {
		expect(toJsonFilename("cat")).toBe("cat.json");
	});

	it("falls back to a default name when no source file name is available", () => {
		expect(toJsonFilename(undefined)).toBe("pixel-art.json");
	});
});
