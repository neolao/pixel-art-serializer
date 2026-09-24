import { describe, expect, it } from "vitest";

describe("app shell", () => {
	it("mounts the file input into #app", async () => {
		document.body.innerHTML = '<div id="app"></div>';

		await import("./main.ts");

		expect(document.querySelector("#image-input")).not.toBeNull();
	});
});
