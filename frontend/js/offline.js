// Offline & Network Status Manager - with IndexedDB
const OfflineManager = {
    dbName: 'OceanHazardDB',
    storeName: 'offlineReports',
    dbVersion: 1,
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
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
                // Try sync on init if online
                if (navigator.onLine) this.syncPendingReports();
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
            if (this.db) this.syncPendingReports();
        } else {
            this.statusElement.classList.remove('online');
            this.statusElement.classList.add('offline');
            this.statusText.textContent = 'Offline';
        }
    },

    async saveReportOffline(formData) {
        if (!this.db) await this.openDB();

        // Convert FormData to simple Object + Base64 Image
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                data['image_file'] = value; // Store blob directly in IDB
            } else {
                data[key] = value;
            }
        }
        data.timestamp = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                console.log('Report saved to IndexedDB');
                resolve({ success: true, offline: true });
            };

            request.onerror = (e) => {
                console.error('Error saving offline:', e.target.error);
                reject({ success: false, error: e.target.error });
            };
        });
    },

    async syncPendingReports() {
        if (!this.db) await this.openDB();

        // 1. Get all pending items
        const getAllRequest = this.db.transaction(this.storeName).objectStore(this.storeName).getAll();

        getAllRequest.onsuccess = async (event) => {
            const reports = event.target.result;
            if (!reports || reports.length === 0) return;

            console.log(`Syncing ${reports.length} pending reports...`);
            this.statusText.textContent = `Syncing (${reports.length})...`;

            for (const report of reports) {
                try {
                    await this.uploadSingleReport(report);
                    // On success, delete from DB
                    this.deleteReport(report.id);
                } catch (err) {
                    console.error('Sync failed for report', report.id, err);
                    // Keep in DB to retry later
                }
            }

            this.statusText.textContent = 'Online - Synced';
            // Trigger refresh if needed
            if (window.App && window.App.loadDashboard) window.App.loadDashboard();
        };
    },

    deleteReport(id) {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        tx.objectStore(this.storeName).delete(id);
    },

    uploadSingleReport(report) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            // Need to convert blob back to base64 for the specific API endpoint 
            // OR use multipart if I change backend. 
            // The User's previous request implemented:
            // class OfflinePostSync(BaseModel):
            //     image_base64: str

            const file = report.image_file;
            if (!file) {
                // Should not happen, but if so just reject
                return reject("No image file");
            }

            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = reader.result.split(',')[1]; // Remove data:image/xxx;base64, prefix

                const payload = {
                    user_id: report.user_id,
                    hazard_type: report.hazard_type,
                    severity: report.severity,
                    description: report.description,
                    latitude: parseFloat(report.latitude),
                    longitude: parseFloat(report.longitude),
                    location_name: report.location_name,
                    image_base64: base64String,
                    timestamp: report.timestamp
                };

                try {
                    // Use the configured API URL
                    const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : 'http://localhost:8000/api';
                    const url = `${baseUrl}/offline/sync`;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Sync error details:', response.status, errorText);
                        throw new Error(`Server error: ${response.status} - ${errorText}`);
                    }
                    const json = await response.json();
                    if (!json.success) {
                        throw new Error(json.message || 'Sync reported failure');
                    }
                    console.log('Synced report:', json);
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
        });
    }
};

window.OfflineManager = OfflineManager;
