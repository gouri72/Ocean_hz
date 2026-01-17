// API Client for Ocean Hazard System

const ApiClient = {
    // Helper for fetch requests
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request Failed: ${endpoint}`, error);
            throw error;
        }
    },

    // --- Dashboard ---
    async getDashboardStats() {
        return this.request('/dashboard');
    },

    // --- Reports ---
    async submitReport(formData) {
        return this.request('/posts', {
            method: 'POST',
            body: formData // FormData handles boundary automatically
        });
    },

    async getRecentPosts(limit = 10) {
        return this.request('/posts?limit=' + limit);
    },

    // --- Map Data ---
    async getMapData(north, south, east, west) {
        return this.request(`/map/data?n=${north}&s=${south}&e=${east}&w=${west}`);
    },

    // --- INCOIS ---
    async getIncoisAlerts() {
        // Fetch active alerts from backend which syncs with INCOIS
        return this.request('/map/data').then(data => data.alerts || []);
    },

    // --- Translation ---
    async getTranslations(langCode) {
        return this.request(`/ui-translations/${langCode}`);
    },

    // --- Guidelines ---
    async getGuidelines(hazardType) {
        return this.request(`/guidelines/${hazardType}`);
    },

    // --- User ---
    async createUser(deviceId, fcmToken = null) {
        return this.request('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: deviceId, fcm_token: fcmToken })
        });
    }
};

window.ApiClient = ApiClient;
