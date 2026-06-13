/* eslint-disable @typescript-eslint/no-require-imports -- plain Node QA harness */
/*
 * Image-stage QA: proves the photoreal cinematic stage.
 *  1) scrolls to each of the 9 station HOLDs and screenshots (image + copy/panel)
 *  2) captures the hero WITH explorer pins
 *  3) captures a few mid-band fractions (crossfade evidence)
 *  4) clicks the Heatmieter pin → fly-in mid + settled, then returns to overview
 *  5) mobile top + mid
 * Reports console errors.
 *
 * Usage: PH_URL=http://localhost:3210 node scripts/qa-imagestage.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "/tmp/ph360-image";
const URL = process.env.PH_URL || "http://localhost:3210";

const STATIONS = [
  "hero",
  "powermieter",
  "heatmieter",
  "hub",
  "chargemieter",
  "smokemieter",
  "residents",
  "dashboard",
  "cta",
];

async function settleTo(page, sid, frac) {
  const targetY = await page.evaluate(
    ([sidv, fracv]) => {
      const el = document.getElementById(sidv);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(window.scrollY + r.top + el.offsetHeight * fracv);
    },
    [sid, frac]
  );
  if (targetY == null) return null;
  for (let it = 0; it < 140; it++) {
    const y = await page.evaluate(() => window.scrollY);
    const d = targetY - y;
    if (Math.abs(d) < 4) break;
    await page.mouse.wheel(0, Math.max(-800, Math.min(800, d)));
    await page.waitForTimeout(50);
  }
  return targetY;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const logs = [];

  // ── desktop pass ───────────────────────────────────────────────────────────
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    hasTouch: false,
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") logs.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3800); // hero push-in + decode

  // hero WITH pins (top of page)
  await page.screenshot({ path: `${OUT}/hero-pins.png` });

  // each station at mid-HOLD
  for (const id of STATIONS) {
    await settleTo(page, id, 0.5);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${OUT}/st-${id}.png` });
    console.log(`shot st-${id} @ y=${await page.evaluate(() => Math.round(window.scrollY))}`);
  }

  // heatmieter 5-beat band evidence: 10/35/65/95% → transitioning/settled/panel/exiting
  for (const f of [0.1, 0.35, 0.65, 0.95]) {
    await settleTo(page, "heatmieter", f);
    await page.waitForTimeout(1700);
    await page.screenshot({ path: `${OUT}/heat-band-${Math.round(f * 100)}.png` });
    console.log(`shot heat-band-${Math.round(f * 100)}`);
  }

  // ── explorer fly-in: back to hero, click Heatmieter pin ─────────────────────
  await settleTo(page, "hero", 0.18);
  await page.waitForTimeout(2200);
  const pin = await page.$('[data-hotspot="heatmieter"]');
  if (pin) {
    // fire the click
    await pin.click({ force: true });
    await page.waitForTimeout(450); // mid fly-in (blend ~0.4)
    await page.screenshot({ path: `${OUT}/flyin-mid.png` });
    await page.waitForTimeout(1600); // settled + panel risen
    await page.screenshot({ path: `${OUT}/flyin-settled.png` });
    console.log("shot flyin mid + settled");
    // return to overview via the back control
    const back = await page.$("[data-focus-back]");
    if (back) {
      await back.click({ force: true });
      await page.waitForTimeout(1700);
      await page.screenshot({ path: `${OUT}/flyin-return.png` });
      console.log("shot flyin-return");
    } else {
      logs.push("[qa] back control not found");
    }
  } else {
    logs.push("[qa] heatmieter pin not found");
  }

  await ctx.close();

  // ── mobile pass ─────────────────────────────────────────────────────────────
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mctx.newPage();
  mpage.on("console", (m) => {
    if (m.type() === "error") logs.push(`[m-console] ${m.text()}`);
  });
  mpage.on("pageerror", (e) => logs.push(`[m-pageerror] ${e.message}`));
  await mpage.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: `${OUT}/m-top.png` });
  // scroll to heatmieter card
  await mpage.evaluate(() => {
    const el = document.getElementById("heatmieter");
    if (el) el.scrollIntoView({ block: "center" });
  });
  await mpage.waitForTimeout(1500);
  await mpage.screenshot({ path: `${OUT}/m-heat.png` });
  // scroll to dashboard card
  await mpage.evaluate(() => {
    const el = document.getElementById("dashboard");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await mpage.waitForTimeout(1500);
  await mpage.screenshot({ path: `${OUT}/m-dashboard.png` });
  console.log("shot mobile top + heat + dashboard");

  await mctx.close();

  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ logs }, null, 2));
  console.log("ERRORS:", logs.length);
  logs.slice(0, 30).forEach((l) => console.log("  " + l));
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
