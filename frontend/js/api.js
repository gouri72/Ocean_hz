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

    // --- SOS ---
    async createSOSReport(data) {
        return this.request('/sos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    // --- Map Data ---
    async getMapData(north, south, east, west) {
        return this.request(`/map/data?n=${north}&s=${south}&e=${east}&w=${west}`);
    },

    // --- Reverse Geocoding (Added for Location Name) ---
    async getPlaceName(lat, lng) {
        try {
            const token = API_CONFIG.MAPBOX_TOKEN;
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,district,region&limit=1&access_token=${token}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                return data.features[0].place_name;
            }
            return null;
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return null;
        }
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
    async createUser(userId, langPref = 'en') {
        return this.request('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                language_preference: langPref
            })
        });
    }
};

window.ApiClient = ApiClient;
