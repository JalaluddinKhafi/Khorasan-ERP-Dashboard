import { api, send, esc, money, toast } from "./api-service.js";
import { icon } from "./icons.js";
const $ = (s) => document.querySelector(s);
const number = (n) => new Intl.NumberFormat("fa-AF").format(Number(n) || 0);
const badge = (active) =>
  `<span class="status-badge ${active ? "is-active" : "is-inactive"}"><i></i>${active ? "فعال" : "غیرفعال"}</span>`;
const action = (name, label, attr, danger = false) =>
  `<button type="button" class="icon-button ${danger ? "danger" : ""}" ${attr} title="${esc(label)}" aria-label="${esc(label)}">${icon(name, 18)}</button>`;
const thumbnail = (p, large = false) =>
  p.image
    ? `<img class="${large ? "detail-image" : "product-thumb"}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
    : `<span class="${large ? "detail-image image-placeholder" : "product-thumb image-placeholder"}" aria-label="تصویر ثبت نشده">${icon("image", large ? 64 : 24)}</span>`;
function hierarchy(categories) {
  const children = (id) =>
    categories
      .filter((c) => String(c.parent_id ?? "") === String(id ?? ""))
      .sort((a, b) => a.name.localeCompare(b.name, "fa"));
  const descendants = (id) => {
    const result = new Set([String(id)]);
    const visit = (key) =>
      children(key).forEach((c) => {
        if (!result.has(String(c.id))) {
          result.add(String(c.id));
          visit(c.id);
        }
      });
    visit(id);
    return result;
  };
  const count = (id) =>
    categories
      .filter((c) => descendants(id).has(String(c.id)))
      .reduce((sum, c) => sum + Number(c.product_count || 0), 0);
  const path = (id) => {
    const names = [],
      seen = new Set();
    let node = categories.find((c) => String(c.id) === String(id));
    while (node && !seen.has(node.id)) {
      seen.add(node.id);
      names.unshift(node.name);
      node = categories.find((c) => String(c.id) === String(node.parent_id));
    }
    return names.join(" / ");
  };
  const flattened = [];
  const walk = (id, depth) =>
    children(id).forEach((c) => {
      flattened.push({ ...c, depth });
      walk(c.id, depth + 1);
    });
  walk(null, 0);
  return { children, descendants, count, path, flattened };
}
async function readImage(file) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error(
      "تصویر PNG، JPEG یا WebP با حجم حداکثر ۲ مگابایت انتخاب کنید.",
    );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("تصویر خوانده نشد؛ دوباره انتخاب کنید."));
    reader.readAsDataURL(file);
  });
}
export async function productsPage(ui) {
  const { heading, panel, table, field, edit, me, refresh } = ui;
  const [products, categories] = await Promise.all([
    api("products"),
    api("categories"),
  ]);
  const tree = hierarchy(categories);
  heading(
    "ثبت و مدیریت اجناس، نرخ‌ها و موجودی گدام",
    `<button id="add" class="primary">${icon("plus")} افزودن کالا</button>`,
  );
  const low = products.filter(
    (p) => p.active && Number(p.stock) <= Number(p.min_stock),
  ).length;
  $("#app").insertAdjacentHTML(
    "beforeend",
    `<div class="catalog-summary"><span>${icon("box")} <b>${number(products.length)}</b> جنس ثبت‌شده</span><span>${badge(true)} <b>${number(products.filter((p) => p.active).length)}</b> جنس فعال</span><span class="warning-text">${icon("alert")} <b>${number(low)}</b> هشدار موجودی</span></div>` +
      panel(
        `<div class="panel-head"><div><h2>لیست اجناس</h2><p class="muted small">برای مشاهدهٔ مشخصات کامل، روی آیکن جزئیات کلیک کنید.</p></div><span class="table-counter" id="product-count"></span></div><form id="product-filters" class="filter-bar" role="search"><label class="filter-search">جستجوی جنس<div class="input-icon">${icon("search")}<input id="search" type="search" placeholder="نام، کد یا بارکد…" aria-label="جستجوی جنس"></div></label><label>دسته‌بندی<select id="category-filter"><option value="">همهٔ دسته‌ها</option><option value="none">بدون دسته‌بندی</option>${tree.flattened.map((c) => `<option value="${c.id}">${esc("— ".repeat(c.depth) + c.name)}</option>`).join("")}</select></label><label>وضعیت<select id="status-filter"><option value="">همهٔ وضعیت‌ها</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select></label><label>موجودی<select id="stock-filter"><option value="">همهٔ موجودی‌ها</option><option value="available">موجود</option><option value="low">کم‌موجود</option><option value="out">ناموجود</option></select></label><label>ترتیب نمایش<select id="sort-filter"><option value="newest">جدیدترین</option><option value="name">نام جنس</option><option value="price">نرخ فروش</option><option value="stock">موجودی کمتر</option></select></label><button type="reset" class="filter-reset">پاک‌کردن فیلترها</button></form><div id="records"></div>`,
      ),
  );
  function draw() {
    const q = $("#search").value.trim().toLocaleLowerCase("fa"),
      category = $("#category-filter").value,
      status = $("#status-filter").value,
      stock = $("#stock-filter").value,
      desc =
        category && category !== "none" ? tree.descendants(category) : null;
    const rows = products.filter(
      (p) =>
        (!q ||
          [p.name, p.code, p.barcode, p.description]
            .join(" ")
            .toLocaleLowerCase("fa")
            .includes(q)) &&
        (!category ||
          (category === "none"
            ? p.category_id == null
            : desc.has(String(p.category_id)))) &&
        (!status || (status === "active" ? p.active : !p.active)) &&
        (!stock ||
          (stock === "out"
            ? Number(p.stock) === 0
            : stock === "low"
              ? Number(p.stock) <= Number(p.min_stock)
              : Number(p.stock) > 0)),
    );
    const sort = $("#sort-filter").value;
    rows.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "fa")
        : sort === "price"
          ? Number(a.sale_price) - Number(b.sale_price)
          : sort === "stock"
            ? Number(a.stock) - Number(b.stock)
            : Number(b.id) - Number(a.id),
    );
    $("#product-count").textContent =
      number(rows.length) + " از " + number(products.length) + " جنس";
    $("#records").innerHTML = table(
      [
        "تصویر",
        "کد کالا / نام کالا",
        "دسته‌بندی",
        "قیمت خرید",
        "قیمت فروش",
        "موجودی فعلی",
        "وضعیت",
        "عملیات",
      ],
      rows.map((p) => [
        thumbnail(p),
        `<div class="product-name"><b>${esc(p.name)}</b><span class="muted" dir="auto">${esc(p.code)}</span></div>`,
        esc(p.category_id ? tree.path(p.category_id) : "بدون دسته‌بندی"),
        money(p.purchase_price),
        money(p.sale_price),
        `<span class="stock-figure ${Number(p.stock) <= Number(p.min_stock) ? "warning-text" : ""}">${number(p.stock)} <small>${esc(p.unit)}</small></span>`,
        badge(p.active),
        `<div class="row-actions">${action("eye", "جزئیات", `data-details="${p.id}"`)}${action("edit", "ویرایش", `data-edit="${p.id}"`)}${me.role === "ADMIN" ? action("trash", "حذف", `data-delete="${p.id}"`, true) : ""}</div>`,
      ]),
    );
  }
  $("#product-filters").onsubmit = (e) => e.preventDefault();
  $("#product-filters").addEventListener("input", (event) => {
    if (event.target.tagName === "INPUT") draw();
  });
  $("#product-filters").addEventListener("change", (event) => {
    if (event.target.tagName === "SELECT") draw();
  });
  $("#product-filters").onreset = () => setTimeout(draw, 0);
  draw();
  function open(row = {}) {
    let image = row.image || "",
      imageTask = Promise.resolve(),
      imageVersion = 0;
    const fields = [
      field("code", "کد کالا", "text", { max: 60 }),
      field("name", "نام کالا"),
      field("category_id", "دسته‌بندی", "select", {
