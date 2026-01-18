// Main Application Logic

const App = {
    async init() {
        console.log('Initializing Ocean Hazard App...');

        // Initialize modules
        OfflineManager.init();
        await TranslationManager.init();

        // Ensure user is registered to prevent FK errors
        this.ensureUserExists();

        // Navigation Logic
        this.setupNavigation();

        // Dashboard Stats
        this.loadDashboard();

        // Report Form
        this.setupReportForm();

        // Map (Lazy load when needed, or init now if on map view)
        MapManager.init();

        // Auto-refresh dashboard every 10 seconds
        setInterval(() => {
            if (document.getElementById('dashboard-view').classList.contains('active')) {
                this.loadDashboard();
            }
        }, 10000);

        // Remove loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContainer = document.getElementById('app');

            if (loadingScreen) loadingScreen.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
        }, 1000);
    },

    async ensureUserExists() {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_id', userId);
        }

        // Try to register user silently
        try {
            await ApiClient.createUser(userId);
            console.log('User registered/verified:', userId);
        } catch (err) {
            // Ignore error if user already exists (400 or similar)
            console.log('User registration check:', err.message);
        }
        return userId;
    },

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showView(btn.dataset.view);
            });
        });
    },

    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(`${viewName}-view`);
        if (view) view.classList.add('active');

        if (viewName === 'map') {
            if (MapManager.map) MapManager.map.resize();
        } else if (viewName === 'dashboard') {
            this.loadDashboard();
        }
    },

    async loadDashboard() {
        try {
            const stats = await ApiClient.getDashboardStats();
            if (stats) {
                // Update Counters (using correct API field names)
                document.getElementById('stat-verified').textContent = stats.verified_posts || 0;
                document.getElementById('stat-pending').textContent = stats.pending_posts || 0;
                document.getElementById('stat-total').textContent = stats.total_posts || 0;

                // Render Posts (Recent Reports)
                if (stats.posts) {
                    this.renderPosts(stats.posts);
                }

                // Render INCOIS Alerts
                if (stats.incois_alerts) {
                    this.renderIncoisAlerts(stats.incois_alerts);
                }
            }
        } catch (error) {
            console.warn('Could not load dashboard stats', error);
        }
    },

    renderPosts(posts) {
        const container = document.getElementById('posts-container');
        if (!container) return;

        container.innerHTML = '';

        if (!posts || posts.length === 0) {
            container.innerHTML = '<p class="text-center" style="color:var(--text-muted); padding: 20px;">No reports yet.</p>';
            return;
        }

        const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');

        posts.forEach(post => {
            const isPending = !post.verified;
            // Status text/color
            let statusText = 'Pending Verification';
            let statusClass = 'pending';
            let statusColor = 'var(--warning)';

            if (post.verified) {
                statusText = 'Verified';
                statusClass = 'verified';
                statusColor = 'var(--success)';
            }

            // Format time
            const date = new Date(post.timestamp + 'Z'); // Ensure UTC parsing
            const timeStr = date.toLocaleString();

            // Hazard Icon
            const icon = HAZARD_ICONS[post.hazard_type] || '⚠️';
            const hazardName = post.hazard_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            const card = document.createElement('div');
            card.className = 'post-card';

            // Construct Image URL
            const imageUrl = post.watermarked_image_path ? `${baseUrl}/${post.watermarked_image_path}` : '';

            card.innerHTML = `
                <img src="${imageUrl}" class="post-image" alt="${hazardName}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Image+Error'">
                <div class="post-content">
                    <div class="post-header">
                        <span class="post-type">
                            ${icon} ${hazardName}
                        </span>
                        <span class="post-verified" style="background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}">
                            ${statusText}
                        </span>
                    </div>
                    <p class="post-description">${post.description || 'No description provided.'}</p>
                    <div class="post-footer">
                        <div class="post-location">
                            <span>📍</span> ${post.location_name || `${post.latitude.toFixed(4)}, ${post.longitude.toFixed(4)}`}
                        </div>
                    </div>
                     <div class="post-footer" style="padding-top: 5px; border:none; font-size: 0.8rem; color: var(--text-muted)">
                         ${timeStr}
                        ${post.ai_confidence ? `<span title="AI Confidence">🤖 ${(post.ai_confidence * 100).toFixed(0)}%</span>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    renderIncoisAlerts(alerts) {
        const container = document.getElementById('incois-alerts-container');
        if (!container) return;

        container.innerHTML = '';

        if (!alerts || alerts.length === 0) {
            container.innerHTML = '<p class="text-center" style="color:var(--text-muted); font-size: 0.9rem;">No active INCOIS alerts.</p>';
            return;
        }

        alerts.forEach(alert => {
            const card = document.createElement('div');
            card.className = 'alert-card';

            // Severity Class
            const severity = alert.severity.toLowerCase();

            card.innerHTML = `
                <div class="alert-header">
                    <div class="alert-title">⚠️ ${alert.title}</div>
                    <span class="alert-severity ${severity}">${alert.severity}</span>
                </div>
                <p class="alert-description">${alert.description}</p>
                <div class="alert-meta">
                    <span>📍 ${alert.affected_area}</span>
                    <span>🕒 Issued: ${new Date(alert.issued_at + 'Z').toLocaleDateString()}</span>
                </div>
             `;
            container.appendChild(card);
        });
    },

    setupReportForm() {
        const form = document.getElementById('report-form');
        const fileInput = document.getElementById('image-input');
        const captureBtn = document.getElementById('capture-btn');
        const removeImageBtn = document.getElementById('remove-image');
        const retryLocationBtn = document.getElementById('retry-location-btn');

        // Image Handling
        captureBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('preview-img').src = ev.target.result;
                    document.getElementById('image-preview').style.display = 'block';
                    document.getElementById('upload-placeholder').style.display = 'none';
                    this.checkFormValidity();
                };
                reader.readAsDataURL(file);
            }
        });

        removeImageBtn.addEventListener('click', () => {
            fileInput.value = '';
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('upload-placeholder').style.display = 'block';
            this.checkFormValidity();
        });

        // Triple-Redundancy Location System
        const requestLocation = async (method = 'gps') => {
            const statusText = document.getElementById('location-status-text');

            // 1. IP Fallback Logic
            const useIPFallback = async () => {
                statusText.textContent = 'Using IP Location (Fallback)...';
                statusText.style.color = '#f59e0b';

                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();

                    if (data.latitude && data.longitude) {
                        updateLocationUI(data.latitude, data.longitude, `${data.city}, ${data.region_code}, ${data.country_name}`);
                        console.log('Location Found via IP:', data);
                    } else {
                        throw new Error('IP Location failed');
                    }
                } catch (err) {
                    console.error('IP Fallback failed:', err);
                    statusText.textContent = 'Location Failed. Ensure GPS is on.';
                    statusText.style.color = '#ef4444';
                }
            };

            // Helper to update UI
            const updateLocationUI = (lat, lng, name = null) => {
                document.getElementById('latitude').value = lat;
                document.getElementById('longitude').value = lng;
                statusText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                statusText.style.color = '#10b981';

                if (name) {
                    document.getElementById('location-name').value = name;
                    statusText.textContent = `📍 ${name}`;
                } else {
                    ApiClient.getPlaceName(lat, lng).then(place => {
                        if (place) {
                            document.getElementById('location-name').value = place;
                            statusText.textContent = `📍 ${place}`;
                        } else {
                            document.getElementById('location-name').value = "Unknown Location";
                        }
                    });
                }
                this.checkFormValidity();
            };

            // 2. GPS Logic
            if (method === 'gps') {
                statusText.textContent = 'Locating (GPS)...';
                statusText.style.color = '#f59e0b';

                if (!navigator.geolocation) {
                    useIPFallback();
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => updateLocationUI(pos.coords.latitude, pos.coords.longitude),
                    (err) => {
                        console.warn('GPS Failed, trying IP fallback...', err);
                        useIPFallback();
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else {
                useIPFallback();
            }
        };

        retryLocationBtn.addEventListener('click', () => requestLocation('gps'));

        // Trigger immediately
        requestLocation('gps');

        // Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');

            // 1. Ensure user exists before sending report
            const userId = await this.ensureUserExists();

            // 2. Prepare Data
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

            try {
                const formData = new FormData(form);
                formData.append('user_id', userId);
                formData.set('synced', 'true');

                // Debug: Log data
                for (var pair of formData.entries()) {
                    console.log(pair[0] + ', ' + pair[1]);
                }

                if (navigator.onLine) {
                    const result = await ApiClient.submitReport(formData);
                    this.showToast(result.message || 'Report submitted successfully!', result.rejected ? 'error' : 'success');
                } else {
                    await OfflineManager.saveReportOffline(formData);
                    this.showToast('Saved offline. Will sync when online.', 'info');
                }

                // Reset
                form.reset();
                removeImageBtn.click();
                this.showView('dashboard');
                // Re-detect location
                requestLocation('gps');

            } catch (error) {
                console.error('Submission error:', error);
                this.showToast('Submission Error: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        });

        // Monitor form changes
        form.addEventListener('change', () => this.checkFormValidity());
        form.addEventListener('input', () => this.checkFormValidity());
    },

    checkFormValidity() {
        const form = document.getElementById('report-form');
        const submitBtn = document.getElementById('submit-btn');
        const hasImage = document.getElementById('image-input').files.length > 0;

        const lat = document.getElementById('latitude').value;
        const lng = document.getElementById('longitude').value;
        const hasLocation = lat && lng && lat !== "" && lng !== "";

        if (form.checkValidity() && hasImage && hasLocation) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${type.toUpperCase()}</div>
            <div class="toast-message">${icon} ${message}</div>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
