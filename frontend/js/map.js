// Mapbox Integration

const MapManager = {
    map: null,
    sourceId: 'hazards-source',

    async init() {
        if (!window.mapboxgl) {
            console.error('Mapbox GL JS not loaded');
            return;
        }

        mapboxgl.accessToken = API_CONFIG.MAPBOX_TOKEN;

        // Default to India coordinates
        const defaultCenter = [78.9629, 20.5937];
        const defaultZoom = 4;

        try {
            this.map = new mapboxgl.Map({
                container: 'map-container',
                style: 'mapbox://styles/mapbox/dark-v11',
                center: defaultCenter,
                zoom: defaultZoom
            });

            this.map.on('load', () => {
                this.setupMapLayers();
                this.loadMapData();
                this.setupControls();
                this.setupInteractions();
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

    setupMapLayers() {
        // Add a new source from our GeoJSON data and set the
        // 'cluster' option to true. GL-JS will add the point_count property to your source data.
        this.map.addSource(this.sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50   // Radius of each cluster when clustering points (defaults to 50)
        });

        // 1. Clusters Layer (The Colored Dots)
        this.map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: this.sourceId,
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#10b981', // Green (Low density, < 3 reports)
                    3,
                    '#f59e0b', // Yellow (Medium density, 3-7 reports)
                    8,
                    '#ef4444'  // Red (High density, >= 8 reports)
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20, // Radius for low
                    3,
                    30, // Radius for medium
                    8,
                    40  // Radius for high
                ],
                // Add a slight glow/stroke
                'circle-stroke-width': 2,
                'circle-stroke-color': 'rgba(255,255,255,0.3)'
            }
        });

        // 2. Cluster Count Text Layer
        this.map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: this.sourceId,
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: {
                'text-color': '#ffffff'
            }
        });

        // 3. Unclustered Points Layer (Single Reports)
        this.map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: this.sourceId,
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#10b981', // Single points start as Green
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        });

        // --- INCOIS Alert Layers ---
        this.map.addSource('incois-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        // Add a pulsating effect or halo for INCOIS alerts to distinguish them
        this.map.addLayer({
            id: 'incois-halo',
            type: 'circle',
            source: 'incois-source',
            paint: {
                'circle-radius': 20,
                'circle-color': [
                    'match',
                    ['get', 'severity'],
                    'high', '#ef4444',
                    'medium', '#f59e0b',
                    'low', '#10b981',
                    '#3b82f6' // Default Blue
                ],
                'circle-opacity': 0.3,
                'circle-stroke-width': 0
            }
        });

        this.map.addLayer({
            id: 'incois-points',
            type: 'circle',
            source: 'incois-source',
            paint: {
                'circle-radius': 10,
                'circle-color': [
                    'match',
                    ['get', 'severity'],
                    'high', '#ef4444',
                    'medium', '#f59e0b',
                    'low', '#10b981',
                    '#3b82f6' // Default
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    },

    setupControls() {
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const heatmapBtn = document.getElementById('toggle-heatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => {
                const visibility = this.map.getLayoutProperty('clusters', 'visibility');
                const newState = (visibility === 'visible' || visibility === undefined) ? 'none' : 'visible';

                // Toggle User Reports
                this.map.setLayoutProperty('clusters', 'visibility', newState);
                this.map.setLayoutProperty('cluster-count', 'visibility', newState);
                this.map.setLayoutProperty('unclustered-point', 'visibility', newState);

                // Keep INCOIS always visible or toggle? Let's keep them visible as they are critical.
                // But if user wants a clean map, maybe toggle them too. Let's toggle everything for "Map Only" mode.
                this.map.setLayoutProperty('incois-points', 'visibility', newState);
                this.map.setLayoutProperty('incois-halo', 'visibility', newState);

                if (newState === 'none') {
                    heatmapBtn.classList.add('active');
                } else {
                    heatmapBtn.classList.remove('active');
                }
            });
        }
    },

    setupInteractions() {
        // inspect a cluster on click
        this.map.on('click', 'clusters', (e) => {
            const features = this.map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });
            const clusterId = features[0].properties.cluster_id;
            this.map.getSource(this.sourceId).getClusterExpansionZoom(
                clusterId,
                (err, zoom) => {
                    if (err) return;
                    this.map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });

        // Show popup for unclustered points (User Reports)
        this.map.on('click', 'unclustered-point', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;

            const hazardType = props.hazard_type || 'Hazard';
            const description = props.description || 'No description';
            const severity = props.severity || 'unknown';

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <div class="map-popup">
                        <strong style="color:var(--text-main)">${hazardType.toUpperCase()}</strong>
                        <span style="font-size:0.8rem; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.1); margin-left: 5px;">${severity}</span>
                        <p style="margin-top:5px; color:var(--text-muted)">${description}</p>
                    </div>
                `)
                .addTo(this.map);
        });

        // Show popup for INCOIS Alerts
        this.map.on('click', 'incois-points', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;

            const title = props.title || 'Alert';
            const desc = props.description || '';
            const severity = props.severity || 'info';

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <div class="map-popup" style="border-left: 3px solid ${props.color}">
                        <strong style="color:${props.color}">INCOIS: ${title}</strong>
                        <br>
                        <span style="font-size:0.75rem; color:#888;">Severity: ${severity.toUpperCase()}</span>
                        <p style="margin-top:5px; color:#333;">${desc}</p>
                    </div>
                `)
                .addTo(this.map);
        });

        // Cursor logic
        const layers = ['clusters', 'unclustered-point', 'incois-points'];
        layers.forEach(layer => {
            this.map.on('mouseenter', layer, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', layer, () => {
                this.map.getCanvas().style.cursor = '';
            });
        });
    },

    async loadMapData() {
        if (!this.map) return;

        try {
            // Fetch Global Data
            const data = await ApiClient.getMapData(90, -90, 180, -180);

            // 1. Process User Reports
            const features = data.markers.map(m => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [m.longitude, m.latitude]
                },
                properties: {
                    id: m.id,
                    hazard_type: m.hazard_type,
                    severity: m.severity,
                    description: m.description,
                    verified: m.verified
                }
            }));

            const geoJsonData = {
                type: 'FeatureCollection',
                features: features
            };

            const source = this.map.getSource(this.sourceId);
            if (source) {
                source.setData(geoJsonData);
            }

            // 2. Process INCOIS Alerts
            // Use real data if available and has coords, otherwise use Demo Data
            let incoisFeatures = [];

            if (data.alerts && data.alerts.length > 0) {
                incoisFeatures = data.alerts.map(a => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [a.longitude, a.latitude]
                    },
                    properties: {
                        title: a.hazard_type,
                        severity: a.severity,
                        description: a.description || 'INCOIS Alert',
                        color: a.severity === 'high' ? '#ef4444' : (a.severity === 'medium' ? '#f59e0b' : '#10b981')
                    }
                }));
            }

            // If no features found (or no coords), use Demo Data for visualization
            if (incoisFeatures.length === 0) {
                const demoAlerts = [
                    {
                        coords: [80.2707, 13.0827], // Chennai
                        props: {
                            title: 'Tsunami Warning',
                            severity: 'high',
                            description: 'High possibility of tsunami waves near Chennai coast.',
                            color: '#ef4444'
                        }
                    },
                    {
                        coords: [72.8777, 19.0760], // Mumbai
                        props: {
                            title: 'High Tide Alert',
                            severity: 'medium',
                            description: 'Unusual high tides expected near Gateway of India.',
                            color: '#f59e0b'
                        }
                    }
                ];

                incoisFeatures = demoAlerts.map(a => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: a.coords
                    },
                    properties: a.props
                }));
            }

            const incoisSource = this.map.getSource('incois-source');
            if (incoisSource) {
                incoisSource.setData({
                    type: 'FeatureCollection',
                    features: incoisFeatures
                });
            }

        } catch (error) {
            console.error('Failed to load map data:', error);
        }
    }
};


window.MapManager = MapManager;
