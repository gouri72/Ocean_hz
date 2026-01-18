import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_create_sos():
    print("\n--- Testing Create SOS ---")
    data = {
        "emergency_type": "drowning",
        "location_name": "Test Beach, North End",
        "contact_number": "9876543210",
        "description": "Test emergency report",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sos", json=data)
        if response.status_code == 200:
            print("✅ SOS Created Successfully")
            return response.json()['id']
        else:
            print(f"❌ Failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_get_sos():
    print("\n--- Testing Get SOS Reports ---")
    try:
        response = requests.get(f"{BASE_URL}/sos/reports?active_only=true")
        if response.status_code == 200:
            reports = response.json()
            print(f"✅ Retrieved {len(reports)} active reports")
            return len(reports) > 0
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    # Wait for server reload (simulated)
    print("Starting SOS Tests...")
    sos_id = test_create_sos()
    if sos_id:
        test_get_sos()
