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
		hex: color.hex,
		alpha: color.alpha,
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
			c.index === index ? { ...c, hex: color.hex, alpha: color.alpha } : c,
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
