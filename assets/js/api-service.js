let csrf;
export async function fetchData(endpoint, options = {}) {
  if (!csrf || (options.method && options.method !== "GET")) {
    const r = await fetch("/api/csrf", { credentials: "same-origin" });
    if (!r.ok) throw new Error("ارتباط با سرور برقرار نشد");
    csrf = await r.json();
  }
  const response = await fetch("/api/" + endpoint.replace(/^\//, ""), {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { [csrf.headerName]: csrf.token } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && !endpoint.startsWith("public/")) {
    location.href = "/dashboard/login.html";
    throw new Error("لطفاً وارد سیستم شوید");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok)
    throw new Error(
      data.message || "عملیات انجام نشد؛ ارتباط و دسترسی خود را بررسی کنید",
    );
  return data;
}
export const api = fetchData;
export const send = (path, data, method = "POST") =>
  api(path, { method, body: JSON.stringify(data) });
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const money = (value, currency = "USD") =>
  "\u2067" +
  new Intl.NumberFormat("fa-AF", { maximumFractionDigits: 4 }).format(
    Number(value) || 0,
  ) +
  " " +
  (currency === "USD" ? "دالر" : "\u2066" + esc(currency) + "\u2069") +
  "\u2069";
export const day = (value) =>
  value
    ? new Intl.DateTimeFormat("fa-AF", {
        dateStyle: "medium",
        timeZone: "Asia/Kabul",
      }).format(new Date(value + "T12:00:00Z"))
    : "";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function toast(message, error = false) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  if (error) el.style.border = "2px solid var(--danger)";
  document.body.append(el);
  setTimeout(() => el.remove(), 6000);
}
export function downloadCsv(name, rows) {
  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row
