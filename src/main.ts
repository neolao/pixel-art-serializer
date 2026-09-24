import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
	app.innerHTML = `
    <main>
      <h1>Pixel Art Serializer</h1>
      <p>Upload an image to detect its pixel grid and export it as JSON.</p>
      <input id="image-input" type="file" accept="image/*" />
    </main>
  `;
}
