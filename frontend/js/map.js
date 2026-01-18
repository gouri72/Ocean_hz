// Mapbox Integration

const MapManager = {
    map: null,
    markers: [],

    async init() {
        if (!window.mapboxgl) {
            console.error('Mapbox GL JS not loaded');
            return;
        }

        mapboxgl.accessToken = API_CONFIG.MAPBOX_TOKEN;

        // Default to India coordinates if geolocation fails
        const defaultCenter = [78.9629, 20.5937];
        const defaultZoom = 4;

        try {
            this.map = new mapboxgl.Map({
                container: 'map-container',
                style: 'mapbox://styles/mapbox/dark-v11', // Dark theme to match UI
                center: defaultCenter,
                zoom: defaultZoom
            });

            this.map.on('load', () => {
                this.loadMapData();
                this.setupControls();
            });

            // Try to get user location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        this.map.flyTo({
                            center: [pos.coords.longitude, pos.coords.latitude],
                            zoom: 10
                        });
                    },
                    (err) => console.log('Location access denied for map centering')
                );
            }

        } catch (error) {
            console.error('Error initializing map:', error);
            document.getElementById('map-container').innerHTML =
                '<div class="error-message">Map could not be loaded. Please check API configuration.</div>';
        }
    },

    setupControls() {
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const heatmapBtn = document.getElementById('toggle-heatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => {
                // Future implementation: toggle heatmap layer
                alert('Heatmap toggle: Feature enabled for next release');
            });
        }
    },

    async loadMapData() {
        if (!this.map) return;

        try {
            // Get current bounds
            const bounds = this.map.getBounds();
            const data = await ApiClient.getMapData(
                bounds.getNorth(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getWest()
            );

            // Access correct field 'markers' instead of 'points'
            this.updateMarkers(data.markers);

            // Heatmap logic would use data.heatmap_data

        } catch (error) {
            console.error('Failed to load map data:', error);
        }
    },

    updateMarkers(points) {
        // Clear existing markers
        this.markers.forEach(m => m.remove());
        this.markers = [];

        if (!points) return;

        points.forEach(point => {
            const el = document.createElement('div');
            el.className = 'map-marker';
            // Simple styling for marker
            el.style.backgroundColor = SEVERITY_COLORS[point.severity] || SEVERITY_COLORS.medium;
            el.style.width = '15px';
            el.style.height = '15px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';

            // Create popup
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div class="map-popup">
                    <h3>${HAZARD_ICONS[point.hazard_type] || '⚠️'} ${point.hazard_type.replace('_', ' ').toUpperCase()}</h3>
                    <p>${point.description || 'No description'}</p>
                    <small>Confidence: ${(point.confidence * 100).toFixed(0)}%</small>
                </div>
            `);

            const marker = new mapboxgl.Marker(el)
                .setLngLat([point.longitude, point.latitude])
                .setPopup(popup)
                .addTo(this.map);

            this.markers.push(marker);
        });
    }
};

window.MapManager = MapManager;
