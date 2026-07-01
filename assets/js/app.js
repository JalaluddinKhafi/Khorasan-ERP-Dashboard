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
