export default async function run(page, ui) {
  const url = page.url();
  const name = url.split("/").pop().replace(".html", "");
  const widths = [360, 768, 1024];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 780 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `e:\\Amini\\khorasan-system\\.shot-${name}-${w}.png`,
      fullPage: false,
    });
  }
  return { shot: name, widths };
}
