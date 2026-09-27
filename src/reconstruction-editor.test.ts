import { describe, expect, it, vi } from "vitest";
import {
	attachPixelPainter,
	createReconstructionEditor,
	pixelIndexAt,
} from "./reconstruction-editor";
import type { PixelArtSerialization } from "./serializer";

function makeSerialization(): PixelArtSerialization {
	return {
		gridWidth: 2,
		gridHeight: 2,
		palette: [
			{ index: 0, hex: "#000000", alpha: 0 },
			{ index: 1, hex: "#ff0000", alpha: 255 },
			{ index: 2, hex: "#00ff00", alpha: 255 },
		],
		pixels: [1, 2, 1, 2],
	};
}

describe("pixelIndexAt", () => {
	const rect = { left: 100, top: 50, width: 200, height: 100 };

	it("maps a click near the top-left corner to pixel (0,0)", () => {
		expect(pixelIndexAt(rect, 2, 2, 105, 55)).toBe(0);
	});

	it("maps a click in the bottom-right cell to the last pixel index", () => {
		// gridWidth=2 gridHeight=2 over a 200x100 rect: each cell is 100x50,
		// so (290, 140) falls well inside the bottom-right cell.
		expect(pixelIndexAt(rect, 2, 2, 290, 140)).toBe(3);
	});

	it("returns null for a click outside the rect entirely", () => {
		expect(pixelIndexAt(rect, 2, 2, 10, 10)).toBeNull();
	});

	it("returns null for a degenerate zero-size rect", () => {
		expect(
			pixelIndexAt({ left: 0, top: 0, width: 0, height: 0 }, 2, 2, 5, 5),
		).toBeNull();
	});
});

describe("attachPixelPainter", () => {
	function makeCanvas(rect: {
		left: number;
		top: number;
		width: number;
		height: number;
	}): HTMLCanvasElement {
		const canvas = document.createElement("canvas");
		canvas.getBoundingClientRect = () =>
			({ ...rect, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} }) as DOMRect;
		return canvas;
	}

	it("calls onPaint with the pixel index under a click inside the canvas", () => {
		const canvas = makeCanvas({ left: 0, top: 0, width: 200, height: 100 });
		const serialization = makeSerialization();
		const onPaint = vi.fn();
		attachPixelPainter(canvas, () => serialization, onPaint);

		canvas.dispatchEvent(
			new MouseEvent("click", { clientX: 5, clientY: 5, bubbles: true }),
		);

		expect(onPaint).toHaveBeenCalledWith(0);
	});

	it("does not call onPaint for a click outside the canvas bounds", () => {
		const canvas = makeCanvas({ left: 0, top: 0, width: 200, height: 100 });
		const onPaint = vi.fn();
		attachPixelPainter(canvas, () => makeSerialization(), onPaint);

		canvas.dispatchEvent(
			new MouseEvent("click", { clientX: -10, clientY: -10, bubbles: true }),
		);

		expect(onPaint).not.toHaveBeenCalled();
	});

	it("does nothing when no serialization is loaded yet", () => {
		const canvas = makeCanvas({ left: 0, top: 0, width: 200, height: 100 });
		const onPaint = vi.fn();
		attachPixelPainter(canvas, () => null, onPaint);

		canvas.dispatchEvent(
			new MouseEvent("click", { clientX: 5, clientY: 5, bubbles: true }),
		);

		expect(onPaint).not.toHaveBeenCalled();
	});
});

function makeEditorElements() {
	const reconstructionCanvas = document.createElement("canvas");
	reconstructionCanvas.getBoundingClientRect = () =>
		({
			left: 0,
			top: 0,
			width: 200,
			height: 200,
			right: 0,
			bottom: 0,
			x: 0,
			y: 0,
			toJSON() {},
		}) as DOMRect;
	// jsdom has no real 2D canvas backend (see
	// .vibe/decisions/003-canvas-pixel-extraction-verified-at-runtime.md); a
	// minimal fake context lets the editor's DOM-safe wiring (palette,
	// download link, active selection) be unit-tested without needing real
	// pixel rendering, which stays verified only through the `run` skill.
	reconstructionCanvas.getContext = (() => ({
		fillStyle: "",
		fillRect: () => {},
	})) as unknown as typeof reconstructionCanvas.getContext;
	const palette = document.createElement("div");
	const downloadLink = document.createElement("a");
	const addColorInput = document.createElement("input");
	addColorInput.type = "color";
	const addColorButton = document.createElement("button");
	const mergeToggleButton = document.createElement("button");
	return {
		reconstructionCanvas,
		palette,
		downloadLink,
		addColorInput,
		addColorButton,
		mergeToggleButton,
	};
}

describe("createReconstructionEditor", () => {
	it("renders the palette and download link once a serialization is loaded", () => {
		const elements = makeEditorElements();
		const editor = createReconstructionEditor(elements);

		editor.load(makeSerialization(), "cat.png");

		expect(elements.palette.querySelectorAll(".swatch")).toHaveLength(3);
		expect(elements.downloadLink.hidden).toBe(false);
	});

	it("selects a color on swatch click, then paints a clicked pixel with it, reflected in the downloaded JSON", () => {
		const elements = makeEditorElements();
		const editor = createReconstructionEditor(elements);
		editor.load(makeSerialization(), "cat.png");

		// Pixel index 0 (top-left) currently holds palette index 1 (red);
		// select green (index 2) and click it to prove the repaint happened.
		const greenBox = [...elements.palette.querySelectorAll(".swatch-box")][2];
		(greenBox as HTMLElement).click();
		elements.reconstructionCanvas.dispatchEvent(
			new MouseEvent("click", { clientX: 5, clientY: 5, bubbles: true }),
		);

		const href = elements.downloadLink.getAttribute("href") ?? "";
		const json = JSON.parse(
			decodeURIComponent(
				href.slice("data:application/json;charset=utf-8,".length),
			),
		);
		expect(json.pixels[0]).toBe(2);
	});

	it("marks the canvas as in paint mode while a color is active, and clears it on deselect", () => {
		const elements = makeEditorElements();
		const editor = createReconstructionEditor(elements);
		editor.load(makeSerialization(), "cat.png");

		const redBox = [...elements.palette.querySelectorAll(".swatch-box")][1];
		(redBox as HTMLElement).click();
		expect(elements.reconstructionCanvas.classList.contains("painting")).toBe(
			true,
		);

		(redBox as HTMLElement).click(); // click again to deselect
		expect(elements.reconstructionCanvas.classList.contains("painting")).toBe(
			false,
		);
	});

	it("removing the currently active color clears the active selection", () => {
		const elements = makeEditorElements();
		const editor = createReconstructionEditor(elements);
		editor.load(makeSerialization(), "cat.png");

		const redBox = [...elements.palette.querySelectorAll(".swatch-box")][1];
		(redBox as HTMLElement).click();
		const removeButton = elements.palette.querySelectorAll(
			".swatch-remove",
		)[0] as HTMLButtonElement;
		removeButton.click();

		expect(elements.palette.querySelector(".active")).toBeNull();
	});

	it("appends a new color to the palette when the add-color button is used", () => {
		const elements = makeEditorElements();
		const editor = createReconstructionEditor(elements);
		editor.load(makeSerialization(), "cat.png");

		elements.addColorInput.value = "#0000ff";
		elements.addColorButton.click();

		expect(elements.palette.querySelectorAll(".swatch")).toHaveLength(4);
	});

	it("does nothing when a control is used before any serialization has been loaded", () => {
		const elements = makeEditorElements();
		createReconstructionEditor(elements);

		expect(() => {
			elements.addColorButton.click();
			elements.reconstructionCanvas.dispatchEvent(
				new MouseEvent("click", { clientX: 5, clientY: 5, bubbles: true }),
			);
		}).not.toThrow();
	});

	it("stops reacting to controls after reset, so a stale edit can't repaint a since-cleared result", () => {
		const elements = makeEditorElements();
		const editor = createReconstructionEditor(elements);
		editor.load(makeSerialization(), "cat.png");

		editor.reset();
		elements.addColorInput.value = "#0000ff";
		elements.addColorButton.click();

		expect(elements.palette.querySelectorAll(".swatch")).toHaveLength(3);
	});

	describe("merge mode", () => {
		it("enters merge mode on toggle, showing checkboxes instead of modify/remove controls", () => {
			const elements = makeEditorElements();
			const editor = createReconstructionEditor(elements);
			editor.load(makeSerialization(), "cat.png");

			elements.mergeToggleButton.click();

			expect(
				elements.palette.querySelectorAll(".swatch-merge-select"),
			).toHaveLength(2);
			expect(elements.palette.querySelectorAll(".swatch-modify")).toHaveLength(
				0,
			);
		});

		it("merges checked colors into the chosen one, reflected in the reconstruction's downloaded JSON", () => {
			const elements = makeEditorElements();
			const editor = createReconstructionEditor(elements);
			editor.load(makeSerialization(), "cat.png");
			elements.mergeToggleButton.click();

			const checkboxes = [
				...elements.palette.querySelectorAll<HTMLInputElement>(
					".swatch-merge-select",
				),
			];
			for (const checkbox of checkboxes) {
				checkbox.checked = true;
				checkbox.dispatchEvent(new Event("change", { bubbles: true }));
			}
			const mergeIntoButtons = [
				...elements.palette.querySelectorAll<HTMLButtonElement>(
					".swatch-merge-into",
				),
			];
			mergeIntoButtons[1].click();

			const href = elements.downloadLink.getAttribute("href") ?? "";
			const json = JSON.parse(
				decodeURIComponent(
					href.slice("data:application/json;charset=utf-8,".length),
				),
			);
			expect(json.palette.map((c: { index: number }) => c.index)).toEqual([
				0, 2,
			]);
			expect(json.pixels).toEqual([2, 2, 2, 2]);
		});

		it("switches the active paint color to the merge survivor when the active color is merged away", () => {
			const elements = makeEditorElements();
			const editor = createReconstructionEditor(elements);
			editor.load(makeSerialization(), "cat.png");

			const redBox = [...elements.palette.querySelectorAll(".swatch-box")][1];
			(redBox as HTMLElement).click();
			elements.mergeToggleButton.click();
			const checkboxes = [
				...elements.palette.querySelectorAll<HTMLInputElement>(
					".swatch-merge-select",
				),
			];
			for (const checkbox of checkboxes) {
				checkbox.checked = true;
				checkbox.dispatchEvent(new Event("change", { bubbles: true }));
			}
			const mergeIntoButtons = [
				...elements.palette.querySelectorAll<HTMLButtonElement>(
					".swatch-merge-into",
				),
			];
			mergeIntoButtons[1].click(); // survivor is index 2

			expect(
				elements.palette.querySelector(".active .swatch-hex")?.textContent,
			).toBe("#00ff00");
		});

		it("ignores a color-box click on a swatch while merge mode is active", () => {
			const elements = makeEditorElements();
			const editor = createReconstructionEditor(elements);
			editor.load(makeSerialization(), "cat.png");
			const redBox = [...elements.palette.querySelectorAll(".swatch-box")][1];
			(redBox as HTMLElement).click();
			elements.mergeToggleButton.click();

			const greenBox = [
				...elements.palette.querySelectorAll(".swatch-box"),
			][2] as HTMLElement;
			greenBox.click();

			expect(
				elements.palette.querySelector(".active .swatch-hex")?.textContent,
			).toBe("#ff0000");
		});

		it("exits merge mode without changing anything when toggled off before merging", () => {
			const elements = makeEditorElements();
			const editor = createReconstructionEditor(elements);
			editor.load(makeSerialization(), "cat.png");
			elements.mergeToggleButton.click();
			const checkboxes = [
				...elements.palette.querySelectorAll<HTMLInputElement>(
					".swatch-merge-select",
				),
			];
			checkboxes[0].checked = true;
			checkboxes[0].dispatchEvent(new Event("change", { bubbles: true }));

			elements.mergeToggleButton.click();

			expect(elements.palette.querySelectorAll(".swatch")).toHaveLength(3);
			expect(
				elements.palette.querySelectorAll(".swatch-merge-select"),
			).toHaveLength(0);
		});
	});
});
