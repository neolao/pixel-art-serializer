import { GifWriter } from "omggif";
import { fromHex8 } from "./color";
import type { PixelArtSerialization } from "./serializer";

/**
 * GIF's color table can hold at most 256 entries — see
 * .vibe/decisions/022-gif-export-via-omggif.md.
 */
export const MAX_GIF_COLORS = 256;

export interface GifEncodingResult {
	bytes: Uint8Array;
	/**
	 * True when a non-reserved palette color carried partial transparency
	 * that GIF cannot represent and was rendered fully opaque instead — see
	 * .vibe/decisions/023-gif-export-flattens-non-reserved-alpha.md.
	 */
	hasFlattenedColor: boolean;
}

export function encodeGif(
	serialization: PixelArtSerialization,
): GifEncodingResult {
	const { gridWidth, gridHeight, palette, pixels } = serialization;

	if (palette.length > MAX_GIF_COLORS) {
		throw new Error(
			`Cannot export a GIF: the palette has ${palette.length} colors, more than GIF's ${MAX_GIF_COLORS}-color limit.`,
		);
	}

	const tableSize = nextPowerOfTwo(Math.max(palette.length, 2));
	const rgbPalette = new Array<number>(tableSize).fill(0);
	const positionByStableIndex = new Map<number, number>();
	let transparentPosition = 0;
	let hasFlattenedColor = false;

	palette.forEach((color, position) => {
		positionByStableIndex.set(color.index, position);
		if (color.reserved) {
			transparentPosition = position;
			return;
		}
		const { hex, alpha } = fromHex8(color.color);
		if (alpha < 255) hasFlattenedColor = true;
		rgbPalette[position] = Number.parseInt(hex.slice(1), 16);
	});

	// Palette indices are stable identifiers, not array positions (a removed
	// color leaves a gap — see result.ts's renderReconstruction), so every
	// pixel is remapped to its color's current position in the GIF table.
	const indexedPixels = pixels.map((stableIndex) => {
		const position = positionByStableIndex.get(stableIndex);
		if (position === undefined) {
			throw new Error(
				`Cannot export a GIF: a pixel references palette index ${stableIndex}, which is not in the palette.`,
			);
		}
		return position;
	});

	const buffer = new Uint8Array(indexedPixels.length * 2 + 2048);
	const writer = new GifWriter(buffer, gridWidth, gridHeight, {
		palette: rgbPalette,
	});
	writer.addFrame(0, 0, gridWidth, gridHeight, indexedPixels, {
		transparent: transparentPosition,
	});
	const length = writer.end();

	return { bytes: buffer.subarray(0, length), hasFlattenedColor };
}

function nextPowerOfTwo(value: number): number {
	let power = 2;
	while (power < value) power *= 2;
	return power;
}
