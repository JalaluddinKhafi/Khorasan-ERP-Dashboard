export default async function run(page, ui) {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(400);
  const btn = page.locator("button.show-on-mobile").first();
  await btn.click();
  await page.waitForTimeout(900);

  return await page.evaluate(() => {
    const a = document.querySelector(".sidebar-nav li a");
    const icon = a.querySelector("i");
    const span = a.querySelector("span");
    const acs = getComputedStyle(a);
    const ics = icon.getBoundingClientRect();
    const srs = span.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    return {
      linkBox: [
        Math.round(ar.left),
        Math.round(ar.right),
        Math.round(ar.width),
      ],
      iconBox: [
        Math.round(ics.left),
        Math.round(ics.right),
        Math.round(ics.width),
      ],
      spanBox: [
        Math.round(srs.left),
        Math.round(srs.right),
        Math.round(srs.width),
      ],
      justifyContent: acs.justifyContent,
      gap: acs.gap,
      textAlign: acs.textAlign,
      iconMarginLeft: getComputedStyle(icon).marginLeft,
      iconMarginRight: getComputedStyle(icon).marginRight,
      spanFlex: getComputedStyle(span).flex,
      classes: a.className,
    };
  });
}
