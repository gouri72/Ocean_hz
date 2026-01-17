# 🌊 Ocean Hazard Live Reporting System

> **Mobile-first Progressive Web App for crowdsourced ocean hazard reporting with AI validation, INCOIS verification, and real-time visualization**

[![Status](https://img.shields.io/badge/status-ready--to--deploy-green)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![PWA](https://img.shields.io/badge/PWA-enabled-purple)]()

## 🚀 Quick Start

```bash
# 1. Clone or navigate to project
cd c:/Users/Gouri/OceanHz

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env and add your API keys (see SETUP.md for details)
# Required: GEMINI_API_KEY, MAPBOX_ACCESS_TOKEN, TWILIO credentials, GROQ_API_KEY

# 4. Update Mapbox token in frontend/js/config.js

# 5. Start with Docker
docker-compose up -d

# 7. Access the app
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000/docs
# n8n: http://localhost:5678
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions and API key guides
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Technical implementation details
- **API Docs** - http://localhost:8000/docs (after starting)

## 🎯 Current Status

### ✅ Completed
- ✅ Backend API with FastAPI
- ✅ Database models and schemas
- ✅ **Gemini Vision API integration** (multimodal AI analysis)
- ✅ Twilio SMS service
- ✅ Groq translation service
- ✅ INCOIS validation service
- ✅ Image watermarking
- ✅ Frontend HTML structure
- ✅ Modern CSS styling (dark mode, ocean theme)
- ✅ Docker configuration
- ✅ PWA manifest
- ✅ Comprehensive documentation

### 🔨 In Progress
- 🔨 JavaScript frontend logic (API client, offline sync, map integration)
- 🔨 Service worker for offline support
- 🔨 n8n workflow templates

### 📋 To Do
- ⏳ API key configuration
- ⏳ Testing and debugging
- ⏳ Production deployment

## 📦 Project Structure

```
OceanHz/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── database.py             # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── services/
│   │   ├── vision_service.py   # Google Vision API
│   │   ├── twilio_service.py   # SMS alerts
│   │   ├── translation_service.py  # Groq translation
│   │   ├── incois_service.py   # INCOIS integration
│   │   └── image_service.py    # Image processing
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css           # Modern ocean theme
│   ├── js/
│   │   ├── config.js           # Configuration
│   │   ├── api.js              # API client (to be completed)
│   │   ├── offline.js          # Offline support (to be completed)
│   │   ├── translation.js      # Language switching (to be completed)
│   │   ├── map.js              # Mapbox integration (to be completed)
│   │   └── app.js              # Main app logic (to be completed)
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (to be completed)
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── SETUP.md
└── IMPLEMENTATION.md
```



A mobile-first Progressive Web App for crowdsourced ocean hazard reporting with AI validation, INCOIS verification, and real-time visualization.

## 🎯 Features

### Core Functionality
- **Crowdsourced Reporting**: Citizens can report ocean hazards with images
- **AI Validation**: Google Vision API analyzes images for ocean hazard detection
- **INCOIS Integration**: Cross-validates reports with official ocean data
- **Live Dashboard**: Public real-time visualization of verified hazards
- **Interactive Map**: Mapbox-powered heatmap with severity-based color coding
- **Offline Support**: IndexedDB storage with automatic sync when online
- **SMS Alerts**: Twilio integration for network failure notifications

### Hazard Types
- 🌊 **Tsunami**: Sudden large waves from underwater disturbances
- 🌀 **Cyclone**: Severe storms with high winds and heavy rain
- 🌊 **High Tide**: Abnormally high sea levels causing coastal inundation

### Technical Features
- **Multilingual**: English, Hindi, Kannada (Groq API)
- **PWA**: Installable, works offline
- **Mobile-First**: Optimized for smartphones and tablets
- **Real-time Updates**: Live dashboard synchronization
- **Workflow Automation**: n8n integration
- **Containerized**: Docker deployment

## 🏗️ Architecture

```
┌─────────────────┐
│   Mobile PWA    │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI Server │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────┐
│ SQLite │ │Vision│ │ INCOIS │ │ Twilio │ │ Groq │
│   DB   │ │ API  │ │  API   │ │  SMS   │ │ LLM  │
└────────┘ └──────┘ └────────┘ └────────┘ └──────┘
         │
         ▼
    ┌────────┐
    │ Mapbox │
    │  Maps  │
    └────────┘
```

## 📦 Tech Stack

### Frontend
- **HTML5/CSS3/JavaScript**: Core web technologies
- **Service Workers**: PWA offline support
- **IndexedDB**: Offline data storage
- **Mapbox GL JS**: Interactive maps

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLite**: Lightweight database
- **Google Vision API**: Image analysis
- **Twilio**: SMS notifications
- **Groq API**: Multilingual translation

### DevOps
- **Docker**: Containerization
- **n8n**: Workflow automation
- **Docker Compose**: Multi-container orchestration

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- API Keys:
  - Google Cloud Vision API
  - Mapbox
  - Twilio
  - Groq API
  - INCOIS API access

### Installation

1. **Clone and setup**:
```bash
cd c:/Users/Gouri/OceanHz
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Run with Docker**:
```bash
docker-compose up -d
```

4. **Access the app**:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- n8n: http://localhost:5678

## 📱 Usage

### For Citizens
1. Open the app on your mobile device
2. Select language (English/Hindi/Kannada)
3. Capture or upload ocean hazard image
4. Add optional description
5. Select severity level (Low/Medium/High)
6. Submit report

### Validation Flow
1. **Image Upload**: Automatic watermark with location, date, time
2. **AI Analysis**: Google Vision API validates ocean hazard
3. **INCOIS Check**: Cross-validates with official data
4. **Verification**: Auto-approve if both AI and INCOIS confirm
5. **Dashboard**: Verified reports appear on public map

### Offline Mode
- Reports saved locally in IndexedDB
- SMS alert sent to admin via Twilio
- Auto-sync when network restored

## 🗄️ Database Schema

### Tables
- **users**: User profiles and language preferences
- **hazard_posts**: Citizen reports with metadata
- **image_analysis**: AI validation results
- **incois_alerts**: Official ocean hazard data
- **admin_notifications**: System alerts

## 🔐 Security

- Input validation on all endpoints
- Rate limiting to prevent abuse
- Image size and type restrictions
- CORS configuration
- SQL injection prevention

## 🌍 Multilingual Support

Dynamic UI translation using Groq API:
- English (default)
- Hindi (हिंदी)
- Kannada (ಕನ್ನಡ)

## 📊 Dashboard Features

- Live hazard posts with verification status
- AI confidence scores
- INCOIS correlation indicators
- Interactive map with:
  - Live markers
  - Heatmap visualization
  - Severity-based color coding
- Real-time updates

## 🔄 Workflow Automation (n8n)

1. Image upload → AI validation → INCOIS verification
2. Offline detection → Twilio SMS trigger
3. Network restore → Data sync → Dashboard update
4. Language selection → UI translation

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ for ocean safety and community resilience**
