const fs = require("fs");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.E2E_BASE || "http://localhost:8081";
if (!base.includes("localhost:8081") && process.env.E2E_ALLOW_WRITES !== "yes")
  throw new Error(
    "Use a disposable QA database. Set E2E_ALLOW_WRITES=yes only for a test instance.",
  );
const env = Object.fromEntries(
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "")
    .trim()
    .split(/\r?\n/)
    .map((l) => {
      const n = l.indexOf("=");
      return [l.slice(0, n), l.slice(n + 1)];
    }),
);
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel:
      process.env.BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const goto = async (name) => {
    await page.goto(base + "/dashboard/" + name + ".html");
    await page.locator("#app h1").waitFor();
    assert(
      !(await page.locator("#app").innerText()).includes(
        "دریافت معلومات انجام نشد",
      ),
    );
  };
  const api = (path, body, method) =>
    page.evaluate(
      async ({ path, body, method }) => {
        const t = await (await fetch("/api/csrf")).json();
        const r = await fetch("/api/" + path, {
          method: method || (body ? "POST" : "GET"),
          headers: {
            "Content-Type": "application/json",
            [t.headerName]: t.token,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return { status: r.status, data: await r.json() };
      },
      { path, body, method },
    );
  await page.goto(base + "/dashboard/login.html");
  await page.locator("[name=username]").fill("admin");
  await page
    .locator("[name=password]")
    .fill(process.env.E2E_PASSWORD || env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await page.waitForURL("**/dashboard.html");
  const create = async (route, values) => {
    await goto(route);
    await page.locator("#add").click();
    for (const [name, value] of Object.entries(values)) {
      const el = page.locator("#editor [name=" + name + "]");
      if ((await el.evaluate((e) => e.tagName)) === "SELECT")
        await el.selectOption(String(value));
      else await el.fill(String(value));
    }
    await page.locator("#editor button[type=submit]").click();
    await page.locator("#editor").waitFor({ state: "hidden" });
  };
  const baseline = (await api("reports")).data;
  const tag = Date.now().toString();
  await create("categories", { name: "آزمایشی " + tag });
  const cats = (await api("categories")).data;
  const cat = cats.find((c) => c.name.includes(tag));
  await create("products", {
    code: "QA-" + tag,
    name: "پروفیل آزمایشی " + tag,
    unit: "شاخه",
    category_id: cat.id,
    sale_price: 10,
    purchase_price: 5,
    stock: 10,
    min_stock: 2,
  });
  await create("customers", {
    name: "مشتری آزمایشی " + tag,
    phone: "0700000000",
    address: "هرات",
  });
  await create("suppliers", {
    name: "تهیه‌کننده آزمایشی " + tag,
    phone: "0700000001",
    address: "هرات",
  });
  await create("employees", {
    name: "کارمند آزمایشی " + tag,
    phone: "0700000002",
    position: "فروشنده",
    salary: 100,
  });
  const customer = (await api("customers")).data.find((p) =>
    p.name.includes(tag),
  );
  const supplier = (await api("suppliers")).data.find((p) =>
    p.name.includes(tag),
  );
  const product = (await api("products")).data.find(
    (p) => p.code === "QA-" + tag,
  );
  const employee = (await api("employees")).data.find((p) =>
    p.name.includes(tag),
  );
  let currency = await api("currencies", {
    code: "AFN",
    name: "افغانی",
    rate: 70,
  });
  assert([200, 409].includes(currency.status));
  async function invoice(route, party, qty, currency, price) {
    await goto(route);
    await page.locator("#new-invoice").click();
    await page.locator("#editor [name=party_id]").selectOption(String(party));
    await page.locator("#editor [name=currency]").selectOption(currency);
    await page
      .locator("#editor [data-product]")
      .selectOption(String(product.id));
    await page.locator("#editor [data-quantity]").fill(String(qty));
    if (price !== undefined)
      await page.locator("#editor [data-price]").fill(String(price));
    await page.locator("#editor button[type=submit]").click();
    await page.locator("#editor").waitFor({ state: "hidden" });
  }
  await invoice("purchases", supplier.id, 5, "USD", 8);
  await invoice("sales", customer.id, 2, "AFN", 700);
  const sale = (await api("invoices?kind=SALE")).data.find(
    (i) => i.party_id === customer.id,
  );
  assert.equal(Number(sale.total_usd), 20);
  await goto("payments");
  await page.locator("#add-payment").click();
  await page
    .locator("#editor [name=party_id]")
    .selectOption(String(customer.id));
  await page.locator("#editor [name=invoice_id]").selectOption(String(sale.id));
  await page.locator("#editor [name=currency]").selectOption("AFN");
  await page.locator("#editor [name=amount]").fill("700");
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  await goto("employees");
  await page.locator('[data-payroll="' + employee.id + '"]').click();
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  await goto("expenses");
  await page.locator("#add-expense").click();
  await page.locator("#editor [name=amount]").fill("5");
  await page.locator("#editor button[type=submit]").click();
  await page.locator("#editor").waitFor({ state: "hidden" });
  const stock = (await api("products")).data.find((p) => p.id === product.id);
  assert.equal(Number(stock.stock), 13);
  assert.equal(Number(stock.purchase_price), 6);
  const st = (await api("statement/" + customer.id)).data;
  assert.equal(Number(st.closing), 10);
  assert.equal(st.rows.length, 2);
  const report = (await api("reports")).data;
  assert.equal(Number(report.sales) - Number(baseline.sales), 20);
  assert.equal(Number(report.cost) - Number(baseline.cost), 12);
  assert.equal(Number(report.expenses) - Number(baseline.expenses), 105);
  assert.equal(Number(report.profit) - Number(baseline.profit), -97);
  const over = await api("payments", {
    request_key: crypto.randomUUID(),
    party_id: customer.id,
    invoice_id: sale.id,
    payment_date: "2026-10-26",
    amount: 11,
    currency: "USD",
  });
  assert.equal(over.status, 400);
  const oversell = await api("invoices", {
    request_key: crypto.randomUUID(),
    kind: "SALE",
    party_id: customer.id,
    invoice_date: "2026-10-26",
    currency: "USD",
    discount: 0,
    items: [{ product_id: product.id, quantity: 100, price: 10 }],
  });
  assert.equal(oversell.status, 400);
  await goto("settings");
  await page
    .locator("#header-upload")
    .setInputFiles("assets/images/amini-letterhead.jpg");
  await page.locator("#settings-form button.primary").click();
  await page
    .getByRole("status")
    .filter({ hasText: "تنظیمات ذخیره شد" })
    .waitFor();
  await page.goto(base + "/dashboard/sales-invoice.html?id=" + sale.id);
  await page.locator(".print-sheet .header-image").waitFor();
  await page.screenshot({ path: "tmp/invoice-screen.png", fullPage: true });
  await page.emulateMedia({ media: "print" });
  await page.screenshot({ path: "tmp/invoice-print.png", fullPage: true });
  await page.emulateMedia({ media: "screen" });
