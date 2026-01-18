// Translation Manager

const TranslationManager = {
    currentLang: 'en',

    // Hardcoded translations
    dictionaries: {
        en: {
            app_title: "Ocean Hazard Live Reporting",
            dashboard: "Dashboard",
            report_hazard: "Report Hazard",
            map: "Map",
            verified_reports: "Verified Reports",
            pending_reports: "Pending Reports",
            incois_alerts: "INCOIS Alerts",
            hazard_type: "Hazard Type",
            tsunami: "Tsunami",
            cyclone: "Cyclone",
            high_tide: "High Tide",
            severity: "Severity Level",
            low: "Low",
            medium: "Medium",
            high: "High",
            // Alerts
            high_wave: "High Wave Alert",
            rough_sea: "Rough Sea Alert",
            alert_issued: "Alert Issued",
            valid_until: "Valid Until",
            affected_area: "Affected Area",
            capture_image: "Capture or Upload Image",
            capture_btn: "Capture Image",
            description: "Description (Optional)",
            describe_placeholder: "Describe what you're seeing...",
            location: "Location",
            location_placeholder: "Or enter beach/area name",
            retry_gps: "Retry GPS",
            safety_guidelines: "View Safety Guidelines",
            submit_report: "Submit Report"
        },
        hi: {
            app_title: "महासागर आपदा लाइव रिपोर्टिंग",
            dashboard: "डैशबोर्ड",
            report_hazard: "आपदा रिपोर्ट करें",
            map: "मानचित्र",
            verified_reports: "सत्यापित रिपोर्ट",
            pending_reports: "लंबित रिपोर्ट",
            incois_alerts: "INCOIS अलर्ट",
            hazard_type: "आपदा का प्रकार",
            tsunami: "सुनामी",
            cyclone: "चक्रवात",
            high_tide: "ज्वार",
            severity: "गंभीरता स्तर",
            low: "कम",
            medium: "मध्यम",
            high: "उच्च",
            // Alerts
            high_wave: "ऊंची लहरों की चेतावनी",
            rough_sea: "खराब मौसम की चेतावनी",
            alert_issued: "चेतावनी जारी",
            valid_until: "तक मान्य",
            affected_area: "प्रभावित क्षेत्र",
            capture_image: "तस्वीर लें या अपलोड करें",
            capture_btn: "फ़ोटो लें",
            description: "विवरण (वैकल्पिक)",
            describe_placeholder: "बताएं कि आप क्या देख रहे हैं...",
            location: "स्थान",
            location_placeholder: "या समुद्र तट/क्षेत्र का नाम दर्ज करें",
            retry_gps: "जीपीएस पुनः प्रयास करें",
            safety_guidelines: "सुरक्षा दिशानिर्देश देखें",
            submit_report: "रिपोर्ट सबमिट करें"
        },
        kn: {
            app_title: "ಸಾಗರ ಅವಘಡ ನೇರ ವರದಿ",
            dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
            report_hazard: "ಅವಘಡ ವರದಿ ಮಾಡಿ",
            map: "ನಕ್ಷೆ",
            verified_reports: "ಪರಿಶೀಲಿಸಿದ ವರದಿಗಳು",
            pending_reports: "ಬಾಕಿ ಇರುವ ವರದಿಗಳು",
            incois_alerts: "INCOIS ಎಚ್ಚರಿಕೆಗಳು",
            hazard_type: "ಅವಘಡ ವಿಧ",
            tsunami: "ಸುನಾಮಿ",
            cyclone: "ಚಂಡಮಾರುತ",
            high_tide: "ದೊಡ್ಡ ಅಲೆ",
            severity: "ತೀವ್ರತೆಯ ಮಟ್ಟ",
            low: "ಕಡಿಮೆ",
            medium: "ಮಧ್ಯಮ",
            high: "ಹೆಚ್ಚು",
            // Alerts
            high_wave: "ಎತ್ತರದ ಅಲೆಗಳ ಎಚ್ಚರಿಕೆ",
            rough_sea: "ಪ್ರಕ್ಷುಬ್ಧ ಸಮುದ್ರದ ಎಚ್ಚರಿಕೆ",
            alert_issued: "ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ",
            valid_until: "ವರೆಗೆ ಮಾನ್ಯ",
            affected_area: "ಬಾಧಿತ ಪ್ರದೇಶ",
            capture_image: "ಚಿತ್ರ ತೆಗೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
            capture_btn: "ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ",
            description: "ವಿವರಣೆ (ಐಚ್ಛಿಕ)",
            describe_placeholder: "ನೀವು ನೋಡುತ್ತಿರುವುದನ್ನು ವಿವರಿಸಿ...",
            location: "ಸ್ಥಳ",
            location_placeholder: "ಅಥವಾ ಬೀಚ್/ಪ್ರದೇಶದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
            retry_gps: "ಜಿಪಿಎಸ್ ಮರುಪ್ರಯತ್ನಿಸಿ",
            safety_guidelines: "ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
            submit_report: "ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ"
        }
    },

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
            // Use hardcoded translations
            this.translations = this.dictionaries[langCode] || this.dictionaries['en'];
            this.applyTranslations();

        } catch (error) {
            console.error('Translation error:', error);
        }
    },

    get(key) {
        return this.translations[key] || null;
    },

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.dataset.i18n;
            if (this.translations[key]) {
                if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                    el.placeholder = this.translations[key];
                } else {
                    el.textContent = this.translations[key];
                }
            }
        });
    }
};

window.TranslationManager = TranslationManager;
