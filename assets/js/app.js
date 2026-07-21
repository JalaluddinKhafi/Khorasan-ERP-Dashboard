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
