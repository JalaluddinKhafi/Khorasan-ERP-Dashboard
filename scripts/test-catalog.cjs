const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.CATALOG_TEST_BASE || "http://localhost:8081";
if (!base.includes("localhost:8081") && process.env.E2E_ALLOW_WRITES !== "yes")
  throw new Error("Run catalog tests only against the isolated QA database.");
const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .trim()
    .split(/\r?\n/)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel:
      process.env.BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const tag = Date.now().toString();
  const rootName = "الکترونیک " + tag,
    childName = "لپ تاپ " + tag,
    leafName = "لپ تاپ گیمینگ " + tag,
    otherName = "پوشاک " + tag;
  const goto = async (name) => {
    await page.goto(base + "/dashboard/" + name + ".html");
    await page.locator("#app h1").waitFor();
    assert(
      !(await page.locator("#app").innerText()).includes(
        "دریافت معلومات انجام نشد",
      ),
    );
  };
