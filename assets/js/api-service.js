// سرویس عمومی برای اتصال به API
const API_BASE = 'http://localhost:8080/api';

export async function fetchData(endpoint, options = {}) {
    try {
        const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    } catch (error) {
        console.warn('API unavailable, using mock data:', error);
        return mockDatabase[endpoint] || [];
    }
}

// دیتابیس محلی با اطلاعات فارسی
const mockDatabase = {
    'dashboard': {
        totalProducts: 248,
        totalCustomers: 1240,
        totalSuppliers: 56,
        totalPurchaseInvoices: 312,
        totalSalesInvoices: 589,
        todaySales: 18420000,
        monthSales: 478300000,
        monthProfit: 112400000,
        debtCustomers: 45800000,
        debtSuppliers: 23700000,
        pendingOrders: 23,
        lowStockCount: 8
    },
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
    'products': [
        { id: 1, code: 'P1001', name: 'لپ تاپ ایسوس', category: 'الکترونیک', purchasePrice: 25000000, salePrice: 28500000, unit: 'عدد', status: 'موجود', stock: 45, description: 'لپ تاپ گیمینگ', image: '' },
        { id: 2, code: 'P1002', name: 'گوشی سامسونگ', category: 'الکترونیک', purchasePrice: 38000000, salePrice: 42000000, unit: 'عدد', status: 'موجود', stock: 28, description: '', image: '' },
        { id: 3, code: 'P1003', name: 'هدفون سونی', category: 'الکترونیک', purchasePrice: 6500000, salePrice: 8900000, unit: 'عدد', status: 'موجود', stock: 112, description: '', image: '' }
    ],
    'products/top': [
        { name: 'لپ تاپ ایسوس', sales: 342 },
        { name: 'گوشی سامسونگ', sales: 298 },
        { name: 'هدفون بلوتوثی', sales: 512 }
    ],
    'sales/latest': [
        { id: 1001, customer: 'آرمان پوراحمد', total: 12500000, date: '1402/12/05' },
        { id: 1002, customer: 'شرکت تدبیر', total: 33600000, date: '1402/12/04' }
    ]
};