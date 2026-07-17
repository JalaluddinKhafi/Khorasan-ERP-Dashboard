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
