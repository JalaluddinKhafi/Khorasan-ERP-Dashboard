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