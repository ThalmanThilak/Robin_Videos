// Frame-by-frame renderer for hausrat.html (Node + Playwright + FFmpeg).
// usage:
//   node render.js probe 2 6.3 9 12.5 ...  -> out/probe.png (contact sheet of those times)
//   node render.js full [audio.wav]       -> out/film.mp4 (30 fps; muxes the audio if given)
// Needs a local web server for the folder: python3 -m http.server 8767 (started by this script).
const { chromium } = require("playwright");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const PORT = 8767;
const URL = `http://localhost:${PORT}/hausrat.html`;
const FPS = 30;
const BROWSER = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

async function open() {
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", HERE], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));
  const opts = { args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--disable-threaded-animation"] };
  if (fs.existsSync(BROWSER)) opts.executablePath = BROWSER;
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(URL);
  await page.waitForFunction("window.ready === true", null, { timeout: 60000 });
  await page.evaluate("document.fonts.ready");
  const shot = async (t) => {
    await page.evaluate(async (t) => { await window.seek(t); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
    return page.screenshot({ type: "png" });
  };
  const close = async () => { await browser.close(); server.kill(); if (errs.length) console.log("page errors:", errs); };
  return { page, shot, close };
}

(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  fs.mkdirSync(path.join(HERE, "out"), { recursive: true });
  const { page, shot, close } = await open();
  if (mode === "probe") {
    const dir = fs.mkdtempSync("/tmp/probe-");
    const times = rest.map(Number);
    for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(dir, `p_${String(i).padStart(3, "0")}.png`), await shot(times[i]));
    const cols = Math.min(times.length, 6);
    const rows = Math.ceil(times.length / cols);
    const label = times.map((t, i) => `[${i}:v]scale=270:-2,drawtext=text='${t}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(";");
    const ins = times.flatMap((_, i) => ["-i", path.join(dir, `p_${String(i).padStart(3, "0")}.png`)]);
    const layout = times.map((_, i) => `${(i % cols) * 276}_${Math.floor(i / cols) * 486}`).join("|");
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", `${label};${times.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${times.length}:layout=${layout}:fill=white`, "-frames:v", "1", path.join(HERE, "out/probe.png")]);
    if (r.status) console.log(String(r.stderr));
    console.log("-> out/probe.png");
  } else if (mode === "full") {
    const dur = await page.evaluate("window.DURATION");
    const n = Math.round(dur * FPS);
    const audio = rest[0];
    const args = ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
    if (audio) args.push("-i", audio);
    args.push("-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p", "-color_range", "tv", "-colorspace", "bt709",
      "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-movflags", "+faststart");
    if (audio) args.push("-c:a", "aac", "-b:a", "256k", "-t", String(dur));
    args.push(path.join(HERE, "out/film.mp4"));
    const ff = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
    const t0 = Date.now();
    for (let f = 0; f < n; f++) {
      const buf = await shot(f / FPS);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % 150 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
    console.log(`-> out/film.mp4 (${n} frames)`);
  }
  await close();
})();
