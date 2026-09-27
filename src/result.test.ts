import { describe, expect, it } from "vitest";
import { type ResultElements, renderPalette, resetResult } from "./result";
import type { SerializedPaletteColor } from "./serializer";

function makeResultElements(): ResultElements {
	const reconstructionFigure = document.createElement("figure");
	const reconstructionCanvas = document.createElement("canvas");
	const palette = document.createElement("div");
	reconstructionFigure.appendChild(reconstructionCanvas);
	return { reconstructionFigure, reconstructionCanvas, palette };
}

describe("renderPalette", () => {
	it("renders one visible swatch per palette color, in index order, with its hex code as text", () => {
		const colors: SerializedPaletteColor[] = [
			{ index: 0, hex: "#ff0000", alpha: 255 },
			{ index: 1, hex: "#00ff00", alpha: 255 },
			{ index: 2, hex: "#0000ff", alpha: 255 },
		];
		const container = document.createElement("div");

		renderPalette(container, colors);

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

		renderPalette(container, [{ index: 0, hex: "#2ac811", alpha: 255 }]);

		expect(container.querySelectorAll(".swatch")).toHaveLength(1);
	});

	it("makes a partially transparent color visually distinct from an opaque one", () => {
		const container = document.createElement("div");

		renderPalette(container, [
			{ index: 0, hex: "#336699", alpha: 255 },
			{ index: 1, hex: "#336699", alpha: 128 },
		]);

		const fills = container.querySelectorAll(".swatch-fill");
		const opaqueColor = (fills[0] as HTMLElement).style.backgroundColor;
		const transparentColor = (fills[1] as HTMLElement).style.backgroundColor;
		expect(opaqueColor).not.toBe(transparentColor);
	});

	it("hides the container when given an empty palette", () => {
		const container = document.createElement("div");

		renderPalette(container, []);

		expect(container.querySelectorAll(".swatch")).toHaveLength(0);
		expect(container.hidden).toBe(true);
	});
});

describe("resetResult", () => {
	it("hides the reconstruction figure and the palette, and clears previous swatches", () => {
		const elements = makeResultElements();
		renderPalette(elements.palette, [{ index: 0, hex: "#ff0000", alpha: 255 }]);
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
});
