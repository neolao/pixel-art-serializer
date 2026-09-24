import { describe, expect, it } from "vitest";
import { handleImageSelection } from "./upload";

function createElements() {
	const preview = document.createElement("img");
	preview.hidden = true;
	const error = document.createElement("p");
	error.hidden = true;
	return { preview, error };
}

function pngFile(name = "a.png") {
	return new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });
}

describe("handleImageSelection", () => {
	it("shows a preview for a valid image (nominal)", async () => {
		const elements = createElements();

		await handleImageSelection(pngFile(), elements);

		expect(elements.preview.hidden).toBe(false);
		expect(elements.preview.src).toContain("data:image/png;base64,");
		expect(elements.error.hidden).toBe(true);
	});

	it("does nothing when no file was selected, e.g. the picker was cancelled (edge case)", async () => {
		const elements = createElements();
		elements.preview.src = "data:image/png;base64,existing";
		elements.preview.hidden = false;

		await handleImageSelection(undefined, elements);

		expect(elements.preview.hidden).toBe(false);
		expect(elements.preview.src).toContain("existing");
		expect(elements.error.hidden).toBe(true);
	});

	it("clears a previous error once a valid image is selected afterwards (edge case)", async () => {
		const elements = createElements();
		await handleImageSelection(
			new File([], "a.txt", { type: "text/plain" }),
			elements,
		);
		expect(elements.error.hidden).toBe(false);

		await handleImageSelection(pngFile(), elements);

		expect(elements.error.hidden).toBe(true);
		expect(elements.preview.hidden).toBe(false);
	});

	it("shows an error and no preview for a non-image file (error path)", async () => {
		const elements = createElements();

		await handleImageSelection(
			new File(["not an image"], "a.txt", { type: "text/plain" }),
			elements,
		);

		expect(elements.error.hidden).toBe(false);
		expect(elements.error.textContent).toMatch(/image/i);
		expect(elements.preview.hidden).toBe(true);
	});

	it("shows an error and no preview for an SVG file, since it is not pixel data (error path)", async () => {
		const elements = createElements();

		await handleImageSelection(
			new File([], "a.svg", { type: "image/svg+xml" }),
			elements,
		);

		expect(elements.error.hidden).toBe(false);
		expect(elements.preview.hidden).toBe(true);
	});
});
