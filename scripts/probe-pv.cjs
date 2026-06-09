const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true,
    args: ["--ignore-gpu-blocklist","--enable-unsafe-swiftshader","--use-angle=swiftshader","--enable-webgl"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "no-preference", hasTouch: false });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3500);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (const [name, frac] of [["pv", 1/7], ["meters", 4/7]]) {
    const targetY = Math.round(frac * max);
    for (let it=0; it<140; it++){ const y = await page.evaluate(()=>window.scrollY); const d=targetY-y; if(Math.abs(d)<4)break; await page.mouse.wheel(0, Math.max(-500,Math.min(500,d))); await page.waitForTimeout(45); }
    await page.waitForTimeout(3200);
    await page.screenshot({ path: `/tmp/ph360-shots/probe-${name}.png` });
    console.log(name, "ok");
  }
  await browser.close();
})();
