const UNSUPPORTED_IMAGE_TYPES = new Set(["image/svg+xml"]);

export function isSupportedImageType(file: File): boolean {
	return (
		file.type.startsWith("image/") && !UNSUPPORTED_IMAGE_TYPES.has(file.type)
	);
}

export function readImageFile(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}
