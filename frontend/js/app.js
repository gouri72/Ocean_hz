// Main Application Logic

const App = {
    async init() {
        console.log('Initializing Ocean Hazard App...');

        // Initialize modules
        OfflineManager.init();
        await TranslationManager.init();

        // Navigation Logic
        this.setupNavigation();

        // Dashboard Stats
        this.loadDashboard();

        // Report Form
        this.setupReportForm();

        // Map (Lazy load when needed, or init now if on map view)
        // For now, simple init
        MapManager.init();

        // Remove loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContainer = document.getElementById('app');

            if (loadingScreen) loadingScreen.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
        }, 1000); // Small delay to show animation
    },

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update buttons
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show view
                const viewName = btn.dataset.view;
                this.showView(viewName);
            });
        });
    },

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        // Show selected
        const view = document.getElementById(`${viewName}-view`);
        if (view) view.classList.add('active');

        // Logic for specific views
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
                document.getElementById('stat-verified').textContent = stats.verified_count || 0;
                document.getElementById('stat-pending').textContent = stats.pending_count || 0;
                document.getElementById('stat-total').textContent = stats.total_count || 0;
            }
        } catch (error) {
            console.warn('Could not load dashboard stats', error);
        }
    },

    setupReportForm() {
        const form = document.getElementById('report-form');
        const fileInput = document.getElementById('image-input');
        const captureBtn = document.getElementById('capture-btn');
        const removeImageBtn = document.getElementById('remove-image');

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

        // Location Detection
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    document.getElementById('latitude').value = pos.coords.latitude;
                    document.getElementById('longitude').value = pos.coords.longitude;
                    document.querySelector('.location-text').textContent =
                        `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                },
                (err) => {
                    document.querySelector('.location-text').textContent = 'Location access denied';
                }
            );
        }

        // Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const formData = new FormData(form);

                if (navigator.onLine) {
                    const result = await ApiClient.submitReport(formData);
                    this.showToast('Report submitted successfully!', 'success');
                } else {
                    await OfflineManager.saveReportOffline(formData);
                    this.showToast('Saved offline. Will sync when online.', 'info');
                }

                // Reset form
                form.reset();
                removeImageBtn.click(); // Reset image view
                this.showView('dashboard');

            } catch (error) {
                console.error('Submission error:', error);
                this.showToast('Failed to submit report. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        });

        // Monitor form changes to enable submit button
        form.addEventListener('change', () => this.checkFormValidity());
    },

    checkFormValidity() {
        const form = document.getElementById('report-form');
        const submitBtn = document.getElementById('submit-btn');
        const hasImage = document.getElementById('image-input').files.length > 0;

        // Simple validation: check if form is valid and image exists
        if (form.checkValidity() && hasImage) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
