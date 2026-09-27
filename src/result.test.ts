import { describe, expect, it, vi } from "vitest";
import type { ConfidenceResult } from "./confidence";
import {
	type PaletteCallbacks,
	type ResultElements,
	renderConfidence,
	renderDownloadLink,
	renderPalette,
	resetResult,
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
	const confidence = document.createElement("p");
	reconstructionFigure.appendChild(reconstructionCanvas);
	return {
		reconstructionFigure,
		reconstructionCanvas,
		palette,
		downloadLink,
		confidence,
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
	return { onSelect: vi.fn(), onRemove: vi.fn(), onModify: vi.fn() };
}

describe("renderPalette", () => {
	it("renders one visible swatch per palette color, in index order, with its hex code as text", () => {
		const colors: SerializedPaletteColor[] = [
			{ index: 0, hex: "#ff0000", alpha: 255 },
			{ index: 1, hex: "#00ff00", alpha: 255 },
			{ index: 2, hex: "#0000ff", alpha: 255 },
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
			[{ index: 0, hex: "#2ac811", alpha: 255 }],
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
				{ index: 0, hex: "#336699", alpha: 255 },
				{ index: 1, hex: "#336699", alpha: 128 },
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
			{ index: 0, hex: "#000000", alpha: 0 },
			{ index: 1, hex: "#ff0000", alpha: 255 },
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
				{ index: 0, hex: "#000000", alpha: 0 },
				{ index: 1, hex: "#ff0000", alpha: 255 },
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
			[{ index: 0, hex: "#000000", alpha: 0 }],
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
				{ index: 0, hex: "#000000", alpha: 0 },
				{ index: 1, hex: "#ff0000", alpha: 255 },
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
				{ index: 0, hex: "#000000", alpha: 0 },
				{ index: 1, hex: "#ff0000", alpha: 255 },
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
});

describe("resetResult", () => {
	it("hides the reconstruction figure and the palette, and clears previous swatches", () => {
		const elements = makeResultElements();
		renderPalette(
			elements.palette,
			[{ index: 0, hex: "#ff0000", alpha: 255 }],
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
			gridWidth: 1,
			gridHeight: 1,
			palette: [{ index: 0, hex: "#ff0000", alpha: 255 }],
			pixels: [0],
		};
		renderDownloadLink(elements.downloadLink, serialization, "cat.png");

		resetResult(elements);

		expect(elements.downloadLink.hidden).toBe(true);
		expect(elements.downloadLink.getAttribute("href")).toBeNull();
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
		gridWidth: 2,
		gridHeight: 1,
		palette: [
			{ index: 0, hex: "#ff0000", alpha: 255 },
			{ index: 1, hex: "#00ff00", alpha: 128 },
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
