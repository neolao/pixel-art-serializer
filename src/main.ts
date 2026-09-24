import "./style.css";
import { handleImageSelection } from "./upload";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
	app.innerHTML = `
    <main>
      <h1>Pixel Art Serializer</h1>
      <p>Upload an image to detect its pixel grid and export it as JSON.</p>
      <input id="image-input" type="file" accept="image/*" />
      <p id="image-error" role="alert" hidden></p>
      <img id="image-preview" alt="Selected image preview" hidden />
    </main>
  `;

	const input = app.querySelector<HTMLInputElement>("#image-input");
	const preview = app.querySelector<HTMLImageElement>("#image-preview");
	const error = app.querySelector<HTMLParagraphElement>("#image-error");

	if (input && preview && error) {
		input.addEventListener("change", () => {
			const file = input.files?.[0];
			void handleImageSelection(file, { preview, error }).finally(() => {
				input.value = "";
			});
		});
	}
}
