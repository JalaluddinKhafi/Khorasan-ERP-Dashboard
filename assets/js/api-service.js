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
}

// دیتابیس محلی با اطلاعات فارسی
const mockDatabase = {
    'dashboard/stats': {
        totalProducts: 248,
        totalCustomers: 1240,
        totalSuppliers: 56,
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
