/* eslint-disable @typescript-eslint/no-require-imports -- plain Node QA harness, not app code */
/* Visual QA harness — drives REAL Chrome (GPU/SwiftShader) against the dev
 * server, scrolls through the 8 chapters like a user (wheel events so Lenis
 * tracks), and captures a screenshot + console diagnostics per section.
 * Standalone: run with `node scripts/qa-shots.cjs`. Not imported by the app. */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "/tmp/ph360-shots";
const URL = "http://localhost:3000";
const SECTIONS = ["hero", "pv", "heat", "hub", "meters", "residents", "dashboard", "cta"];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--ignore-gpu-blocklist",
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--enable-webgl",
    ],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    hasTouch: false,
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text()}`); });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

  const webgl = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return { ok: false };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      ok: true,
      version: gl.getParameter(gl.VERSION),
      renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    };
  });

  const mode = await page.evaluate(() => ({
    wide: matchMedia("(min-width:1024px)").matches,
    fine: matchMedia("(pointer:fine)").matches,
    hasCanvas: !!document.querySelector("canvas"),
    scrollH: document.documentElement.scrollHeight,
    innerH: window.innerHeight,
  }));

  await page.waitForTimeout(3500); // loader clear + first frames

  const curY = () => page.evaluate(() => window.scrollY);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

  async function scrollToFraction(p) {
    const targetY = Math.round(p * max);
    for (let it = 0; it < 80; it++) {
      const y = await curY();
      const d = targetY - y;
      if (Math.abs(d) < 6) break;
      await page.mouse.wheel(0, Math.max(-600, Math.min(600, d)));
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1600); // Lenis ease + camera damping settle
  }

  const results = [];
  for (let i = 0; i < SECTIONS.length; i++) {
    await scrollToFraction(i / (SECTIONS.length - 1));
    const info = await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      progress: +(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)).toFixed(3),
    }));
    const file = `${OUT}/${String(i).padStart(2, "0")}-${SECTIONS[i]}.png`;
    await page.screenshot({ path: file });
    results.push({ section: SECTIONS[i], ...info, file });
    console.log(`shot ${i} ${SECTIONS[i]} @ progress=${info.progress}`);
  }

  // Mobile pass
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mctx.newPage();
  await mp.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await mp.waitForTimeout(1800);
  await mp.screenshot({ path: `${OUT}/mobile-top.png` });
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.42));
  await mp.waitForTimeout(1200);
  await mp.screenshot({ path: `${OUT}/mobile-mid.png` });

  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ webgl, mode, results, logs }, null, 2));
  console.log("WEBGL:", JSON.stringify(webgl));
  console.log("MODE:", JSON.stringify(mode));
  console.log("LOGS:", logs.length);
  logs.slice(0, 40).forEach((l) => console.log("  " + l));
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
