# 🛠️ Generated Tech Stack Report & Dependencies

## Overview
This document lists the actual technologies, libraries, and APIs currently implemented in the **Ocean Hazard Live Reporting System**, verified by scanning the codebase (`backend/requirements.txt`, `frontend/index.html`, and service files).

---

## 1. Backend Infrastructure (Python/FastAPI)
The core server is built on high-performance asynchronous Python tools.

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | **FastAPI** | `>=0.109.0` | Main web server and API handler. |
| **Server** | **Uvicorn** | `>=0.27.0` | ASGI server to run the FastAPI app. |
| **Database ORM** | **SQLAlchemy** | `>=2.0.25` | Database interaction and object-relational mapping. |
| **Database Migrations** | **Alembic** | `1.13.1` | Managing database schema changes. |
| **Data Validation** | **Pydantic** | `>=2.5.3` | Strict data validation for API requests/responses. |
| **Async HTTP** | **HTTPX** | `0.26.0` | Making asynchronous requests to external APIs (INCOIS, etc). |

## 2. Artificial Intelligence & Validation Services
Advanced AI integration for verifying citizen reports.

| Service | Provider | Library | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Image Analysis** | **Google Gemini** | `google-generativeai` | **Function:** Analyzes uploaded photos to detect Tsunami, Cyclone, or High Tide evidence. Validates "Ocean Related" content vs spam. |
| **Translation** | **Groq API** | `groq` | **Function:** Provides real-time translation for alerts and guidelines (English ↔ Hindi ↔ Kannada). |

## 3. External APIs & Integrations
Third-party services connecting the app to the real world.

| Service | Purpose | Key Features |
| :--- | :--- | :--- |
| **Twilio** | **SMS Alerts** | Sends emergency notifications to admins when a high-severity hazard is verified. |
| **INCOIS** | **Official Data** | Fetches official ocean hazard bulletins (Tsunami/High Wave warnings) for cross-verification. |
| **Mapbox GL JS** | **Mapping** | Renders the interactive coastal map, heatmap layers, and hazard markers in the frontend. |
| **ipapi.co** | **Geolocation** | Primary fallback for detecting user location when GPS is disabled. |
| **ip-api.com** | **Geolocation** | Secondary backup for location detection. |

## 4. Frontend Technologies (Web/PWA)
A lightweight, mobile-first Progressive Web App structure.

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Core** | **HTML5 / CSS3 / ES6+ JS** | Built with Vanilla JS (no heavy frameworks like React/Angular) for maximum performance on low-end devices. |
| **Storage** | **IndexedDB** | Stores offline reports andcached alerts directly in the browser. |
| **Fonts** | **Google Fonts (Inter)** | Modern, clean typography for optimal readability. |
| **Icons** | **Unicode / Custom CSS** | Lightweight iconography without large SVG libraries. |

## 5. Deployment & Tools
| Tool | Purpose |
| :--- | :--- |
| **Docker** | Containerization of the Backend and Frontend services. |
| **Docker Compose** | Orchestrating the multi-container environment. |
| **Python-Dotenv** | Managing environment variables and secrets. |
| **Pillow (PIL)** | Image processing (resizing, watermarking) before AI analysis. |
