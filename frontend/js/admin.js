const AdminApp = {
    async init() {
        console.log('Initializing Admin Dashboard...');

        // check auth
        if (sessionStorage.getItem('admin_logged_in') === 'true') {
            this.showDashboard();
        }
    },

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('admin-user').value.toLowerCase().trim();
        const pass = document.getElementById('admin-pass').value;

        if (user === 'admin' && pass === 'admin123') {
            sessionStorage.setItem('admin_logged_in', 'true');
            this.showDashboard();
        } else {
            alert('Invalid Credentials');
        }
    },

    async showDashboard() {
        // Hide login, show content
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.style.display = 'none';

        const content = document.getElementById('admin-content');
        if (content) {
            content.style.filter = 'none';
            content.style.pointerEvents = 'all';
        }

        // Load Data
        await this.loadPendingPosts();
        await this.loadSensorData();
    },

    async loadPendingPosts() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/posts?limit=100`);
            const posts = await response.json();

            // Filter pending (not verified AND not rejected)
            const pending = posts.filter(p => !p.verified && !p.rejected);

            this.renderPending(pending);
        } catch (error) {
            console.error('Error loading posts:', error);
            const container = document.getElementById('pending-container');
            if (container) container.innerHTML = '<p class="text-center" style="color:var(--error)">Failed to load posts.</p>';
        }
    },

    renderPending(posts) {
        const container = document.getElementById('pending-container');
        if (!container) return;
        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<div class="card"><p style="text-align:center; color:var(--text-muted); padding:20px;">No pending reports for verification.</p></div>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'card post-card';
            card.style.marginBottom = '20px';

            const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
            const imageUrl = post.watermarked_image_path
                ? `${baseUrl}/${post.watermarked_image_path}`
                : 'https://placehold.co/600x400?text=No+Image';

            const hazardName = post.hazard_type.replace(/_/g, ' ').toUpperCase();

            card.innerHTML = `
                <div style="display:flex; gap: 20px; flex-wrap: wrap;">
                    <img src="${imageUrl}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px; background: #000;">
                    <div style="flex:1; min-width: 200px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
                            <h4 style="margin:0">${hazardName}</h4>
                            <span class="alert-severity ${post.severity}" style="font-size:0.8rem; padding: 2px 8px; border-radius: 4px;">${post.severity.toUpperCase()}</span>
                        </div>
                        <p style="margin-bottom: 10px; color: var(--text-color);">${post.description || 'No description provided.'}</p>
                        <p style="font-size:0.9rem; color: var(--text-muted); margin-bottom: 5px;">
                            <strong>📍 Location:</strong> ${post.location_name || `${post.latitude.toFixed(4)}, ${post.longitude.toFixed(4)}`}
                        </p>
                        <p style="font-size:0.8rem; color: var(--text-muted);">
                            <strong>🕒 Time:</strong> ${new Date(post.timestamp).toLocaleString()}
                        </p>
                        
                        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; border: 1px solid var(--border);">
                            <strong>🤖 AI Analysis:</strong> Confidence ${(post.ai_confidence * 100).toFixed(1)}%
                        </div>
                        
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button onclick="AdminApp.verifyPost(${post.id}, true)" class="action-btn btn-verify">Verify / Approve</button>
                            <button onclick="AdminApp.verifyPost(${post.id}, false)" class="action-btn btn-reject">Reject</button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    async verifyPost(postId, isApproved) {
        let reason = null;
        if (!isApproved) {
            reason = prompt("Please provide a reason for rejection:");
            if (reason === null) return; // User cancelled
        }

        try {
            // Find button to disable
            const btn = event.target;
            if (btn) {
                btn.textContent = 'Processing...';
                btn.disabled = true;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/posts/${postId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verified: isApproved,
                    rejected: !isApproved,
                    rejection_reason: reason
                })
            });

            if (response.ok) {
                this.loadPendingPosts();
                this.loadSensorData(); // Update stats
            } else {
                alert('Failed to update status');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = isApproved ? 'Verify / Approve' : 'Reject';
                }
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert('Network error');
        }
    },

    async loadSensorData() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/historical-data`);
            const data = await response.json();

            // Render Stats
            const statsDiv = document.getElementById('admin-stats');
            if (statsDiv) {
                statsDiv.innerHTML = `
                    <div class="card" style="flex:1">
                        <h3 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px;">Total Reports</h3>
                        <p style="font-size:2rem; font-weight:bold; margin:0;">${data.stats.total_reports}</p>
                    </div>
                    <div class="card" style="flex:1">
                        <h3 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px;">Verified</h3>
                        <div style="font-size:2rem; font-weight:bold; color:var(--success); margin:0;">${data.stats.verified}</div>
                    </div>
                    <div class="card" style="flex:1">
                        <h3 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px;">Accuracy</h3>
                        <div style="font-size:2rem; font-weight:bold; color:var(--primary); margin:0;">${data.stats.accuracy_rate.toFixed(1)}%</div>
                    </div>
                `;
            }

            // Render Sensor Table
            const tbody = document.querySelector('#sensor-table tbody');
            if (tbody) {
                tbody.innerHTML = '';

                if (!data.sensor_data || data.sensor_data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">No sensors available</td></tr>';
                } else {
                    data.sensor_data.forEach(sensor => {
                        const row = document.createElement('tr');
                        let color = 'var(--text-color)';
                        if (sensor.status === 'Operational') color = 'var(--success)';
                        else if (sensor.status === 'Offline') color = 'var(--error)';
                        else if (sensor.status === 'Maintenance') color = 'var(--warning)';

                        row.innerHTML = `
                            <td>
                                <div><strong>${sensor.id}</strong></div>
                                <div style="font-size:0.8rem; color:var(--text-muted)">${sensor.location}</div>
                            </td>
                            <td>${sensor.type}</td>
                            <td>
                                <div style="color:${color}; font-weight:bold">${sensor.status}</div>
                                <div style="font-size:0.8rem">${sensor.reading}</div>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                }
            }

        } catch (error) {
            console.error('Error loading sensor data:', error);
        }
    }
};

// Expose to window for onclick handlers
window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
