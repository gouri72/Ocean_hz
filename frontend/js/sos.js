// sos.js - Handle SOS Form Submission

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('sos-form');
    const modal = document.getElementById('success-modal');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // Disable button
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending Alert...';
            submitBtn.style.opacity = '0.7';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                // Manually ensure location is present (double check)
                if (!data.location_name || data.location_name.length < 3) {
                    throw new Error("Please provide a valid location description.");
                }

                // Direct fetch to bypass cache issues
                const response = await fetch(`${API_CONFIG.BASE_URL}/sos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Server Error: ${response.status}`);
                }

                // Show Success
                modal.style.display = 'flex';
                form.reset();

            } catch (error) {
                console.error('SOS Error:', error);
                alert('⚠️ Failed to send SOS: ' + (error.message || 'Network Error'));

                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.opacity = '1';
            }
        });
    }
});
