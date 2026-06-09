// Probe: scroll to hub anchor, sample canvas luminance in left/center/right
// thirds so we can SEE (numerically) where the bright Hub enclosure lands.
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    channel: "chrome", headless: true,
    args: ["--ignore-gpu-blocklist","--enable-unsafe-swiftshader","--use-angle=swiftshader","--enable-webgl"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  const targetY = await page.evaluate(() => {
    const el = document.getElementById("hub");
    return el ? Math.round(window.scrollY + el.getBoundingClientRect().top) : null;
  });
  for (let it=0; it<140; it++){ const y=await page.evaluate(()=>window.scrollY); const d=targetY-y; if(Math.abs(d)<5)break; await page.mouse.wheel(0, Math.max(-700,Math.min(700,d))); await page.waitForTimeout(50); }
  await page.waitForTimeout(2000);
  // sample the canvas: brightest pixel + per-third mean luma in the middle band
  const res = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return "no canvas";
    const off = document.createElement("canvas");
    off.width = 144; off.height = 90;
    const g = off.getContext("2d");
    g.drawImage(c, 0, 0, off.width, off.height);
    const d = g.getImageData(0, 0, off.width, off.height).data;
    let max = 0, maxXY = [0,0];
    const thirds = [0,0,0], counts=[0,0,0];
    for (let y=20; y<70; y++) for (let x=0; x<144; x++){
      const i=(y*144+x)*4; const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
      const t = x<48?0:x<96?1:2; thirds[t]+=lum; counts[t]++;
      if (lum>max){max=lum; maxXY=[x,y];}
    }
    return { maxLum: Math.round(max), maxXY, leftMean: Math.round(thirds[0]/counts[0]), midMean: Math.round(thirds[1]/counts[1]), rightMean: Math.round(thirds[2]/counts[2]) };
  });
  console.log(JSON.stringify(res));
  await browser.close();
})();
