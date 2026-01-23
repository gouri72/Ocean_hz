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
            total_reports: "Total Reports",
            places_to_avoid: "Places to Avoid",
            incois_alerts: "INCOIS Alerts",
            hazard_type: "Hazard Type",
            tsunami: "Tsunami",
            cyclone: "Cyclone",
            high_tide: "High Tide",
            severity: "Severity Level",
            low: "Low",
            medium: "Medium",
            high: "High",
            // Manual Location
            manual_location_required: "Manual Location Required",
            enter_precise_location: "Enter precise location (e.g. Marina Beach North End)",
            // Hardcoded Alerts
            tsunami_title: "TSUNAMI WARNING: Chennai Coast",
            tsunami_desc: "Massive seismic activity detected near Sumatra. Tsunami waves expected to hit Chennai coast within 2 hours. Evacuate Marina Beach immediately.",
            tsunami_area: "Chennai, Tamil Nadu",
            high_tide_title: "High Tide Warning: Ennore Port",
            high_tide_desc: "Rough sea conditions expected near Ennore. Fishermen advised not to venture into sea.",
            high_tide_area: "Ennore, Chennai",
            // Alerts
            high_wave: "High Wave Alert",
            rough_sea: "Rough Sea Alert",
            alert_issued: "Alert Issued",
            valid_until: "Valid Until",
            affected_area: "Affected Area",
            incois_area: "Area:",
            incois_issued: "Issued:",
            no_active_incois: "No Active INCOIS Alerts.",
            capture_image: "Capture or Upload Image",
            image_label: "Image",
            capture_btn: "Capture Image",
            safety_guidelines: "View Safety Guidelines",
            safety_guidelines_title: "Safety Guidelines",
            description: "Description (Optional)",
            describe_placeholder: "Describe what you're seeing...",
            location: "Location",
            location_placeholder: "Or enter beach/area name",
            retry_gps: "Retry GPS",
            safety_guidelines: "View Safety Guidelines",
            safety_guidelines_title: "Safety Guidelines",
            submit_report: "Submit Report",
            // SOS Page
            emergency_reporting: "Emergency Reporting",
            emergency_type: "Nature of Emergency",
            drowning: "Drowning",
            boat_accident: "Boat Accident",
            stranded: "Stranded",
            medical: "Medical",
            contact_number: "Contact Number (Important)",
            send_sos: "SEND SOS ALERT",
            back_to_home: "Back to Home",
            active_rescue: "🚨 Active Rescue Operations",
            // Post Status & Time
            verified: "Verified",
            pending_verification: "Pending Verification",
            active_hazard: "ACTIVE HAZARD",
            label_hazard: "Hazard:",
            label_issued: "Issued:",
            just_now: "Just now",
            min_ago: "m ago",
            hr_ago: "h ago",
            day_ago: "d ago",
            // Extended Hazards
            rough_sea: "Rough Sea",
            high_wave: "High Wave"
        },
        hi: {
            app_title: "महासागर आपदा लाइव रिपोर्टिंग",
            dashboard: "डैशबोर्ड",
            report_hazard: "आपदा रिपोर्ट करें",
            map: "मानचित्र",
            verified_reports: "सत्यापित रिपोर्ट",
            pending_reports: "लंबित रिपोर्ट",
            total_reports: "कुल रिपोर्ट",
            places_to_avoid: "बचने के स्थान",
            incois_alerts: "INCOIS अलर्ट",
            hazard_type: "आपदा का प्रकार",
            tsunami: "सुनामी",
            cyclone: "चक्रवात",
            high_tide: "ज्वार",
            severity: "गंभीरता स्तर",
            low: "कम",
            medium: "मध्यम",
            high: "उच्च",
            // Manual Location
            manual_location_required: "मैन्युअल स्थान आवश्यक",
            enter_precise_location: "सटीक स्थान दर्ज करें (उदा. मरीना बीच उत्तरी छोर)",
            // Hardcoded Alerts
            tsunami_title: "सुनामी की चेतावनी: चेन्नई तट",
            tsunami_desc: "सुमात्रा के पास भारी भूकंपीय गतिविधि का पता चला। 2 घंटे के भीतर चेन्नई तट पर सुनामी की लहरें आने की आशंका। मरीना बीच को तुरंत खाली करें।",
            tsunami_area: "चेन्नई, तमिलनाडु",
            high_tide_title: "उच्च ज्वार की चेतावनी: आदिनी बंदरगाह",
            high_tide_desc: "एन्नोर के पास समुद्र में खराब स्थिति की आशंका। मछुआरों को समुद्र में न जाने की सलाह।",
            high_tide_area: "एन्नोर, चेन्नई",
            // Alerts
            high_wave: "ऊंची लहरों की चेतावनी",
            rough_sea: "खराब मौसम की चेतावनी",
            alert_issued: "चेतावनी जारी",
            valid_until: "तक मान्य",
            affected_area: "प्रभावित क्षेत्र",
            incois_area: "क्षेत्र:",
            incois_issued: "जारी किया गया:",
            no_active_incois: "कोई सक्रिय INCOIS अलर्ट नहीं।",
            capture_image: "तस्वीर लें या अपलोड करें",
            image_label: "तस्वीर",
            capture_btn: "फ़ोटो लें",
            description: "विवरण (वैकल्पिक)",
            describe_placeholder: "बताएं कि आप क्या देख रहे हैं...",
            location: "स्थान",
            location_placeholder: "या समुद्र तट/क्षेत्र का नाम दर्ज करें",
            retry_gps: "जीपीएस पुनः प्रयास करें",
            safety_guidelines: "सुरक्षा दिशानिर्देश देखें",
            safety_guidelines_title: "सुरक्षा दिशानिर्देश",
            submit_report: "रिपोर्ट सबमिट करें",
            // SOS Page
            emergency_reporting: "आपातकालीन रिपोर्टिंग",
            emergency_type: "आपातकाल का प्रकार",
            drowning: "डूबना",
            boat_accident: "नाव दुर्घटना",
            stranded: "फंसे हुए",
            medical: "चिकित्सा",
            contact_number: "संपर्क नंबर (महत्वपूर्ण)",
            send_sos: "SOS अलर्ट भेजें",
            back_to_home: "वापस जाएं",
            active_rescue: "🚨 सक्रिय बचाव अभियान",
            // Post Status & Time
            verified: "सत्यापित",
            pending_verification: "सत्यापन लंबित",
            active_hazard: "सक्रिय खतरा",
            label_hazard: "खतरा:",
            label_issued: "जारी किया गया:",
            just_now: "अभी",
            min_ago: " मिनट पहले",
            hr_ago: " घंटे पहले",
            day_ago: " दिन पहले",
            // Extended Hazards
            rough_sea: "खराब मौसम",
            high_wave: "ऊंची लहरें"
        },
        kn: {
            app_title: "ಸಾಗರ ಅವಘಡ ನೇರ ವರದಿ",
            dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
            report_hazard: "ಅವಘಡ ವರದಿ ಮಾಡಿ",
            map: "ನಕ್ಷೆ",
            verified_reports: "ಪರಿಶೀಲಿಸಿದ ವರದಿಗಳು",
            pending_reports: "ಬಾಕಿ ಇರುವ ವರದಿಗಳು",
            total_reports: "ಒಟ್ಟು ವರದಿಗಳು",
            places_to_avoid: "ತಪ್ಪಿಸಬೇಕಾದ ಸ್ಥಳಗಳು",
            incois_alerts: "INCOIS ಎಚ್ಚರಿಕೆಗಳು",
            hazard_type: "ಅವಘಡ ವಿಧ",
            tsunami: "ಸುನಾಮಿ",
            cyclone: "ಚಂಡಮಾರುತ",
            high_tide: "ದೊಡ್ಡ ಅಲೆ",
            severity: "ತೀವ್ರತೆಯ ಮಟ್ಟ",
            low: "ಕಡಿಮೆ",
            medium: "ಮಧ್ಯಮ",
            high: "ಹೆಚ್ಚು",
            // Manual Location
            manual_location_required: "ಕೈಯಾರೆ ಸ್ಥಳ ನಮೂದಿಸಿ",
            enter_precise_location: "ನಿಖರವಾದ ಸ್ಥಳವನ್ನು ನಮೂದಿಸಿ (ಉದಾ. ಮರೀನಾ ಬೀಚ್ ಉತ್ತರ ಪ್ರಾಂತ್ಯ)",
            // Hardcoded Alerts
            tsunami_title: "ಸುನಾಮಿ ಎಚ್ಚರಿಕೆ: ಚೆನ್ನೈ ಕರಾವಳಿ",
            tsunami_desc: "ಸುಮಾತ್ರಾ ಬಳಿ ಭಾರಿ ಭೂಕಂಪನ ಚಟುವಟಿಕೆ ಪತ್ತೆಯಾಗಿದೆ. 2 ಗಂಟೆಗಳಲ್ಲಿ ಚೆನ್ನೈ ಕರಾವಳಿಗೆ ಸುನಾಮಿ ಅಲೆಗಳು ಅಪ್ಪಳಿಸುವ ನಿರೀಕ್ಷೆಯಿದೆ. ಮರೀನಾ ಬೀಚ್ ಅನ್ನು ತಕ್ಷಣ ಖಾಲಿ ಮಾಡಿ.",
            tsunami_area: "ಚೆನ್ನೈ, ತಮಿಳುನಾಡು",
            high_tide_title: "ದೊಡ್ಡ ಅಲೆಗಳ ಎಚ್ಚರಿಕೆ: ಎನ್ನೋರ್ ಬಂದರು",
            high_tide_desc: "ಎನ್ನೋರ್ ಬಳಿ ಸಮುದ್ರ ಪ್ರಕ್ಷುಬ್ಧವಾಗುವ ನಿರೀಕ್ಷೆಯಿದೆ. ಮೀನುಗಾರರು ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯದಂತೆ ಸಲಹೆ ನೀಡಲಾಗಿದೆ.",
            high_tide_area: "ಎನ್ನೋರ್, ಚೆನ್ನೈ",
            // Alerts
            high_wave: "ಎತ್ತರದ ಅಲೆಗಳ ಎಚ್ಚರಿಕೆ",
            rough_sea: "ಪ್ರಕ್ಷುಬ್ಧ ಸಮುದ್ರದ ಎಚ್ಚರಿಕೆ",
            alert_issued: "ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ",
            valid_until: "ವರೆಗೆ ಮಾನ್ಯ",
            affected_area: "ಬಾಧಿತ ಪ್ರದೇಶ",
            incois_area: "ಪ್ರದೇಶ:",
            incois_issued: "ಹೊರಡಿಸಲಾಗಿದೆ:",
            no_active_incois: "ಯಾವುದೇ ಸಕ್ರಿಯ INCOIS ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ.",
            capture_image: "ಚಿತ್ರ ತೆಗೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
            image_label: "ಚಿತ್ರ",
            capture_btn: "ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ",
            description: "ವಿವರಣೆ (ಐಚ್ಛಿಕ)",
            describe_placeholder: "ನೀವು ನೋಡುತ್ತಿರುವುದನ್ನು ವಿವರಿಸಿ...",
            location: "ಸ್ಥಳ",
            location_placeholder: "ಅಥವಾ ಬೀಚ್/ಪ್ರದೇಶದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
            retry_gps: "ಜಿಪಿಎಸ್ ಮರುಪ್ರಯತ್ನಿಸಿ",
            safety_guidelines: "ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
            safety_guidelines_title: "ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿಗಳು",
            submit_report: "ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ",
            // SOS Page
            emergency_reporting: "ತುರ್ತು ವರದಿ",
            emergency_type: "ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ಸ್ವರೂಪ",
            drowning: "ಮುಳುಗುತ್ತಿದ್ದಾರೆ",
            boat_accident: "ದೋಣಿ ಅಪಘಾತ",
            stranded: "ಸಿಕ್ಕಿಹಾಕಿಕೊಂಡಿದ್ದಾರೆ",
            medical: "ವೈದ್ಯಕೀಯ",
            contact_number: "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (ಮುಖ್ಯ)",
            send_sos: "SOS ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ",
            back_to_home: "ಹಿಂದಕ್ಕೆ",
            active_rescue: "🚨 ಸಕ್ರಿಯ ರಕ್ಷಣಾ ಕಾರ್ಯಾಚರಣೆಗಳು",
            // Post Status & Time
            verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
            pending_verification: "ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ",
            active_hazard: "ಸಕ್ರಿಯ ಅಪಾಯ",
            label_hazard: "ಅಪಾಯ:",
            label_issued: "ಹೊರಡಿಸಲಾಗಿದೆ:",
            just_now: "ಈಗಷ್ಟೇ",
            min_ago: " ನಿಮಿಷಗಳ ಹಿಂದೆ",
            hr_ago: " ಗಂಟೆಗಳ ಹಿಂದೆ",
            day_ago: " ದಿನಗಳ ಹಿಂದೆ",
            // Extended Hazards
            rough_sea: "ಪ್ರಕ್ಷುಬ್ಧ ಸಮುದ್ರ",
            high_wave: "ಎತ್ತರದ ಅಲೆಗಳು"
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
