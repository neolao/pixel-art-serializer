import { describe, expect, it } from "vitest";
import {
	moveRect,
	resizeFromHandle,
	type SelectionRect,
	toImageSpace,
} from "./grid-selection";

describe("resizeFromHandle", () => {
	const rect: SelectionRect = { x: 10, y: 10, width: 20, height: 20 };

	it("grows the rectangle from its bottom-right corner", () => {
		const result = resizeFromHandle(rect, "se", 5, 8, 100, 100);

		expect(result).toEqual({ x: 10, y: 10, width: 25, height: 28 });
	});

	it("shrinks and shifts the rectangle when dragging its top-left corner inward", () => {
		const result = resizeFromHandle(rect, "nw", 4, 6, 100, 100);

		expect(result).toEqual({ x: 14, y: 16, width: 16, height: 14 });
	});

	it("resizes only the dragged edge for a side handle, leaving the opposite edge in place", () => {
		const result = resizeFromHandle(rect, "e", 5, 0, 100, 100);

		expect(result).toEqual({ x: 10, y: 10, width: 25, height: 20 });
	});

	it("never lets a handle cross past its opposite edge, instead of inverting the rectangle", () => {
		// Dragging the east edge far past the west edge would invert width to negative.
		const result = resizeFromHandle(rect, "e", -1000, 0, 100, 100);

		expect(result.width).toBeGreaterThan(0);
		expect(result.x).toBe(rect.x);
	});

	it("clamps growth at the image bounds instead of extending past them", () => {
		const result = resizeFromHandle(rect, "se", 1000, 1000, 100, 100);

		expect(result.x + result.width).toBe(100);
		expect(result.y + result.height).toBe(100);
	});
});

describe("moveRect", () => {
	const rect: SelectionRect = { x: 10, y: 10, width: 20, height: 20 };

	it("translates the rectangle by the given delta", () => {
		const result = moveRect(rect, 5, -3, 100, 100);

		expect(result).toEqual({ x: 15, y: 7, width: 20, height: 20 });
	});

	it("clamps so the rectangle cannot be dragged past the image's left/top edge", () => {
		const result = moveRect(rect, -1000, -1000, 100, 100);

		expect(result.x).toBe(0);
		expect(result.y).toBe(0);
		expect(result.width).toBe(20);
		expect(result.height).toBe(20);
	});

	it("clamps so the rectangle cannot be dragged past the image's right/bottom edge", () => {
		const result = moveRect(rect, 1000, 1000, 100, 100);

		expect(result.x).toBe(80);
		expect(result.y).toBe(80);
	});
});

describe("toImageSpace", () => {
	it("maps a client point through a scaled-down display rect to natural image coordinates", () => {
		const displayRect = { left: 10, top: 20, width: 50, height: 50 };

		const result = toImageSpace(displayRect, 100, 100, 35, 45);

		expect(result).toEqual({ x: 50, y: 50 });
	});

	it("returns the origin instead of dividing by zero for a degenerate (zero-size) display rect", () => {
		const displayRect = { left: 0, top: 0, width: 0, height: 0 };

		const result = toImageSpace(displayRect, 100, 100, 35, 45);

		expect(result).toEqual({ x: 0, y: 0 });
	});
});
