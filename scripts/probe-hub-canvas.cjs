/* eslint-disable @typescript-eslint/no-require-imports -- plain Node QA harness, not app code */
// Screenshot ONLY the WebGL canvas at the hub anchor (bypasses the dark DOM
// overlay) so we can judge the raw Hub framing + brightness. Port via PH_URL.
const { chromium } = require("playwright");
const URL = process.env.PH_URL || "http://localhost:3000";
const OUT = "/tmp/ph360-anchor/hub-canvas.png";
(async () => {
  const browser = await chromium.launch({
    channel: "chrome", headless: true,
    args: ["--ignore-gpu-blocklist","--enable-unsafe-swiftshader","--use-angle=swiftshader","--enable-webgl"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  const targetY = await page.evaluate(() => {
    const el = document.getElementById("hub");
    return el ? Math.round(window.scrollY + el.getBoundingClientRect().top) : null;
  });
  for (let it=0; it<140; it++){ const y=await page.evaluate(()=>window.scrollY); const d=targetY-y; if(Math.abs(d)<5)break; await page.mouse.wheel(0, Math.max(-700,Math.min(700,d))); await page.waitForTimeout(50); }
  await page.waitForTimeout(2200);
  const canvas = await page.$("canvas");
  await canvas.screenshot({ path: OUT });
  console.log("wrote", OUT);
  await browser.close();
})();
