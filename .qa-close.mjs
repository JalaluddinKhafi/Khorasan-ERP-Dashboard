export default async function run(page, ui) {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.waitForTimeout(400);
  return await page.evaluate(() => {
    const close = document.querySelector(".sidebar-close");
    const trend = document.querySelector(
      "#statsRow2 .trend-up, #statsRow2 .trend-down",
    );
    const cs = close ? getComputedStyle(close) : null;
    return {
      closeExists: !!close,
      closeDisplay: cs ? cs.display : null,
      matchMedia991: window.matchMedia("(max-width: 991.98px)").matches,
      innerWidth: window.innerWidth,
      trendHTML: trend ? trend.innerHTML.trim() : null,
      trendText: trend ? trend.innerText.trim() : null,
    };
  });
}
