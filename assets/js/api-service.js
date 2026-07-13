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
        totalPurchaseInvoices: 312,
        totalSalesInvoices: 589,
        todaySales: 18420000,
        monthSales: 478300000,
        monthProfit: 112400000,
        debtCustomers: 45800000,
        debtSuppliers: 23700000
    },
    'products/top': [
        { name: "لپ تاپ ایسوس", sales: 342 },
        { name: "گوشی سامسونگ", sales: 298 },
        { name: "هدفون بلوتوثی", sales: 512 }
    ],
    'sales/latest': [
        { id: 1001, customer: "آرمان پوراحمد", total: 12500000, date: "1402/12/05" },
        { id: 1002, customer: "شرکت تدبیر", total: 33600000, date: "1402/12/04" }
    ]
};