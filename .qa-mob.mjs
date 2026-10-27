export default async function run(page, ui) {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(600);

  return await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        l: Math.round(r.left),
        r: Math.round(r.right),
        w: Math.round(r.width),
        display: cs.display,
        flex: cs.flex,
      };
    };
    const row1 = document.getElementById("statsRow1");
    const firstCol = row1 ? row1.firstElementChild : null;
    const wc = document.querySelector(".welcome-card");
    const wcRow = wc ? wc.querySelector(".row") : null;
    const wcCol8 = wc ? wc.querySelector(".col-md-8") : null;

    return {
      vw: document.documentElement.clientWidth,
      mainContent: box(".main-content"),
      container: box(".container-fluid"),
      welcomeCard: box(".welcome-card"),
      welcomeInnerRow: wcRow
        ? {
            w: Math.round(wcRow.getBoundingClientRect().width),
            display: getComputedStyle(wcRow).display,
            flexWrap: getComputedStyle(wcRow).flexWrap,
          }
        : null,
      welcomeCol8: wcCol8
        ? {
            w: Math.round(wcCol8.getBoundingClientRect().width),
            flex: getComputedStyle(wcCol8).flex,
            maxW: getComputedStyle(wcCol8).maxWidth,
          }
        : null,
      statsRow1: box("#statsRow1"),
      firstCol: firstCol
        ? {
            cls: firstCol.className,
            w: Math.round(firstCol.getBoundingClientRect().width),
            flex: getComputedStyle(firstCol).flex,
            maxW: getComputedStyle(firstCol).maxWidth,
            display: getComputedStyle(firstCol).display,
          }
        : null,
      statCard: box(".stat-card-dashboard"),
    };
  });
}
