// ============================================
// داده‌های داشبورد (با API واقعی و fallback Mock)
// ============================================

let dashboardStats = {
    totalProducts: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
    totalPurchaseInvoices: 0,
    totalSalesInvoices: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    yearSales: 0,
    monthProfit: 0,
    monthProfitPercent: 0,
    debtCustomers: 0,
    debtSuppliers: 0,
    pendingOrders: 0,
    lowStockCount: 0
};

const fallbackDashboardStats = {
    totalProducts: 248,
    totalCustomers: 1240,
    totalSuppliers: 56,
    totalPurchaseInvoices: 312,
    totalSalesInvoices: 589,
    todaySales: 18420000,
    weekSales: 124500000,
    monthSales: 478300000,
    yearSales: 5240000000,
    monthProfit: 112400000,
    monthProfitPercent: 18.5,
    debtCustomers: 45800000,
    debtSuppliers: 23700000,
    pendingOrders: 23,
    lowStockCount: 8
};

let topProducts = [
    { id: 1, name: "لپ تاپ ایسوس ROG", sales: 342, amount: 12150000000, growth: 12.5, image: "../assets/images/placeholders/d8fff340a52a.svg" },
    { id: 2, name: "گوشی سامسونگ S24", sales: 298, amount: 12516000000, growth: 8.2, image: "../assets/images/placeholders/97d5c6e8f53e.svg" },
    { id: 3, name: "هدفون سونی XM5", sales: 512, amount: 4556800000, growth: 15.3, image: "../assets/images/placeholders/a06406b3992f.svg" },
    { id: 4, name: "تبلت اپل iPad Pro", sales: 187, amount: 9150000000, growth: -2.1, image: "../assets/images/placeholders/d9a003dbd4cb.svg" },
    { id: 5, name: "موس بی سیم لاجیتک", sales: 423, amount: 1057500000, growth: 22.7, image: "../assets/images/placeholders/bc0f7f0be41f.svg" }
];

let latestSales = [
    { id: "F-1001", customer: "آرمان پوراحمد", amount: 12500000, date: "۱۴۰۲/۱۲/۰۵", status: "پرداخت شده" },
    { id: "F-1002", customer: "شرکت تدبیر", amount: 33600000, date: "۱۴۰۲/۱۲/۰۴", status: "در انتظار" },
    { id: "F-1003", customer: "مهدی رضایی", amount: 8900000, date: "۱۴۰۲/۱۲/۰۴", status: "پرداخت شده" },
    { id: "F-1004", customer: "فروشگاه دیجیتال", amount: 45200000, date: "۱۴۰۲/۱۲/۰۳", status: "پرداخت شده" },
    { id: "F-1005", customer: "آیدا محمدی", amount: 23000000, date: "۱۴۰۲/۱۲/۰۳", status: "در انتظار" }
];

let latestPurchases = [
    { id: "P-2001", supplier: "توزیع کننده البرز", amount: 56000000, date: "۱۴۰۲/۱۲/۰۵", status: "پرداخت شده" },
    { id: "P-2002", supplier: "واردات سامسونگ", amount: 234000000, date: "۱۴۰۲/۱۲/۰۴", status: "پرداخت جزئی" },
    { id: "P-2003", supplier: "بازرگانی نوین", amount: 12500000, date: "۱۴۰۲/۱۲/۰۳", status: "پرداخت شده" },
    { id: "P-2004", supplier: "توزیع کننده البرز", amount: 89000000, date: "۱۴۰۲/۱۲/۰۲", status: "پرداخت نشده" }
];

let lowStockProducts = [
    { id: 1, name: "گوشی سامسونگ S24", code: "P1002", stock: 3, minStock: 15, category: "الکترونیک" },
    { id: 2, name: "تبلت اپل iPad Pro", code: "P1004", stock: 2, minStock: 10, category: "الکترونیک" },
    { id: 3, name: "پاوربانک شیائومی", code: "P1008", stock: 5, minStock: 20, category: "لوازم جانبی" }
];

let recentActivities = [
    { time: "۱۰:۳۰", action: "فاکتور فروش جدید", user: "admin", details: "فاکتور شماره F-1006 به مبلغ ۱۵,۲۰۰,۰۰۰ تومان صادر شد", icon: "fa-file-invoice", color: "bg-danger" },
    { time: "۰۹:۴۵", action: "افزودن کالا", user: "admin", details: "کالای جدید با نام 'هدفون جی بی ال' به انبار اضافه شد", icon: "fa-box", color: "bg-success" },
    { time: "۰۹:۱۵", action: "پرداخت", user: "admin", details: "پرداخت مبلغ ۵,۰۰۰,۰۰۰ تومان از مشتری آرمان پوراحمد", icon: "fa-credit-card", color: "bg-info" },
    { time: "۰۸:۳۰", action: "هشدار موجودی", user: "سیستم", details: "موجودی گوشی سامسونگ S24 به زیر حد مجاز رسید", icon: "fa-exclamation-triangle", color: "bg-warning" }
];

async function loadDashboardData() {
    dashboardStats = OrgContext.isBranch()?Object.fromEntries(Object.keys(fallbackDashboardStats).map(key=>[key,0])):{...fallbackDashboardStats};
    if(OrgContext.isBranch()){topProducts=[];latestSales=[];latestPurchases=[];lowStockProducts=[];recentActivities=[];}
    const sales = FrontendStore.read('sales', DemoData.sales);
    const purchases = FrontendStore.read('purchases', DemoData.purchases);
    if (OrgContext.isBranch() || FrontendStore.has('products')) {
        const products = FrontendStore.read('products', DemoData.products);
        dashboardStats.totalProducts = products.length;
        lowStockProducts = products.filter(p => p.stock <= p.minStock);
        dashboardStats.lowStockCount = lowStockProducts.length;
    }
    if (OrgContext.isBranch() || FrontendStore.has('sales')) {
        dashboardStats.totalSalesInvoices = sales.length;
        dashboardStats.todaySales = sales.filter(s=>dateKey(s.date)===dateKey(todayISO())).reduce((sum,s)=>sum+s.total,0);
        dashboardStats.monthSales = sales.filter(s=>dateKey(s.date).slice(0,7)===dateKey(todayISO()).slice(0,7)).reduce((sum,s)=>sum+s.total,0);
        latestSales = sales.slice(-4).reverse().map(s=>({...s,id:s.invoiceNo,amount:s.total}));
    }
    if (OrgContext.isBranch() || FrontendStore.has('purchases')) {
        dashboardStats.totalPurchaseInvoices = purchases.length;
        latestPurchases = purchases.slice(-4).reverse().map(p=>({...p,id:p.invoiceNo,amount:p.total}));
    }
    if (OrgContext.isBranch() || FrontendStore.has('customers')) dashboardStats.totalCustomers = FrontendStore.read('customers',[]).length;
    if (OrgContext.isBranch() || FrontendStore.has('suppliers')) dashboardStats.totalSuppliers = FrontendStore.read('suppliers',[]).length;

    if(OrgContext.isBranch()){
        dashboardStats.debtCustomers=FrontendStore.read('customers',[]).reduce((sum,c)=>sum+c.debt,0);
        dashboardStats.debtSuppliers=FrontendStore.read('suppliers',[]).reduce((sum,c)=>sum+c.debt,0);
        dashboardStats.pendingOrders=FrontendStore.read('orders',[]).filter(o=>o.status==='pending').length;
        const groups=new Map();sales.forEach(s=>(s.items||[]).forEach(i=>{const p=groups.get(i.productId)||{name:i.name,sales:0,amount:0,growth:0,image:'../assets/images/placeholder.svg'};p.sales+=i.quantity;p.amount+=i.total;groups.set(i.productId,p);}));topProducts=[...groups.values()].sort((a,b)=>b.sales-a.sales).slice(0,5);
        const monthSales=sales.filter(s=>dateKey(s.date).slice(0,7)===dateKey(todayISO()).slice(0,7));
        const cost=monthSales.reduce((sum,s)=>sum+(s.items||[]).reduce((t,i)=>t+(i.costPrice||0)*i.quantity,0),0);
        const expense=FrontendStore.read('expenses',[]).filter(e=>dateKey(e.isoDate||e.date).slice(0,7)===dateKey(todayISO()).slice(0,7)).reduce((sum,e)=>sum+e.amount,0);
        dashboardStats.monthProfit=dashboardStats.monthSales-cost-expense;
    }
    renderStatsCards();
    renderTopProducts();
    renderRecentActivities();
    renderLatestTables();
    renderLowStockAlert();
}

// ============================================
// توابع رندرینگ
// ============================================

// رندر تاریخ امروز
function renderDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const today = new Date().toLocaleDateString('fa-IR', options);
    document.getElementById('todayDate').innerHTML = today;
}

// رندر کارت‌های آماری
function renderStatsCards() {
    const row1 = document.getElementById('statsRow1');
    const row2 = document.getElementById('statsRow2');
    
    const stats1 = [
        { icon: "fas fa-box", color: "bg-primary", value: dashboardStats.totalProducts, label: "کل کالاها", trend: "+۱۲", trendUp: true },
        { icon: "fas fa-users", color: "bg-success", value: dashboardStats.totalCustomers, label: "کل مشتریان", trend: "+۲۴", trendUp: true },
        { icon: "fas fa-truck", color: "bg-warning", value: dashboardStats.totalSuppliers, label: "تامین‌کنندگان", trend: "+۳", trendUp: true },
        { icon: "fas fa-file-invoice", color: "bg-danger", value: dashboardStats.totalPurchaseInvoices, label: "فاکتورهای خرید", trend: "+۱۸", trendUp: true },
        { icon: "fas fa-file-signature", color: "bg-info", value: dashboardStats.totalSalesInvoices, label: "فاکتورهای فروش", trend: "+۲۵", trendUp: true },
        { icon: "fas fa-dollar-sign", color: "bg-secondary", value: dashboardStats.todaySales, label: "فروش امروز", isPrice: true, trend: "+۸%", trendUp: true }
    ];
    
    const stats2 = [
        { icon: "fas fa-chart-line", color: "bg-dark", value: dashboardStats.monthSales, label: "فروش ماه جاری", isPrice: true, trend: "+۱۲%", trendUp: true },
        { icon: "fas fa-coins", color: "bg-purple", value: dashboardStats.monthProfit, label: "سود ماه جاری", isPrice: true, trend: "+۵%", trendUp: true },
        { icon: "fas fa-hand-holding-usd", color: "bg-danger", value: dashboardStats.debtCustomers, label: "بدهی مشتریان", isPrice: true, trend: "+۲%", goodWhenDown: true },
        { icon: "fas fa-money-bill-wave", color: "bg-orange", value: dashboardStats.debtSuppliers, label: "بدهی به تامین‌کنندگان", isPrice: true, trend: "-۳%", goodWhenDown: true },
        { icon: "fas fa-clock", color: "bg-warning", value: dashboardStats.pendingOrders, label: "سفارشات در انتظار", trend: "+۵" },
        { icon: "fas fa-exclamation-triangle", color: "bg-danger", value: dashboardStats.lowStockCount, label: "محصولات کم موجود", trend: "+۲", goodWhenDown: true }
    ];
    
    row1.innerHTML = stats1.map(renderStatCard).join('');
    row2.innerHTML = stats2.map(renderStatCard).join('');
}

// اعداد فارسی + تفکیک هزارگان
function toPersianDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) {
        return '۰۱۲۳۴۵۶۷۸۹'[d];
    });
}

function formatStatNumber(stat) {
    if (stat.isPrice) {
        // میلیون تومان با یک رقم اعشار، به فارسی
        var millions = stat.value / 1000000;
        var text = millions.toLocaleString('en-US', {
            minimumFractionDigits: millions < 100 ? 1 : 0,
            maximumFractionDigits: 1
        });
        return toPersianDigits(text) + 'M';
    }
    return toPersianDigits(stat.value.toLocaleString('en-US'));
}

function renderStatCard(s) {
    if(OrgContext.isBranch())s={...s,trend:"0"};
    // جهت از خود عدد استخراج می‌شود تا هرگز با علامت درصد اختلاف نداشته باشد
    var rawTrend = String(s.trend).replace(/[۰-۹]/g, function (d) {
        return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
    });
    var trendValue = parseFloat(rawTrend.replace(/[^0-9.\-]/g, '')) || 0;
    var isUp = trendValue > 0;
    var isFlat = trendValue === 0;

    var trendIcon = isFlat ? 'fa-minus' : (isUp ? 'fa-arrow-up' : 'fa-arrow-down');

    // رنگ بر اساس «خوب/بد» است، نه صرفاً بالا/پایین:
    // برای شاخص‌های منفی (بدهی، کمبود موجودی...) افزایش بد است.
    var good = isFlat ? null : (s.goodWhenDown ? !isUp : isUp);
    var trendClass = good === null ? 'trend-flat' : (good ? 'trend-up' : 'trend-down');

    // علامت همیشه اول عدد بیاید: «۱۲+» → «+۱۲»
    var trendLabel = String(s.trend).replace(/^([۰-۹\d.,٪%]+)([+\-−])$/, '$2$1');

    return `
        <div class="col-xl-2 col-md-4 col-sm-6">
            <div class="stat-card-dashboard"${s.link ? ` onclick="window.location.href='${s.link}'"` : ''}>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="stat-icon ${s.color}"><i class="${s.icon}"></i></div>
                    <div class="text-end">
                        <h3 class="mb-0">${formatStatNumber(s)}</h3>
                        <small class="text-muted">${s.label}</small>
                        <div class="${trendClass}" dir="ltr">
                            <i class="fas ${trendIcon}"></i>
                            <span class="trend-label">${trendLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// رندر محصولات پرفروش
function renderTopProducts() {
    const container = document.getElementById('topProductsList');
    const maxSales = Math.max(...topProducts.map(p => p.sales));
    
    container.innerHTML = topProducts.map(p => `
        <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center gap-3">
                <img src="${p.image}" class="top-product-img" alt="${escapeHTML(p.name)}">
                <div>
                    <h6 class="mb-0">${escapeHTML(p.name)}</h6>
                    <small class="text-muted">${p.sales} عدد فروش</small>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-bold">${(p.amount / 1000000).toFixed(0)}M تومان</div>
                <small class="${p.growth >= 0 ? 'text-success' : 'text-danger'}">
                    <i class="fas fa-arrow-${p.growth >= 0 ? 'up' : 'down'}"></i> ${Math.abs(p.growth)}%
                </small>
            </div>
        </div>
        <div class="percentage-bar mb-3">
            <div class="percentage-fill" style="width: ${(p.sales / maxSales) * 100}%"></div>
        </div>
    `).join('');
}

// رندر فعالیت‌های اخیر
function renderRecentActivities() {
    const container = document.getElementById('activityTimeline');
    container.innerHTML = recentActivities.map(a => `
        <div class="timeline-item">
            <div class="timeline-icon ${a.color} text-white">
                <i class="fas ${a.icon}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between">
                    <strong>${a.action}</strong>
                    <small class="text-muted">${a.time}</small>
                </div>
                <p class="mb-0 small">${a.details}</p>
                <small class="text-muted">کاربر: ${a.user}</small>
            </div>
        </div>
    `).join('');
}

// رندر جداول آخرین فاکتورها
function renderLatestTables() {
    const salesBody = document.querySelector('#latestSalesTable tbody');
    const purchasesBody = document.querySelector('#latestPurchasesTable tbody');

    if (salesBody) {
        salesBody.innerHTML = latestSales.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${escapeHTML(s.customer)}</td>
                <td>${s.amount.toLocaleString()} تومان</td>
                <td>${escapeHTML(s.date)}</td>
                <td><span class="badge ${s.status === 'پرداخت شده' ? 'bg-success' : 'bg-warning'}">${escapeHTML(s.status)}</span></td>
            </tr>
        `).join('');
    }
    
    if (purchasesBody) {
        purchasesBody.innerHTML = latestPurchases.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${escapeHTML(p.supplier)}</td>
                <td>${p.amount.toLocaleString()} تومان</td>
                <td>${escapeHTML(p.date)}</td>
                <td><span class="badge ${p.status === 'پرداخت شده' ? 'bg-success' : (p.status === 'پرداخت جزئی' ? 'bg-warning' : 'bg-danger')}">${escapeHTML(p.status)}</span></td>
            </tr>
        `).join('');
    }
}

// رندر هشدار موجودی کم
function renderLowStockAlert() {
    const container = document.getElementById('lowStockAlert');
    if (lowStockProducts.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">همه محصولات دارای موجودی مناسب هستند</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr><th>کد کالا</th><th>نام کالا</th><th>دسته‌بندی</th><th>موجودی فعلی</th><th>حداقل مجاز</th><th>وضعیت</th><th>عملیات</th></tr>
                </thead>
                <tbody>
                    ${lowStockProducts.map(p => `
                        <tr>
                            <td>${escapeHTML(p.code)}</td>
                            <td>${escapeHTML(p.name)}</td>
                            <td>${escapeHTML(p.category)}</td>
                            <td class="text-danger fw-bold">${p.stock}</td>
                            <td>${p.minStock}</td>
                            <td><span class="badge bg-warning text-dark">نیاز به سفارش</span></td>
                            <td><button class="btn btn-sm btn-primary" onclick="queueOrder(lowStockProducts.find(x=>x.id===${p.id}))">ثبت سفارش</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================
// مقداردهی اولیه
// ============================================

loadSidebarAndNavbar('dashboard');
renderDate();
loadDashboardData();
