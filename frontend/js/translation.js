// Translation Manager

const TranslationManager = {
    currentLang: 'en',
    translations: {},

    async init() {
        const savedLang = localStorage.getItem('app_language') || 'en';
        this.currentLang = savedLang;

        const select = document.getElementById('language-select');
        if (select) {
            select.value = savedLang;
            select.addEventListener('change', (e) => this.setLanguage(e.target.value));
        }

        await this.loadTranslations(savedLang);
    },

    async setLanguage(langCode) {
        this.currentLang = langCode;
        localStorage.setItem('app_language', langCode);

        // Show loading state if needed
        document.body.style.opacity = '0.7';

        await this.loadTranslations(langCode);

        document.body.style.opacity = '1';
    },

    async loadTranslations(langCode) {
        try {
            // Try to fetch from backend
            let data;
            try {
                data = await ApiClient.getTranslations(langCode);
            } catch (e) {
                console.warn('Failed to fetch translations, using fallbacks');
                data = {}; // Fallback would go here
            }

            this.translations = data;
            this.applyTranslations();

        } catch (error) {
            console.error('Translation error:', error);
        }
    },

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.dataset.i18n;
            if (this.translations[key]) {
                if (el.tagName === 'INPUT' && el.type === 'placeholder') {
                    el.placeholder = this.translations[key];
                } else {
                    el.textContent = this.translations[key];
                }
            }
        });
    }
};

window.TranslationManager = TranslationManager;
