# 🌊 Ocean Hazard Live Reporting System - Setup Guide

## Prerequisites

Before you begin, ensure you have:
- Docker and Docker Compose installed
- API keys for:
  - Google Cloud Vision API
  - Mapbox
  - Twilio (for SMS alerts)
  - Groq API (for translation)

## Step-by-Step Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Google Gemini Vision API
GEMINI_API_KEY=your_gemini_api_key_here

# Mapbox
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Twilio SMS
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
ADMIN_PHONE_NUMBER=+1234567890

# Groq API
GROQ_API_KEY=your_groq_key_here

# INCOIS API (optional - uses mock data if not provided)
INCOIS_API_URL=https://incois.gov.in/api
INCOIS_API_KEY=your_incois_key_here
```

### 2. Update Mapbox Token in Frontend

Edit `frontend/js/config.js` and replace the Mapbox token:

```javascript
MAPBOX_TOKEN: 'your_actual_mapbox_token_here'
```

### 3. Build and Run with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Access the Application

- **Frontend (PWA)**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **n8n Workflows**: http://localhost:5678
  - Username: `admin`
  - Password: `admin123`

## Development Mode (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Serve with Python HTTP server
python -m http.server 8080

# Or use any static file server
# npx serve -p 8080
```

## API Key Setup Guides

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Select or create a Google Cloud project
5. Copy the generated API key
6. Add to `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

**Note**: Gemini API is free for moderate usage with generous rate limits. Perfect for this application!

### Mapbox

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for free account
3. Go to **Account > Access Tokens**
4. Copy your default public token
5. Or create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`

### Twilio

1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for trial account ($15 credit)
3. Get a phone number
4. From dashboard, copy:
   - Account SID
   - Auth Token
   - Your Twilio phone number

### Groq API

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for account
3. Go to **API Keys**
4. Create new API key
5. Copy the key

## Testing the Application

### 1. Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Get UI translations
curl http://localhost:8000/api/ui-translations/en

# Sync INCOIS alerts
curl -X POST http://localhost:8000/api/incois/sync
```

### 2. Test Frontend

1. Open http://localhost:8080
2. Select language (English/Hindi/Kannada)
3. Navigate to "Report Hazard"
4. Fill out the form
5. Upload test image
6. Submit report
7. Check dashboard for verification

### 3. Test Offline Mode

1. Open browser DevTools
2. Go to Network tab
3. Set to "Offline"
4. Try submitting a report
5. Should save to IndexedDB
6. Go back "Online"
7. Should auto-sync

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing .env file
# - Invalid API keys
# - Port 8000 already in use
```

### Frontend can't connect to backend

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check CORS settings in .env
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Image upload fails

- Check image size (max 10MB)
- Check image type (JPEG, PNG, WebP only)
- Verify Google Vision API credentials
- Check backend logs for errors

### Translation not working

- Verify Groq API key in `.env`
- Check backend logs for API errors
- Groq API may have rate limits

### Map not loading

- Verify Mapbox token in `frontend/js/config.js`
- Check browser console for errors
- Ensure token has correct scopes

### SMS alerts not sending

- Verify Twilio credentials
- Check Twilio phone number format (+1234567890)
- Ensure admin phone number is set
- Trial accounts can only send to verified numbers

## Production Deployment

### 1. Update Environment

```env
DEBUG=False
SECRET_KEY=generate-strong-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Use HTTPS

- SSL certificate required for PWA features
- Use Let's Encrypt or cloud provider SSL
- Update nginx configuration

### 3. Secure API Keys

- Use environment variables
- Never commit `.env` to git
- Rotate keys regularly

### 4. Database

- Consider PostgreSQL for production
- Setup regular backups
- Use connection pooling

### 5. Monitoring

- Setup logging aggregation
- Monitor API usage
- Track error rates
- Setup alerts

## n8n Workflow Setup

1. Access n8n at http://localhost:5678
2. Login with admin/admin123
3. Create workflows for:
   - Image upload → AI validation → INCOIS verification
   - Offline detection → Twilio SMS
   - Network restore → Data sync
   - Language selection → UI translation

Example workflow nodes:
- **Webhook** - Trigger on post creation
- **HTTP Request** - Call Google Vision API
- **Function** - Process AI results
- **HTTP Request** - Check INCOIS data
- **IF** - Validation logic
- **Twilio** - Send SMS if offline

## Maintenance

### Database Cleanup

```bash
# Access backend container
docker exec -it ocean_hazard_backend bash

# Run Python shell
python

# Clean old posts
from database import SessionLocal, HazardPost
from datetime import datetime, timedelta

db = SessionLocal()
cutoff = datetime.utcnow() - timedelta(days=30)
old_posts = db.query(HazardPost).filter(HazardPost.timestamp < cutoff).all()
for post in old_posts:
    db.delete(post)
db.commit()
```

### Update Dependencies

```bash
# Backend
cd backend
pip install --upgrade -r requirements.txt

# Rebuild Docker images
docker-compose build --no-cache
docker-compose up -d
```

## Support & Documentation

- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **Backend Code**: `backend/` directory
- **Frontend Code**: `frontend/` directory
- **Database Models**: `backend/database.py`
- **API Routes**: `backend/main.py`

## License

MIT License - See LICENSE file

---

**Need Help?**
- Check logs: `docker-compose logs -f`
- Review API docs: http://localhost:8000/docs
- Test endpoints with Swagger UI
- Check browser console for frontend errors

**Ready to Deploy!** 🚀
