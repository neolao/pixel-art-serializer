import { isSupportedImageType, readImageFile } from "./image-loader";

export interface UploadElements {
	preview: HTMLImageElement;
	error: HTMLElement;
}

export async function handleImageSelection(
	file: File | undefined,
	elements: UploadElements,
): Promise<void> {
	if (!file) {
		return;
	}

	if (!isSupportedImageType(file)) {
		showError(
			elements,
			"Please select a supported image file (SVG is not supported).",
		);
		return;
	}

	try {
		const dataUrl = await readImageFile(file);
		showPreview(elements, dataUrl);
	} catch {
		showError(elements, "This file could not be read as an image.");
	}
}

function showPreview(elements: UploadElements, dataUrl: string): void {
	elements.error.hidden = true;
	elements.error.textContent = "";
	elements.preview.onerror = () => {
		showError(elements, "This file could not be displayed as an image.");
	};
	elements.preview.src = dataUrl;
	elements.preview.hidden = false;
}

function showError(elements: UploadElements, message: string): void {
	elements.preview.hidden = true;
	elements.preview.removeAttribute("src");
	elements.error.textContent = message;
	elements.error.hidden = false;
}
