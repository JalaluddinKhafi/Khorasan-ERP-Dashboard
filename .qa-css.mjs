export default async function run(page, ui) {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.waitForTimeout(400);

  return await page.evaluate(() => {
    const mc = document.querySelector(".main-content");
    const wrap = document.querySelector(".wrapper");
    const sb = document.querySelector(".sidebar");
    const cs = getComputedStyle(mc);
    const mw = getComputedStyle(wrap);
    const r = mc.getBoundingClientRect();
    const matched = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list, media) => {
        for (const rule of list) {
          if (rule.type === 4 && rule.cssRules) {
            walk(rule.cssRules, rule.conditionText || "media");
            continue;
          }
          if (rule.selectorText && rule.selectorText.includes("main-content")) {
            matched.push({
              sel: rule.selectorText,
              media: media || "-",
              mr: rule.style.marginRight || "",
              ml: rule.style.marginLeft || "",
              w: rule.style.width || "",
              flex: rule.style.flex || "",
            });
          }
        }
      };
      walk(rules, null);
    }
    return {
      vw: document.documentElement.clientWidth,
      wrapperDisplay: mw.display,
      sidebarRight: Math.round(sb.getBoundingClientRect().right),
      mainLeft: Math.round(r.left),
      mainRight: Math.round(r.right),
      mainWidth: Math.round(r.width),
      mainMarginRight: cs.marginRight,
      mainMarginLeft: cs.marginLeft,
      mainWidthProp: cs.width,
      mainFlex: cs.flex,
      sidebarWidthVar: getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-width")
        .trim(),
      rules: matched,
    };
  });
}
