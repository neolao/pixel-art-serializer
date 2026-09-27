import { describe, expect, it, vi } from "vitest";
import {
	createManualGridEditor,
	type ManualGridElements,
} from "./manual-grid-editor";

function stubRect(
	element: HTMLElement,
	rect: { left: number; top: number; width: number; height: number },
): void {
	element.getBoundingClientRect = () =>
		({ ...rect, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} }) as DOMRect;
}

function makeElements(): ManualGridElements {
	const stage = document.createElement("div");
	stubRect(stage, { left: 0, top: 0, width: 100, height: 100 });
	const overlay = document.createElement("div");
	overlay.hidden = true;
	const selection = document.createElement("div");
	const handles = {
		nw: document.createElement("button"),
		n: document.createElement("button"),
		ne: document.createElement("button"),
		e: document.createElement("button"),
		se: document.createElement("button"),
		s: document.createElement("button"),
		sw: document.createElement("button"),
		w: document.createElement("button"),
	};
	const resetButton = document.createElement("button");
	const widthInput = document.createElement("input");
	const heightInput = document.createElement("input");
	const error = document.createElement("p");
	error.hidden = true;
	return {
		stage,
		overlay,
		selection,
		handles,
		resetButton,
		widthInput,
		heightInput,
		error,
	};
}

describe("createManualGridEditor", () => {
	describe("activate", () => {
		it("shows the overlay, seeds the selection to the full image, and pre-fills the form with the current grid size", () => {
			const elements = makeElements();
			const editor = createManualGridEditor(elements, vi.fn(), vi.fn());

			editor.activate(100, 100, 8, 6);

			expect(elements.overlay.hidden).toBe(false);
			expect(elements.widthInput.value).toBe("8");
			expect(elements.heightInput.value).toBe("6");
			expect(elements.selection.style.left).toBe("0%");
			expect(elements.selection.style.top).toBe("0%");
			expect(elements.selection.style.width).toBe("100%");
			expect(elements.selection.style.height).toBe("100%");
		});
	});

	describe("dragging a handle", () => {
		it("resizes the selection and reports the new crop rectangle once the drag ends", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.handles.se.dispatchEvent(
				new MouseEvent("mousedown", {
					clientX: 100,
					clientY: 100,
					bubbles: true,
				}),
			);
			window.dispatchEvent(
				new MouseEvent("mousemove", { clientX: 80, clientY: 80 }),
			);
			expect(onConfirm).not.toHaveBeenCalled();
			window.dispatchEvent(
				new MouseEvent("mouseup", { clientX: 80, clientY: 80 }),
			);

			expect(onConfirm).toHaveBeenCalledTimes(1);
			const [rect, width, height] = onConfirm.mock.calls[0];
			expect(rect).toEqual({ x: 0, y: 0, width: 80, height: 80 });
			expect(width).toBe(8);
			expect(height).toBe(8);
		});

		it("clamps the resize to the image bounds instead of reporting an out-of-range rectangle", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.handles.se.dispatchEvent(
				new MouseEvent("mousedown", {
					clientX: 100,
					clientY: 100,
					bubbles: true,
				}),
			);
			window.dispatchEvent(
				new MouseEvent("mousemove", { clientX: 500, clientY: 500 }),
			);
			window.dispatchEvent(
				new MouseEvent("mouseup", { clientX: 500, clientY: 500 }),
			);

			const [rect] = onConfirm.mock.calls[0];
			expect(rect).toEqual({ x: 0, y: 0, width: 100, height: 100 });
		});
	});

	describe("dragging the selection body", () => {
		it("moves the selection and reports the translated rectangle once the drag ends", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 4, 4);
			// Shrink first so there is room to move within the 100x100 image.
			elements.handles.se.dispatchEvent(
				new MouseEvent("mousedown", {
					clientX: 100,
					clientY: 100,
					bubbles: true,
				}),
			);
			window.dispatchEvent(
				new MouseEvent("mousemove", { clientX: 60, clientY: 60 }),
			);
			window.dispatchEvent(
				new MouseEvent("mouseup", { clientX: 60, clientY: 60 }),
			);

			elements.selection.dispatchEvent(
				new MouseEvent("mousedown", {
					clientX: 10,
					clientY: 10,
					bubbles: true,
				}),
			);
			window.dispatchEvent(
				new MouseEvent("mousemove", { clientX: 30, clientY: 20 }),
			);
			window.dispatchEvent(
				new MouseEvent("mouseup", { clientX: 30, clientY: 20 }),
			);

			const last = onConfirm.mock.calls.at(-1)?.[0];
			expect(last).toEqual({ x: 20, y: 10, width: 60, height: 60 });
		});
	});

	describe("width/height form", () => {
		it("reports the new grid size once a valid value is entered", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.widthInput.value = "12";
			elements.widthInput.dispatchEvent(new Event("change", { bubbles: true }));

			expect(onConfirm).toHaveBeenCalledWith(
				{ x: 0, y: 0, width: 100, height: 100 },
				12,
				8,
			);
			expect(elements.error.hidden).toBe(true);
		});

		it("shows an error and does not confirm when the width is zero", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.widthInput.value = "0";
			elements.widthInput.dispatchEvent(new Event("change", { bubbles: true }));

			expect(onConfirm).not.toHaveBeenCalled();
			expect(elements.error.hidden).toBe(false);
		});

		it("shows an error and does not confirm when the height is left empty", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.heightInput.value = "";
			elements.heightInput.dispatchEvent(
				new Event("change", { bubbles: true }),
			);

			expect(onConfirm).not.toHaveBeenCalled();
			expect(elements.error.hidden).toBe(false);
		});
	});

	describe("keyboard nudging", () => {
		it("resizes from a handle by one image pixel per arrow key press", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.handles.se.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
			);

			expect(onConfirm).toHaveBeenCalledWith(
				{ x: 0, y: 0, width: 99, height: 100 },
				8,
				8,
			);
		});

		it("moves a larger step when Shift is held", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.handles.se.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "ArrowUp",
					shiftKey: true,
					bubbles: true,
				}),
			);

			const [rect] = onConfirm.mock.calls[0];
			expect(rect.height).toBe(90);
		});

		it("moves the whole selection by one image pixel per arrow key press on its body", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);
			elements.handles.se.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
			);
			onConfirm.mockClear();

			elements.selection.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
			);

			expect(onConfirm).toHaveBeenCalledWith(
				{ x: 1, y: 0, width: 99, height: 100 },
				8,
				8,
			);
		});

		it("ignores unrelated key presses", () => {
			const elements = makeElements();
			const onConfirm = vi.fn();
			const editor = createManualGridEditor(elements, onConfirm, vi.fn());
			editor.activate(100, 100, 8, 8);

			elements.handles.se.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
			);

			expect(onConfirm).not.toHaveBeenCalled();
		});
	});

	describe("reset", () => {
		it("hides the overlay and calls onReset when the reset button is clicked", () => {
			const elements = makeElements();
			const onReset = vi.fn();
			const editor = createManualGridEditor(elements, vi.fn(), onReset);
			editor.activate(100, 100, 8, 8);

			elements.resetButton.click();

			expect(onReset).toHaveBeenCalledTimes(1);
			expect(elements.overlay.hidden).toBe(true);
		});
	});

	describe("deactivate", () => {
		it("hides the overlay without calling onReset", () => {
			const elements = makeElements();
			const onReset = vi.fn();
			const editor = createManualGridEditor(elements, vi.fn(), onReset);
			editor.activate(100, 100, 8, 8);

			editor.deactivate();

			expect(elements.overlay.hidden).toBe(true);
			expect(onReset).not.toHaveBeenCalled();
		});
	});
});
