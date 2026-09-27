import "./style.css";
import { computeConfidence } from "./confidence";
import {
	createManualGridEditor,
	type ManualGridElements,
} from "./manual-grid-editor";
import {
	createReconstructionEditor,
	type EditorElements,
} from "./reconstruction-editor";
import {
	computeDetection,
	computeManualDetection,
	type DetectionResult,
	type ResultElements,
	renderConfidence,
	renderGridSize,
	resetResult,
} from "./result";
import { handleImageSelection } from "./upload";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
	app.innerHTML = `
    <main>
      <h1>Pixel Art Serializer</h1>
      <p>Upload an image to detect its pixel grid and export it as JSON.</p>
      <input id="image-input" type="file" accept="image/*" />
      <p id="image-error" role="alert" hidden></p>
      <div class="comparison">
        <figure>
          <figcaption>Original</figcaption>
          <div id="manual-grid-stage" class="manual-grid-stage">
            <img id="image-preview" alt="Selected image preview" hidden />
            <div id="manual-grid-overlay" class="manual-grid-overlay" hidden>
              <div
                id="manual-grid-selection"
                class="manual-grid-selection"
                tabindex="0"
                role="group"
                aria-label="Selected area — drag, or focus and use arrow keys to move; Shift+arrow for bigger steps"
              >
                <button type="button" class="manual-grid-handle" data-handle="nw" aria-label="Resize selection from top-left corner (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="n" aria-label="Resize selection height from the top (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="ne" aria-label="Resize selection from top-right corner (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="e" aria-label="Resize selection width from the right (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="se" aria-label="Resize selection from bottom-right corner (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="s" aria-label="Resize selection height from the bottom (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="sw" aria-label="Resize selection from bottom-left corner (arrow keys, Shift for bigger steps)"></button>
                <button type="button" class="manual-grid-handle" data-handle="w" aria-label="Resize selection width from the left (arrow keys, Shift for bigger steps)"></button>
              </div>
            </div>
          </div>
        </figure>
        <figure id="reconstruction-figure" hidden>
          <figcaption>Reconstruction</figcaption>
          <canvas
            id="reconstruction-canvas"
            aria-label="Image reconstructed from the extracted grid and palette"
            aria-describedby="grid-size"
          ></canvas>
          <p id="grid-size" hidden></p>
        </figure>
      </div>
      <p id="confidence" role="status" hidden></p>
      <p class="manual-grid-controls">
        <button id="manual-grid-toggle" type="button" hidden>Adjust grid manually</button>
      </p>
      <form id="manual-grid-form" class="manual-grid-form" hidden>
        <label>Width <input id="manual-grid-width" type="number" min="1" step="1" /></label>
        <label>Height <input id="manual-grid-height" type="number" min="1" step="1" /></label>
        <button id="manual-grid-reset" type="button">Return to automatic detection</button>
        <p id="manual-grid-error" role="alert" hidden></p>
      </form>
      <div id="palette" aria-label="Color palette" hidden></div>
      <p class="palette-add">
        <input id="add-color-input" type="color" value="#000000" />
        <button id="add-color-button" type="button">Add color</button>
        <button id="merge-toggle-button" type="button">Merge colors</button>
      </p>
      <a id="download-json" download hidden>Download JSON</a>
    </main>
  `;

	const input = app.querySelector<HTMLInputElement>("#image-input");
	const preview = app.querySelector<HTMLImageElement>("#image-preview");
	const error = app.querySelector<HTMLParagraphElement>("#image-error");
	const reconstructionFigure = app.querySelector<HTMLElement>(
		"#reconstruction-figure",
	);
	const reconstructionCanvas = app.querySelector<HTMLCanvasElement>(
		"#reconstruction-canvas",
	);
	const palette = app.querySelector<HTMLElement>("#palette");
	const downloadLink = app.querySelector<HTMLAnchorElement>("#download-json");
	const confidence = app.querySelector<HTMLElement>("#confidence");
	const gridSize = app.querySelector<HTMLElement>("#grid-size");
	const addColorInput = app.querySelector<HTMLInputElement>("#add-color-input");
	const addColorButton =
		app.querySelector<HTMLButtonElement>("#add-color-button");
	const mergeToggleButton = app.querySelector<HTMLButtonElement>(
		"#merge-toggle-button",
	);
	const manualGridStage = app.querySelector<HTMLElement>("#manual-grid-stage");
	const manualGridOverlay = app.querySelector<HTMLElement>(
		"#manual-grid-overlay",
	);
	const manualGridSelection = app.querySelector<HTMLElement>(
		"#manual-grid-selection",
	);
	const manualGridToggle = app.querySelector<HTMLButtonElement>(
		"#manual-grid-toggle",
	);
	const manualGridForm =
		app.querySelector<HTMLFormElement>("#manual-grid-form");
	const manualGridWidth =
		app.querySelector<HTMLInputElement>("#manual-grid-width");
	const manualGridHeight = app.querySelector<HTMLInputElement>(
		"#manual-grid-height",
	);
	const manualGridReset =
		app.querySelector<HTMLButtonElement>("#manual-grid-reset");
	const manualGridError = app.querySelector<HTMLElement>("#manual-grid-error");
	const manualGridHandles = manualGridSelection
		? ([
				...manualGridSelection.querySelectorAll<HTMLElement>("[data-handle]"),
			].reduce<Record<string, HTMLElement>>((acc, el) => {
				const handle = el.dataset.handle;
				if (handle) acc[handle] = el;
				return acc;
			}, {}) as ManualGridElements["handles"])
		: null;

	if (
		input &&
		preview &&
		error &&
		reconstructionFigure &&
		reconstructionCanvas &&
		palette &&
		downloadLink &&
		confidence &&
		gridSize &&
		addColorInput &&
		addColorButton &&
		mergeToggleButton &&
		manualGridStage &&
		manualGridOverlay &&
		manualGridSelection &&
		manualGridToggle &&
		manualGridForm &&
		manualGridWidth &&
		manualGridHeight &&
		manualGridReset &&
		manualGridError &&
		manualGridHandles
	) {
		const resultElements: ResultElements = {
			reconstructionFigure,
			reconstructionCanvas,
			palette,
			downloadLink,
			confidence,
			gridSize,
		};
		const editorElements: EditorElements = {
			reconstructionCanvas,
			palette,
			downloadLink,
			addColorInput,
			addColorButton,
			mergeToggleButton,
		};
		const editor = createReconstructionEditor(editorElements);
		const manualGridElements: ManualGridElements = {
			stage: manualGridStage,
			overlay: manualGridOverlay,
			selection: manualGridSelection,
			handles: manualGridHandles,
			resetButton: manualGridReset,
			widthInput: manualGridWidth,
			heightInput: manualGridHeight,
			error: manualGridError,
		};
		let currentFileName: string | undefined;
		let currentAutomaticResult: DetectionResult | null = null;

		const showResult = (detection: DetectionResult): void => {
			editor.load(detection.serialization, currentFileName);
			renderConfidence(
				confidence,
				computeConfidence(detection.grid, detection.palette),
			);
			renderGridSize(gridSize, detection.serialization);
			reconstructionFigure.hidden = false;
		};

		const closeManualGrid = (): void => {
			manualGridEditor.deactivate();
			manualGridForm.hidden = true;
			manualGridToggle.hidden = !currentAutomaticResult;
		};

		const manualGridEditor = createManualGridEditor(
			manualGridElements,
			(rect, gridWidthValue, gridHeightValue) => {
				showResult(
					computeManualDetection(
						preview,
						rect,
						gridWidthValue,
						gridHeightValue,
					),
				);
			},
			() => {
				if (currentAutomaticResult) showResult(currentAutomaticResult);
				closeManualGrid();
			},
		);

		manualGridToggle.addEventListener("click", () => {
			if (!currentAutomaticResult) return;
			manualGridEditor.activate(
				preview.naturalWidth,
				preview.naturalHeight,
				currentAutomaticResult.grid.gridWidth,
				currentAutomaticResult.grid.gridHeight,
			);
			manualGridForm.hidden = false;
			manualGridToggle.hidden = true;
		});

		input.addEventListener("change", () => {
			resetResult(resultElements);
			editor.reset();
			currentAutomaticResult = null;
			closeManualGrid();
			const file = input.files?.[0];
			currentFileName = file?.name;
			void handleImageSelection(file, { preview, error }).finally(() => {
				input.value = "";
			});
		});

		preview.addEventListener("load", () => {
			currentAutomaticResult = computeDetection(preview);
			showResult(currentAutomaticResult);
			manualGridToggle.hidden = false;
		});
	}
}
