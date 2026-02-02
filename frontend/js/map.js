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
                // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                // with three steps to implement three types of circles:
                //   * Green, 20px circles when point count is less than 5
                //   * Yellow, 30px circles when point count is between 5 and 10
                //   * Red, 40px circles when point count is greater than or equal to 10
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#10b981', // Green (Low density, < 5 reports)
                    5,
                    '#f59e0b', // Yellow (Medium density, 5-15 reports)
                    15,
                    '#ef4444'  // Red (High density, > 15 reports)
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20, // Radius for low
                    5,
                    30, // Radius for medium
                    15,
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
    },

    setupControls() {
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const heatmapBtn = document.getElementById('toggle-heatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => {
                const visibility = this.map.getLayoutProperty('clusters', 'visibility');
                if (visibility === 'visible' || visibility === undefined) {
                    this.map.setLayoutProperty('clusters', 'visibility', 'none');
                    this.map.setLayoutProperty('cluster-count', 'visibility', 'none');
                    this.map.setLayoutProperty('unclustered-point', 'visibility', 'none');
                    heatmapBtn.classList.add('active'); // Indicate "Off" state visually or swap icon
                } else {
                    this.map.setLayoutProperty('clusters', 'visibility', 'visible');
                    this.map.setLayoutProperty('cluster-count', 'visibility', 'visible');
                    this.map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
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

        // Show popup for unclustered points
        this.map.on('click', 'unclustered-point', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties; // This will simplify complex objects to strings if not handled

            // Retrieve descriptions
            const hazardType = props.hazard_type || 'Hazard';
            const description = props.description || 'No description';
            const severity = props.severity || 'unknown';

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <div class="map-popup">
                        <strong style="color:var(--text-main)">${hazardType.toUpperCase()}</strong>
                        <span style="font-size:0.8rem; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.1)">${severity}</span>
                        <p style="margin-top:5px; color:var(--text-muted)">${description}</p>
                    </div>
                `)
                .addTo(this.map);
        });

        // Cursor logic
        this.map.on('mouseenter', 'clusters', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'clusters', () => {
            this.map.getCanvas().style.cursor = '';
        });
        this.map.on('mouseenter', 'unclustered-point', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'unclustered-point', () => {
            this.map.getCanvas().style.cursor = '';
        });
    },

    async loadMapData() {
        if (!this.map) return;

        try {
            // Get current bounds (or fetch all for clustering global view)
            const bounds = this.map.getBounds();

            // Fetch ALL data from backend for clustering to work effectively across zoom levels
            // The existing backend endpoint supports bbox, but also returns all valid points if coords aren't restrictive
            // Ideally we need all active reports.
            // Using a wider bounding box or a specific endpoint for all points would be better.
            // For now, let's just use a very wide box or the current view.
            // A better way is to ask the API for 'all' active markers.

            // Let's rely on standard getMapData which returns 'markers'.
            // Note: If backend paginates or clips, clustering only shows what's in view.
            const data = await ApiClient.getMapData(90, -90, 180, -180); // Fetch Global

            // Convert Markers Array to GeoJSON Features
            const features = data.markers.map(m => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [m.longitude, m.latitude] // GeoJSON is [lng, lat]
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

            // Update Source
            const source = this.map.getSource(this.sourceId);
            if (source) {
                source.setData(geoJsonData);
            }

        } catch (error) {
            console.error('Failed to load map data:', error);
        }
    }
};

window.MapManager = MapManager;
