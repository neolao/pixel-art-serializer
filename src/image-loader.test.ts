import { describe, expect, it, vi } from "vitest";
import { isSupportedImageType, readImageFile } from "./image-loader";

describe("isSupportedImageType", () => {
	it("accepts common raster image types", () => {
		expect(
			isSupportedImageType(new File([], "a.png", { type: "image/png" })),
		).toBe(true);
		expect(
			isSupportedImageType(new File([], "a.jpg", { type: "image/jpeg" })),
		).toBe(true);
	});

	it("rejects non-image files", () => {
		expect(
			isSupportedImageType(new File([], "a.txt", { type: "text/plain" })),
		).toBe(false);
	});

	it("rejects SVG files, since they are vector graphics rather than pixel data", () => {
		expect(
			isSupportedImageType(new File([], "a.svg", { type: "image/svg+xml" })),
		).toBe(false);
	});
});

describe("readImageFile", () => {
	it("resolves with a data URL encoding the file's exact bytes (nominal)", async () => {
		const bytes = new Uint8Array([1, 2, 3, 4, 5]);
		const file = new File([bytes], "a.png", { type: "image/png" });

		const dataUrl = await readImageFile(file);

		const expectedBase64 = btoa(String.fromCharCode(...bytes));
		expect(dataUrl).toBe(`data:image/png;base64,${expectedBase64}`);
	});

	it("rejects when the file cannot be read (error path)", async () => {
		const file = new File([new Uint8Array([1])], "a.png", {
			type: "image/png",
		});
		const readAsDataURL = vi
			.spyOn(FileReader.prototype, "readAsDataURL")
			.mockImplementation(function (this: FileReader) {
				this.onerror?.(
					new ProgressEvent("error") as unknown as ProgressEvent<FileReader>,
				);
			});

		await expect(readImageFile(file)).rejects.toBeTruthy();

		readAsDataURL.mockRestore();
	});
});
