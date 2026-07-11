/* eslint-disable @typescript-eslint/no-require-imports -- plain Node QA harness, not app code */
/* 5-beat QA (§5): screenshots a station at explicit fractions of its scroll
 * band to verify Approach / Hold / Reveal+Explain / Transition empirically.
 * Scrolls via Lenis-friendly wheel nudges to scrollY = sectionTop + f*height
 * (the same mapping ScrollBridge uses for the raw section float).
 * Usage: node scripts/qa-beats.cjs [sectionId] [f1 f2 ...]
 *        (default: heatmieter 0.10 0.35 0.65 0.95) */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "/tmp/ph360-beats";
const URL = process.env.PH_URL || "http://localhost:3000";
const args = process.argv.slice(2);
const SECTION = args[0] || "heatmieter";
const FRACTIONS = args.length > 1 ? args.slice(1).map(Number) : [0.1, 0.35, 0.65, 0.95];

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

  const band = await page.evaluate((sid) => {
    const el = document.getElementById(sid);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(window.scrollY + r.top), height: el.offsetHeight };
  }, SECTION);
  if (!band) { console.log(`MISSING #${SECTION}`); process.exit(1); }

  for (const f of FRACTIONS) {
    const targetY = Math.round(band.top + band.height * f);
    for (let it = 0; it < 160; it++) {
      const y = await page.evaluate(() => window.scrollY);
      const d = targetY - y;
      if (Math.abs(d) < 4) break;
      await page.mouse.wheel(0, Math.max(-700, Math.min(700, d)));
      await page.waitForTimeout(55);
    }
    // settle: let Lenis + camera damping + panel transitions finish
    await page.waitForTimeout(2800);
    const pct = Math.round(f * 100);
    const file = `${OUT}/${SECTION}-${String(pct).padStart(2, "0")}.png`;
    await page.screenshot({ path: file });
    console.log(`shot ${SECTION} @ ${pct}% (y=${await page.evaluate(() => Math.round(window.scrollY))})`);
  }
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ section: SECTION, logs }, null, 2));
  console.log("ERRORS:", logs.length);
  logs.slice(0, 20).forEach((l) => console.log("  " + l));
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
