        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-success"><i class="fas fa-user-friends"></i></div><div class="stat-info"><h3>${stats.totalCustomers}</h3><p>مشتریان</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-warning"><i class="fas fa-truck-loading"></i></div><div class="stat-info"><h3>${stats.totalSuppliers}</h3><p>تامین‌کنندگان</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-danger"><i class="fas fa-file-invoice"></i></div><div class="stat-info"><h3>${stats.totalPurchaseInvoices}</h3><p>فاکتورهای خرید</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-info"><i class="fas fa-file-signature"></i></div><div class="stat-info"><h3>${stats.totalSalesInvoices}</h3><p>فاکتورهای فروش</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-secondary"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><h3>${stats.todaySales.toLocaleString()} تومان</h3><p>فروش امروز</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-dark"><i class="fas fa-chart-line"></i></div><div class="stat-info"><h3>${stats.monthSales.toLocaleString()} تومان</h3><p>فروش ماه جاری</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-purple"><i class="fas fa-coins"></i></div><div class="stat-info"><h3>${stats.monthProfit.toLocaleString()} تومان</h3><p>سود ماه جاری</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-danger"><i class="fas fa-hand-holding-usd"></i></div><div class="stat-info"><h3>${stats.debtCustomers.toLocaleString()} تومان</h3><p>بدهی مشتریان</p></div></div></div>
        <div class="col-xl-3 col-md-6"><div class="stat-card"><div class="stat-icon bg-orange"><i class="fas fa-money-bill-wave"></i></div><div class="stat-info"><h3>${stats.debtSuppliers.toLocaleString()} تومان</h3><p>بدهی به تامین‌کنندگان</p></div></div></div>
    `;
}

function renderCharts() {
    // نمودار فروش روزانه
    new ApexCharts(document.querySelector("#dailySalesChart"), {
        series: [{ name: 'فروش', data: [12, 19, 15, 17, 24, 28, 31] }],
        chart: { type: 'line', height: 300, toolbar: { show: false } },
        xaxis: { categories: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] },
        colors: ['#2563eb'],
        title: { text: 'فروش روزانه (میلیون تومان)' }
    }).render();
    
    // نمودار فروش ماهانه
    new ApexCharts(document.querySelector("#monthlySalesChart"), {
        series: [{ name: 'فروش', data: [185, 202, 230, 245, 268, 290, 310, 335, 360, 385, 410, 445] }],
        chart: { type: 'bar', height: 300 },
        xaxis: { categories: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] },
        colors: ['#10b981']
    }).render();
    
    // نمودار خرید ماهانه
    new ApexCharts(document.querySelector("#monthlyPurchaseChart"), {
        series: [{ name: 'خرید', data: [95, 112, 130, 125, 148, 160, 155, 170, 185, 190, 210, 225] }],
        chart: { type: 'area', height: 300 },
        xaxis: { categories: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] },
        colors: ['#f59e0b']
    }).render();
    
    // نمودار سود و زیان
    new ApexCharts(document.querySelector("#profitLossChart"), {
        series: [{ name: 'سود خالص', data: [45, 62, 75, 85, 95, 108, 120, 135, 148, 160, 175, 195] }],
        chart: { type: 'line', height: 300 },
        xaxis: { categories: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] },
        colors: ['#8b5cf6']
    }).render();
}

function renderTopProducts() {
    const tbody = document.querySelector('#topProductsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = dashboardData.topProducts.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.sales} عدد</td>
            <td>${p.amount.toLocaleString()} تومان</td>
        </tr>
    `).join('');
    
    $('#topProductsTable').DataTable({
        language: { url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/fa.json" },
        pageLength: 5
    });
}

function renderLatestTables() {
    const salesTbody = document.querySelector('#latestSalesTable tbody');
    if (salesTbody) {
        salesTbody.innerHTML = dashboardData.latestSales.map(s => `
            <tr><td>${s.id}</td><td>${s.customer}</td><td>${s.amount.toLocaleString()} تومان</td><td>${s.date}</td></tr>
        `).join('');
    }
    
    const purchasesTbody = document.querySelector('#latestPurchasesTable tbody');
    if (purchasesTbody) {
        purchasesTbody.innerHTML = dashboardData.latestPurchases.map(p => `
            <tr><td>${p.id}</td><td>${p.supplier}</td><td>${p.amount.toLocaleString()} تومان</td><td>${p.date}</td></tr>
        `).join('');
    }
}

// نمونه fetch برای اتصال به API واقعی
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        return data;
    } catch (error) {
        console.log('Using mock data');
        return dashboardData.stats;
    }
}