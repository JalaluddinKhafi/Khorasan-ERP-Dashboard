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
