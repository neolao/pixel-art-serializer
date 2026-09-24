// REPL driver for pixel-art-serializer (browser-driven web app).
// Uses playwright-core (a project devDependency) to drive headless Chromium.
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
//
// Usage: node .claude/skills/run-pixel-art-serializer/driver.mjs
// (run with the Vite dev server already up — see SKILL.md)

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { chromium } from "playwright-core";

const SKILL_DIR = path.dirname(new URL(import.meta.url).pathname);
const FIXTURES_DIR = path.join(SKILL_DIR, "fixtures");
const SHOT_DIR =
	process.env.SCREENSHOT_DIR || "/tmp/pixel-art-serializer-shots";
fs.mkdirSync(SHOT_DIR, { recursive: true });

const DEFAULT_URL = process.env.APP_URL || "http://localhost:5173";

let browser = null;
let page = null;

function requirePage() {
	if (!page) throw new Error("not launched — run 'launch' first");
	return page;
}

const COMMANDS = {
	async launch() {
		if (browser) return console.log("already launched");
		browser = await chromium.launch({ args: ["--no-sandbox"] });
		page = await browser.newPage();
		page.on("pageerror", (e) => console.log("PAGE ERROR:", String(e)));
		page.on("console", (msg) => {
			if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
		});
		console.log("launched.");
	},

	async nav(url) {
		const p = requirePage();
		await p.goto(url || DEFAULT_URL);
		await p.waitForSelector("#image-input");
		console.log("navigated to", url || DEFAULT_URL);
	},

	// upload <selector> <fixture-name-or-path>
	// Fixture names (valid.png, notes.txt, corrupt.png) resolve against fixtures/.
	async upload(args) {
		const p = requirePage();
		const [selector, fixture] = args.split(/\s+/);
		const fixturePath = fs.existsSync(fixture)
			? fixture
			: path.join(FIXTURES_DIR, fixture);
		await p.setInputFiles(selector, fixturePath);
		console.log("uploaded", fixturePath, "into", selector);
	},

	async wait(sel) {
		const p = requirePage();
		try {
			await p.waitForSelector(sel, { timeout: 10_000 });
			console.log("found:", sel);
		} catch {
			console.log("TIMEOUT:", sel);
		}
	},

	async ss(name) {
		const p = requirePage();
		const f = path.join(SHOT_DIR, `${name || `ss-${Date.now()}`}.png`);
		await p.screenshot({ path: f });
		console.log("screenshot:", f);
	},

	async eval(expr) {
		const p = requirePage();
		try {
			console.log(JSON.stringify(await p.evaluate(expr)));
		} catch (e) {
			console.log("ERROR:", e.message);
		}
	},

	async text(sel) {
		const p = requirePage();
		console.log(
			await p.evaluate(
				(s) =>
					(s ? document.querySelector(s) : document.body)?.innerText ??
					"(null)",
				sel || null,
			),
		);
	},

	// Reproduces the 3 verification scenarios for the upload feature
	// (backlog item 001): valid image / non-image file / corrupt image.
	async scenarios() {
		const p = requirePage();
		await p.goto(DEFAULT_URL);
		await p.waitForSelector("#image-input");

		const readState = () =>
			p.evaluate(() => {
				const preview = document.querySelector("#image-preview");
				const error = document.querySelector("#image-error");
				return {
					previewHidden: preview?.hidden,
					previewSrcPrefix: preview?.src?.slice(0, 30),
					errorHidden: error?.hidden,
					errorText: error?.textContent,
				};
			});

		await p.setInputFiles("#image-input", path.join(FIXTURES_DIR, "valid.png"));
		await p.waitForTimeout(300);
		const validImage = await readState();

		await p.setInputFiles("#image-input", path.join(FIXTURES_DIR, "notes.txt"));
		await p.waitForTimeout(300);
		const nonImage = await readState();

		await p.setInputFiles(
			"#image-input",
			path.join(FIXTURES_DIR, "corrupt.png"),
		);
		await p.waitForTimeout(1500); // decode-failure path is async (img.onerror)
		const corruptImage = await readState();

		console.log(
			JSON.stringify({ validImage, nonImage, corruptImage }, null, 2),
		);
	},

	async quit() {
		if (browser) await browser.close().catch(() => {});
		browser = null;
		page = null;
	},

	help() {
		console.log("commands:", Object.keys(COMMANDS).join(", "));
	},
};

const stdin = fs.createReadStream(null, { fd: fs.openSync("/dev/stdin", "r") });
const rl = readline.createInterface({
	input: stdin,
	output: process.stdout,
	prompt: "driver> ",
});

rl.on("line", async (line) => {
	const [cmd, ...rest] = line.trim().split(/\s+/);
	if (!cmd) return rl.prompt();
	const fn = COMMANDS[cmd];
	if (!fn) {
		console.log("unknown:", cmd, "— try: help");
		return rl.prompt();
	}
	try {
		await fn(rest.join(" "));
	} catch (e) {
		console.log("ERROR:", e.message);
	}
	if (cmd === "quit") {
		rl.close();
		process.exit(0);
	}
	rl.prompt();
});
rl.on("close", async () => {
	await COMMANDS.quit();
	process.exit(0);
});

console.log(
	"pixel-art-serializer driver — 'help' for commands, 'launch' to start",
);
rl.prompt();
