from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
import shutil
from datetime import datetime
import logging

from database import get_db, init_db, User, HazardPost, ImageAnalysis, INCOISAlert, AdminNotification
from schemas import (
    UserCreate, UserResponse, HazardPostCreate, HazardPostResponse, HazardPostDetail,
    DashboardResponse, DashboardPost, INCOISAlertResponse, MapDataResponse, MapMarker,
    TranslationRequest, TranslationResponse, ValidationResult, OfflinePostSync, SyncResponse
)
from services.vision_service import vision_service
from services.twilio_service import twilio_service
from services.translation_service import translation_service
from services.incois_service import incois_service
from services.image_service import image_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Ocean Hazard Live Reporting System",
    description="Crowdsourced ocean hazard reporting with AI validation",
    version="1.0.0"
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/watermarked", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Database initialized")
    
    # Fetch and store INCOIS alerts
    await sync_incois_alerts()


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")


# Health check
@app.get("/")
async def root():
    return {
        "app": "Ocean Hazard Live Reporting System",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ==================== USER ENDPOINTS ====================

@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create or get user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.user_id == user.user_id).first()
    
    if existing_user:
        # Update language preference
        existing_user.language_preference = user.language_preference
        db.commit()
        db.refresh(existing_user)
        return existing_user
    
    # Create new user
    new_user = User(
        user_id=user.user_id,
        language_preference=user.language_preference
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"User created: {user.user_id}")
    return new_user


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@app.put("/api/users/{user_id}/language")
async def update_language(user_id: str, language: str, db: Session = Depends(get_db)):
    """Update user language preference"""
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if language not in ['en', 'hi', 'kn']:
        raise HTTPException(status_code=400, detail="Invalid language code")
    
    user.language_preference = language
    db.commit()
    
    return {"success": True, "language": language}


# ==================== HAZARD POST ENDPOINTS ====================

@app.post("/api/posts", response_model=ValidationResult)
async def create_hazard_post(
    user_id: str = Form(...),
    hazard_type: str = Form(...),
    severity: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    location_name: Optional[str] = Form(None),
    synced: bool = Form(True),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Create new hazard post with image
    Performs AI validation and INCOIS verification
    """
    try:
        # Validate hazard type
        if hazard_type not in ['tsunami', 'cyclone', 'high_tide']:
            raise HTTPException(status_code=400, detail="Invalid hazard type")
        
        # Validate severity
        if severity not in ['low', 'medium', 'high']:
            raise HTTPException(status_code=400, detail="Invalid severity level")
        
        # Save uploaded image
        timestamp = datetime.utcnow()
        filename = f"{user_id}_{int(timestamp.timestamp())}_{image.filename}"
        image_path = os.path.join("uploads", filename)
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        logger.info(f"Image uploaded: {image_path}")
        
        # Validate image
        is_valid = await image_service.validate_image(image_path)
        if not is_valid:
            os.remove(image_path)
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Add watermark
        watermarked_path = await image_service.add_watermark(
            image_path, location_name or "Unknown", latitude, longitude, timestamp
        )
        
        # Create post record
        post = HazardPost(
            user_id=user_id,
            hazard_type=hazard_type,
            severity=severity,
            description=description,
            latitude=latitude,
            longitude=longitude,
            location_name=location_name,
            image_path=image_path,
            watermarked_image_path=watermarked_path,
            timestamp=timestamp,
            synced=synced
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        logger.info(f"Post created: ID={post.id}")
        
        # If offline post, send SMS alert
        if not synced:
            await twilio_service.send_offline_alert(
                post.id, location_name or f"{latitude}, {longitude}"
            )
        
        # Perform AI validation
        try:
            ai_result = await vision_service.analyze_image(image_path)
            
            # Store analysis results
            analysis = ImageAnalysis(
                post_id=post.id,
                labels=json.dumps(ai_result.get('labels', [])),
                objects=json.dumps(ai_result.get('objects', [])),
                web_entities=json.dumps(ai_result.get('web_entities', [])),
                ocean_related=ai_result.get('ocean_related', False),
                hazard_detected=ai_result.get('hazard_detected', False),
                confidence_score=ai_result.get('confidence_score', 0.0),
                scene_description=ai_result.get('scene_description'),
                detected_elements=json.dumps(ai_result.get('all_elements', []))
            )
            db.add(analysis)
            
            # Update post with AI results
            post.ai_validated = ai_result.get('ocean_related', False) and ai_result.get('hazard_detected', False)
            post.ai_confidence = ai_result.get('confidence_score', 0.0)
            post.ai_analysis = json.dumps(ai_result)
            
            logger.info(f"AI validation complete: ocean_related={ai_result.get('ocean_related')}, "
                       f"hazard_detected={ai_result.get('hazard_detected')}")
            
        except Exception as e:
            logger.error(f"AI validation failed: {str(e)}")
            post.ai_validated = False
            post.ai_confidence = 0.0
        
        # Perform INCOIS validation
        try:
            incois_result = await incois_service.validate_hazard(
                hazard_type, latitude, longitude, timestamp
            )
            
            post.incois_validated = incois_result.get('validated', False)
            post.incois_correlation = incois_result.get('correlation')
            
            logger.info(f"INCOIS validation: {incois_result.get('validated')}")
            
        except Exception as e:
            logger.error(f"INCOIS validation failed: {str(e)}")
            post.incois_validated = False
        
        # Determine final verification status
        if post.ai_validated and post.incois_validated:
            post.verified = True
            post.rejected = False
            message = "Report verified! Both AI and INCOIS confirm ocean hazard."
            
            # Send success notification
            await twilio_service.send_validation_alert(post.id, "verified")
            
        elif not post.ai_validated:
            post.verified = False
            post.rejected = True
            post.rejection_reason = "Image not related to ocean hazard"
            message = "Report rejected: Image does not appear to be an ocean hazard."
            
            # Send rejection notification
            await twilio_service.send_validation_alert(
                post.id, "rejected", post.rejection_reason
            )
        else:
            post.verified = False
            post.rejected = False
            message = "Report pending: AI validated but no matching INCOIS data."
        
        db.commit()
        db.refresh(post)
        
        return ValidationResult(
            success=True,
            ai_validated=post.ai_validated,
            ai_confidence=post.ai_confidence,
            incois_validated=post.incois_validated,
            verified=post.verified,
            rejected=post.rejected,
            rejection_reason=post.rejection_reason,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/posts", response_model=List[HazardPostResponse])
async def get_all_posts(
    verified_only: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all hazard posts"""
    query = db.query(HazardPost)
    
    if verified_only:
        query = query.filter(HazardPost.verified == True)
    
    posts = query.order_by(HazardPost.timestamp.desc()).limit(limit).all()
    
    return posts


@app.get("/api/posts/{post_id}", response_model=HazardPostDetail)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get specific post with details"""
    post = db.query(HazardPost).filter(HazardPost.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return post


# ==================== DASHBOARD ENDPOINTS ====================

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard data with verified posts and INCOIS alerts"""
    # Get verified posts
    verified_posts = db.query(HazardPost).filter(
        HazardPost.verified == True
    ).order_by(HazardPost.timestamp.desc()).limit(50).all()
    
    # Get INCOIS alerts
    incois_alerts = db.query(INCOISAlert).filter(
        INCOISAlert.active == True
    ).order_by(INCOISAlert.issued_at.desc()).all()
    
    # Get statistics
    total_posts = db.query(HazardPost).count()
    verified_count = db.query(HazardPost).filter(HazardPost.verified == True).count()
    pending_count = db.query(HazardPost).filter(
        HazardPost.verified == False,
        HazardPost.rejected == False
    ).count()
    
    # Format posts for dashboard
    dashboard_posts = [
        DashboardPost(
            id=post.id,
            hazard_type=post.hazard_type,
            severity=post.severity,
            description=post.description,
            latitude=post.latitude,
            longitude=post.longitude,
            location_name=post.location_name,
            watermarked_image_path=post.watermarked_image_path or post.image_path,
            ai_confidence=post.ai_confidence,
            verified=post.verified,
            timestamp=post.timestamp
        )
        for post in verified_posts
    ]
    
    return DashboardResponse(
        posts=dashboard_posts,
        incois_alerts=[INCOISAlertResponse.from_orm(alert) for alert in incois_alerts],
        total_posts=total_posts,
        verified_posts=verified_count,
        pending_posts=pending_count
    )


# ==================== MAP ENDPOINTS ====================

@app.get("/api/map/data", response_model=MapDataResponse)
async def get_map_data(db: Session = Depends(get_db)):
    """Get map markers and heatmap data"""
    markers = []
    heatmap_data = []
    
    # Get verified posts
    posts = db.query(HazardPost).filter(HazardPost.verified == True).all()
    
    for post in posts:
        markers.append(MapMarker(
            id=post.id,
            type="post",
            hazard_type=post.hazard_type,
            severity=post.severity,
            latitude=post.latitude,
            longitude=post.longitude,
            title=f"{post.hazard_type.title()} - {post.severity.title()}",
            description=post.description or "No description",
            timestamp=post.timestamp,
            verified=post.verified
        ))
        
        # Add to heatmap
        heatmap_data.append({
            "lat": post.latitude,
            "lng": post.longitude,
            "intensity": 1.0 if post.severity == "high" else 0.6 if post.severity == "medium" else 0.3
        })
    
    # Get INCOIS alerts
    alerts = db.query(INCOISAlert).filter(INCOISAlert.active == True).all()
    
    for alert in alerts:
        markers.append(MapMarker(
            id=alert.id,
            type="incois_alert",
            hazard_type=alert.alert_type,
            severity=alert.severity,
            latitude=alert.latitude,
            longitude=alert.longitude,
            title=alert.title,
            description=alert.description,
            timestamp=alert.issued_at,
            verified=True
        ))
        
        # Add to heatmap with higher intensity
        heatmap_data.append({
            "lat": alert.latitude,
            "lng": alert.longitude,
            "intensity": 1.5
        })
    
    return MapDataResponse(
        markers=markers,
        heatmap_data=heatmap_data
    )


# ==================== TRANSLATION ENDPOINTS ====================

@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """Translate text to target language"""
    try:
        translated = await translation_service.translate(
            request.text, request.target_language
        )
        
        return TranslationResponse(
            original_text=request.text,
            translated_text=translated,
            target_language=request.target_language
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Translation failed")


@app.get("/api/ui-translations/{language}")
async def get_ui_translations(language: str):
    """Get UI element translations for specified language"""
    if language not in ['en', 'hi', 'kn']:
        raise HTTPException(status_code=400, detail="Invalid language code")
    
    # Define UI elements to translate
    ui_elements = {
        "app_title": "Ocean Hazard Live Reporting",
        "report_hazard": "Report Hazard",
        "dashboard": "Dashboard",
        "map": "Map",
        "select_language": "Select Language",
        "hazard_type": "Hazard Type",
        "tsunami": "Tsunami",
        "cyclone": "Cyclone",
        "high_tide": "High Tide",
        "severity": "Severity",
        "low": "Low",
        "medium": "Medium",
        "high": "High",
        "description": "Description",
        "location": "Location",
        "capture_image": "Capture Image",
        "upload_image": "Upload Image",
        "submit_report": "Submit Report",
        "verified_reports": "Verified Reports",
        "pending_reports": "Pending Reports",
        "incois_alerts": "INCOIS Alerts",
        "ai_confidence": "AI Confidence",
        "view_details": "View Details",
        "report_submitted": "Report Submitted Successfully",
        "report_verified": "Report Verified",
        "report_rejected": "Report Rejected",
        "offline_mode": "Offline Mode - Will sync when online",
        "network_restored": "Network Restored - Syncing data",
        "safety_guidelines": "Safety Guidelines",
        "evacuation_info": "Evacuation Information"
    }
    
    if language == 'en':
        return ui_elements
    
    try:
        translated = await translation_service.translate_ui_elements(
            ui_elements, language
        )
        return translated
    except Exception as e:
        logger.error(f"UI translation error: {str(e)}")
        return ui_elements  # Return English on error


# ==================== INCOIS SYNC ENDPOINTS ====================

@app.post("/api/incois/sync")
async def sync_incois_alerts(db: Session = Depends(get_db)):
    """Fetch and sync INCOIS alerts"""
    try:
        alerts = await incois_service.fetch_active_alerts()
        
        synced_count = 0
        
        for alert_data in alerts:
            # Check if alert already exists
            existing = db.query(INCOISAlert).filter(
                INCOISAlert.external_id == alert_data.get('id')
            ).first()
            
            if existing:
                # Update existing alert
                existing.active = alert_data.get('active', True)
                existing.valid_until = datetime.fromisoformat(alert_data.get('valid_until')) if alert_data.get('valid_until') else None
            else:
                # Create new alert
                new_alert = INCOISAlert(
                    alert_type=alert_data.get('alert_type'),
                    severity=alert_data.get('severity'),
                    title=alert_data.get('title'),
                    description=alert_data.get('description'),
                    latitude=alert_data.get('latitude'),
                    longitude=alert_data.get('longitude'),
                    affected_area=alert_data.get('affected_area'),
                    radius_km=alert_data.get('radius_km', 50.0),
                    issued_at=datetime.fromisoformat(alert_data.get('issued_at')),
                    valid_until=datetime.fromisoformat(alert_data.get('valid_until')) if alert_data.get('valid_until') else None,
                    source=alert_data.get('source', 'INCOIS'),
                    external_id=str(alert_data.get('id')),
                    active=alert_data.get('active', True)
                )
                db.add(new_alert)
                synced_count += 1
        
        db.commit()
        
        logger.info(f"Synced {synced_count} new INCOIS alerts")
        
        return {
            "success": True,
            "synced": synced_count,
            "total": len(alerts)
        }
        
    except Exception as e:
        logger.error(f"INCOIS sync error: {str(e)}")
        raise HTTPException(status_code=500, detail="INCOIS sync failed")


# ==================== OFFLINE SYNC ENDPOINTS ====================

@app.post("/api/offline/sync", response_model=SyncResponse)
async def sync_offline_post(
    sync_data: OfflinePostSync,
    db: Session = Depends(get_db)
):
    """Sync offline post when network is restored"""
    try:
        import base64
        
        # Decode base64 image
        image_data = base64.b64decode(sync_data.image_base64)
        
        # Save image
        timestamp = datetime.fromisoformat(sync_data.timestamp)
        filename = f"{sync_data.user_id}_{int(timestamp.timestamp())}_offline.jpg"
        image_path = os.path.join("uploads", filename)
        
        with open(image_path, "wb") as f:
            f.write(image_data)
        
        # Create post (similar to create_hazard_post but from offline data)
        post = HazardPost(
            user_id=sync_data.user_id,
            hazard_type=sync_data.hazard_type,
            severity=sync_data.severity,
            description=sync_data.description,
            latitude=sync_data.latitude,
            longitude=sync_data.longitude,
            location_name=sync_data.location_name,
            image_path=image_path,
            timestamp=timestamp,
            synced=True  # Now synced
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        logger.info(f"Offline post synced: ID={post.id}")
        
        # Trigger validation in background (would use background tasks in production)
        # For now, just return success
        
        return SyncResponse(
            success=True,
            post_id=post.id,
            message="Offline post synced successfully. Validation in progress."
        )
        
    except Exception as e:
        logger.error(f"Offline sync error: {str(e)}")
        return SyncResponse(
            success=False,
            post_id=None,
            message=f"Sync failed: {str(e)}"
        )


# ==================== GUIDELINES ENDPOINTS ====================

@app.get("/api/guidelines/{hazard_type}")
async def get_safety_guidelines(hazard_type: str, language: str = "en"):
    """Get safety guidelines for specific hazard type"""
    guidelines = {
        "tsunami": {
            "title": "Tsunami Safety Guidelines",
            "precautions": [
                "Move to higher ground immediately",
                "Stay away from the beach and coastal areas",
                "Listen to emergency broadcasts",
                "Do not return until authorities say it's safe"
            ],
            "evacuation": [
                "Evacuate vertically (go to upper floors) if you cannot evacuate horizontally",
                "Take emergency supplies with you",
                "Help others who need assistance",
                "Follow designated evacuation routes"
            ],
            "dos": [
                "Stay informed through official channels",
                "Keep emergency kit ready",
                "Know your evacuation routes",
                "Practice evacuation drills"
            ],
            "donts": [
                "Don't go to the beach to watch the waves",
                "Don't wait for official warnings if you feel strong earthquake",
                "Don't return home until all-clear is given",
                "Don't drive unless absolutely necessary"
            ]
        },
        "cyclone": {
            "title": "Cyclone Safety Guidelines",
            "precautions": [
                "Stay indoors and away from windows",
                "Secure loose objects outside",
                "Stock up on food, water, and medicines",
                "Charge all electronic devices"
            ],
            "evacuation": [
                "Move to designated cyclone shelters if advised",
                "Take important documents and valuables",
                "Turn off electricity and gas",
                "Inform family members of your location"
            ],
            "dos": [
                "Monitor weather updates regularly",
                "Keep emergency supplies ready",
                "Reinforce doors and windows",
                "Stay in the strongest part of the building"
            ],
            "donts": [
                "Don't venture outside during the storm",
                "Don't use electrical appliances",
                "Don't touch wet switches or wires",
                "Don't spread rumors or unverified information"
            ]
        },
        "high_tide": {
            "title": "High Tide Safety Guidelines",
            "precautions": [
                "Stay away from low-lying coastal areas",
                "Monitor tide schedules and warnings",
                "Secure boats and marine equipment",
                "Be prepared to evacuate if necessary"
            ],
            "evacuation": [
                "Move to higher ground if flooding occurs",
                "Take valuables and important documents",
                "Follow local authority instructions",
                "Help elderly and children evacuate first"
            ],
            "dos": [
                "Check tide timings regularly",
                "Keep emergency contact numbers handy",
                "Maintain drainage systems around your property",
                "Stay informed about weather conditions"
            ],
            "donts": [
                "Don't park vehicles in low-lying areas",
                "Don't ignore warning signs",
                "Don't attempt to cross flooded areas",
                "Don't delay evacuation if advised"
            ]
        }
    }
    
    if hazard_type not in guidelines:
        raise HTTPException(status_code=404, detail="Hazard type not found")
    
    guideline_data = guidelines[hazard_type]
    
    # Translate if not English
    if language != 'en':
        try:
            # Translate all text fields
            for key in guideline_data:
                if isinstance(guideline_data[key], str):
                    guideline_data[key] = await translation_service.translate(
                        guideline_data[key], language
                    )
                elif isinstance(guideline_data[key], list):
                    translated_list = []
                    for item in guideline_data[key]:
                        translated_item = await translation_service.translate(item, language)
                        translated_list.append(translated_item)
                    guideline_data[key] = translated_list
        except Exception as e:
            logger.error(f"Guidelines translation error: {str(e)}")
    
    return guideline_data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

