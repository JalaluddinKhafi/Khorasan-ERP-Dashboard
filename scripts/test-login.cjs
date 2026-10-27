const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const env = Object.fromEntries(
    fs
      .readFileSync(".env", "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );
  const browser = await chromium.launch({
    headless: true,
    channel:
      process.env.BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
  });
  const page = await browser.newPage();
  const base = process.env.LOGIN_TEST_BASE || "http://localhost:8082";
  await page.goto(base + "/dashboard/login.html");
  await page.locator("[name=username]").fill(env.ADMIN_USERNAME || "admin");
  await page.locator("[name=password]").fill("incorrect-test-password");
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await page
    .locator("#login-error")
    .filter({ hasText: "نام کاربری یا رمز عبور نادرست است" })
    .waitFor();
  for (const [status, expected] of [
    [403, "نشست ورود منقضی"],
    [404, "صفحهٔ ورود را از آدرس"],
    [503, "سرویس ورود با مشکل"],
  ]) {
    await page.route("**/api/login", (route) =>
      route.fulfill({ status, contentType: "application/json", body: "{}" }),
    );
