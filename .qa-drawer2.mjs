export default async function run(page, ui) {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(500);

  const btn = page.locator("button.show-on-mobile").first();
  await btn.click();
  await page.waitForTimeout(1000); // let the 0.25s transition finish

  const state = await page.evaluate(() => {
    const sb = document.querySelector(".sidebar");
    const r = sb.getBoundingClientRect();
    const logo = document.querySelector(".sidebar-logo");
    const firstLink = document.querySelector(".sidebar-nav a");
    return {
      sidebar: {
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      },
      fullyOpen:
        Math.round(r.right) === document.documentElement.clientWidth &&
        Math.round(r.left) === 100,
      logoVisible: logo ? Math.round(logo.getBoundingClientRect().width) : 0,
      firstLinkText: firstLink ? firstLink.innerText.trim() : null,
      backdrop: document
        .querySelector(".sidebar-backdrop")
        ?.classList.contains("show"),
    };
  });

  await page.screenshot({
    path: "e:\\Amini\\khorasan-system\\.shot-drawer.png",
  });
  return state;
}
