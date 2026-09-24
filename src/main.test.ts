import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
	document.body.innerHTML = '<div id="app"></div>';
	vi.resetModules();
});

describe("app shell", () => {
	it("mounts the upload input, preview and error elements into #app", async () => {
		await import("./main.ts");

		expect(document.querySelector("#image-input")).not.toBeNull();
		expect(document.querySelector("#image-preview")).not.toBeNull();
		expect(document.querySelector("#image-error")).not.toBeNull();
	});

	it("shows a preview when a valid image is selected through the real input", async () => {
		await import("./main.ts");
		const input = document.querySelector<HTMLInputElement>("#image-input");
		if (!input) throw new Error("input not mounted");
		const file = new File([new Uint8Array([1, 2, 3])], "a.png", {
			type: "image/png",
		});
		Object.defineProperty(input, "files", {
			value: [file],
			configurable: true,
		});

		input.dispatchEvent(new Event("change"));

		await vi.waitFor(() => {
			const preview =
				document.querySelector<HTMLImageElement>("#image-preview");
			expect(preview?.hidden).toBe(false);
		});
		const preview = document.querySelector<HTMLImageElement>("#image-preview");
		expect(preview?.src).toContain("data:image/png;base64,");
	});
});
