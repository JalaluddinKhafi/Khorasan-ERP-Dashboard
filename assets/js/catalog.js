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
        required: false,
        options: [
          ["", "بدون دسته‌بندی"],
          ...tree.flattened
            .filter((c) => c.active || c.id === row.category_id)
            .map((c) => [c.id, "— ".repeat(c.depth) + c.name]),
        ],
      }),
      field("unit", "واحد جنس", "text", { value: "عدد", max: 40 }),
      ...(!row.id
        ? [
            field("purchase_price", "قیمت خرید افتتاحیه (دالر)", "number", {
              value: 0,
            }),
            field("stock", "موجودی افتتاحیه", "number", { value: 0 }),
          ]
        : []),
      field("sale_price", "قیمت فروش (دالر)", "number", { value: 0 }),
      field("min_stock", "حداقل موجودی هشدار", "number", { value: 5 }),
      field("barcode", "بارکد", "text", { required: false, max: 100 }),
      field("active", "وضعیت — فعال", "checkbox", { value: true }),
      field("description", "توضیحات", "textarea", {
        required: false,
        max: 2000,
        wide: true,
      }),
    ];
    edit(row.id ? "ویرایش جنس" : "افزودن کالا", fields, row, async (m) => {
      await imageTask;
      await send(
        "products" + (row.id ? "/" + row.id : ""),
        { ...m, image },
        row.id ? "PUT" : "POST",
      );
    });
    $("#editor-fields").insertAdjacentHTML(
      "beforeend",
      `<div class="wide product-upload"><div id="product-image-preview">${thumbnail({ ...row, image }, true)}</div><div><label>تصویر جنس<input id="product-image" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="muted small">PNG، JPEG یا WebP؛ حداکثر ۲ مگابایت</p><button type="button" id="remove-product-image" class="danger">حذف تصویر</button></div></div>`,
    );
    $("#product-image").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const version = ++imageVersion;
      imageTask = readImage(file)
        .then((result) => {
          if (version === imageVersion) {
            image = result;
            $("#product-image-preview").innerHTML = thumbnail(
              { ...row, image },
              true,
            );
          }
        })
        .catch((error) => {
          toast(error.message, true);
          e.target.value = "";
        });
    };
    $("#remove-product-image").onclick = () => {
      imageVersion++;
      image = "";
      $("#product-image").value = "";
      $("#product-image-preview").innerHTML = thumbnail(
        { ...row, image },
        true,
      );
    };
  }
  $("#add").onclick = () => open();
  $("#records").onclick = async (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    const row = products.find(
      (p) =>
        String(p.id) ===
        (button.dataset.edit ||
          button.dataset.details ||
          button.dataset.delete),
    );
    if (button.dataset.edit) open(row);
    if (button.dataset.details)
      try {
        details(await api("products/" + row.id), tree);
      } catch (error) {
        toast(error.message, true);
      }
    if (
      button.dataset.delete &&
      confirm(
        "جنس «" + row.name + "» حذف شود؟ اجناس دارای معامله حذف نمی‌شوند.",
      )
    )
      try {
        await api("products/" + row.id, { method: "DELETE" });
        await refresh();
        toast("جنس حذف شد");
      } catch (error) {
        toast(error.message, true);
      }
  };
}
function details(p, tree) {
  $("#product-details")?.remove();
  const modal = document.createElement("dialog");
  modal.id = "product-details";
  modal.className = "product-details-modal";
  modal.setAttribute("aria-labelledby", "product-details-title");
  const profit = Number(p.sale_price) - Number(p.purchase_price);
  const data = [
    ["کد کالا", esc(p.code)],
    ["نام کالا", esc(p.name)],
    [
      "دسته‌بندی",
      esc(p.category_id ? tree.path(p.category_id) : "بدون دسته‌بندی"),
    ],
    ["قیمت خرید", money(p.purchase_price)],
    ["قیمت فروش", money(p.sale_price)],
    [
      "سود هر واحد",
      `<span class="${profit < 0 ? "error" : "profit-value"}">${money(profit)}</span>`,
    ],
    ["موجودی فعلی", number(p.stock) + " " + esc(p.unit)],
    ["حداقل موجودی هشدار", number(p.min_stock) + " " + esc(p.unit)],
    ["وضعیت", badge(p.active)],
    [
      "بارکد",
      p.barcode
        ? `<bdi class="barcode-value">${esc(p.barcode)}</bdi>`
        : "ثبت نشده",
    ],
    [
      "توضیحات",
      `<span class="prose">${esc(p.description || "توضیحی ثبت نشده است.")}</span>`,
    ],
  ];
  modal.innerHTML = `<header><div><span class="eyebrow">مشخصات کامل جنس</span><h2 id="product-details-title">جزئیات کالا</h2></div><button type="button" data-close aria-label="بستن جزئیات">×</button></header><div class="product-detail-layout"><div class="detail-visual">${thumbnail(p, true)}<h3>${esc(p.name)}</h3><span class="muted">${esc(p.code)}</span><div class="detail-price"><small>قیمت فروش هر ${esc(p.unit)}</small><strong>${money(p.sale_price)}</strong></div></div><dl class="detail-specs">${data.map(([label, value], i) => `<div class="${i === 10 ? "wide" : ""}"><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl></div><footer class="detail-footer"><button type="button" data-close>بستن جزئیات</button></footer>`;
  document.body.append(modal);
  modal
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = () => modal.close()));
  modal.showModal();
}
export async function categoriesPage(ui) {
  const { heading, panel, table, field, edit, me, refresh } = ui;
  const categories = await api("categories"),
    tree = hierarchy(categories);
  heading(
    "دسته‌های اصلی و زیرمجموعه‌ها را در یک ساختار منظم مدیریت کنید.",
    `<button id="add" class="primary">${icon("plus")} افزودن دسته جدید</button>`,
  );
  const rowActions = (c, sub = false) =>
    `<div class="row-actions">${action("edit", "ویرایش", `data-edit="${c.id}"`)}${me.role === "ADMIN" ? action("trash", "حذف", `data-delete="${c.id}"`, true) : ""}${sub ? action("branch", "افزودن زیرمجموعه", `data-child="${c.id}"`) : ""}</div>`;
  $("#app").insertAdjacentHTML(
    "beforeend",
    panel(
      `<div class="panel-head"><div><h2>${icon("layers")} دسته‌بندی کالاها</h2><p class="muted small">تعداد اجناس هر شاخه شامل زیرمجموعه‌های آن است.</p></div><span class="table-counter">${number(categories.filter((c) => !c.parent_id).length)} دستهٔ اصلی · ${number(categories.length)} دسته در مجموع</span></div>${table(
        ["نام دسته‌بندی", "تعداد محصولات", "وضعیت", "عملیات"],
        tree.flattened.map((c) => [
          `<div class="category-tree-name" style="--depth:${c.depth}"><span class="tree-symbol">${icon(c.depth ? "branch" : "layers", 18)}</span><span>${esc(c.name)}${c.description ? `<small>${esc(c.description)}</small>` : ""}</span></div>`,
          `<span class="count-pill">${number(tree.count(c.id))} محصول</span>`,
          badge(c.active),
          rowActions(c, true),
        ]),
      )}`,
    ) +
      panel(
        `<div class="panel-head"><div><h2>لیست تمام دسته‌بندی‌ها</h2><p class="muted small">جستجو در نام دسته، والد و توضیحات</p></div><label class="category-search">جستجو<div class="input-icon">${icon("search")}<input id="search" type="search" placeholder="جستجوی دسته‌بندی…" aria-label="جستجوی دسته‌بندی"></div></label></div><div id="category-records"></div>`,
      ),
  );
  function draw() {
    const q = $("#search").value.trim().toLocaleLowerCase("fa");
    $("#category-records").innerHTML = table(
      ["شناسه", "نام دسته", "دسته والد", "تعداد محصولات", "عملیات"],
      categories
        .filter((c) =>
          [c.name, c.parent_name, c.description, c.id]
            .join(" ")
            .toLocaleLowerCase("fa")
            .includes(q),
        )
        .map((c) => [
          `<span class="record-id">#${c.id}</span>`,
          `<b>${esc(c.name)}</b>${!c.active ? '<span class="muted small"> · غیرفعال</span>' : ""}`,
          c.parent_name
            ? esc(c.parent_name)
            : '<span class="muted">بدون والد (دسته اصلی)</span>',
          number(tree.count(c.id)),
          rowActions(c),
        ]),
    );
  }
  draw();
  $("#search").oninput = draw;
  function open(row = {}, parent = "") {
    const excluded = row.id ? tree.descendants(row.id) : new Set();
    edit(
      row.id ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی",
      [
        field("name", "نام دسته‌بندی", "text", { max: 160 }),
        field("parent_id", "دسته والد", "select", {
          required: false,
          value: parent,
          options: [
            ["", "بدون والد (دسته اصلی)"],
            ...tree.flattened
              .filter((c) => !excluded.has(String(c.id)))
              .map((c) => [c.id, "— ".repeat(c.depth) + c.name]),
          ],
        }),
        field("description", "توضیحات", "textarea", {
          required: false,
          wide: true,
          max: 1000,
        }),
        field("active", "وضعیت — فعال", "checkbox", { value: true }),
      ],
      row,
      (m) =>
        send(
          "categories" + (row.id ? "/" + row.id : ""),
          m,
          row.id ? "PUT" : "POST",
        ),
    );
  }
  $("#add").onclick = () => open();
  $("#app").onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b || b.id === "add") return;
    const row = categories.find(
      (c) =>
        String(c.id) ===
        (b.dataset.edit || b.dataset.delete || b.dataset.child),
    );
