// API Configuration
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : '/api',
    MAPBOX_TOKEN: 'YOUR_MAPBOX_TOKEN_HERE', // Replace with actual token
    DEFAULT_LANGUAGE: 'en',
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    REFRESH_INTERVAL: 30000, // 30 seconds
};

// Hazard type icons
const HAZARD_ICONS = {
    tsunami: '🌊',
    cyclone: '🌀',
    high_tide: '🌊'
};

// Severity colors for map markers
const SEVERITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
};

// Export configuration
window.API_CONFIG = API_CONFIG;
window.HAZARD_ICONS = HAZARD_ICONS;
window.SEVERITY_COLORS = SEVERITY_COLORS;
