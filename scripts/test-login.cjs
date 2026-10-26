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
