# 🌊 Getting Started Checklist

## ✅ Pre-Deployment Checklist

### 1. API Keys Setup
- [ ] Google Gemini API key obtained
- [ ] Mapbox access token obtained
- [ ] Twilio Account SID and Auth Token obtained
- [ ] Twilio phone number acquired
- [ ] Groq API key obtained
- [ ] INCOIS API access (optional - uses mock data if not available)

### 2. Configuration Files
- [ ] Copied `.env.example` to `.env`
- [ ] Added all API keys to `.env`
- [ ] Updated Mapbox token in `frontend/js/config.js`
- [ ] Set admin phone number in `.env`

### 3. Docker Setup
- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Sufficient disk space (at least 2GB)

### 4. First Run
- [ ] Run `docker-compose up -d`
- [ ] Check logs: `docker-compose logs -f`
- [ ] No errors in backend logs
- [ ] No errors in frontend logs
- [ ] All containers running: `docker-compose ps`

### 5. Testing
- [ ] Frontend accessible at http://localhost:8080
- [ ] Backend API accessible at http://localhost:8000
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] n8n accessible at http://localhost:5678
- [ ] Health check passes: `curl http://localhost:8000/health`

### 6. Functionality Tests
- [ ] Language selector works (EN/HI/KN)
- [ ] Navigation works (Dashboard/Report/Map)
- [ ] Dashboard loads statistics
- [ ] INCOIS alerts display
- [ ] Report form loads
- [ ] Location detection works
- [ ] Image upload works (test with API docs)
- [ ] Map view loads (requires Mapbox token)

### 7. API Integration Tests
- [ ] Gemini Vision API responding
- [ ] Twilio SMS sending (test with API docs)
- [ ] Groq translation working
- [ ] INCOIS sync working (mock data)
- [ ] Image watermarking working

## 🚀 Quick Test Commands

### Test Backend Health
```bash
curl http://localhost:8000/health
```

### Test UI Translations
```bash
curl http://localhost:8000/api/ui-translations/en
curl http://localhost:8000/api/ui-translations/hi
curl http://localhost:8000/api/ui-translations/kn
```

### Test INCOIS Sync
```bash
curl -X POST http://localhost:8000/api/incois/sync
```

### Test Dashboard
```bash
curl http://localhost:8000/api/dashboard
```

### Test Map Data
```bash
curl http://localhost:8000/api/map/data
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

## 📝 Common Issues & Solutions

### Issue: Backend won't start
**Solution**: 
- Check `.env` file exists and has all required keys
- Verify Google credentials JSON exists
- Check port 8000 is not in use

### Issue: Frontend can't connect to backend
**Solution**:
- Verify backend is running: `docker-compose ps`
- Check CORS settings in `.env`
- Ensure `ALLOWED_ORIGINS` includes `http://localhost:8080`

### Issue: Map not loading
**Solution**:
- Verify Mapbox token in `frontend/js/config.js`
- Check browser console for errors
- Ensure token has correct scopes

### Issue: Image upload fails
**Solution**:
- Check image size (max 10MB)
- Verify image type (JPEG/PNG/WebP)
- Check Gemini API key in `.env`
- Review backend logs

### Issue: Translation not working
**Solution**:
- Verify Groq API key in `.env`
- Check backend logs for API errors
- Groq may have rate limits

### Issue: SMS not sending
**Solution**:
- Verify Twilio credentials
- Check phone number format (+1234567890)
- Trial accounts can only send to verified numbers

## 🎯 Next Steps After Setup

1. **Test Full Workflow**
   - Submit a test report via API docs
   - Verify AI validation works
   - Check INCOIS correlation
   - Confirm dashboard updates

2. **Complete JavaScript Files** (Optional)
   - `frontend/js/api.js` - API client
   - `frontend/js/offline.js` - Offline sync
   - `frontend/js/translation.js` - Language switching
   - `frontend/js/map.js` - Mapbox integration
   - `frontend/js/app.js` - Main app logic
   - `frontend/sw.js` - Service worker

3. **Setup n8n Workflows**
   - Access http://localhost:5678
   - Login: admin/admin123
   - Create automation workflows

4. **Production Deployment**
   - Setup HTTPS/SSL
   - Configure production `.env`
   - Use PostgreSQL instead of SQLite
   - Setup monitoring and logging
   - Configure backups

## 📚 Documentation Reference

- **README.md** - Project overview
- **SETUP.md** - Detailed setup guide
- **IMPLEMENTATION.md** - Technical details
- **PROJECT_SUMMARY.md** - Complete feature list
- **API Docs** - http://localhost:8000/docs

## ✨ You're Ready!

Once all checkboxes are complete, your Ocean Hazard Live Reporting System is ready to use!

Access the app at: **http://localhost:8080**

---

**Need help?** Check the documentation files or review the logs.

🌊 **Happy Reporting!**
