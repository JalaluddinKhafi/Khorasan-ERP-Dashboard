// سرویس فرضی برای اتصال به API (آماده جایگزینی با Spring Boot)
const API_BASE = '/api'; // بعداً http://localhost:8080/api

export async function fetchData(endpoint) {
    // نمونه fetch واقعی
    // return fetch(`${API_BASE}/${endpoint}`).then(res => res.json());
    // در حال حاضر داده‌های نمونه محلی
    return mockDatabase[endpoint] || [];
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