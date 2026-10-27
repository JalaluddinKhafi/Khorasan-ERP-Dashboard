export default async function run(page, ui) {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.waitForTimeout(500);

  return await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.position === "fixed") return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > vw + 2 || r.left < -2) {
        let p = el.parentElement,
          scrolls = false;
        while (p) {
          const pc = getComputedStyle(p);
          if (pc.overflowX === "auto" || pc.overflowX === "scroll") {
            scrolls = true;
            break;
          }
          p = p.parentElement;
        }
        if (!scrolls) {
          bad.push({
            t: el.tagName,
            c: (el.className || "").toString().slice(0, 55),
            id: el.id,
            l: Math.round(r.left),
            r: Math.round(r.right),
            w: Math.round(r.width),
          });
        }
      }
    });
    const sb = document.querySelector(".sidebar");
    const mc = document.querySelector(".main-content");
    return {
      vw,
      scrollW: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      sidebar: sb
        ? {
            l: sb.getBoundingClientRect().left,
            r: sb.getBoundingClientRect().right,
          }
        : null,
      main: mc
        ? {
            l: Math.round(mc.getBoundingClientRect().left),
            r: Math.round(mc.getBoundingClientRect().right),
            w: Math.round(mc.getBoundingClientRect().width),
          }
        : null,
      bad: bad.slice(0, 14),
    };
  });
}
