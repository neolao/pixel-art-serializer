import "./style.css";
import { displayResult, type ResultElements, resetResult } from "./result";
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
      <div id="palette" aria-label="Color palette" hidden></div>
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

	if (
		input &&
		preview &&
		error &&
		reconstructionFigure &&
		reconstructionCanvas &&
		palette &&
		downloadLink
	) {
		const resultElements: ResultElements = {
			reconstructionFigure,
			reconstructionCanvas,
			palette,
			downloadLink,
		};
		let currentFileName: string | undefined;

		input.addEventListener("change", () => {
			resetResult(resultElements);
			const file = input.files?.[0];
			currentFileName = file?.name;
			void handleImageSelection(file, { preview, error }).finally(() => {
				input.value = "";
			});
		});

		preview.addEventListener("load", () => {
			displayResult(preview, resultElements, currentFileName);
		});
	}
}
