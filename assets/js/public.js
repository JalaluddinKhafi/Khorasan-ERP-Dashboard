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
