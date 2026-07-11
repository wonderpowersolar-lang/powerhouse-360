/* eslint-disable @typescript-eslint/no-require-imports -- plain Node QA harness, not app code */
/*
 * Explorer focus QA: proves the interactive "click a building zone → fly in →
 * panel → back to overview" loop with real screenshots.
 *
 * Flow:
 *   1. load, settle, screenshot the HERO with hotspot pins visible
 *   2. assert pins are on-screen (opacity > 0) and report each pin's screen pos
 *   3. click a pin (default heatmieter) via [data-hotspot], wait for the fly-in
 *      tween, screenshot the FOCUSED module (camera parked + panel + back btn)
 *   4. click another pin while focused → screenshot the direct module→module fly
 *   5. click [data-focus-back], wait for the fly-out, screenshot RETURN-to-overview
 *   6. report console errors (benign ones filtered)
 *
 * Usage: PH_URL=http://localhost:3187 node scripts/qa-focus.cjs [firstPin] [secondPin]
 */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "/tmp/ph360-focus";
const URL = process.env.PH_URL || "http://localhost:3000";
const FIRST = process.argv[2] || "heatmieter";
const SECOND = process.argv[3] || "powermieter";

const BENIGN = [
  /THREE\.Clock/i,
  /Largest Contentful Paint/i,
  /ReadPixels/i,
  /SwiftShader/i,
  /PCF/i,
  /was preloaded using link preload/i,
];
const isBenign = (s) => BENIGN.some((re) => re.test(s));

async function settleScroll(page, ms) {
  await page.waitForTimeout(ms);
}

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
  page.on("console", (m) => {
    if (m.type() === "error" && !isBenign(m.text())) logs.push(`[error] ${m.text()}`);
  });
  page.on("pageerror", (e) => {
    if (!isBenign(e.message)) logs.push(`[pageerror] ${e.message}`);
  });

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  // let the scene warm up + first paint + loader fade
  await settleScroll(page, 4500);

  // ── 1) HERO with pins ──────────────────────────────────────────────────
  // Make sure we're at the very top (hero overview band).
  await page.evaluate(() => window.scrollTo(0, 0));
  await settleScroll(page, 2500);
  await page.screenshot({ path: `${OUT}/1-hero-pins.png` });

  // ── 2) assert pins on screen ───────────────────────────────────────────
  const pinState = await page.evaluate(() => {
    const pins = Array.from(document.querySelectorAll("[data-hotspot]"));
    return pins.map((p) => {
      const r = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      return {
        id: p.getAttribute("data-hotspot"),
        opacity: cs.opacity,
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
      };
    });
  });
  console.log("PINS:");
  pinState.forEach((p) =>
    console.log(`  ${p.id.padEnd(13)} opacity=${p.opacity} @(${p.x},${p.y}) w=${p.w}`)
  );
  const visiblePins = pinState.filter((p) => Number(p.opacity) > 0.05);
  console.log(`VISIBLE PINS: ${visiblePins.length}/${pinState.length}`);

  // ── 3) click a pin → fly-in → focused module ───────────────────────────
  const clickPin = async (id) => {
    const ok = await page.evaluate((sid) => {
      const el = document.querySelector(`[data-hotspot="${sid}"]`);
      if (!el) return false;
      el.click();
      return true;
    }, id);
    return ok;
  };

  const c1 = await clickPin(FIRST);
  console.log(`CLICK pin #${FIRST}: ${c1 ? "ok" : "MISSING"}`);
  // fly-in tween ~1.25s + camera settle
  await settleScroll(page, 2600);
  await page.screenshot({ path: `${OUT}/2-focus-${FIRST}.png` });

  // verify the focus overlay (panel + back button) is mounted
  const focusUI = await page.evaluate(() => {
    const back = document.querySelector("[data-focus-back]");
    const panel = document.querySelector(".product-panel");
    const dialog = document.querySelector('[role="dialog"]');
    return {
      back: !!back,
      panel: !!panel,
      dialog: !!dialog,
      panelOpacity: panel ? getComputedStyle(panel).opacity : null,
    };
  });
  console.log("FOCUS UI:", JSON.stringify(focusUI));

  // ── 4) module → module direct fly ──────────────────────────────────────
  const c2 = await clickPin(SECOND);
  console.log(`CLICK pin #${SECOND} (while focused): ${c2 ? "ok" : "MISSING"}`);
  await settleScroll(page, 2600);
  await page.screenshot({ path: `${OUT}/3-focus-${SECOND}.png` });

  // ── 5) back → overview ─────────────────────────────────────────────────
  const back = await page.evaluate(() => {
    const el = document.querySelector("[data-focus-back]");
    if (!el) return false;
    el.click();
    return true;
  });
  console.log(`CLICK back: ${back ? "ok" : "MISSING"}`);
  // fly-out tween ~1.05s + settle, then pins should re-appear
  await settleScroll(page, 2600);
  await page.screenshot({ path: `${OUT}/4-return-overview.png` });

  const afterBack = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const pins = Array.from(document.querySelectorAll("[data-hotspot]")).filter(
      (p) => Number(getComputedStyle(p).opacity) > 0.05
    );
    return { dialogGone: !dialog, visiblePins: pins.length };
  });
  console.log("AFTER BACK:", JSON.stringify(afterBack));

  fs.writeFileSync(
    `${OUT}/report.json`,
    JSON.stringify({ pinState, focusUI, afterBack, logs }, null, 2)
  );
  console.log("ERRORS:", logs.length);
  logs.slice(0, 20).forEach((l) => console.log("  " + l));
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
