    ? `<img class="${large ? "detail-image" : "product-thumb"}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
    : `<span class="${large ? "detail-image image-placeholder" : "product-thumb image-placeholder"}" aria-label="تصویر ثبت نشده">${icon("image", large ? 64 : 24)}</span>`;
function hierarchy(categories) {
  const children = (id) =>
    categories
      .filter((c) => String(c.parent_id ?? "") === String(id ?? ""))
      .sort((a, b) => a.name.localeCompare(b.name, "fa"));
  const descendants = (id) => {
    const result = new Set([String(id)]);
