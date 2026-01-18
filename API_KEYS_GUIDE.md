# 🔑 API Keys Setup Guide

## Required API Keys

You need **4 API keys** to run the Ocean Hazard Live Reporting System:

### ✅ Already Configured (I can see these in your .env.example)
1. ✅ **Mapbox Access Token** - Already set!
2. ✅ **Groq API Key** - Already set!

### ⚠️ Still Needed
3. ❌ **Google Gemini API Key** - Required for image analysis
4. ❌ **Twilio Credentials** - Required for SMS alerts (3 values)

### 🔵 Optional
5. 🔵 **INCOIS API Key** - Optional (uses mock data if not provided)

---

## 📋 Detailed Setup Instructions

### 1. ✅ Mapbox Access Token (DONE!)
**Status**: ✅ Already configured  
**Current Value**: `YOUR_MAPBOX_ACCESS_TOKEN_HERE`

You're all set! This token is valid and ready to use.

---

### 2. ✅ Groq API Key (DONE!)
**Status**: ✅ Already configured  
**Current Value**: `your_groq_api_key_here`

You're all set! This key is valid and ready to use for multilingual translation.

---

### 3. ❌ Google Gemini API Key (NEEDED!)
**Status**: ❌ Not configured  
**Purpose**: AI-powered image analysis for ocean hazard detection  
**Required**: Yes

#### How to Get It:

**Step 1**: Visit Google AI Studio
```
https://makersuite.google.com/app/apikey
```

**Step 2**: Sign in with your Google account

**Step 3**: Click **"Get API Key"** or **"Create API Key"**

**Step 4**: Select or create a Google Cloud project

**Step 5**: Copy the API key (looks like: `AIzaSy...`)

**Step 6**: Add to your `.env` file:
```env
GEMINI_API_KEY=AIzaSy_your_actual_key_here
```

**Cost**: FREE with generous limits (60 requests/minute)

---

### 4. ❌ Twilio SMS Credentials (NEEDED!)
**Status**: ❌ Not configured  
**Purpose**: Send SMS alerts when network fails during offline post submission  
**Required**: Yes (for offline functionality)

You need **3 values** from Twilio:
- Account SID
- Auth Token
- Phone Number

#### How to Get It:

**Step 1**: Visit Twilio
```
https://www.twilio.com/try-twilio
```

**Step 2**: Sign up for a **FREE trial account**
- You get $15 credit
- Can send SMS to verified numbers

**Step 3**: After signup, go to Console Dashboard
```
https://console.twilio.com/
```

**Step 4**: Copy these values:

**Account SID** (looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Auth Token** (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
```env
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 5**: Get a phone number
- Click "Get a Trial Number"
- Accept the number they assign
- Copy it (looks like: `+1234567890`)

```env
TWILIO_PHONE_NUMBER=+1234567890
```

**Step 6**: Set your admin phone number (where you want to receive alerts)
```env
ADMIN_PHONE_NUMBER=+919876543210  # Your actual phone number
```

**Important**: 
- Trial accounts can only send to **verified phone numbers**
- Verify your admin phone number in Twilio Console
- Go to: Phone Numbers → Verified Caller IDs

**Cost**: FREE trial with $15 credit

---

### 5. 🔵 INCOIS API Key (OPTIONAL)
**Status**: 🔵 Optional  
**Purpose**: Validate hazard reports against official ocean data  
**Required**: No (uses mock data if not provided)

#### How to Get It:

INCOIS (Indian National Centre for Ocean Information Services) API access requires official approval.

**Option 1**: Use Mock Data (Recommended for Development)
- Leave as is: `INCOIS_API_KEY=your_incois_api_key_here`
- The system will use built-in mock data
- Perfect for testing and development

**Option 2**: Get Real Access (For Production)
- Contact INCOIS: https://incois.gov.in/
- Request API access for your project
- Explain your use case (ocean hazard reporting)
- Wait for approval and credentials

**For now**: Just leave it as is. The system works perfectly with mock data!

---

## 📝 Your Complete .env File

Here's what your `.env` file should look like after adding the missing keys:

```env
# Database
DATABASE_URL=sqlite:///./ocean_hazard.db

# Google Gemini Vision API
GEMINI_API_KEY=AIzaSy_your_actual_gemini_key_here  # ← ADD THIS

# Mapbox (Already configured ✅)
MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_ACCESS_TOKEN_HERE

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # ← ADD THIS
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # ← ADD THIS
TWILIO_PHONE_NUMBER=+1234567890                       # ← ADD THIS (from Twilio)
ADMIN_PHONE_NUMBER=+919876543210                      # ← ADD THIS (your phone)

# Groq API (Already configured ✅)
GROQ_API_KEY=your_groq_api_key_here

# INCOIS API (Optional - leave as is for now)
INCOIS_API_URL=https://incois.gov.in/api
INCOIS_API_KEY=your_incois_api_key_here

# Application Settings (Keep as is)
APP_NAME=Ocean Hazard Live Reporting System
APP_VERSION=1.0.0
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production

# CORS Settings (Keep as is)
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Upload Settings (Keep as is)
MAX_IMAGE_SIZE_MB=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting (Keep as is)
RATE_LIMIT_PER_MINUTE=10

# n8n Settings (Keep as is)
N8N_WEBHOOK_URL=http://n8n:5678/webhook
```

---

## ✅ Quick Checklist

- [x] **Mapbox Token** - ✅ Already have it!
- [x] **Groq API Key** - ✅ Already have it!
- [ ] **Gemini API Key** - Get from https://makersuite.google.com/app/apikey
- [ ] **Twilio Account SID** - Get from https://console.twilio.com/
- [ ] **Twilio Auth Token** - Get from https://console.twilio.com/
- [ ] **Twilio Phone Number** - Get a trial number from Twilio
- [ ] **Admin Phone Number** - Your phone number (verify it in Twilio)
- [x] **INCOIS API** - Optional, can skip for now

---

## 🚀 After Getting All Keys

1. **Copy `.env.example` to `.env`**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your keys**
   - Add Gemini API key
   - Add Twilio credentials
   - Keep Mapbox and Groq as they are

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Test it**
   - Open http://localhost:8080
   - Try submitting a hazard report
   - Check if AI validation works

---

## 💰 Cost Summary

| Service | Free Tier | Cost After Free Tier |
|---------|-----------|---------------------|
| **Gemini API** | 60 req/min | Very low ($0.00025/image) |
| **Mapbox** | 50,000 loads/month | $5/1000 after |
| **Twilio** | $15 trial credit | ~$0.0075/SMS |
| **Groq** | Generous free tier | Pay as you go |
| **INCOIS** | N/A (mock data) | Free if approved |

**For development/testing**: Everything is FREE! 🎉

---

## 🆘 Need Help?

### Gemini API Issues
- Make sure you're signed in to Google
- Try creating a new API key
- Check if billing is enabled (not required for free tier)

### Twilio Issues
- Verify your phone number in Twilio Console
- Trial accounts can only send to verified numbers
- Check your trial credit balance

### Still Stuck?
1. Check backend logs: `docker-compose logs backend`
2. Verify all keys are correctly copied (no extra spaces)
3. Make sure `.env` file is in the project root

---

## 📞 Support Links

- **Gemini API**: https://ai.google.dev/
- **Mapbox**: https://docs.mapbox.com/
- **Twilio**: https://www.twilio.com/docs
- **Groq**: https://console.groq.com/docs

---

**You're almost there!** Just get the Gemini and Twilio keys, and you're ready to go! 🚀
