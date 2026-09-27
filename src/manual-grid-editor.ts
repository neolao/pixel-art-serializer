import {
	type Handle,
	moveRect,
	resizeFromHandle,
	type SelectionRect,
	toImageSpace,
} from "./grid-selection";

export interface ManualGridElements {
	/** The element whose bounding box is the *displayed* image (may be scaled via CSS from its natural size). */
	stage: HTMLElement;
	overlay: HTMLElement;
	selection: HTMLElement;
	handles: Record<Handle, HTMLElement>;
	resetButton: HTMLElement;
	widthInput: HTMLInputElement;
	heightInput: HTMLInputElement;
	error: HTMLElement;
}

export interface ManualGridEditor {
	/** Opens the overlay, seeded to the whole image and the given (typically auto-detected) grid size. */
	activate(
		imageWidth: number,
		imageHeight: number,
		gridWidth: number,
		gridHeight: number,
	): void;
	/** Hides the overlay without notifying the caller (e.g. a fresh image was selected). */
	deactivate(): void;
}

type DragState =
	| {
			kind: "move";
			startRect: SelectionRect;
			startImage: { x: number; y: number };
	  }
	| {
			kind: "resize";
			handle: Handle;
			startRect: SelectionRect;
			startImage: { x: number; y: number };
	  };

export function createManualGridEditor(
	elements: ManualGridElements,
	onConfirm: (
		rect: SelectionRect,
		gridWidth: number,
		gridHeight: number,
	) => void,
	onReset: () => void,
): ManualGridEditor {
	let imageWidth = 0;
	let imageHeight = 0;
	let rect: SelectionRect = { x: 0, y: 0, width: 0, height: 0 };
	let drag: DragState | null = null;

	function render(): void {
		if (imageWidth <= 0 || imageHeight <= 0) return;
		elements.selection.style.left = `${(rect.x / imageWidth) * 100}%`;
		elements.selection.style.top = `${(rect.y / imageHeight) * 100}%`;
		elements.selection.style.width = `${(rect.width / imageWidth) * 100}%`;
		elements.selection.style.height = `${(rect.height / imageHeight) * 100}%`;
		elements.selection.style.setProperty(
			"--manual-grid-cols",
			String(currentGridWidth() || 1),
		);
		elements.selection.style.setProperty(
			"--manual-grid-rows",
			String(currentGridHeight() || 1),
		);
	}

	function pointFromEvent(event: MouseEvent): { x: number; y: number } {
		return toImageSpace(
			elements.stage.getBoundingClientRect(),
			imageWidth,
			imageHeight,
			event.clientX,
			event.clientY,
		);
	}

	function onPointerMove(event: MouseEvent): void {
		if (!drag) return;
		const point = pointFromEvent(event);
		const deltaX = point.x - drag.startImage.x;
		const deltaY = point.y - drag.startImage.y;
		rect =
			drag.kind === "move"
				? moveRect(drag.startRect, deltaX, deltaY, imageWidth, imageHeight)
				: resizeFromHandle(
						drag.startRect,
						drag.handle,
						deltaX,
						deltaY,
						imageWidth,
						imageHeight,
					);
		render();
	}

	function endDrag(event: MouseEvent): void {
		if (!drag) return;
		onPointerMove(event);
		drag = null;
		window.removeEventListener("mousemove", onPointerMove);
		window.removeEventListener("mouseup", endDrag);
		onConfirm(rect, currentGridWidth(), currentGridHeight());
	}

	function startDrag(event: MouseEvent, next: DragState): void {
		event.preventDefault();
		drag = next;
		window.addEventListener("mousemove", onPointerMove);
		window.addEventListener("mouseup", endDrag);
	}

	elements.selection.addEventListener("mousedown", (event) => {
		if (event.target !== elements.selection) return;
		startDrag(event, {
			kind: "move",
			startRect: rect,
			startImage: pointFromEvent(event),
		});
	});

	for (const handle of Object.keys(elements.handles) as Handle[]) {
		elements.handles[handle].addEventListener("mousedown", (event) => {
			event.stopPropagation();
			startDrag(event, {
				kind: "resize",
				handle,
				startRect: rect,
				startImage: pointFromEvent(event),
			});
		});
	}

	elements.selection.addEventListener("keydown", (event) => {
		if (event.target !== elements.selection) return;
		const delta = arrowKeyDelta(event);
		if (!delta) return;
		event.preventDefault();
		rect = moveRect(rect, delta.dx, delta.dy, imageWidth, imageHeight);
		render();
		onConfirm(rect, currentGridWidth(), currentGridHeight());
	});

	for (const handle of Object.keys(elements.handles) as Handle[]) {
		elements.handles[handle].addEventListener("keydown", (event) => {
			const delta = arrowKeyDelta(event);
			if (!delta) return;
			event.preventDefault();
			rect = resizeFromHandle(
				rect,
				handle,
				delta.dx,
				delta.dy,
				imageWidth,
				imageHeight,
			);
			render();
			onConfirm(rect, currentGridWidth(), currentGridHeight());
		});
	}

	function currentGridWidth(): number {
		return Math.round(Number(elements.widthInput.value));
	}

	function currentGridHeight(): number {
		return Math.round(Number(elements.heightInput.value));
	}

	function validateAndConfirm(): void {
		const width = currentGridWidth();
		const height = currentGridHeight();
		if (
			!Number.isFinite(width) ||
			width < 1 ||
			!Number.isFinite(height) ||
			height < 1
		) {
			elements.error.textContent =
				"Width and height must be whole numbers of at least 1.";
			elements.error.hidden = false;
			return;
		}
		elements.error.hidden = true;
		render();
		onConfirm(rect, width, height);
	}

	elements.widthInput.addEventListener("change", validateAndConfirm);
	elements.heightInput.addEventListener("change", validateAndConfirm);

	elements.resetButton.addEventListener("click", () => {
		hide();
		onReset();
	});

	function hide(): void {
		elements.overlay.hidden = true;
	}

	/** A keyboard alternative to dragging: arrow keys nudge by one image pixel, or 10 with Shift held. */
	function arrowKeyDelta(
		event: KeyboardEvent,
	): { dx: number; dy: number } | null {
		const step = event.shiftKey ? 10 : 1;
		switch (event.key) {
			case "ArrowLeft":
				return { dx: -step, dy: 0 };
			case "ArrowRight":
				return { dx: step, dy: 0 };
			case "ArrowUp":
				return { dx: 0, dy: -step };
			case "ArrowDown":
				return { dx: 0, dy: step };
			default:
				return null;
		}
	}

	return {
		activate(width, height, gridWidth, gridHeight) {
			imageWidth = width;
			imageHeight = height;
			rect = { x: 0, y: 0, width, height };
			elements.widthInput.value = String(gridWidth);
			elements.heightInput.value = String(gridHeight);
			elements.error.hidden = true;
			elements.overlay.hidden = false;
			render();
		},
		deactivate() {
			hide();
		},
	};
}
