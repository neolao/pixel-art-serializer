import { toHex8 } from "./color";
import type {
	PixelArtSerialization,
	SerializedPaletteColor,
} from "./serializer";

export interface EditableColor {
	hex: string;
	alpha: number;
}

/**
 * Index 0 is always the reserved transparent entry (see
 * .vibe/decisions/011-palette-always-reserves-transparent-index-zero.md); no
 * edit operation may remove it, recolor it, or let another color take its
 * place.
 */
export const TRANSPARENT_INDEX = 0;

export function addPaletteColor(
	serialization: PixelArtSerialization,
	color: EditableColor,
): PixelArtSerialization {
	const nextIndex = Math.max(...serialization.palette.map((c) => c.index)) + 1;
	const newColor: SerializedPaletteColor = {
		index: nextIndex,
		color: toHex8(color.hex, color.alpha),
		reserved: false,
	};
	return { ...serialization, palette: [...serialization.palette, newColor] };
}

export function removePaletteColor(
	serialization: PixelArtSerialization,
	index: number,
): PixelArtSerialization {
	if (index === TRANSPARENT_INDEX) return serialization;
	if (!serialization.palette.some((c) => c.index === index)) {
		return serialization;
	}
	return {
		...serialization,
		palette: serialization.palette.filter((c) => c.index !== index),
		pixels: serialization.pixels.map((p) =>
			p === index ? TRANSPARENT_INDEX : p,
		),
	};
}

export function modifyPaletteColor(
	serialization: PixelArtSerialization,
	index: number,
	color: EditableColor,
): PixelArtSerialization {
	if (index === TRANSPARENT_INDEX) return serialization;
	return {
		...serialization,
		palette: serialization.palette.map((c) =>
			c.index === index ? { ...c, color: toHex8(color.hex, color.alpha) } : c,
		),
	};
}

export function mergePaletteColors(
	serialization: PixelArtSerialization,
	indices: readonly number[],
	resultIndex: number,
): PixelArtSerialization {
	if (indices.length < 2) return serialization;
	if (indices.includes(TRANSPARENT_INDEX)) return serialization;
	if (!indices.includes(resultIndex)) return serialization;
	const existingIndices = new Set(serialization.palette.map((c) => c.index));
	if (!indices.every((index) => existingIndices.has(index))) {
		return serialization;
	}

	const discardedIndices = new Set(
		indices.filter((index) => index !== resultIndex),
	);
	return {
		...serialization,
		palette: serialization.palette.filter(
			(c) => !discardedIndices.has(c.index),
		),
		pixels: serialization.pixels.map((p) =>
			discardedIndices.has(p) ? resultIndex : p,
		),
	};
}

export function recolorPixel(
	serialization: PixelArtSerialization,
	pixelPosition: number,
	paletteIndex: number,
): PixelArtSerialization {
	if (pixelPosition < 0 || pixelPosition >= serialization.pixels.length) {
		return serialization;
	}
	if (!serialization.palette.some((c) => c.index === paletteIndex)) {
		return serialization;
	}
	const pixels = [...serialization.pixels];
	pixels[pixelPosition] = paletteIndex;
	return { ...serialization, pixels };
}
