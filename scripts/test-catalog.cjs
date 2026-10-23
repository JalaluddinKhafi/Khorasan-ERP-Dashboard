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
  const api = (path, data, method) =>
    page.evaluate(
      async ({ path, data, method }) => {
        const c = await (await fetch("/api/csrf")).json();
        const r = await fetch("/api/" + path, {
          method: method || (data ? "POST" : "GET"),
          headers: {
            "Content-Type": "application/json",
            [c.headerName]: c.token,
          },
          ...(data ? { body: JSON.stringify(data) } : {}),
        });
        return { status: r.status, data: await r.json() };
      },
      { path, data, method },
    );
  await page.goto(base + "/dashboard/login.html");
  await page.locator("[name=username]").fill("admin");
  await page
    .locator("[name=password]")
    .fill(process.env.E2E_PASSWORD || env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await page.waitForURL("**/dashboard.html");
  await page.evaluate(() => {
    setTheme("light");
    setAccent("blue");
  });
  await goto("categories");
  await page.locator("#add").click();
  await page.locator("#editor [name=name]").fill(rootName);
  await page
    .locator("#editor [name=description]")
    .fill("دستهٔ اصلی اجناس برقی");
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  let cats = (await api("categories")).data;
  const root = cats.find((c) => c.name === rootName);
  await page.locator('[data-child="' + root.id + '"]').click();
  assert.equal(
    await page.locator("#editor [name=parent_id]").inputValue(),
    String(root.id),
  );
  await page.locator("#editor [name=name]").fill(childName);
  await page.locator("#editor [name=description]").fill("انواع لپ تاپ");
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  cats = (await api("categories")).data;
  const child = cats.find((c) => c.name === childName);
  const leaf = (
    await api("categories", {
      name: leafName,
      parent_id: child.id,
      description: "لپ تاپ‌های گیمینگ",
      active: true,
    })
  ).data;
  const other = (
    await api("categories", {
      name: otherName,
      parent_id: null,
      description: "پوشاک",
      active: true,
    })
  ).data;
  await goto("products");
  await page.locator("#add").click();
  for (const [name, val] of Object.entries({
    code: "P-" + tag,
    name: "لپ تاپ ایسوس " + tag,
    unit: "عدد",
    purchase_price: 600,
    sale_price: 750,
    stock: 10,
    min_stock: 2,
    barcode: "BAR-" + tag,
    description: "توضیحات محصول آزمایشی؛ ضمانت و مشخصات کامل.",
  })) {
    await page.locator("#editor [name=" + name + "]").fill(String(val));
  }
  await page
    .locator("#editor [name=category_id]")
    .selectOption(String(child.id));
  await page.locator("#product-image").setInputFiles("assets/images/logo.png");
  await page.locator("#product-image-preview img").waitFor();
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  const product = (await api("products")).data.find(
    (p) => p.code === "P-" + tag,
  );
  assert(product.image.startsWith("data:image/png;base64,"));
  assert.equal(product.barcode, "BAR-" + tag);
  assert(product.description.includes("ضمانت"));
  const low = (
    await api("products", {
      code: "LOW-" + tag,
      name: "لپ تاپ کم‌موجود " + tag,
      category_id: leaf.id,
      unit: "عدد",
      purchase_price: 400,
      sale_price: 500,
      stock: 1,
      min_stock: 4,
      barcode: "LOW-" + tag,
      description: "موجودی محدود",
      active: true,
      image: product.image,
    })
  ).data;
  await api("products", {
    code: "OFF-" + tag,
    name: "جنس غیرفعال " + tag,
    category_id: other.id,
    unit: "عدد",
    purchase_price: 20,
    sale_price: 30,
    stock: 3,
    min_stock: 1,
    active: false,
  });
  await goto("products");
  await page.locator("#category-filter").selectOption(String(root.id));
  assert.equal(await page.locator("#records tbody tr").count(), 2);
  await page.locator("#stock-filter").selectOption("low");
  assert.equal(await page.locator("#records tbody tr").count(), 1);
  assert((await page.locator("#records").innerText()).includes(low.name));
  await page.locator("#product-filters button[type=reset]").click();
  await page.locator("#search").fill("BAR-" + tag);
  assert.equal(await page.locator("#records tbody tr").count(), 1);
  await page.locator('[data-details="' + product.id + '"]').click();
  await page.locator("#product-details").waitFor();
  for (const label of [
    "کد کالا",
    "نام کالا",
    "دسته‌بندی",
    "قیمت خرید",
    "قیمت فروش",
    "سود هر واحد",
    "موجودی فعلی",
    "حداقل موجودی هشدار",
    "وضعیت",
    "بارکد",
    "توضیحات",
  ])
    assert(
      (await page.locator("#product-details").innerText()).includes(label),
    );
  assert.equal(await page.locator("#product-details img").count(), 1);
  assert(
    (await page.locator("#product-details").innerText()).includes("BAR-" + tag),
  );
  await page.screenshot({
    path: "tmp/catalog-details-light.png",
    fullPage: true,
  });
  await page.locator("#product-details [data-close]").first().click();
  await page.locator('[data-edit="' + product.id + '"]').click();
  assert.equal(
    await page.locator("#editor [name=barcode]").inputValue(),
    "BAR-" + tag,
  );
  await page
    .locator("#editor [name=description]")
    .fill("توضیحات ویرایش‌شده و ذخیره‌شده");
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  const updated = (await api("products/" + product.id)).data;
  assert.equal(updated.description, "توضیحات ویرایش‌شده و ذخیره‌شده");
  assert.equal(updated.image, product.image);
  await page.locator("#status-filter").selectOption("inactive");
  assert(
    (await page.locator("#records").innerText()).includes("جنس غیرفعال " + tag),
  );
  await page.locator("#product-filters button[type=reset]").click();
  await page.locator("#category-filter").selectOption(String(root.id));
  await page.screenshot({
    path: "tmp/catalog-products-light.png",
    fullPage: true,
  });
  await goto("categories");
  const treeRow = page
    .locator(".panel")
    .first()
    .locator("tr")
    .filter({ has: page.locator('[data-child="' + root.id + '"]') });
  assert((await treeRow.innerText()).includes("۲ محصول"));
  await page.locator('#category-records [data-edit="' + root.id + '"]').click();
  const optionValues = await page
    .locator("#editor [name=parent_id] option")
    .evaluateAll((els) => els.map((e) => e.value));
  assert(!optionValues.includes(String(root.id)));
  assert(!optionValues.includes(String(child.id)));
  assert(!optionValues.includes(String(leaf.id)));
  await page.locator("#cancel-editor").click();
  const cyclic = await api(
    "categories/" + root.id,
    { name: rootName, parent_id: leaf.id, active: true },
    "PUT",
  );
