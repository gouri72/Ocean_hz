from sqlalchemy.orm import Session
from database import SessionLocal, INCOISAlert, SafetyAlert, SOSReport, init_db
from datetime import datetime, timedelta

def seed_data():
    db = SessionLocal()
    
    # 1. 2004 Chennai Tsunami Simulation (INCOIS Alerts)
    # Tsunami hitting Marina Beach and surrounding areas
    alerts = [
        INCOISAlert(
            alert_type="tsunami",
            severity="high",
            title="TSUNAMI WARNING: Chennai Coast",
            description="Massive seismic activity detected near Sumatra. Tsunami waves expected to hit Chennai coast within 2 hours. Evacuate Marina Beach immediately.",
            latitude=13.0475,
            longitude=80.2824, # Marina Beach
            affected_area="Chennai, Tamil Nadu",
            radius_km=100.0,
            issued_at=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(hours=4),
            source="INCOIS Simulation",
            active=True
        ),
        INCOISAlert(
            alert_type="high_tide",
            severity="medium",
            title="High Tide Warning: Ennore Port",
            description="Rough sea conditions expected near Ennore. Fishermen advised not to venture into sea.",
            latitude=13.2000,
            longitude=80.3300, # Ennore
            affected_area="Ennore, Chennai",
            radius_km=20.0,
            issued_at=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(hours=6),
            source="INCOIS Simulation",
            active=True
        )
    ]

    for alert in alerts:
        existing = db.query(INCOISAlert).filter(INCOISAlert.title == alert.title).first()
        if not existing:
            db.add(alert)
            print(f"Added Alert: {alert.title}")

    # 2. Populate Safety Alerts (Places to Avoid)
    safety_alerts = [
        SafetyAlert(location_name="Marina Beach (Zone A)", hazard_type="tsunami", active=True),
        SafetyAlert(location_name="Besant Nagar Beach", hazard_type="tsunami", active=True),
        SafetyAlert(location_name="Ennore Port Area", hazard_type="high_tide", active=True),
        SafetyAlert(location_name="Kovalam Beach", hazard_type="cyclone", active=True)
    ]

    for sa in safety_alerts:
        existing = db.query(SafetyAlert).filter(SafetyAlert.location_name == sa.location_name).first()
        if not existing:
            db.add(sa)
            print(f"Added Safety Alert: {sa.location_name}")

    # 3. Simulate an Active SOS Rescue
    sos = SOSReport(
        emergency_type="drowning",
        description="Two fishermen capsized near the lighthouse. Urgent help needed!",
        contact_number="9876543210",
        latitude=13.0380, 
        longitude=80.2790, # Lighthouse
        location_name="Chennai Lighthouse",
        active=True,
        deployed=True,
        deployed_by="Rescue Team Alpha",
        deployed_at=datetime.utcnow(),
        rescue_notes="Team dispatched via speedboat."
    )
    
    existing_sos = db.query(SOSReport).filter(SOSReport.description == sos.description).first()
    if not existing_sos:
        db.add(sos)
        print("Added Active SOS Report")

    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    seed_data()
    print("Database seeded with Chennai Tsunami Simulation Data!")
