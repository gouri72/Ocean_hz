// Offline & Network Status Manager

const OfflineManager = {
    init() {
        this.statusElement = document.getElementById('network-status');
        this.statusText = document.querySelector('.status-text');

        window.addEventListener('online', () => this.updateStatus(true));
        window.addEventListener('offline', () => this.updateStatus(false));

        // Initial check
        this.updateStatus(navigator.onLine);
    },

    updateStatus(isOnline) {
        if (!this.statusElement) return;

        if (isOnline) {
            this.statusElement.classList.remove('offline');
            this.statusElement.classList.add('online');
            this.statusText.textContent = 'Online';
            this.syncPendingReports();
        } else {
            this.statusElement.classList.remove('online');
            this.statusElement.classList.add('offline');
            this.statusText.textContent = 'Offline';
        }
    },

    async saveReportOffline(formData) {
        // Simple IndexedDB logic could go here
        // For MVP, we'll store in localStorage if simple data, 
        // but FormData (images) requires IndexedDB
        console.log('Saving report offline not fully implemented yet');
        // Retrieve generic info
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') data[key] = value;
        }

        // Save metadata to localStorage
        const reports = JSON.parse(localStorage.getItem('offline_reports') || '[]');
        reports.push({
            timestamp: Date.now(),
            data: data
            // Note: Images skipped for localStorage MVP
        });
        localStorage.setItem('offline_reports', JSON.stringify(reports));

        return { success: true, offline: true, message: 'Saved offline. Will sync when online.' };
    },

    async syncPendingReports() {
        const reports = JSON.parse(localStorage.getItem('offline_reports') || '[]');
        if (reports.length === 0) return;

        console.log(`Syncing ${reports.length} pending reports...`);
        // Actual sync logic implemented later
    }
};

window.OfflineManager = OfflineManager;
