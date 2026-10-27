export default async function run(page, ui) {
  const results = [];
  for (const w of [768, 1024]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll("body *").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.position === "fixed") return;
        const b = el.getBoundingClientRect();
        if (b.width === 0) return;
        if (b.right > vw + 2 || b.left < -2) {
          bad.push({
            t: el.tagName.toLowerCase(),
            c: (el.className || "").toString().slice(0, 40),
            id: el.id,
            l: Math.round(b.left),
            r: Math.round(b.right),
          });
        }
      });
      return {
        vw,
        scrollW: document.documentElement.scrollWidth,
        bad: bad.slice(0, 8),
      };
    });
    results.push({ w, ...r });
  }
  return results;
}
