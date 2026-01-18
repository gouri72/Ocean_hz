// Main Application Logic

const App = {
    async init() {
        console.log('Initializing Ocean Hazard App...');

        // Initialize modules
        OfflineManager.init();
        await TranslationManager.init();

        // Refresh dashboard content on language change
        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.addEventListener('change', () => this.loadDashboard());
        }

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

                // Load SOS Reports
                this.loadSOSReports();

                // Load Safety Alerts (Places to Avoid)
                this.loadSafetyAlerts();
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
            let statusText = TranslationManager.get('pending_verification') || 'Pending Verification';
            let statusClass = 'pending';
            let statusColor = 'var(--warning)';

            if (post.verified) {
                statusText = TranslationManager.get('verified') || 'Verified';
                statusClass = 'verified';
                statusColor = 'var(--success)';
            }

            // Format time
            const date = new Date(post.timestamp + 'Z'); // Ensure UTC parsing
            const timeStr = date.toLocaleString();

            // Hazard Icon
            const icon = HAZARD_ICONS[post.hazard_type] || '⚠️';
            const hazardKey = post.hazard_type.toLowerCase();
            const hazardName = TranslationManager.get(hazardKey) || post.hazard_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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

    async loadSOSReports() {
        try {
            const container = document.getElementById('dashboard-sos-container');
            const section = document.getElementById('dashboard-sos-section');
            if (!container || !section) return;

            const response = await fetch(`${API_CONFIG.BASE_URL}/sos/reports?active_only=true`);
            const reports = await response.json();

            // Hardcoded Translations
            const currentLang = document.getElementById('language-select').value || 'en';

            const TR = {
                en: {
                    sos_alert: '🆘 SOS ALERT',
                    team_deployed: '🚁 RESCUE TEAM DEPLOYED',
                    status_prefix: 'Status:',
                    on_way: 'is on the way/on scene.',
                    reported: 'Reported',
                    location: 'Location:',
                    types: {
                        stranded: 'STRANDED',
                        drowning: 'DROWNING',
                        boat_accident: 'BOAT ACCIDENT',
                        medical: 'MEDICAL EMERGENCY'
                    }
                },
                hi: {
                    sos_alert: '🆘 एस.ओ.एस अलर्ट',
                    team_deployed: '🚁 बचाव दल तैनात',
                    status_prefix: 'स्थिति:',
                    on_way: 'रास्ते में है / घटनास्थल पर है।',
                    reported: 'रिपोर्ट किया गया',
                    location: 'स्थान:',
                    types: {
                        stranded: 'फंसे हुए',
                        drowning: 'डूबना',
                        boat_accident: 'नाव दुर्घटना',
                        medical: 'चिकित्सा आपात स्थिति'
                    }
                },
                kn: {
                    sos_alert: '🆘 SOS ಎಚ್ಚರಿಕೆ',
                    team_deployed: '🚁 ರಕ್ಷಣಾ ತಂಡ ನಿಯೋಜಿಸಲಾಗಿದೆ',
                    status_prefix: 'ಸ್ಥಿತಿ:',
                    on_way: 'ಮಾರ್ಗದಲ್ಲಿದ್ದಾರೆ / ಸ್ಥಳದಲ್ಲಿದ್ದಾರೆ.',
                    reported: 'ವರದಿ ಮಾಡಲಾಗಿದೆ',
                    location: 'ಸ್ಥಳ:',
                    types: {
                        stranded: 'ಸಿಕ್ಕಿಹಾಕಿಕೊಂಡಿದ್ದಾರೆ',
                        drowning: 'ಮುಳುಗುತ್ತಿದ್ದಾರೆ',
                        boat_accident: 'ದೋಣಿ ಅಪಘಾತ',
                        medical: 'ವೈದ್ಯಕೀಯ ತುರ್ತು'
                    }
                }
            };

            const t = TR[currentLang] || TR['en'];

            if (reports.length > 0) {
                // Update header translation dynamically if needed
                const header = section.querySelector('h2.section-title');
                if (header) {
                    const TR_HEADER = {
                        en: '🚨 Active Rescue Operations',
                        hi: '🚨 सक्रिय बचाव अभियान',
                        kn: '🚨 ಸಕ್ರಿಯ ರಕ್ಷಣಾ ಕಾರ್ಯಾಚರಣೆಗಳು'
                    };
                    header.textContent = TR_HEADER[currentLang] || TR_HEADER['en'];
                }

                section.style.display = 'block';
                container.innerHTML = '';

                reports.forEach(sos => {
                    const card = document.createElement('div');
                    card.className = 'post-card';
                    // Styling for emergency card
                    card.style.borderLeft = sos.deployed ? '5px solid var(--success)' : '5px solid var(--error)';
                    card.style.background = sos.deployed ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)';

                    const timeAgo = this.getTimeAgo(new Date(sos.timestamp + 'Z'));

                    // Translate Type
                    const rawType = sos.emergency_type.toLowerCase();
                    const translatedType = t.types[rawType] || sos.emergency_type.toUpperCase().replace('_', ' ');

                    card.innerHTML = `
                        <div class="post-content" style="width:100%">
                            <div class="post-header">
                                <span class="post-type" style="color: var(--error)">
                                    🚨 ${translatedType}
                                </span>
                                <span class="post-verified" style="background: ${sos.deployed ? 'var(--success)' : 'var(--error)'}; color: white; border:none;">
                                    ${sos.deployed ? t.team_deployed : t.sos_alert}
                                </span>
                            </div>
                            
                            <p class="post-description">
                                <strong>${t.location}</strong> ${sos.location_name || 'Coordinates provided'} <br>
                                ${sos.description ? `<br><i>"${sos.description}"</i>` : ''}
                            </p>

                            ${sos.deployed ? `
                                <div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.1); border-radius:6px; font-size: 0.9rem;">
                                    <strong>${t.status_prefix}</strong> ${sos.deployed_by} ${t.on_way}<br>
                                    <small>${t.team_deployed} ${timeAgo}</small>
                                </div>
                            ` : `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">${t.reported} ${timeAgo}</div>`}
                        </div>
                    `;
                    container.appendChild(card);
                });
            } else {
                section.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading SOS reports:', error);
        }
    },

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return TranslationManager.get('just_now') || 'Just now';

        const minutes = Math.floor(seconds / 60);
        const minStr = TranslationManager.get('min_ago') || 'm ago';
        if (minutes < 60) return `${minutes}${minStr}`;

        const hours = Math.floor(minutes / 60);
        const hrStr = TranslationManager.get('hr_ago') || 'h ago';
        if (hours < 24) return `${hours}${hrStr}`;

        const dayStr = TranslationManager.get('day_ago') || 'd ago';
        return `${Math.floor(hours / 24)}${dayStr}`;
    },

    renderIncoisAlerts(alerts) {
        // ... (existing code) ...
    },

    async loadSafetyAlerts() {
        try {
            const container = document.getElementById('safety-alerts-container');
            const section = document.getElementById('safety-alerts-section');
            if (!container || !section) return;

            const response = await fetch(`${API_CONFIG.BASE_URL}/safety-alerts`);
            const alerts = await response.json();

            if (alerts.length > 0) {
                // Translation Dictionary for Guidelines
                const GUIDELINES = {
                    en: {
                        tsunami: "⚠️ Move to higher ground immediately. Do not stay near the coast.",
                        cyclone: "⚠️ Stay indoors. Secure windows and doors. Avoid coastal areas.",
                        high_tide: "⚠️ Do not enter the water. High waves expected."
                    },
                    hi: {
                        tsunami: "⚠️ तुरंत ऊंचे स्थान पर जाएं। तट के पास न रहें।",
                        cyclone: "⚠️ घर के अंदर रहें। खिड़कियां और दरवाजे बंद रखें। तटीय क्षेत्रों से बचें।",
                        high_tide: "⚠️ पानी में प्रवेश न करें। ऊंची लहरों की आशंका है।"
                    },
                    kn: {
                        tsunami: "⚠️ ತಕ್ಷಣ ಎತ್ತರದ ಪ್ರದೇಶಕ್ಕೆ ಹೋಗಿ. ಕರಾವಳಿ ಹತ್ತಿರ ಇರಬೇಡಿ.",
                        cyclone: "⚠️ ಮನೆಯೊಳಗೆ ಇರಿ. ಕಿಟಕಿಗಳು ಮತ್ತು ಬಾಗಿಲುಗಳನ್ನು ಭದ್ರಪಡಿಸಿ.",
                        high_tide: "⚠️ ನೀರಿಗೆ ಇಳಿಯಬೇಡಿ. ಎತ್ತರದ ಅಲೆಗಳ ನಿರೀಕ್ಷೆಯಿದೆ."
                    }
                };

                const currentLang = document.getElementById('language-select').value || 'en';
                const langData = GUIDELINES[currentLang] || GUIDELINES['en'];

                // Update Section Header Translation
                const TR_HEADER = {
                    en: '⚠️ Places to Avoid',
                    hi: '⚠️ सुरक्षित नहीं',
                    kn: '⚠️ ಹೋಗಬಾರದು'
                };
                const header = section.querySelector('h2.section-title');
                if (header) {
                    header.textContent = TR_HEADER[currentLang] || TR_HEADER['en'];
                }

                section.style.display = 'block';
                container.innerHTML = '';

                alerts.forEach(alert => {
                    const card = document.createElement('div');
                    card.className = 'post-card'; // Reuse post card styles
                    card.style.borderLeft = '5px solid var(--error)';
                    card.style.background = 'rgba(255, 0, 0, 0.1)';
                    card.style.marginBottom = '15px';

                    const guideline = langData[alert.hazard_type] || "Caution advised.";
                    const hazardKey = alert.hazard_type.toLowerCase();
                    const hazardLabel = TranslationManager.get(hazardKey) || alert.hazard_type.toUpperCase().replace('_', ' ');

                    card.innerHTML = `
                        <div class="post-content" style="width:100%">
                            <div class="post-header">
                                <span class="post-type" style="color: var(--error)">
                                    🚫 ${alert.location_name}
                                </span>
                                <span class="post-verified" style="background: var(--error); color: white; border:none;">
                                    ${TranslationManager.get('active_hazard') || 'ACTIVE HAZARD'}
                                </span>
                            </div>
                            
                            <p class="post-description">
                                <strong>${TranslationManager.get('label_hazard') || 'Hazard:'}</strong> ${hazardLabel} <br>
                                <div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:6px; font-weight:500; font-size:1rem;">
                                    ${guideline}
                                </div>
                            </p>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">
                                ${TranslationManager.get('label_issued') || 'Issued:'} ${new Date(alert.created_at + 'Z').toLocaleString()}
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });
            } else {
                section.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading safety alerts:', error);
        }
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
