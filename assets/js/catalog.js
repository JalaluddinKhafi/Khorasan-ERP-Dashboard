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
