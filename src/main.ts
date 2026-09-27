import "./style.css";
import { computeConfidence } from "./confidence";
import {
	createReconstructionEditor,
	type EditorElements,
} from "./reconstruction-editor";
import {
	computeDetection,
	type ResultElements,
	renderConfidence,
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
          <img id="image-preview" alt="Selected image preview" hidden />
        </figure>
        <figure id="reconstruction-figure" hidden>
          <figcaption>Reconstruction</figcaption>
          <canvas
            id="reconstruction-canvas"
            aria-label="Image reconstructed from the extracted grid and palette"
          ></canvas>
        </figure>
      </div>
      <p id="confidence" role="status" hidden></p>
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
	const addColorInput = app.querySelector<HTMLInputElement>("#add-color-input");
	const addColorButton =
		app.querySelector<HTMLButtonElement>("#add-color-button");
	const mergeToggleButton = app.querySelector<HTMLButtonElement>(
		"#merge-toggle-button",
	);

	if (
		input &&
		preview &&
		error &&
		reconstructionFigure &&
		reconstructionCanvas &&
		palette &&
		downloadLink &&
		confidence &&
		addColorInput &&
		addColorButton &&
		mergeToggleButton
	) {
		const resultElements: ResultElements = {
			reconstructionFigure,
			reconstructionCanvas,
			palette,
			downloadLink,
			confidence,
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
		let currentFileName: string | undefined;

		input.addEventListener("change", () => {
			resetResult(resultElements);
			editor.reset();
			const file = input.files?.[0];
			currentFileName = file?.name;
			void handleImageSelection(file, { preview, error }).finally(() => {
				input.value = "";
			});
		});

		preview.addEventListener("load", () => {
			const {
				grid,
				palette: extractedPalette,
				serialization,
			} = computeDetection(preview);
			editor.load(serialization, currentFileName);
			renderConfidence(confidence, computeConfidence(grid, extractedPalette));
			reconstructionFigure.hidden = false;
		});
	}
}
