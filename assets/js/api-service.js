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
};
