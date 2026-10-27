export default async function run(page, ui) {
  const out = {};

  // ---- mobile drawer ----
  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => {
    const sb = document.querySelector(".sidebar");
    return {
      sidebarLeft: Math.round(sb.getBoundingClientRect().left),
      hasBackdrop: !!document.querySelector(".sidebar-backdrop"),
      backdropShown:
        document
          .querySelector(".sidebar-backdrop")
          ?.classList.contains("show") || false,
    };
  });

  // click the hamburger
  const btn = page.locator("button.show-on-mobile").first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(500);
  }

  const opened = await page.evaluate(() => {
    const sb = document.querySelector(".sidebar");
    const bd = document.querySelector(".sidebar-backdrop");
    return {
      sidebarLeft: Math.round(sb.getBoundingClientRect().left),
      sidebarRight: Math.round(sb.getBoundingClientRect().right),
      backdropShown: bd ? bd.classList.contains("show") : false,
      bodyOverflow: document.body.style.overflow,
    };
  });

  // close via backdrop
  if (opened.backdropShown) {
    await page
      .locator(".sidebar-backdrop")
      .click({ position: { x: 20, y: 400 } });
    await page.waitForTimeout(400);
  }

  const closed = await page.evaluate(() => {
    const sb = document.querySelector(".sidebar");
    return {
      sidebarLeft: Math.round(sb.getBoundingClientRect().left),
      backdropShown:
        document
          .querySelector(".sidebar-backdrop")
          ?.classList.contains("show") || false,
      bodyOverflow: document.body.style.overflow,
    };
  });

  out.mobile = { before, opened, closed };

  // ---- desktop layout check ----
  const desktop = {};
  for (const w of [768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(400);
    desktop[w] = await page.evaluate(() => {
      const sb = document.querySelector(".sidebar").getBoundingClientRect();
      const mc = document
        .querySelector(".main-content")
        .getBoundingClientRect();
      return {
        vw: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
        sidebar: [Math.round(sb.left), Math.round(sb.right)],
        main: [Math.round(mc.left), Math.round(mc.right)],
        overlap: Math.round(mc.right) > Math.round(sb.left),
      };
    });
  }
  out.desktop = desktop;

  return out;
}
