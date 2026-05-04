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