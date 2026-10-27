export default async function run(page, ui) {
  const sizes = [
    { name: "xs", w: 360, h: 740 },
    { name: "sm", w: 414, h: 896 },
    { name: "md", w: 768, h: 1024 },
    { name: "lg", w: 1024, h: 768 },
    { name: "xl", w: 1440, h: 900 },
  ];

  const results = [];

  for (const s of sizes) {
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.waitForTimeout(350);

    const r = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const overflow = scrollW - docW;

      // elements sticking out past the viewport (ignore intentionally scrollable containers)
      const offenders = [];
      document.querySelectorAll("body *").forEach((el) => {
        const cs = getComputedStyle(el);
        if (
          cs.display === "none" ||
          cs.visibility === "hidden" ||
          cs.position === "fixed"
        )
          return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        if (rect.right > docW + 2 || rect.left < -2) {
          const parentScrolls = (() => {
            let p = el.parentElement;
            while (p) {
              const pc = getComputedStyle(p);
              if (pc.overflowX === "auto" || pc.overflowX === "scroll")
                return true;
              p = p.parentElement;
            }
            return false;
          })();
          if (!parentScrolls) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || "").toString().slice(0, 40),
              id: el.id,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
            });
          }
        }
      });

      const sidebar = document.querySelector(".sidebar");
      const main = document.querySelector(".main-content");
      const sbCs = sidebar ? getComputedStyle(sidebar) : null;
      const mainCs = main ? getComputedStyle(main) : null;

      // detect tiny tap targets
      const tinyBtns = [
        ...document.querySelectorAll("button, .btn, a.nav-link"),
      ].filter((b) => {
        const rect = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return (
          cs.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.height < 30
        );
      }).length;

      return {
        docW,
        scrollW,
        overflow,
        offenders: offenders.slice(0, 6),
        offenderCount: offenders.length,
        sidebarX: sbCs
          ? Math.round(sidebar.getBoundingClientRect().left)
          : null,
        sidebarW: sbCs
          ? Math.round(sidebar.getBoundingClientRect().width)
          : null,
        mainMarginRight: mainCs ? mainCs.marginRight : null,
        tinyBtns,
      };
    });

    results.push({ size: s.name, w: s.w, ...r });
  }

  return results;
}
