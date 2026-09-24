# Module: upload

**Role:** Validates and reads a selected image file, and drives the preview/error DOM state for a single file selection.
**Files:** `src/upload.ts`, `src/image-loader.ts`
**Exports:** `handleImageSelection(file: File | undefined, elements: UploadElements): Promise<void>`, `isSupportedImageType(file: File): boolean`, `readImageFile(file: File): Promise<string>`
**Depends on:** none
