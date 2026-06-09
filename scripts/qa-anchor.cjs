/* Resting-state QA: scrolls to each section's anchor (#id) via Lenis-friendly
 * wheel nudges so the camera keyframe + the panel text + DOM overlays settle
 * together, then screenshots. Targets the DOM-overlay sections by default.
 * Usage: node scripts/qa-anchor.cjs [section ...]   (default: dashboard residents meters) */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "/tmp/ph360-anchor";
const URL = process.env.PH_URL || "http://localhost:3000";
const want = process.argv.slice(2);
const SECTIONS = want.length ? want : ["dashboard", "residents", "meters"];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    hasTouch: false,
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => { if (m.type() === "error") logs.push(`[error] ${m.text()}`); });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3500);

  for (const id of SECTIONS) {
    // get the target y of the section element, then wheel-nudge Lenis toward it
    const targetY = await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(window.scrollY + r.top);
    }, id);
    if (targetY == null) { console.log(`MISSING #${id}`); continue; }
    for (let it = 0; it < 120; it++) {
      const y = await page.evaluate(() => window.scrollY);
      const d = targetY - y;
      if (Math.abs(d) < 5) break;
      await page.mouse.wheel(0, Math.max(-700, Math.min(700, d)));
      await page.waitForTimeout(55);
    }
    await page.waitForTimeout(1800);
    const file = `${OUT}/${id}.png`;
    await page.screenshot({ path: file });
    console.log(`shot #${id} @ y=${await page.evaluate(() => Math.round(window.scrollY))}`);
  }
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ logs }, null, 2));
  console.log("ERRORS:", logs.length);
  logs.slice(0, 20).forEach((l) => console.log("  " + l));
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
