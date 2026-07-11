/* eslint-disable @typescript-eslint/no-require-imports -- plain Node QA harness, not app code */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true,
    args: ["--ignore-gpu-blocklist","--enable-unsafe-swiftshader","--use-angle=swiftshader","--enable-webgl"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion:"no-preference" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3500);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const targetY = Math.round((1/7) * max);
  for (let it=0; it<160; it++){ const y = await page.evaluate(()=>window.scrollY); const d=targetY-y; if(Math.abs(d)<3)break; await page.mouse.wheel(0, Math.max(-500,Math.min(500,d))); await page.waitForTimeout(40); }
  await page.waitForTimeout(3500);
  // read three.js camera if exposed; else read canvas pixel luminance grid
  const lum = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return "no canvas";
    return { w: c.width, h: c.height };
  });
  console.log("scrollY frac", (await page.evaluate(()=>window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))).toFixed(3), JSON.stringify(lum));
  await browser.close();
})();
