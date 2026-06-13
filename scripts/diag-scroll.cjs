/* eslint-disable @typescript-eslint/no-require-imports */
/* Diagnose "no scroll animation": (A) does desktop ImageStage animate on scroll?
 * (B) does prefers-reduced-motion fall back to the static mobile stack?
 * Standalone: `node scripts/diag-scroll.cjs`. Not imported by the app. */
const { chromium } = require("playwright");
const fs = require("fs");
const OUT = "/tmp/ph360-scroll";
const URL = "http://localhost:3001";

async function detect(page) {
  return page.evaluate(async () => {
    const img = [...document.querySelectorAll("img")].find((i) =>
      /\/stations\/|hero-tower/.test(i.currentSrc || i.src)
    );
    if (!img) return { found: false };
    const top0 = img.getBoundingClientRect().top;
    window.scrollTo(0, 700);
    await new Promise((r) => setTimeout(r, 400));
    const top1 = img.getBoundingClientRect().top;
    window.scrollTo(0, 0);
    return { found: true, top0: Math.round(top0), top1: Math.round(top1), moved: Math.round(top0 - top1) };
  });
}

async function layerOpacities(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((i) =>
      /\/stations\/|hero-tower/.test(i.currentSrc || i.src)
    );
    return imgs.slice(0, 9).map((i) => +(+getComputedStyle(i.parentElement).opacity).toFixed(2));
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });

  // ── A · desktop, motion allowed ──
  const a = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", hasTouch: false });
  const pa = await a.newPage();
  await pa.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await pa.waitForTimeout(4000);
  const detA = await detect(pa);
  const max = await pa.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const states = [];
  for (let k = 0; k <= 12; k++) {
    const y = Math.round((k / 12) * max);
    await pa.evaluate((yy) => window.scrollTo(0, yy), y);
    await pa.waitForTimeout(450);
    const ops = await layerOpacities(pa);
    const opaque = ops.map((o, idx) => (o > 0.5 ? idx : -1)).filter((x) => x >= 0);
    states.push({ y, opaque, ops });
    if (k % 3 === 0) await pa.screenshot({ path: `${OUT}/A-${String(k).padStart(2, "0")}-y${y}.png` });
  }
  const distinct = new Set(states.map((s) => s.opaque.join("|"))).size;

  // ── B · reduced motion ──
  const b = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", hasTouch: false });
  const pb = await b.newPage();
  await pb.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await pb.waitForTimeout(3500);
  const detB = await detect(pb);
  await pb.screenshot({ path: `${OUT}/B-reduced-top.png` });

  console.log("DETECT_A(motion):", JSON.stringify(detA), "->", detA.moved > 300 ? "MOBILE(in-flow)" : "DESKTOP(fixed stage)");
  console.log("DESKTOP distinct opaque-layer states across 13 scroll steps:", distinct);
  console.log("STATES:", JSON.stringify(states.map((s) => ({ y: s.y, opaque: s.opaque }))));
  console.log("DETECT_B(reduced):", JSON.stringify(detB), "->", detB.moved > 300 ? "MOBILE(in-flow) <-- reduced-motion falls back to static stack" : "DESKTOP(fixed stage)");
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
