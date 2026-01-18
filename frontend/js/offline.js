// Offline & Network Status Manager - with IndexedDB
const OfflineManager = {
    dbName: 'OceanHazardDB',
    dbVersion: 2,
    db: null,

    init() {
        this.statusElement = document.getElementById('network-status');
        this.statusText = document.querySelector('.status-text');

        window.addEventListener('online', () => this.updateStatus(true));
        window.addEventListener('offline', () => this.updateStatus(false));

        // Open Database
        this.openDB();

        // Initial check
        this.updateStatus(navigator.onLine);
    },

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Store for Hazard Posts
                if (!db.objectStoreNames.contains('offlineReports')) {
                    db.createObjectStore('offlineReports', { keyPath: 'id', autoIncrement: true });
                }
                // Store for SOS Reports (New)
                if (!db.objectStoreNames.contains('offlineSOS')) {
                    db.createObjectStore('offlineSOS', { keyPath: 'id', autoIncrement: true });
                }
                // Store for API Cache (New)
                if (!db.objectStoreNames.contains('apiCache')) {
                    db.createObjectStore('apiCache', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
                // Try sync on init if online
                if (navigator.onLine) {
                    this.syncPendingReports();
                    this.syncPendingSOS();
                }
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    updateStatus(isOnline) {
        if (!this.statusElement) return;

        if (isOnline) {
            this.statusElement.classList.remove('offline');
            this.statusElement.classList.add('online');
            this.statusText.textContent = 'Online';
            if (this.db) {
                this.syncPendingReports();
                this.syncPendingSOS();
            }
        } else {
            this.statusElement.classList.remove('online');
            this.statusElement.classList.add('offline');
            this.statusText.textContent = 'Offline';
        }
    },

    // --- Caching Logic (For viewing offline) ---
    async cacheData(key, data) {
        if (!this.db) await this.openDB();
        return new Promise((resolve) => {
            const tx = this.db.transaction(['apiCache'], 'readwrite');
            tx.objectStore('apiCache').put({ key: key, data: data, timestamp: Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    },

    async getCachedData(key) {
        if (!this.db) await this.openDB();
        return new Promise((resolve) => {
            const tx = this.db.transaction(['apiCache'], 'readonly');
            const req = tx.objectStore('apiCache').get(key);
            req.onsuccess = () => resolve(req.result ? req.result.data : null);
            req.onerror = () => resolve(null);
        });
    },

    // --- Hazard Reports Logic ---
    async saveReportOffline(formData) {
        if (!this.db) await this.openDB();

        const data = {};
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                data['image_file'] = value;
            } else {
                data[key] = value;
            }
        }
        data.timestamp = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['offlineReports'], 'readwrite');
            const req = tx.objectStore('offlineReports').add(data);
            req.onsuccess = () => resolve({ success: true, offline: true });
            req.onerror = (e) => reject({ success: false, error: e.target.error });
        });
    },

    async syncPendingReports() {
        if (!this.db) await this.openDB();

        try {
            const tx = this.db.transaction('offlineReports', 'readonly');
            const req = tx.objectStore('offlineReports').getAll();

            req.onsuccess = async (event) => {
                const reports = event.target.result;
                if (!reports || reports.length === 0) return;

                if (this.statusText) this.statusText.textContent = `Syncing (${reports.length})...`;

                for (const report of reports) {
                    try {
                        await this.uploadSingleReport(report);
                        this.deleteItem('offlineReports', report.id);
                    } catch (err) {
                        console.error('Sync failed for report', report.id, err);
                    }
                }
                if (this.statusText) this.statusText.textContent = 'Online - Synced';
                if (window.App && window.App.loadDashboard) window.App.loadDashboard();
            };
        } catch (e) {
            console.error("Error initiating report sync", e);
        }
    },

    uploadSingleReport(report) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const file = report.image_file;
            if (!file) {
                // Even without image, we might need to sync. But this app requires image usually.
                // If no image file object, maybe it was just data.
                // Let's try syncing without image processing if so (unlikely for this app's flow but good for robustness)
                return reject("No image file");
            }

            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = reader.result.split(',')[1];
                const payload = { ...report, image_base64: base64String };
                delete payload.image_file;
                delete payload.id; // Don't send IDB id

                try {
                    const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : '/api';
                    const response = await fetch(`${baseUrl}/offline/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error('Sync failed');
                    resolve(await response.json());
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
        });
    },

    // --- SOS Logic ---
    async saveSOSOffline(formData) {
        if (!this.db) await this.openDB();

        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
            if (value instanceof File) {
                // Skip file for SOS offline in this version or convert to base64 if needed
                // For now, assuming SOS is text-heavy.
            }
        }
        data.timestamp = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['offlineSOS'], 'readwrite');
            const req = tx.objectStore('offlineSOS').add(data);
            req.onsuccess = () => resolve({ success: true, offline: true });
            req.onerror = (e) => reject({ success: false, error: e.target.error });
        });
    },

    async syncPendingSOS() {
        if (!this.db) await this.openDB();

        try {
            const tx = this.db.transaction('offlineSOS', 'readonly');
            const req = tx.objectStore('offlineSOS').getAll();

            req.onsuccess = async (event) => {
                const items = event.target.result;
                if (!items || items.length === 0) return;

                console.log(`Syncing ${items.length} pending SOS...`);

                for (const item of items) {
                    try {
                        const formData = new FormData();
                        for (const key in item) {
                            if (key !== 'id' && key !== 'timestamp') formData.append(key, item[key]);
                        }

                        const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : '/api';
                        const res = await fetch(`${baseUrl}/sos/reports`, {
                            method: 'POST',
                            body: formData
                        });

                        if (res.ok) {
                            this.deleteItem('offlineSOS', item.id);
                        }
                    } catch (err) {
                        console.error('SOS Sync failed', item.id, err);
                    }
                }
            };
        } catch (e) {
            console.error("Error initiating SOS sync", e);
        }
    },

    deleteItem(storeName, id) {
        if (!this.db) return;
        const tx = this.db.transaction([storeName], 'readwrite');
        tx.objectStore(storeName).delete(id);
    }
};

window.OfflineManager = OfflineManager;
