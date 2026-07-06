import { icon } from "./icons.js";
import { productsPage, categoriesPage } from "./catalog.js";
import {
  api,
  send,
  esc,
  money,
  day,
  today,
  toast,
  downloadCsv,
} from "./api-service.js";
const $ = (s) => document.querySelector(s),
  page = document.body.dataset.page,
  app = $("#app"),
  dialog = $("#editor");
let me,
  currencies = [],
  settings = {},
  saveHandler,
  currentRows = [];
const routes = [
  ["dashboard", "داشبورد"],
  ["products", "مدیریت اجناس"],
  ["categories", "دسته‌بندی"],
  ["customers", "مشتریان"],
  ["suppliers", "تهیه‌کنندگان"],
  ["sales", "فروش"],
  ["purchases", "خرید"],
  ["inventory", "گدام"],
  ["payments", "دریافت و پرداخت"],
  ["customer-balance", "بیلانس حساب"],
  ["receipts", "رسیدها"],
  ["price-list", "نرخنامه"],
  ["expenses", "مصارف"],
  ["financial-transactions", "امور مالی"],
  ["reports", "گزارش‌ها"],
  ["employees", "کارمندان و معاش"],
  ["users", "حساب‌های کاربری"],
  ["website-management", "مدیریت وبسایت"],
  ["messages", "پیام‌ها"],
  ["settings", "تنظیمات شرکت"],
  ["audit", "سوابق فعالیت"],
];
const navIcons = {
  dashboard: "grid",
  products: "box",
  categories: "layers",
  customers: "users",
  suppliers: "users",
  sales: "sale",
  purchases: "purchase",
  inventory: "box",
  payments: "wallet",
  "customer-balance": "chart",
  receipts: "sale",
  "price-list": "sale",
  expenses: "wallet",
  "financial-transactions": "chart",
  reports: "chart",
  employees: "users",
  users: "shield",
  "website-management": "globe",
  messages: "mail",
  settings: "settings",
  audit: "clock",
};
const adminPages = new Set([
  "employees",
  "users",
  "website-management",
  "messages",
  "settings",
  "audit",
  "expenses",
  "financial-transactions",
  "reports",
]);
const title = routes.find((r) => r[0] === page)?.[1] || "فاکتور";
function heading(description, buttons = "") {
  app.innerHTML = `<div class="page-heading"><div><div class="eyebrow">امینی گروپ / مدیریت تجارت</div><h1>${esc(title)}</h1><p class="muted">${esc(description)}</p></div><div class="actions no-print">${buttons}</div></div>`;
}
function table(headers, rows) {
  return `<div class="table-scroll"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}" class="empty">هنوز معلوماتی ثبت نشده است.</td></tr>`}</tbody></table></div>`;
}
function panel(content) {
  return `<section class="panel">${content}</section>`;
}
function field(key, label, type = "text", opts = {}) {
  return { key, label, type, ...opts };
}
function renderField(f, value) {
  let val = value ?? f.value ?? "";
  const attrs = `name="${f.key}" ${f.required === false ? "" : "required"} ${f.readonly ? "readonly" : ""}`;
  let input;
  if (f.type === "select")
    input = `<select ${attrs}>${f.options.map((o) => `<option value="${esc(o[0])}" ${String(val) === String(o[0]) ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
  else if (f.type === "checkbox")
    input = `<input name="${f.key}" type="checkbox" ${val ? "checked" : ""}>`;
  else if (f.type === "textarea")
    input = `<textarea ${attrs} rows="4" maxlength="${f.max || 1000}">${esc(val)}</textarea>`;
  else
    input = `<input ${attrs} type="${f.type}" value="${esc(val)}" ${f.type === "number" ? `min="${f.min ?? 0}" max="999999999999" step="${f.step || "0.0001"}"` : ""} ${f.type === "password" ? 'autocomplete="new-password" minlength="12" maxlength="72"' : `maxlength="${f.max || 180}"`}>`;
  return `<label class="${f.wide ? "wide" : ""}">${esc(f.label)}${input}${f.hint ? `<span class="muted">${esc(f.hint)}</span>` : ""}</label>`;
}
function edit(title, fields, values, onSave) {
  $("#editor-title").textContent = title;
  $("#editor-fields").innerHTML = fields
    .map((f) => renderField(f, values[f.key]))
    .join("");
  $("#editor-error").textContent = "";
  const requestKey = crypto.randomUUID();
  saveHandler = async (form) => {
    const m = {
      ...Object.fromEntries(new FormData(form)),
      request_key: requestKey,
    };
    for (const f of fields) {
      if (f.type === "checkbox") m[f.key] = form.elements[f.key].checked;
    }
    await onSave(m);
  };
  dialog.showModal();
}
$("#close-editor").onclick = $("#cancel-editor").onclick = () => dialog.close();
$("#editor-form").onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  $("#editor-error").textContent = "";
  try {
    await saveHandler(e.target);
    await render();
    dialog.close();
    toast("معلومات با موفقیت ذخیره شد");
  } catch (error) {
    $("#editor-error").textContent = error.message;
  } finally {
    btn.disabled = false;
  }
};
const currencyFields = () => [
  field("currency", "واحد پول", "select", {
    options: currencies.map((c) => [c.code, c.name + " (" + c.code + ")"]),
    value: "USD",
  }),
  field("rate", "تعداد واحد ارز در برابر ۱ دالر", "number", {
    value: 1,
    min: 0.00000001,
    step: "0.00000001",
    hint: "مثال: ۱ دالر = ۷۰ افغانی؛ نرخ را ۷۰ وارد کنید.",
  }),
];
function bindRate() {
  const sel = dialog.querySelector("[name=currency]"),
    rate = dialog.querySelector("[name=rate]");
  if (!sel || !rate) return;
  const update = () => {
    rate.value = currencies.find((c) => c.code === sel.value)?.rate || 1;
    rate.readOnly = sel.value === "USD";
  };
  sel.addEventListener("change", update);
  update();
}
const specs = {
  products: {
    fields: [
      field("code", "کد جنس"),
      field("name", "نام جنس"),
      field("unit", "واحد", "text", { value: "عدد" }),
      field("category_id", "دسته‌بندی", "select", {
        required: false,
        options: [],
      }),
      field("sale_price", "نرخ فروش (دالر)", "number"),
      field("purchase_price", "نرخ افتتاحیه خرید (دالر)", "number"),
      field("stock", "موجودی افتتاحیه", "number"),
      field("min_stock", "حداقل موجودی", "number", { value: 5 }),
      field("active", "فعال", "checkbox", { value: true }),
    ],
    headers: ["کد", "نام جنس", "نرخ فروش", "موجودی", "وضعیت"],
    row: (r) => [
      esc(r.code),
      esc(r.name),
      money(r.sale_price),
      esc(r.stock) + " " + esc(r.unit),
      r.active ? "فعال" : "غیرفعال",
    ],
  },
  categories: {
    fields: [field("name", "نام دسته‌بندی")],
    headers: ["شناسه", "نام"],
    row: (r) => [r.id, esc(r.name)],
  },
  customers: {
    fields: [
      field("name", "نام مشتری"),
      field("phone", "شماره تماس", "tel", { required: false }),
      field("address", "آدرس", "textarea", { required: false }),
      field("opening_balance", "باقی افتتاحیه (دالر)", "number", {
        value: 0,
        min: -999999999999,
        hint: "مبلغ منفی برای پیش‌پرداخت؛ پس از ثبت قابل تغییر نیست.",
      }),
      field("opening_date", "تاریخ افتتاح حساب", "date", { value: today() }),
      field("active", "فعال", "checkbox", { value: true }),
    ],
    headers: ["نام مشتری", "تماس", "آدرس", "باقی حساب (دالر)"],
    row: (r) => [esc(r.name), esc(r.phone), esc(r.address), money(r.balance)],
  },
  suppliers: {
    fields: [
      field("name", "نام تهیه‌کننده"),
      field("phone", "شماره تماس", "tel", { required: false }),
      field("address", "آدرس", "textarea", { required: false }),
      field("opening_balance", "باقی افتتاحیه (دالر)", "number", {
        value: 0,
        min: -999999999999,
        hint: "مبلغ منفی برای پیش‌پرداخت؛ پس از ثبت قابل تغییر نیست.",
      }),
      field("opening_date", "تاریخ افتتاح حساب", "date", { value: today() }),
      field("active", "فعال", "checkbox", { value: true }),
    ],
    headers: ["نام تهیه‌کننده", "تماس", "آدرس", "باقی حساب (دالر)"],
    row: (r) => [esc(r.name), esc(r.phone), esc(r.address), money(r.balance)],
  },
  employees: {
    fields: [
      field("name", "نام کارمند"),
      field("phone", "شماره تماس", "tel", { required: false }),
      field("position", "وظیفه", "text", { required: false }),
      field("salary", "معاش ماهانه (دالر)", "number"),
      field("active", "فعال", "checkbox", { value: true }),
    ],
    headers: ["کارمند", "وظیفه", "تماس", "معاش ماهانه", "وضعیت"],
    row: (r) => [
      esc(r.name),
      esc(r.position),
      esc(r.phone),
      money(r.salary),
      r.active ? "فعال" : "غیرفعال",
    ],
  },
  users: {
    fields: [
      field("username", "نام کاربری"),
      field("name", "نام کامل"),
      field("role", "نقش", "select", {
        options: [
          ["EMPLOYEE", "کارمند"],
          ["ADMIN", "مدیر"],
        ],
      }),
      field("password", "رمز عبور", "password"),
      field("active", "فعال", "checkbox", { value: true }),
    ],
    headers: ["نام کاربری", "نام کامل", "نقش", "وضعیت"],
    row: (r) => [
      esc(r.username),
      esc(r.name),
      r.role === "ADMIN" ? "مدیر" : "کارمند",
      r.active ? "فعال" : "غیرفعال",
    ],
  },
  currencies: {
    fields: [
      field("code", "کد سه حرفی ارز"),
      field("name", "نام ارز"),
      field("rate", "تعداد در برابر ۱ دالر", "number", {
        step: "0.00000001",
        min: 0.00000001,
      }),
    ],
    headers: ["کد ارز", "نام ارز", "نرخ در برابر دالر"],
    row: (r) => [esc(r.code), esc(r.name), esc(r.rate)],
  },
};
async function crud(entity) {
  const spec = specs[entity];
  currentRows = await api(entity);
  let fields = spec.fields.map((f) => ({ ...f }));
  if (entity === "products") {
    const cats = await api("categories");
    fields.find((f) => f.key === "category_id").options = [
      ["", "بدون دسته‌بندی"],
      ...cats.map((c) => [c.id, c.name]),
    ];
  }
  heading(
    entity === "products"
      ? "نرخ‌های اجناس به دالر ثبت می‌شوند. موجودی پس از افتتاحیه از طریق خرید و فروش تغییر می‌کند."
      : "ثبت، جستجو و مدیریت معلومات",
    `<button id="add" class="primary">+ ثبت جدید</button>`,
  );
  app.insertAdjacentHTML(
    "beforeend",
    panel(
      `<div class="panel-head"><h2>فهرست ${esc(title)}</h2><input id="search" class="search" placeholder="جستجو…" aria-label="جستجو"></div><div id="records"></div>`,
    ),
  );
  function draw(q = "") {
    const rows = currentRows.filter((r) =>
      Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()),
    );
    $("#records").innerHTML = table(
      [...spec.headers, "عملیات"],
      rows.map((r) => [
        ...spec.row(r),
        `<div class="actions"><button data-edit="${r.id ?? r.code}">ویرایش</button>${entity === "customers" || entity === "suppliers" ? `<a class="button" href="customer-balance.html?id=${r.id}">بیلانس</a>` : ""}${entity === "employees" && r.active ? `<button data-payroll="${r.id}">پرداخت معاش</button>` : ""}${me.role === "ADMIN" && entity !== "currencies" ? `<button class="danger" data-delete="${r.id}">حذف</button>` : ""}</div>`,
      ]),
    );
  }
  draw();
  $("#search").oninput = (e) => draw(e.target.value);
  function open(row = {}) {
    if (["customers", "suppliers"].includes(entity))
      fields.forEach((f) => {
        if (["opening_balance", "opening_date"].includes(f.key))
          f.readonly = Boolean(row.id);
      });
    const fs = fields
      .filter(
        (f) =>
          !(
            entity === "products" &&
            row.id &&
            ["stock", "purchase_price"].includes(f.key)
          ),
      )
      .map((f) => ({
        ...f,
        required: f.key === "password" && row.id ? false : f.required,
        readonly:
          f.readonly ||
          (entity === "currencies" && row.code && f.key === "code"),
      }));
    edit(
      row.id || row.code ? "ویرایش معلومات" : "ثبت جدید",
      fs,
      row,
      async (m) => {
        await send(
          entity +
            (row.id || row.code
              ? "/" + encodeURIComponent(row.id ?? row.code)
              : ""),
          m,
          row.id || row.code ? "PUT" : "POST",
        );
      },
    );
  }
  $("#add").onclick = () => open();
  $("#records").onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const key = b.dataset.edit;
    if (key) open(currentRows.find((r) => String(r.id ?? r.code) === key));
    if (
      b.dataset.delete &&
      confirm("این رکورد حذف شود؟ رکوردهای دارای معامله حذف نمی‌شوند.")
    ) {
      try {
        await api(entity + "/" + b.dataset.delete, { method: "DELETE" });
        await render();
        toast("رکورد حذف شد");
      } catch (error) {
        toast(error.message, true);
      }
    }
    if (b.dataset.payroll)
      payroll(currentRows.find((r) => String(r.id) === b.dataset.payroll));
  };
  if (entity === "employees") {
    const expenses = await api("expenses");
    app.insertAdjacentHTML(
      "beforeend",
      panel(
        "<h2>تاریخچهٔ معاش</h2>" +
          table(
            ["کارمند", "ماه معاش", "تاریخ", "مبلغ اصلی", "مبلغ دالر"],
            expenses
              .filter((e) => e.employee_id)
              .map((e) => [
                esc(e.employee_name),
                esc(e.salary_month),
                day(e.expense_date),
                money(e.amount, e.currency),
                money(e.amount_usd),
              ]),
          ),
      ),
    );
  }
}
function payroll(employee) {
  edit(
    "پرداخت معاش: " + employee.name,
    [
      field("employee_id", "کارمند", "select", {
        options: [[employee.id, employee.name]],
      }),
      field("salary_month", "ماه معاش", "month", {
        value: today().slice(0, 7),
      }),
      field("expense_date", "تاریخ پرداخت", "date", { value: today() }),
      field("amount", "مبلغ معاش", "number", {
        value: employee.salary,
        min: 0.0001,
      }),
      ...currencyFields(),
      field("notes", "یادداشت", "textarea", { required: false }),
    ],
    {},
    (m) => send("expenses/payroll", { ...m, category: "معاش" }),
  );
  bindRate();
}
async function invoices(kind) {
  const rows = await api("invoices?kind=" + kind);
  heading(
    "فاکتورها با موجودی و بیلانس حساب مرتبط هستند. مبلغ دالر با نرخ زمان معامله محاسبه می‌شود.",
    `<button id="new-invoice" class="primary">+ فاکتور جدید</button>`,
  );
  app.insertAdjacentHTML(
    "beforeend",
    panel(
      table(
        [
          "شماره",
          "حساب",
          "تاریخ",
          "مبلغ اصلی",
          "مجموع دالر",
          "پرداخت مرتبط",
          "وضعیت",
          "عملیات",
        ],
        rows.map((r) => [
          r.id,
          esc(r.party_name),
          day(r.invoice_date),
          money(r.total, r.currency),
          money(r.total_usd),
          money(r.paid_usd),
          r.voided
            ? "لغوشده"
            : Number(r.paid_usd) >= Number(r.total_usd)
              ? "تصفیه"
              : "باقی دارد",
          `<a class="button" href="sales-invoice.html?id=${r.id}">نمایش / چاپ</a> ${!r.voided && me.role === "ADMIN" ? `<button class="danger" data-void="${r.id}">لغو</button>` : ""}`,
        ]),
      ),
    ),
  );
  $("#new-invoice").onclick = () => newInvoice(kind);
  app.querySelectorAll("[data-void]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (confirm("فاکتور لغو و موجودی بازگردانده شود؟")) {
          try {
            await api("invoices/" + b.dataset.void, { method: "DELETE" });
            await render();
          } catch (e) {
            toast(e.message, true);
          }
        }
      }),
  );
}
async function newInvoice(kind) {
  try {
    const [parties, products] = await Promise.all([
      api(kind === "SALE" ? "customers" : "suppliers"),
      api("products"),
    ]);
    const active = products.filter((p) => p.active);
    if (!parties.some((p) => p.active) || !active.length) {
      toast("ابتدا حساب و جنس فعال ثبت کنید", true);
      return;
    }
    edit(
      "ثبت فاکتور " + (kind === "SALE" ? "فروش" : "خرید"),
      [
        field("party_id", kind === "SALE" ? "مشتری" : "تهیه‌کننده", "select", {
          options: parties.filter((p) => p.active).map((p) => [p.id, p.name]),
        }),
        field("invoice_date", "تاریخ", "date", { value: today() }),
        ...currencyFields(),
        field("discount", "تخفیف در واحد انتخاب‌شده", "number", { value: 0 }),
        field("notes", "یادداشت", "textarea", { required: false }),
      ],
      {},
      async (m) => {
        const items = [...dialog.querySelectorAll(".line-item")].map((row) => ({
          product_id: row.querySelector("[data-product]").value,
          quantity: row.querySelector("[data-quantity]").value,
          price: row.querySelector("[data-price]").value,
        }));
        await send("invoices", { ...m, kind, items });
      },
    );
    $("#editor-fields").insertAdjacentHTML(
      "beforeend",
      '<div class="wide"><h3>اقلام فاکتور</h3><div id="invoice-items"></div><button type="button" id="add-line">+ افزودن قلم</button><div class="summary"><span>مجموع پس از تخفیف</span><span id="invoice-total"></span></div></div>',
    );
    const calculate = () => {
      const total =
        [...dialog.querySelectorAll(".line-item")].reduce(
          (s, row) =>
            s +
            Number(row.querySelector("[data-quantity]").value) *
              Number(row.querySelector("[data-price]").value),
          0,
        ) - Number(dialog.querySelector("[name=discount]").value);
      $("#invoice-total").textContent = money(
        total,
        dialog.querySelector("[name=currency]").value,
      );
    };
    const addLine = () => {
      const row = document.createElement("div");
      row.className = "line-item";
      row.innerHTML = `<label>جنس<select data-product>${active.map((p) => `<option value="${p.id}">${esc(p.name)} · موجودی ${esc(p.stock)}</option>`).join("")}</select></label><label>تعداد<input data-quantity type="number" value="1" min="0.0001" step="0.0001" required></label><label>نرخ واحد<input data-price type="number" min="0" step="0.0001" required></label><button type="button" class="danger" aria-label="حذف قلم">×</button>`;
      const updatePrice = () => {
        const p = active.find(
          (p) => String(p.id) === row.querySelector("select").value,
        );
        row.querySelector("[data-price]").value = (
          Number(kind === "SALE" ? p.sale_price : p.purchase_price) *
          Number(dialog.querySelector("[name=rate]").value)
        ).toFixed(4);
        calculate();
      };
      row.querySelector("select").onchange = updatePrice;
      row.querySelector("button").onclick = () => {
        row.remove();
        calculate();
      };
      row.addEventListener("input", calculate);
      $("#invoice-items").append(row);
      updatePrice();
    };
    $("#add-line").onclick = addLine;
    bindRate();
    dialog.querySelector("[name=discount]").oninput = calculate;
    let previousRate = Number(dialog.querySelector("[name=rate]").value);
    const convert = () => {
      const rate = Number(dialog.querySelector("[name=rate]").value);
      if (rate > 0) {
        dialog
          .querySelectorAll("[data-price]")
          .forEach(
            (input) =>
              (input.value = (
                (Number(input.value) * rate) /
                previousRate
              ).toFixed(4)),
          );
        previousRate = rate;
      }
      calculate();
    };
    dialog.querySelector("[name=rate]").oninput = convert;
    dialog.querySelector("[name=currency]").addEventListener("change", convert);
    addLine();
  } catch (e) {
    toast(e.message, true);
  }
}
async function paymentForm() {
  const [customers, suppliers, invoicesSale, invoicesPurchase] =
    await Promise.all([
      api("customers"),
      api("suppliers"),
      api("invoices?kind=SALE"),
      api("invoices?kind=PURCHASE"),
    ]);
