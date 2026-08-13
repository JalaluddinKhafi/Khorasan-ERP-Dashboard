import { api, send, esc, money, toast } from "./api-service.js";
const $ = (s) => document.querySelector(s),
  page = document.body.dataset.page,
  root = $("#public-app");
const links = [
  ["index", "صفحهٔ نخست"],
  ["about", "دربارهٔ ما"],
  ["products", "اجناس"],
  ["services", "خدمات"],
  ["blog", "مقاله‌ها"],
  ["gallery", "گالری"],
  ["contact", "تماس با ما"],
];
function cards(rows) {
  return `<div class="catalog">${rows.map((r) => `<article class="panel">${r.image ? `<img src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">` : ""}<h2>${esc(r.title)}</h2><p class="prose muted">${esc(r.body.slice(0, 180))}${r.body.length > 180 ? "…" : ""}</p>${r.kind === "blog" ? `<a class="button" href="blog-details.html?id=${r.id}">مطالعهٔ مقاله ←</a>` : ""}</article>`).join("")}</div>`;
}
async function init() {
  const [company, content] = await Promise.all([
    api("public/settings"),
    api("public/content"),
  ]);
    (c) => c.kind === "page" && c.title === "دربارهٔ ما",
  );
  const selected = (kind) => content.filter((c) => c.kind === kind);
  if (page === "index") {
    const banners = selected("slider");
    root.innerHTML = `<section class="hero"><div><div class="eyebrow">AMINI GROUP · امینی گروپ</div><h1>${esc(banners[0]?.title || "همراه شما در تأمین اجناس و توسعهٔ تجارت")}</h1><p class="prose">${esc(banners[0]?.body || company.brands || "معرفی اجناس، نرخ‌های روز و خدمات شرکت در یک جا.")}</p><div class="actions"><a class="button primary" href="products.html">مشاهدهٔ اجناس و نرخ‌ها ←</a><a class="button" href="contact.html">تماس با شرکت</a></div></div><div class="hero-art">${banners[0]?.image ? `<img src="${esc(banners[0].image)}" style="width:100%;border-radius:12px" alt="${esc(banners[0].title)}">` : `<span>گروپ کمپنی‌های</span><strong>${esc(name)}</strong><hr><span>${esc(company.brands || "تأمین · فروش · همکاری")}</span><p>${esc(company.address)}</p>`}</div></section><div class="panel-head"><h2>اجناس و نرخ‌ها</h2><a href="products.html">فهرست کامل ←</a></div><div id="featured-products"></div><h2>خدمات شرکت</h2>${selected("service").length ? cards(selected("service").slice(0, 3)) : '<p class="muted">برای معلومات دربارهٔ خدمات با شرکت تماس بگیرید.</p>'}`;
    const products = await api("public/products");
    $("#featured-products").innerHTML = productCards(products.slice(0, 3));
  } else if (page === "products") {
    const products = await api("public/products");
