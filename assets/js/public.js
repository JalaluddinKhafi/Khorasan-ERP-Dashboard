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
  const name = company.company_name || "امینی گروپ";
  $("#public-header").innerHTML =
    `<a class="brand" href="index.html">${company.logo_image ? `<img src="${esc(company.logo_image)}" alt="لوگو" width="46" height="46">` : '<span class="brand-mark">ا</span>'}${esc(name)}</a><nav aria-label="صفحات وبسایت">${links.map(([r, t]) => `<a href="${r}.html" ${r === page ? 'aria-current="page" style="color:var(--primary);font-weight:bold"' : ""}>${t}</a>`).join("")}</nav><div class="actions"><button id="public-theme" aria-label="تغییر تم">☾ / ☀</button><a class="button" href="../dashboard/login.html">ورود کارکنان</a></div>`;
  $("#public-theme").onclick = () =>
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    );
  $("#public-footer").innerHTML =
    `<div><b>${esc(name)}</b><br>${esc(company.address)}<br>${esc(company.phone)}</div><div class="actions"><a href="faq.html">پرسش‌ها</a><a href="privacy.html">حریم خصوصی</a><a href="terms.html">شرایط همکاری</a></div><span>© ${new Intl.DateTimeFormat("fa-AF", { year: "numeric" }).format(new Date())} ${esc(name)}</span>`;
  const intro = content.find(
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
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    root.innerHTML =
      '<div class="eyebrow">فهرست اجناس</div><h1>اجناس و نرخ‌های فروش</h1><p class="muted">واحد اصلی نرخنامه دالر امریکایی است. برای موجودی و شرایط فروش با شرکت تماس بگیرید.</p><div class="actions" style="margin-bottom:25px"><input class="search" id="product-search" aria-label="جستجوی جنس" placeholder="جستجوی نام یا کد جنس…"><select id="category-filter" style="max-width:220px" aria-label="دسته‌بندی"><option value="">همهٔ دسته‌ها</option>' +
      categories.map((c) => `<option>${esc(c)}</option>`).join("") +
      '</select></div><div id="product-list"></div>';
    const draw = () => {
      $("#product-list").innerHTML = productCards(
        products.filter(
          (p) =>
            (p.name + " " + p.code)
              .toLowerCase()
              .includes($("#product-search").value.toLowerCase()) &&
            (!$("#category-filter").value ||
              p.category === $("#category-filter").value),
        ),
      );
    };
    $("#product-search").oninput = $("#category-filter").onchange = draw;
    draw();
  } else if (page === "contact") {
    root.innerHTML = `<h1>تماس با ما</h1><p class="muted">پیام شما برای بررسی به بخش مدیریت شرکت فرستاده می‌شود.</p><div class="grid"><section class="panel"><h2>پیام بفرستید</h2><form id="contact-form" class="fields"><label>نام کامل<input name="name" maxlength="160" required autocomplete="name"></label><label>ایمیل<input name="email" type="email" maxlength="200" required autocomplete="email"></label><label>شماره تماس<input name="phone" type="tel" maxlength="60" autocomplete="tel"></label><label>موضوع<input name="subject" maxlength="180"></label><label class="wide">پیام<textarea name="message" maxlength="4000" rows="6" required></textarea></label><p id="contact-status" class="wide" role="status"></p><button class="primary">ارسال پیام</button></form></section><section class="panel"><h2>${esc(name)}</h2><p class="prose">${esc(company.address || "آدرس شرکت هنوز درج نشده است.")}</p><p dir="ltr">${esc(company.phone)}</p><p class="prose muted">${esc(company.brands)}</p></section></div>`;
    $("#contact-form").onsubmit = async (e) => {
      e.preventDefault();
      const b = e.target.querySelector("button");
      b.disabled = true;
      try {
        await send(
          "public/contact",
          Object.fromEntries(new FormData(e.target)),
        );
        $("#contact-status").textContent = "پیام شما ثبت شد. سپاس از تماس شما.";
        e.target.reset();
      } catch (error) {
        $("#contact-status").textContent = error.message;
      } finally {
        b.disabled = false;
      }
    };
  } else if (page === "blog-details") {
    const id = new URLSearchParams(location.search).get("id");
    const article = content.find(
      (c) => String(c.id) === id && c.kind === "blog",
    );
    root.innerHTML = article
      ? `<a href="blog.html">← همهٔ مقاله‌ها</a><article class="panel" style="margin-top:25px"><h1>${esc(article.title)}</h1>${article.image ? `<img src="${esc(article.image)}" alt="${esc(article.title)}" style="max-width:100%;max-height:420px">` : ""}<div class="prose">${esc(article.body)}</div></article>`
      : '<h1>مقاله یافت نشد</h1><a class="button" href="blog.html">بازگشت به مقاله‌ها</a>';
  } else if (page === "faq") {
    const rows = selected("faq");
    root.innerHTML =
      "<h1>پرسش‌های متداول</h1>" +
      (rows.length
        ? rows
            .map(
              (c) =>
                `<details class="panel"><summary>${esc(c.title)}</summary><p class="prose">${esc(c.body)}</p></details>`,
            )
            .join("")
        : '<p>برای دریافت معلومات با شرکت تماس بگیرید.</p><a class="button primary" href="contact.html">تماس با ما</a>');
  } else if (["blog", "gallery", "services"].includes(page)) {
    const kind = { blog: "blog", gallery: "gallery", services: "service" }[
        page
      ],
      rows = selected(kind);
    root.innerHTML = `<h1>${esc({ blog: "خبرها و مقاله‌ها", gallery: "گالری", services: "خدمات شرکت" }[page])}</h1>${rows.length ? cards(rows) : '<section class="panel empty">هنوز محتوایی در این بخش منتشر نشده است.</section>'}`;
  } else {
    const names = {
      about: "دربارهٔ ما",
      privacy: "حریم خصوصی",
      terms: "شرایط همکاری",
    };
    const item = content.find(
      (c) => c.kind === "page" && c.title === names[page],
    );
    root.innerHTML = `<article class="panel"><h1>${esc(names[page] || "صفحه")}</h1><div class="prose">${esc(item?.body || (page === "about" ? company.brands || "معلومات شرکت از بخش مدیریت وبسایت تکمیل می‌شود." : "محتوای این صفحه هنوز توسط مدیریت شرکت منتشر نشده است."))}</div></article>`;
  }
}
function productCards(products) {
  return products.length
    ? `<div class="catalog">${products.map((p) => `<article class="panel">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : ""}<span class="badge">${esc(p.category || "اجناس")}</span><h2 style="margin-top:18px">${esc(p.name)}</h2><p class="muted">کد: ${esc(p.code)} · واحد: ${esc(p.unit)}</p><h3>${money(p.sale_price)}</h3><a href="contact.html" class="button">درخواست معلومات ←</a></article>`).join("")}</div>`
    : '<section class="panel empty">هنوز جنسی در نرخنامه منتشر نشده است.</section>';
}
init().catch((e) => {
  root.innerHTML = `<section class="panel"><h1>ارتباط با سرور برقرار نشد</h1><p>${esc(e.message)}</p><button id="retry">تلاش دوباره</button></section>`;
  $("#retry").onclick = () => location.reload();
});
