export interface SelectionRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** A handle can never drag its edge past the opposite edge, so the selection can shrink to this but never invert or vanish. */
const MIN_SELECTION_SIZE = 1;

/**
 * Resizes a selection rectangle from one of its 8 handles by an image-space
 * delta, keeping the opposite edge fixed and clamping both against the
 * minimum size and the image bounds — so a drag can never invert the
 * rectangle or push it outside the image.
 */
export function resizeFromHandle(
	rect: SelectionRect,
	handle: Handle,
	deltaX: number,
	deltaY: number,
	imageWidth: number,
	imageHeight: number,
): SelectionRect {
	const right = rect.x + rect.width;
	const bottom = rect.y + rect.height;

	const hasWest = handle === "nw" || handle === "w" || handle === "sw";
	const hasEast = handle === "ne" || handle === "e" || handle === "se";
	const hasNorth = handle === "nw" || handle === "n" || handle === "ne";
	const hasSouth = handle === "sw" || handle === "s" || handle === "se";

	const newX = hasWest
		? clamp(rect.x + deltaX, 0, right - MIN_SELECTION_SIZE)
		: rect.x;
	const newRight = hasEast
		? clamp(right + deltaX, rect.x + MIN_SELECTION_SIZE, imageWidth)
		: right;
	const newY = hasNorth
		? clamp(rect.y + deltaY, 0, bottom - MIN_SELECTION_SIZE)
		: rect.y;
	const newBottom = hasSouth
		? clamp(bottom + deltaY, rect.y + MIN_SELECTION_SIZE, imageHeight)
		: bottom;

	return {
		x: newX,
		y: newY,
		width: newRight - newX,
		height: newBottom - newY,
	};
}

/** Translates a selection rectangle, clamped so it always stays fully within the image bounds. */
export function moveRect(
	rect: SelectionRect,
	deltaX: number,
	deltaY: number,
	imageWidth: number,
	imageHeight: number,
): SelectionRect {
	return {
		x: clamp(rect.x + deltaX, 0, imageWidth - rect.width),
		y: clamp(rect.y + deltaY, 0, imageHeight - rect.height),
		width: rect.width,
		height: rect.height,
	};
}

/**
 * Maps a client (mouse/touch) point to natural image-pixel coordinates,
 * given the bounding rect the image is actually displayed at (which may be
 * scaled up or down via CSS) — the same technique as
 * `reconstruction-editor.ts`'s `pixelIndexAt`, generalized to continuous
 * coordinates instead of a discrete grid index.
 */
export function toImageSpace(
	displayRect: { left: number; top: number; width: number; height: number },
	imageWidth: number,
	imageHeight: number,
	clientX: number,
	clientY: number,
): { x: number; y: number } {
	if (displayRect.width <= 0 || displayRect.height <= 0) {
		return { x: 0, y: 0 };
	}
	return {
		x: ((clientX - displayRect.left) / displayRect.width) * imageWidth,
		y: ((clientY - displayRect.top) / displayRect.height) * imageHeight,
	};
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
